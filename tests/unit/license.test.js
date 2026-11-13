import test from 'node:test';
import assert from 'node:assert/strict';
import '../../js/products.js';
import { ALPHABET, generate, validate, normalize, orderRefFrom, ORDER_PARAMS, PREFIX } from '../../js/license.js';

const slugs = Object.keys(globalThis.SITE_PRODUCTS);

test('alphabet has 31 unambiguous characters', () => {
  assert.equal(ALPHABET.length, 31);
  assert.equal(new Set(ALPHABET).size, 31);
  for (const ch of '01ILO') assert.ok(!ALPHABET.includes(ch), `alphabet must not contain ${ch}`);
});

test('generated codes validate for every product and carry its product code', async () => {
  for (const slug of slugs) {
    for (let i = 0; i < 50; i++) {
      const code = await generate(slug);
      assert.match(code, /^FIAN-[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      const v = validate(code);
      assert.ok(v.ok, `${code} should validate`);
      assert.equal(v.product.slug, slug);
      const random = v.body.slice(2, 13);
      assert.ok(random.length >= 8);
      for (const ch of v.body) assert.ok(ALPHABET.includes(ch));
    }
  }
});

test('every single-character substitution is rejected', async () => {
  for (const slug of slugs) {
    const v = validate(await generate(slug));
    const body = v.body;
    let checked = 0;
    for (let i = 0; i < body.length; i++) {
      for (const ch of ALPHABET) {
        if (ch === body[i]) continue;
        const bad = body.slice(0, i) + ch + body.slice(i + 1);
        assert.equal(validate(PREFIX + bad).ok, false, `substitution at ${i} (${body[i]} -> ${ch}) must be caught`);
        checked++;
      }
    }
    assert.equal(checked, 14 * 30);
  }
});

test('every adjacent transposition is rejected', async () => {
  for (const slug of slugs) {
    for (let n = 0; n < 20; n++) {
      const body = validate(await generate(slug)).body;
      for (let i = 0; i < body.length - 1; i++) {
        if (body[i] === body[i + 1]) continue;
        const swapped = body.slice(0, i) + body[i + 1] + body[i] + body.slice(i + 2);
        assert.equal(validate(PREFIX + swapped).ok, false, `swap at ${i} must be caught in ${body}`);
      }
    }
  }
});

test('entry ignores case, spaces and dashes, and forgives look-alikes in the prefix', async () => {
  const code = await generate('endgame-essentials');
  const raw = code.replace(/-/g, '');
  for (const variant of [code.toLowerCase(), raw, ` ${raw.split('').join(' ')} `, code.replace(/-/g, ' - '), code.replace('FIAN', 'F1AN'), code.replace('FIAN', 'flan')]) {
    const v = validate(variant);
    assert.ok(v.ok, `variant "${variant}" should validate`);
    assert.equal(v.code, code);
  }
  assert.equal(normalize('fian-tf 2345'), 'FIANTF2345');
});

test('helpful rejection reasons', () => {
  assert.equal(validate('').reason, 'empty');
  assert.equal(validate('ABCD-TF-2345-6789-ABCD').reason, 'prefix');
  assert.equal(validate('FIAN-TF-2345').reason, 'length');
  assert.equal(validate('FIAN-TF-2345-6789-ABO0').reason, 'chars');
});

test('order-linked codes are consistent: same order, same code', async () => {
  for (const slug of slugs) {
    const a = await generate(slug, 'cs_test_a1B2c3D4e5');
    const b = await generate(slug, 'cs_test_a1B2c3D4e5');
    const c = await generate(slug, 'cs_test_a1B2c3D4e6');
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.ok(validate(a).ok);
  }
  // The same order reference gives different codes for different products.
  assert.notEqual(await generate('tactics-fundamentals', 'ORDER-1'), await generate('checkmate-patterns', 'ORDER-1'));
});

test('codes without an order reference are random', async () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(await generate('tactics-fundamentals'));
  assert.equal(seen.size, 200);
});

test('order reference is read from every supported URL parameter', () => {
  for (const key of ORDER_PARAMS) {
    const r = orderRefFrom(`?utm=x&${key}=ABC123`);
    assert.deepEqual(r, { key, value: 'ABC123' });
  }
  assert.equal(orderRefFrom('?utm=x'), null);
  assert.equal(orderRefFrom('?order_id=%20%20'), null);
});

test('codes never contain unsuitable words, and order-linked codes stay deterministic', async () => {
  const { isAcceptable } = await import('../../js/license.js');
  assert.equal(isAcceptable('FIAN-PS-337Y-ANM2-NSFW'), false);
  assert.equal(isAcceptable('FIAN-PS-337Y-ANM2-NS2W'), true);
  for (let i = 0; i < 3000; i++) assert.ok(isAcceptable(await generate('positional-play-strategy')));
  for (let i = 0; i < 300; i++) {
    const a = await generate('tactics-fundamentals', `ORD-${i}`);
    assert.ok(isAcceptable(a));
    assert.equal(a, await generate('tactics-fundamentals', `ORD-${i}`));
  }
});
