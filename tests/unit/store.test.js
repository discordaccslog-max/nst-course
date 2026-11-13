import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal localStorage for Node.
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear() };
await import('../../js/products.js');
const store = await import('../../js/store.js');
const { generate } = await import('../../js/license.js');
const COURSES = Object.keys(globalThis.SITE_PRODUCTS).filter((s) => !globalThis.SITE_PRODUCTS[s].includes);

test('activating a course code unlocks exactly that course', async () => {
  mem.clear();
  const r = store.activate(await generate('endgame-essentials'));
  assert.ok(r.ok);
  assert.ok(store.owns('endgame-essentials'));
  for (const s of COURSES.filter((c) => c !== 'endgame-essentials')) assert.equal(store.owns(s), false, s);
  assert.equal(store.owns('complete-training-library'), false);
});

test('a Complete Training Library code unlocks all seven courses', async () => {
  mem.clear();
  const code = await generate('complete-training-library', 'ORDER-LIB');
  const r = store.activate(code);
  assert.ok(r.ok);
  assert.deepEqual([...r.unlocks].sort(), [...COURSES].sort());
  for (const s of COURSES) { assert.ok(store.owns(s), s); assert.equal(store.licenseFor(s).code, code); }
  assert.ok(store.owns('complete-training-library'));
});

test('invalid codes are rejected and not stored', () => {
  mem.clear();
  const r = store.activate('FIAN-TF-2222-2222-2222');
  assert.equal(r.ok, false);
  assert.equal(store.licenses().length, 0);
});

test('activating the same code twice is harmless', async () => {
  mem.clear();
  const code = await generate('checkmate-patterns', 'X1');
  assert.equal(store.activate(code).already, false);
  assert.equal(store.activate(code.toLowerCase().replace(/-/g, ' ')).already, true);
  assert.equal(store.licenses().length, 1);
});

test('missed positions go into the review queue and leave it when solved cleanly', () => {
  mem.clear();
  store.recordResult('tactics-fundamentals', 'p1', { correct: false, clean: false });
  store.recordResult('tactics-fundamentals', 'p2', { correct: true, clean: true });
  assert.deepEqual(store.getProgress('tactics-fundamentals').review, ['p1']);
  store.recordResult('tactics-fundamentals', 'p1', { correct: true, clean: true, inReview: true });
  assert.deepEqual(store.getProgress('tactics-fundamentals').review, []);
  const s = store.summary('tactics-fundamentals', 10);
  assert.equal(s.solved, 2);
  assert.equal(s.accuracy, 50); // first attempts: p1 missed, p2 clean
});

test('backup export and import round-trip licenses, progress and settings', async () => {
  mem.clear();
  const code = await generate('positional-play-strategy', 'B-1');
  store.activate(code);
  store.recordResult('positional-play-strategy', 'st-1', { correct: true, clean: true });
  store.setSetting('largeUi', true);
  const backup = store.exportBackup();
  assert.ok(store.lastBackupAt());
  mem.clear();
  assert.equal(store.owns('positional-play-strategy'), false);
  const r = store.importBackup(backup);
  assert.ok(r.ok, r.message);
  assert.equal(r.added, 1);
  assert.ok(store.owns('positional-play-strategy'));
  assert.equal(store.getProgress('positional-play-strategy').items['st-1'].solved, true);
  assert.equal(store.getSetting('largeUi'), true);
});

test('importing rejects files that are not backups and skips invalid codes', () => {
  mem.clear();
  assert.equal(store.importBackup('not json').ok, false);
  assert.equal(store.importBackup(JSON.stringify({ hello: 1 })).ok, false);
  const r = store.importBackup(JSON.stringify({ format: 'fiancho-chess-backup', version: 1, licenses: { x: { code: 'FIAN-TF-2222-2222-2222' } }, progress: {} }));
  assert.ok(r.ok);
  assert.equal(r.added, 0);
  assert.equal(r.rejected, 1);
});

test('the backup reminder appears after 30 days without a backup', async () => {
  mem.clear();
  assert.equal(store.backupDue(), false); // nothing to back up yet
  store.activate(await generate('tactics-fundamentals'));
  const now = Date.now();
  assert.equal(store.backupDue(now), false);
  assert.equal(store.backupDue(now + 31 * 86400000), true);
  store.exportBackup();
  assert.equal(store.backupDue(Date.now() + 29 * 86400000), false);
  assert.equal(store.backupDue(Date.now() + 31 * 86400000), true);
});
