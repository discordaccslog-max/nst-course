/*
  Fiancho Chess — on-device storage for licenses, training progress and settings.
  Everything stays in this browser (localStorage). Nothing is ever sent anywhere.
*/
import { validate } from './license.js';

const KEY = 'fiancho-chess.v1';
const BACKUP_FORMAT = 'fiancho-chess-backup';
export const BACKUP_INTERVAL_DAYS = 30;

function empty() {
  return { version: 1, licenses: {}, progress: {}, settings: {}, lastBackupAt: null, createdAt: new Date().toISOString() };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw);
    return { ...empty(), ...s, licenses: s.licenses || {}, progress: s.progress || {}, settings: s.settings || {} };
  } catch {
    return empty();
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function products() { return globalThis.SITE_PRODUCTS || {}; }

// Course slugs a product unlocks (the Library unlocks all seven).
export function unlocks(slug) {
  const p = products()[slug];
  return p && p.includes ? [...p.includes] : [slug];
}

export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* the browser may decline; data is still stored */ }
}

export function activate(input, { source = 'manual' } = {}) {
  const v = validate(input);
  if (!v.ok) return v;
  const state = load();
  const already = !!state.licenses[v.code];
  if (!already) state.licenses[v.code] = { code: v.code, product: v.product.slug, activatedAt: new Date().toISOString(), source };
  save(state);
  requestPersistence();
  return { ok: true, code: v.code, product: v.product, unlocks: unlocks(v.product.slug), already };
}

export function licenses() {
  return Object.values(load().licenses);
}

export function ownedCourses() {
  const out = new Set();
  for (const l of licenses()) for (const s of unlocks(l.product)) out.add(s);
  return out;
}

export function owns(slug) {
  const p = products()[slug];
  if (p && p.includes) return licenses().some((l) => l.product === slug);
  return ownedCourses().has(slug);
}

// The license that gives access to a course or product (a direct license first, then the Library).
export function licenseFor(slug) {
  const all = licenses();
  return all.find((l) => l.product === slug) || all.find((l) => unlocks(l.product).includes(slug)) || null;
}

/* ---------------- progress ---------------- */
function courseProgress(state, slug) {
  if (!state.progress[slug]) state.progress[slug] = { items: {}, review: [], seen: [], last: null };
  return state.progress[slug];
}

export function getProgress(slug) {
  return courseProgress(load(), slug);
}

// result: { correct: bool, clean: bool } — clean means solved without wrong moves, hints or reveal.
export function recordResult(slug, itemId, { correct, clean, inReview = false }) {
  const state = load();
  const cp = courseProgress(state, slug);
  const it = cp.items[itemId] || { attempts: 0, correct: 0, first: null, solved: false };
  it.attempts++;
  if (correct) { it.correct++; it.solved = true; }
  if (it.first === null) it.first = !!(correct && clean);
  it.lastResult = correct && clean ? 'clean' : correct ? 'solved' : 'missed';
  it.at = new Date().toISOString();
  cp.items[itemId] = it;
  const inQueue = cp.review.includes(itemId);
  if (!(correct && clean)) { if (!inQueue) cp.review.push(itemId); }
  else if (inQueue && (inReview || it.attempts > 1)) cp.review = cp.review.filter((x) => x !== itemId);
  save(state);
  return it;
}

export function markSeen(slug, sectionId) {
  const state = load();
  const cp = courseProgress(state, slug);
  if (!cp.seen.includes(sectionId)) cp.seen.push(sectionId);
  save(state);
}

export function setLast(slug, where) {
  const state = load();
  courseProgress(state, slug).last = where;
  save(state);
}

export function summary(slug, totalPositions) {
  const cp = getProgress(slug);
  const items = Object.values(cp.items);
  const solved = items.filter((i) => i.solved).length;
  const firsts = items.filter((i) => i.first !== null);
  const accuracy = firsts.length ? Math.round((firsts.filter((i) => i.first).length / firsts.length) * 100) : null;
  return { attempted: items.length, solved, total: totalPositions || 0, accuracy, review: cp.review.length, percent: totalPositions ? Math.min(100, Math.round((solved / totalPositions) * 100)) : 0 };
}

/* ---------------- settings ---------------- */
export function getSetting(name, fallback = null) {
  const v = load().settings[name];
  return v === undefined ? fallback : v;
}

export function setSetting(name, value) {
  const state = load();
  state.settings[name] = value;
  save(state);
}

/* ---------------- backup ---------------- */
export function exportBackup() {
  const state = load();
  const now = new Date().toISOString();
  const data = { format: BACKUP_FORMAT, version: 1, exportedAt: now, licenses: state.licenses, progress: state.progress, settings: state.settings };
  state.lastBackupAt = now;
  save(state);
  return JSON.stringify(data, null, 2);
}

export function importBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { return { ok: false, message: 'That file isn’t a Fiancho Chess backup.' }; }
  if (!data || data.format !== BACKUP_FORMAT || typeof data.licenses !== 'object') return { ok: false, message: 'That file isn’t a Fiancho Chess backup.' };
  const state = load();
  let added = 0, rejected = 0;
  for (const rec of Object.values(data.licenses || {})) {
    const v = validate(rec && rec.code);
    if (!v.ok) { rejected++; continue; }
    if (!state.licenses[v.code]) { state.licenses[v.code] = { code: v.code, product: v.product.slug, activatedAt: rec.activatedAt || new Date().toISOString(), source: 'backup' }; added++; }
  }
  // Merge progress: keep the record with more attempts for each item, and union the review queues.
  for (const [slug, cp] of Object.entries(data.progress || {})) {
    const mine = courseProgress(state, slug);
    for (const [id, it] of Object.entries(cp.items || {})) {
      if (!mine.items[id] || (it.attempts || 0) > (mine.items[id].attempts || 0)) mine.items[id] = it;
    }
    for (const id of cp.review || []) if (!mine.review.includes(id)) mine.review.push(id);
    for (const id of cp.seen || []) if (!mine.seen.includes(id)) mine.seen.push(id);
    if (!mine.last && cp.last) mine.last = cp.last;
  }
  state.settings = { ...data.settings, ...state.settings };
  state.lastBackupAt = data.exportedAt || state.lastBackupAt;
  save(state);
  requestPersistence();
  return { ok: true, added, rejected, message: `Backup restored: ${added} ${added === 1 ? 'license' : 'licenses'} added${rejected ? `, ${rejected} invalid ${rejected === 1 ? 'entry' : 'entries'} skipped` : ''}, progress merged.` };
}

// A gentle reminder when there is something to lose and no backup in the last 30 days.
export function backupDue(now = Date.now()) {
  const state = load();
  const lic = Object.values(state.licenses);
  if (!lic.length) return false;
  const firstActivation = Math.min(...lic.map((l) => Date.parse(l.activatedAt) || now));
  const since = state.lastBackupAt ? Date.parse(state.lastBackupAt) : firstActivation;
  return now - since >= BACKUP_INTERVAL_DAYS * 86400000;
}

export function lastBackupAt() {
  return load().lastBackupAt;
}
