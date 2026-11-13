// Build-time: generates exact three-piece endgame tables by retrograde analysis.
// Output: train/tb/{q,r,p}.bin.gz — White-to-move table followed by Black-to-move table, one byte per position.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { SIZE, ILLEGAL, DRAW, idx, legal, whiteMoves, blackMoves, blackInCheck } from '../../train/tb-core.js';

const OUT_DIR = new URL('../../train/tb/', import.meta.url);
fs.mkdirSync(OUT_DIR, { recursive: true });

function generate(type, conversions = {}) {
  const UNKNOWN = -1, ILL = -2;
  const W = new Int16Array(SIZE).fill(UNKNOWN); // plies to mate, White to move
  const B = new Int16Array(SIZE).fill(UNKNOWN); // plies to mate, Black to move (being mated)
  const drawW = new Uint8Array(SIZE), drawB = new Uint8Array(SIZE);
  for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let x = 0; x < 64; x++) {
    const i = idx(wk, bk, x);
    if (!legal(type, wk, bk, x, true)) W[i] = ILL;
    if (!legal(type, wk, bk, x, false)) { B[i] = ILL; continue; }
    const moves = blackMoves(type, wk, bk, x);
    if (!moves.length) {
      if (blackInCheck(type, wk, bk, x)) B[i] = 0; // checkmate
      else drawB[i] = 1; // stalemate
    } else if (moves.some((m) => m.captured)) drawB[i] = 1; // Black can take the piece: draw
  }
  let n = 1, quiet = 0;
  while (quiet < 2 && n < 250) {
    let changed = 0;
    if (n % 2 === 1) {
      for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let x = 0; x < 64; x++) {
        const i = idx(wk, bk, x);
        if (W[i] !== UNKNOWN) continue;
        for (const m of whiteMoves(type, wk, bk, x)) {
          let p;
          if (m.promo) {
            const t = conversions[m.promo];
            const e = t ? t.b[idx(m.wk, bk, m.x)] : DRAW;
            p = e > 0 && e !== ILLEGAL ? e - 1 : -1;
          } else {
            const j = idx(m.wk, bk, m.x);
            p = drawB[j] ? -1 : B[j];
          }
          if (p === n - 1) { W[i] = n; changed++; break; }
        }
      }
    } else {
      for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let x = 0; x < 64; x++) {
        const i = idx(wk, bk, x);
        if (B[i] !== UNKNOWN || drawB[i]) continue;
        let worst = -1, ok = true;
        for (const m of blackMoves(type, wk, bk, x)) {
          const v = W[idx(wk, m.bk, x)];
          if (v < 0) { ok = false; break; }
          if (v > worst) worst = v;
        }
        if (ok && worst === n - 1) { B[i] = n; changed++; }
      }
    }
    quiet = changed ? 0 : quiet + 1;
    n++;
  }
  const w = new Uint8Array(SIZE), b = new Uint8Array(SIZE);
  let maxW = 0, wins = 0, draws = 0;
  for (let i = 0; i < SIZE; i++) {
    w[i] = W[i] === ILL ? ILLEGAL : W[i] >= 0 ? W[i] + 1 : DRAW;
    b[i] = B[i] === ILL ? ILLEGAL : B[i] >= 0 ? B[i] + 1 : DRAW;
    if (W[i] >= 0) { wins++; maxW = Math.max(maxW, W[i]); } else if (W[i] === UNKNOWN) draws++;
  }
  console.log(`${type}: white-to-move wins ${wins}, draws ${draws}, longest mate ${maxW} plies (${(maxW + 1) / 2} moves)`);
  return { w, b };
}

const t0 = Date.now();
const q = generate('q');
const r = generate('r');
const p = generate('p', { q, r });
for (const [name, t] of Object.entries({ q, r, p })) {
  const raw = Buffer.concat([Buffer.from(t.w), Buffer.from(t.b)]);
  const gz = zlib.gzipSync(raw, { level: 9 });
  fs.writeFileSync(new URL(`${name}.bin.gz`, OUT_DIR), gz);
  console.log(`${name}.bin.gz ${(gz.length / 1024).toFixed(0)} KB`);
}
console.log('seconds', ((Date.now() - t0) / 1000).toFixed(1));
