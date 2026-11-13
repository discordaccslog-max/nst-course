// Build-time: picks candidate training positions from the public-domain (CC0) puzzle database
// in tools/cache/puzzles.csv.zst. Output: tools/cache/candidates.json (verified later by verify.mjs).
//
// Each database row stores the position one move early: Moves[0] is the opponent's move, and the
// learner's solution starts at Moves[1]. We store the learner's starting FEN and solution directly.
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { Chess } from 'chess.js';

const SRC = new URL('../cache/puzzles.csv.zst', import.meta.url);
const OUT = new URL('../cache/candidates.json', import.meta.url);

// Slots: course/lesson buckets. `want` = how many candidates to keep (oversampled; verification trims).
const has = (t, ...names) => names.every((n) => t.includes(n));
const any = (t, ...names) => names.some((n) => t.includes(n));
const slots = [
  // Tactics Fundamentals (beginner)
  { id: 'tf-fork', want: 14, rating: [600, 1250], test: (p) => has(p.themes, 'fork') && p.keyPiece === 'n' && p.sol.length <= 3 },
  { id: 'tf-pin', want: 14, rating: [600, 1300], test: (p) => has(p.themes, 'pin') && p.sol.length <= 3 },
  { id: 'tf-skewer', want: 14, rating: [600, 1350], test: (p) => has(p.themes, 'skewer') && p.sol.length <= 3 },
  { id: 'tf-discovered', want: 14, rating: [700, 1400], test: (p) => has(p.themes, 'discoveredAttack') && p.sol.length <= 3 },
  { id: 'tf-double', want: 14, rating: [600, 1300], test: (p) => has(p.themes, 'fork') && ['q', 'b', 'r'].includes(p.keyPiece) && p.sol.length <= 3 },
  { id: 'tf-mixed', want: 22, rating: [900, 1500], test: (p) => any(p.themes, 'fork', 'pin', 'skewer', 'discoveredAttack') && !has(p.themes, 'mate') && p.sol.length <= 3 },
  // Checkmate Patterns (beginner)
  { id: 'cm-backrank', want: 14, rating: [600, 1300], test: (p) => has(p.themes, 'backRankMate') && any(p.themes, 'mateIn1', 'mateIn2') },
  { id: 'cm-queen', want: 14, rating: [500, 1200], test: (p) => has(p.themes, 'mateIn1') && p.keyPiece === 'q' && !has(p.themes, 'backRankMate') },
  { id: 'cm-rook', want: 14, rating: [600, 1300], test: (p) => any(p.themes, 'mateIn1', 'mateIn2') && p.keyPiece === 'r' && !has(p.themes, 'backRankMate') },
  { id: 'cm-minor', want: 14, rating: [700, 1500], test: (p) => any(p.themes, 'smotheredMate', 'doubleBishopMate', 'bodenMate', 'arabianMate', 'hookMate', 'anastasiaMate') && any(p.themes, 'mateIn1', 'mateIn2') },
  { id: 'cm-sacrifice', want: 14, rating: [900, 1600], test: (p) => has(p.themes, 'sacrifice', 'mateIn2') },
  { id: 'cm-mixed', want: 20, rating: [800, 1500], test: (p) => any(p.themes, 'mateIn2') },
  // Calculation & Visualization (intermediate to advanced)
  { id: 'cv-short', want: 14, rating: [1400, 1900], test: (p) => has(p.themes, 'mateIn3') || (has(p.themes, 'long') && p.sol.length === 5) },
  { id: 'cv-long', want: 14, rating: [1800, 2400], test: (p) => any(p.themes, 'veryLong', 'mateIn4', 'mateIn5') && p.sol.length >= 7 },
  { id: 'cv-visual', want: 60, rating: [1000, 2200], test: (p) => p.sol.length >= 3 && p.sol.length <= 9 },
  // Positional Play & Strategy (intermediate to advanced): quiet best moves
  { id: 'ps-quiet', want: 30, rating: [1500, 2200], test: (p) => has(p.themes, 'quietMove') && !has(p.themes, 'mate') && p.sol.length <= 3 },
  { id: 'ps-structure', want: 120, rating: [800, 2200], test: (p) => has(p.themes, 'middlegame') && p.pawnCount >= 10 },
  // Endgame Essentials (beginner to intermediate)
  { id: 'ee-pawn', want: 16, rating: [800, 1600], test: (p) => has(p.themes, 'pawnEndgame') && p.sol.length <= 5 },
  { id: 'ee-rook', want: 16, rating: [900, 1700], test: (p) => has(p.themes, 'rookEndgame') && p.sol.length <= 5 }
];

// Seeded RNG so selection is reproducible.
let seed = 20261113;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const reservoirs = Object.fromEntries(slots.map((s) => [s.id, { seen: 0, items: [] }]));
const usedIds = new Set();

// The file opens with a 12-byte zstd skippable frame (an index), which the decompressor rejects, so skip it.
// A trailing index frame may also raise an error at the very end; by then every row has been read.
const input = fs.createReadStream(SRC, { start: 12 }).pipe(zlib.createZstdDecompress());
input.on('error', (e) => { console.log('decompressor stopped:', e.code); rl.close(); });
const rl = readline.createInterface({ input, crlfDelay: Infinity });
let header = null;
let n = 0;
for await (const line of rl) {
  if (!header) { header = line.split(','); continue; }
  n++;
  const c = line.split(',');
  if (c.length < 8 || !c[2]) continue;
  const row = { id: c[0], fen: c[1], moves: c[2].split(' '), rating: +c[3], rd: +c[4], pop: +c[5], plays: +c[6], themes: c[7].split(' ') };
  if (row.pop < 88 || row.plays < 1500 || row.rd > 85) continue;
  // Quick pre-filter: does any slot accept this rating?
  const ratingSlots = slots.filter((s) => row.rating >= s.rating[0] && row.rating <= s.rating[1]);
  if (!ratingSlots.length) continue;

  let chess;
  try { chess = new Chess(row.fen); chess.move(uciToObj(row.moves[0])); } catch { continue; }
  const startFen = chess.fen();
  const keyMove = chess.move(uciToObj(row.moves[1]));
  chess.undo();
  const placement = startFen.split(' ')[0];
  const p = {
    id: row.id, fen: startFen, sol: row.moves.slice(1), rating: row.rating, themes: row.themes,
    keyPiece: keyMove.piece, pawnCount: (placement.match(/p/gi) || []).length
  };
  for (const s of ratingSlots) {
    if (!s.test(p)) continue;
    const r = reservoirs[s.id];
    r.seen++;
    if (r.items.length < s.want * 3) r.items.push(p);
    else { const j = Math.floor(rand() * r.seen); if (j < r.items.length) r.items[j] = p; }
  }
  if (n % 500000 === 0) console.log(`${n} rows scanned`);
}

// Trim to `want * 3` (already) and remove duplicates across slots, keeping the first slot that claims a puzzle.
const out = {};
for (const s of slots) {
  out[s.id] = [];
  for (const p of reservoirs[s.id].items) {
    if (usedIds.has(p.id)) continue;
    usedIds.add(p.id);
    out[s.id].push(p);
  }
  console.log(s.id, 'candidates', out[s.id].length, 'of', reservoirs[s.id].seen, 'matching');
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('rows scanned:', n);

function uciToObj(u) { return { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }; }
