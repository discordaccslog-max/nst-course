import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPdf, confirmationBlocks } from '../../js/pdf.js';

const blocks = confirmationBlocks({
  productName: 'Positional Play & Strategy', price: 55, dateText: 'November 13, 2026 at 4:39 PM EST', orderRef: 'cs_test_é(1)',
  code: 'FIAN-PS-2345-6789-ABCD', origin: 'https://fiancho-chess.vercel.app', supportEmail: 'fianchomail@fianchochess.space', startUrl: 'https://fiancho-chess.vercel.app/train/'
});
const bytes = buildPdf(blocks, { title: 'Order confirmation' });
const text = Buffer.from(bytes).toString('latin1');

test('confirmation PDF has a valid structure with correct cross-reference offsets', () => {
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.trimEnd().endsWith('%%EOF'));
  const startxref = Number(/startxref\n(\d+)/.exec(text)[1]);
  assert.ok(text.slice(startxref).startsWith('xref'));
  const entries = [...text.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  assert.ok(entries.length >= 7);
  entries.forEach((off, i) => assert.ok(text.slice(off).startsWith(`${i + 1} 0 obj`), `object ${i + 1} offset`));
  const len = Number(/\/Length (\d+) >>\nstream\n/.exec(text)[1]);
  const start = text.indexOf('stream\n') + 7;
  assert.equal(text.slice(start + len, start + len + 10), '\nendstream');
});

test('confirmation PDF contains the order details and policy links', () => {
  for (const s of ['Your order is complete and your course has been delivered.', 'Product: Positional Play & Strategy', 'FIAN-PS-2345-6789-ABCD', 'November 13, 2026', 'Order reference: cs_test_\\351\\(1\\)']) {
    assert.ok(text.includes(s), s);
  }
  for (const u of ['/terms.html', '/refund-policy.html', '/delivery-policy.html']) assert.ok(text.includes(`/URI (https://fiancho-chess.vercel.app${u})`), u);
  assert.ok(text.includes('fianchomail@fianchochess.space'));
});

test('confirmation PDF omits the order reference line when there is none', () => {
  const t = Buffer.from(buildPdf(confirmationBlocks({ productName: 'X', price: 1, dateText: 'd', orderRef: null, code: 'C', origin: 'https://a.b', supportEmail: '', startUrl: 'https://a.b/train/' }))).toString('latin1');
  assert.ok(!t.includes('Order reference'));
});
