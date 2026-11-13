/*
  Fiancho Chess — interactive SVG chessboard.
  Pieces are the original SVG symbols in the page sprite (#s-p, #s-n, ...).
  Input: drag and drop, click-click, or keyboard (arrow keys move the cursor, Enter/Space selects
  and drops, Escape cancels). Feedback marks use an icon as well as a color.
*/
const FILES = 'abcdefgh';
const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const SVGNS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

export function parseFenBoard(fen) {
  const rows = fen.split(' ')[0].split('/');
  const map = {};
  rows.forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else { map[FILES[f] + (8 - i)] = { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b' }; f++; }
    }
  });
  return map;
}

export function describePiece(p) {
  return p ? `${p.color === 'w' ? 'white' : 'black'} ${NAMES[p.type]}` : 'empty';
}

// Static thumbnail (no interaction), used in the Training Room and on product pages.
export function boardThumbnail(fen, { size = 160, label = '' } = {}) {
  const svg = el('svg', { viewBox: '0 0 800 800', width: size, height: size, role: 'img', class: 'fc-thumb' });
  if (label) { const t = el('title', {}, svg); t.textContent = label; }
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) el('rect', { x: f * 100, y: r * 100, width: 100, height: 100, class: (r + f) % 2 ? 'sq-d' : 'sq-l' }, svg);
  const map = parseFenBoard(fen);
  for (const [sq, p] of Object.entries(map)) {
    const f = FILES.indexOf(sq[0]), r = 8 - Number(sq[1]);
    const g = el('g', { class: `pc pc--${p.color}`, transform: `translate(${f * 100 + 6} ${r * 100 + 6}) scale(.88)` }, svg);
    el('use', { href: `#s-${p.type}`, class: 'po', width: 100, height: 100 }, g);
    el('use', { href: `#s-${p.type}`, class: 'pf', width: 100, height: 100 }, g);
  }
  return svg;
}

export class Board {
  constructor(container, { orientation = 'w', label = 'Chessboard', onMove = null, onSquare = null } = {}) {
    this.container = container;
    this.orientation = orientation;
    this.onMove = onMove;          // (from, to, promotion) => void
    this.onSquare = onSquare;      // square-select mode callback
    this.movable = null;           // 'w' | 'b' | null
    this.legalFn = null;           // (square) => [{ to, promotion }]
    this.map = {};
    this.selected = null;
    this.cursor = 'e2';
    this.squareMode = false;

    this.wrap = document.createElement('div');
    this.wrap.className = 'fc-board';
    this.wrap.dataset.orientation = orientation;
    this.wrap.dataset.cursor = this.cursor;
    this.wrap.tabIndex = 0;
    this.wrap.setAttribute('role', 'application');
    this.wrap.setAttribute('aria-roledescription', 'chessboard');
    this.wrap.setAttribute('aria-label', `${label}. Use the arrow keys to move between squares, Enter or Space to pick up and place a piece, and Escape to cancel.`);
    this.svg = el('svg', { viewBox: '0 0 800 800', class: 'fc-board__svg', 'aria-hidden': 'true', focusable: 'false' });
    this.layers = {};
    for (const name of ['squares', 'marks', 'coords', 'pieces', 'hints', 'icons', 'cursor']) this.layers[name] = el('g', { class: `fc-layer-${name}` }, this.svg);
    this.wrap.appendChild(this.svg);
    this.live = document.createElement('p');
    this.live.className = 'visually-hidden';
    this.live.setAttribute('aria-live', 'polite');
    this.wrap.appendChild(this.live);
    container.appendChild(this.wrap);
    this.drawSquares();
    this.bindPointer();
    this.bindKeys();
  }

  xy(sq) {
    const f = FILES.indexOf(sq[0]), r = Number(sq[1]) - 1;
    return this.orientation === 'w' ? [f * 100, (7 - r) * 100] : [(7 - f) * 100, r * 100];
  }

  squareAt(x, y) {
    const f = Math.floor(x / 100), r = Math.floor(y / 100);
    if (f < 0 || f > 7 || r < 0 || r > 7) return null;
    return this.orientation === 'w' ? FILES[f] + (8 - r) : FILES[7 - f] + (r + 1);
  }

  drawSquares() {
    const s = this.layers.squares, c = this.layers.coords;
    s.innerHTML = ''; c.innerHTML = '';
    for (let f = 0; f < 8; f++) for (let r = 1; r <= 8; r++) {
      const sq = FILES[f] + r;
      const [x, y] = this.xy(sq);
      el('rect', { x, y, width: 100, height: 100, class: (f + r) % 2 ? 'sq-d' : 'sq-l' }, s); // a1 (f 0, rank 1) is dark
    }
    for (let i = 0; i < 8; i++) {
      const fileSq = this.orientation === 'w' ? FILES[i] + '1' : FILES[7 - i] + '8';
      const [fx] = this.xy(fileSq);
      const t = el('text', { x: fx + 92, y: 792, class: 'fc-coord', 'text-anchor': 'end' }, c);
      t.textContent = fileSq[0];
      const rankSq = this.orientation === 'w' ? 'a' + (8 - i) : 'h' + (i + 1);
      const [, ry] = this.xy(rankSq);
      const t2 = el('text', { x: 6, y: ry + 22, class: 'fc-coord' }, c);
      t2.textContent = rankSq[1];
    }
  }

