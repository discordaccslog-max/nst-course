/*
  Fiancho Chess — site behaviour
  Plain JavaScript, no dependencies. Reads contact details from js/site-config.js
  and product data from js/products.js.
*/
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function removeNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  /* ----- Support email (js/site-config.js) ----- */
  function renderSupportEmail() {
    var config = window.SITE_CONFIG || {};
    var email = typeof config.supportEmail === 'string' ? config.supportEmail.trim() : '';

    each(document.querySelectorAll('[data-support-email]'), function (slot) {
      if (!email) {
        removeNode(slot);
        return;
      }
      var target = slot.querySelector('[data-email-link]') || slot;
      var link = document.createElement('a');
      link.href = 'mailto:' + email;
      link.textContent = email;
      target.appendChild(link);
      slot.hidden = false;
    });
  }

  /* ----- Prices and buy buttons (js/products.js) ----- */
  function formatPrice(value) {
    var amount = Number(value);
    if (!isFinite(amount) || amount <= 0) return '';
    return '$' + (amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2));
  }

  function renderProducts() {
    var products = window.SITE_PRODUCTS || {};

    each(document.querySelectorAll('[data-price-for]'), function (el) {
      var product = products[el.getAttribute('data-price-for')];
      var text = product ? formatPrice(product.price) : '';
      if (text) el.textContent = text;
    });

    each(document.querySelectorAll('[data-buy-for]'), function (slot) {
      var product = products[slot.getAttribute('data-buy-for')];
      var url = product && typeof product.checkoutUrl === 'string' ? product.checkoutUrl.trim() : '';
      if (!url) {
        removeNode(slot);
        return;
      }
      slot.appendChild(buildGatedBuyButton(slot.getAttribute('data-buy-for'), product, url));
      slot.hidden = false;
    });
  }

  /* Terms agreement: the buy button stays disabled until the box is ticked.
     Only built when a checkout link exists, so it never shows on its own. */
  function buildGatedBuyButton(id, product, url) {
    var wrap = document.createElement('div');
    wrap.className = 'consent';

    var checkboxId = 'agree-' + id;
    var hintId = 'agree-hint-' + id;

    var label = document.createElement('label');
    label.className = 'consent__label';
    label.setAttribute('for', checkboxId);

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.className = 'consent__box';
    checkbox.setAttribute('aria-describedby', hintId);

    var text = document.createElement('span');
    text.innerHTML = 'I agree to the <a href="terms.html">Terms of Service</a> and <a href="refund-policy.html">Refund Policy</a>';

    label.appendChild(checkbox);
    label.appendChild(text);

    var hint = document.createElement('p');
    hint.className = 'consent__hint';
    hint.id = hintId;
    hint.setAttribute('aria-live', 'polite');

    var button = document.createElement('a');
    button.className = 'btn btn--primary btn--block';
    button.textContent = 'Buy ' + product.name + ' · ' + formatPrice(product.price);
    button.setAttribute('aria-describedby', hintId);

    function sync() {
      if (checkbox.checked) {
        button.href = url;
        button.removeAttribute('aria-disabled');
        button.classList.remove('is-disabled');
        hint.textContent = 'Thank you. You can now continue to checkout.';
      } else {
        button.removeAttribute('href');
        button.setAttribute('aria-disabled', 'true');
        button.classList.add('is-disabled');
        hint.textContent = 'Please tick the box to agree to the Terms of Service and Refund Policy. The buy button is enabled once you do.';
      }
    }

    checkbox.addEventListener('change', sync);
    sync();

    wrap.appendChild(label);
    wrap.appendChild(hint);
    wrap.appendChild(button);
    return wrap;
  }

  /* ----- Footer year ----- */
  function renderYear() {
    var year = String(new Date().getFullYear());
    each(document.querySelectorAll('[data-year]'), function (el) {
      el.textContent = year;
    });
  }

  /* ----- Sticky header that compacts on scroll, mobile menu ----- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var ticking = false;
    function update() {
      ticking = false;
      header.classList.toggle('is-compact', window.scrollY > 24);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();

    var toggle = header.querySelector('.nav-toggle');
    var nav = header.querySelector('.site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!header.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (header.classList.contains('is-open') && !header.contains(event.target)) setOpen(false);
    });

    var wide = window.matchMedia('(min-width: 761px)');
    var closeOnWide = function () {
      if (wide.matches) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener('change', closeOnWide);
  }

  /* ----- Scroll-triggered reveals ----- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      each(items, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });

    each(items, function (el) { observer.observe(el); });
  }

  /* ----- Hero board: a four-move checkmate on a loop -----
     The HTML renders the final (mated) position, which is what visitors see
     with reduced motion or without JavaScript. */
  function initHeroBoard() {
    var board = document.querySelector('[data-hero-board]');
    if (!board || reduceMotion) return;

    var layer = board.querySelector('.hb-pieces');
    var hlFrom = board.querySelector('[data-hl="from"]');
    var hlTo = board.querySelector('[data-hl="to"]');
    var mate = board.querySelector('[data-mate]');
    var figure = board.closest('figure');
    var plies = figure ? figure.querySelectorAll('[data-ply]') : [];
    var pieces = {};
    each(board.querySelectorAll('[data-piece]'), function (el) {
      pieces[el.getAttribute('data-piece')] = el;
    });

    var MOVES = [
      { piece: 'wp-e', to: 'e4' },
      { piece: 'bp-e', to: 'e5' },
      { piece: 'wb-f', to: 'c4' },
      { piece: 'bn-b', to: 'c6' },
      { piece: 'wq', to: 'h5' },
      { piece: 'bn-g', to: 'f6' },
      { piece: 'wq', to: 'f7', capture: 'bp-f' }
    ];

    var timers = [];
    var running = false;
    var inView = false;

    function later(fn, ms) {
      timers.push(window.setTimeout(fn, ms));
    }

    function clearTimers() {
      timers.forEach(function (t) { window.clearTimeout(t); });
      timers = [];
    }

    function place(el, square) {
      var x = (square.charCodeAt(0) - 97) * 100;
      var y = (8 - Number(square.charAt(1))) * 100;
      el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      el.setAttribute('data-square', square);
    }

    function setPly(index) {
      each(plies, function (el, i) { el.classList.toggle('is-current', i === index); });
    }

    function clearMarks() {
      hlFrom.classList.remove('is-on');
      hlTo.classList.remove('is-on');
      mate.classList.remove('is-on');
    }

    function reset() {
      board.classList.add('is-resetting');
      Object.keys(pieces).forEach(function (id) {
        var el = pieces[id];
        place(el, el.getAttribute('data-start'));
        el.style.opacity = '';
      });
      clearMarks();
      setPly(-1);
      void board.getBoundingClientRect();
      board.classList.remove('is-resetting');
    }

    function play(move, index) {
      var el = pieces[move.piece];
      place(hlFrom, el.getAttribute('data-square'));
      place(hlTo, move.to);
      hlFrom.classList.add('is-on');
      hlTo.classList.add('is-on');
      if (move.capture && pieces[move.capture]) pieces[move.capture].style.opacity = '0';
      place(el, move.to);
      setPly(index);
    }

    function fadeOut() {
      layer.style.opacity = '0';
      clearMarks();
    }

    function cycle() {
      reset();
      layer.style.opacity = '1';
      var t = 1000;
      MOVES.forEach(function (move, i) {
        later(function () { play(move, i); }, t);
        t += 1250;
      });
      later(function () { mate.classList.add('is-on'); }, t - 350);
      later(fadeOut, t + 2600);
      later(cycle, t + 3300);
    }

    function start() {
      if (running) return;
      running = true;
      later(fadeOut, 1400);
      later(cycle, 2100);
    }

    function stop() {
      running = false;
      clearTimers();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && !document.hidden) start();
        else stop();
      }, { threshold: 0.25 }).observe(board);
    } else {
      inView = true;
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (inView) start();
    });
  }

  renderSupportEmail();
  renderProducts();
  renderYear();
  initHeader();
  initReveal();
  initHeroBoard();
})();