  setOrientation(o) {
    if (o === this.orientation) return;
    this.orientation = o;
    this.wrap.dataset.orientation = o;
    this.drawSquares();
    this.renderPieces(false);
    this.renderCursor();
  }

  setPosition(fen, { lastMove = null, animate = true } = {}) {
    const prev = this.map;
    this.map = parseFenBoard(fen);
    this.fen = fen;
    this.wrap.dataset.fen = fen;
    this.selected = null;
    this.clearHints();
    this.layers.marks.innerHTML = '';
    if (lastMove) this.mark([lastMove.slice(0, 2), lastMove.slice(2, 4)], 'fc-last');
    this.renderPieces(animate && lastMove ? { from: lastMove.slice(0, 2), to: lastMove.slice(2, 4), prev } : false);
  }

  renderPieces(anim) {
    const layer = this.layers.pieces;
    layer.innerHTML = '';
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const [sq, p] of Object.entries(this.map)) {
      const [x, y] = this.xy(sq);
      const g = el('g', { class: `fc-piece pc pc--${p.color}`, 'data-square': sq }, layer);
      const inner = el('g', { transform: 'translate(6 6) scale(.88)' }, g);
      el('use', { href: `#s-${p.type}`, class: 'po', width: 100, height: 100 }, inner);
      el('use', { href: `#s-${p.type}`, class: 'pf', width: 100, height: 100 }, inner);
      if (anim && sq === anim.to && !reduce) {
        const [fx, fy] = this.xy(anim.from);
        g.style.transform = `translate(${fx}px, ${fy}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = `translate(${x}px, ${y}px)`; }));
      } else g.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  setMovable(color, legalFn) {
    this.movable = color;
    this.legalFn = legalFn;
    this.squareMode = false;
    this.wrap.classList.toggle('is-interactive', !!color);
  }

  setSquareMode(on) {
    this.squareMode = on;
    this.movable = null;
    this.wrap.classList.toggle('is-interactive', on);
  }

  mark(squares, cls) {
    for (const sq of squares) {
      const [x, y] = this.xy(sq);
      el('rect', { x, y, width: 100, height: 100, class: cls }, this.layers.marks);
    }
  }

  clearMarks() { this.layers.marks.innerHTML = ''; this.layers.icons.innerHTML = ''; }

  clearHints() { this.layers.hints.innerHTML = ''; }

  // Feedback icon in the corner of a square: ok = check mark, otherwise a cross.
  feedback(sq, ok, { keep = false } = {}) {
    if (!keep) this.layers.icons.innerHTML = '';
    const [x, y] = this.xy(sq);
    el('rect', { x, y, width: 100, height: 100, class: ok ? 'fc-good' : 'fc-bad' }, this.layers.marks);
    const g = el('g', { class: `fc-icon ${ok ? 'fc-icon--good' : 'fc-icon--bad'}`, transform: `translate(${x + 60} ${y + 4})` }, this.layers.icons);
    el('circle', { cx: 18, cy: 18, r: 17 }, g);
    if (ok) el('path', { d: 'M9 18.5l6 6 12-13', class: 'fc-icon__mark' }, g);
    else el('path', { d: 'M11 11l14 14M25 11L11 25', class: 'fc-icon__mark' }, g);
  }

  showTargets(from) {
    this.clearHints();
    if (!this.legalFn) return [];
    const moves = this.legalFn(from);
    for (const m of moves) {
      const [x, y] = this.xy(m.to);
      if (this.map[m.to]) el('circle', { cx: x + 50, cy: y + 50, r: 46, class: 'fc-target fc-target--capture' }, this.layers.hints);
      else el('circle', { cx: x + 50, cy: y + 50, r: 14, class: 'fc-target' }, this.layers.hints);
    }
    const [sx, sy] = this.xy(from);
    el('rect', { x: sx, y: sy, width: 100, height: 100, class: 'fc-selected' }, this.layers.hints);
    return moves;
  }

  highlightSquare(sq, cls = 'fc-hint') {
    const [x, y] = this.xy(sq);
    el('rect', { x: x + 4, y: y + 4, width: 92, height: 92, rx: 8, class: cls }, this.layers.hints);
  }

  canPick(sq) {
    const p = this.map[sq];
    return this.movable && p && p.color === this.movable;
  }

  select(sq) {
    this.selected = sq;
    const moves = this.showTargets(sq);
    this.say(`${describePiece(this.map[sq])} on ${sq} selected. ${moves.length ? `${moves.length} legal ${moves.length === 1 ? 'move' : 'moves'}.` : 'No legal moves.'}`);
  }

  deselect() { this.selected = null; this.clearHints(); }

  async tryMove(from, to) {
    const moves = this.legalFn ? this.legalFn(from).filter((m) => m.to === to) : [];
    if (!moves.length) { this.deselect(); return false; }
    let promotion;
    if (moves.some((m) => m.promotion)) promotion = await this.askPromotion(to);
    this.deselect();
    if (this.onMove) this.onMove(from, to, promotion);
    return true;
  }

  askPromotion(to) {
    return new Promise((resolve) => {
      const dlg = document.createElement('div');
      dlg.className = 'fc-promo';
      dlg.setAttribute('role', 'dialog');
      dlg.setAttribute('aria-label', 'Choose a piece to promote to');
      for (const [t, name] of [['q', 'Queen'], ['r', 'Rook'], ['b', 'Bishop'], ['n', 'Knight']]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'fc-promo__btn';
        b.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true" class="pc pc--${this.movable || 'w'}"><use href="#s-${t}" class="po" width="100" height="100"/><use href="#s-${t}" class="pf" width="100" height="100"/></svg><span>${name}</span>`;
        b.addEventListener('click', () => { dlg.remove(); this.wrap.focus(); resolve(t); });
        dlg.appendChild(b);
      }
      dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') { dlg.remove(); this.wrap.focus(); resolve('q'); } });
      this.wrap.appendChild(dlg);
      dlg.querySelector('button').focus();
    });
  }

  bindPointer() {
    let drag = null;
    const point = (e) => {
      const r = this.svg.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 800, ((e.clientY - r.top) / r.height) * 800];
    };
    this.svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const [x, y] = point(e);
      const sq = this.squareAt(x, y);
      if (!sq) return;
      this.cursor = sq;
      this.wrap.dataset.cursor = sq;
      if (this.squareMode) { this.onSquare && this.onSquare(sq); return; }
      if (!this.movable) return;
      if (this.selected && this.selected !== sq && !this.canPick(sq)) { this.tryMove(this.selected, sq); return; }
      if (this.canPick(sq)) {
        e.preventDefault();
        this.select(sq);
        const g = this.layers.pieces.querySelector(`[data-square="${sq}"]`);
        if (g) { drag = { from: sq, g, moved: false }; this.svg.setPointerCapture(e.pointerId); g.classList.add('is-dragging'); }
      } else this.deselect();
    });
    this.svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const [x, y] = point(e);
      drag.moved = true;
      drag.g.style.transition = 'none';
      drag.g.style.transform = `translate(${x - 50}px, ${y - 50}px)`;
    });
    const end = (e) => {
      if (!drag) return;
      const d = drag; drag = null;
      d.g.classList.remove('is-dragging');
      const [x, y] = point(e);
      const sq = this.squareAt(x, y);
      if (d.moved && sq && sq !== d.from) {
        this.tryMove(d.from, sq).then((ok) => { if (!ok) this.renderPieces(false); });
      } else {
        const [px, py] = this.xy(d.from);
        d.g.style.transition = '';
        d.g.style.transform = `translate(${px}px, ${py}px)`;
      }
    };
    this.svg.addEventListener('pointerup', end);
    this.svg.addEventListener('pointercancel', end);
  }

  bindKeys() {
    this.wrap.addEventListener('focus', () => this.renderCursor());
    this.wrap.addEventListener('blur', () => { this.layers.cursor.innerHTML = ''; });
    this.wrap.addEventListener('keydown', (e) => {
      if (e.target !== this.wrap) return;
      const dirs = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (dirs[e.key]) {
        e.preventDefault();
        let [df, dr] = dirs[e.key];
        if (this.orientation === 'b') { df = -df; dr = -dr; }
        const f = Math.min(7, Math.max(0, FILES.indexOf(this.cursor[0]) + df));
        const r = Math.min(8, Math.max(1, Number(this.cursor[1]) + dr));
        this.cursor = FILES[f] + r;
        this.renderCursor();
        const t = this.selected && this.legalFn && this.legalFn(this.selected).some((m) => m.to === this.cursor) ? ', legal move' : '';
        this.say(`${this.cursor}, ${describePiece(this.map[this.cursor])}${t}`);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.squareMode) { this.onSquare && this.onSquare(this.cursor); return; }
        if (!this.movable) { this.say('Moves are not available on this board right now.'); return; }
        if (this.selected) {
          if (this.selected === this.cursor) { this.deselect(); this.say('Selection cancelled.'); }
          else if (this.canPick(this.cursor)) this.select(this.cursor);
          else this.tryMove(this.selected, this.cursor).then((ok) => { if (!ok) this.say('That move is not legal.'); });
        } else if (this.canPick(this.cursor)) this.select(this.cursor);
        else this.say(`No ${this.movable === 'w' ? 'white' : 'black'} piece to move on ${this.cursor}.`);
      } else if (e.key === 'Escape' && this.selected) {
        this.deselect();
        this.say('Selection cancelled.');
      }
    });
  }

  renderCursor() {
    this.wrap.dataset.cursor = this.cursor;
    this.layers.cursor.innerHTML = '';
    if (document.activeElement !== this.wrap) return;
    const [x, y] = this.xy(this.cursor);
    el('rect', { x: x + 3, y: y + 3, width: 94, height: 94, rx: 6, class: 'fc-cursor' }, this.layers.cursor);
  }

  say(text) {
    this.live.textContent = '';
    requestAnimationFrame(() => { this.live.textContent = text; });
  }
}
