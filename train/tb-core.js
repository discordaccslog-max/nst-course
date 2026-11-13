/*
  Fiancho Chess — three-piece endgame tables (king + queen, rook or pawn against a lone king).
  Shared by the build-time table generator and the trainer. The trainer only reads precomputed tables;
  it never searches.

  Squares: 0 = a1 ... 63 = h8. The stronger side is always stored as White; positions where Black
  has the extra piece are mirrored before lookup.
  Table layout: index = (wk * 64 + bk) * 64 + x, one byte per position for White to move and one for
  Black to move. Byte values: 0 = draw, 255 = illegal, n = mate (or, for pawn tables, a won queen ending)
  is forced in n plies with best play.
*/
export const DRAW = 0;
export const ILLEGAL = 255;
export const SIZE = 64 * 64 * 64;

const file = (s) => s & 7;
const rank = (s) => s >> 3;
const KING_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const QUEEN_DIRS = KING_DIRS;

export const idx = (wk, bk, x) => (wk * 64 + bk) * 64 + x;

export function kingSteps(s) {
  const out = [];
  for (const [df, dr] of KING_DIRS) {
    const f = file(s) + df, r = rank(s) + dr;
    if (f >= 0 && f < 8 && r >= 0 && r < 8) out.push(r * 8 + f);
  }
  return out;
}

export const adjacent = (a, b) => a !== b && Math.abs(file(a) - file(b)) <= 1 && Math.abs(rank(a) - rank(b)) <= 1;

// Squares attacked by White's extra piece, with the two kings as blockers.
export function pieceAttacks(type, x, wk, bk) {
  const out = [];
  if (type === 'p') {
    const r = rank(x) + 1;
    if (r < 8) for (const df of [-1, 1]) { const f = file(x) + df; if (f >= 0 && f < 8) out.push(r * 8 + f); }
    return out;
  }
  const dirs = type === 'r' ? ROOK_DIRS : QUEEN_DIRS;
  for (const [df, dr] of dirs) {
    let f = file(x) + df, r = rank(x) + dr;
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const s = r * 8 + f;
      out.push(s);
      if (s === wk || s === bk) break;
      f += df; r += dr;
    }
  }
  return out;
}

export function blackInCheck(type, wk, bk, x) {
  return pieceAttacks(type, x, wk, bk).includes(bk);
}

export function legal(type, wk, bk, x, whiteToMove) {
  if (wk === bk || wk === x || bk === x) return false;
  if (adjacent(wk, bk)) return false;
  if (type === 'p' && (rank(x) === 0 || rank(x) === 7)) return false;
  if (whiteToMove && blackInCheck(type, wk, bk, x)) return false;
  return true;
}

// White's moves. Each: { wk, x, promo } where promo is 'q' or 'r' when a pawn promotes.
export function whiteMoves(type, wk, bk, x) {
  const out = [];
  for (const s of kingSteps(wk)) {
    if (s === x || adjacent(s, bk) || s === bk) continue;
    out.push({ wk: s, x, promo: null, from: wk, to: s });
  }
  if (type === 'p') {
    const one = x + 8;
    if (one !== wk && one !== bk) {
      if (rank(one) === 7) { out.push({ wk, x: one, promo: 'q', from: x, to: one }); out.push({ wk, x: one, promo: 'r', from: x, to: one }); }
      else {
        out.push({ wk, x: one, promo: null, from: x, to: one });
        const two = x + 16;
        if (rank(x) === 1 && two !== wk && two !== bk) out.push({ wk, x: two, promo: null, from: x, to: two });
      }
    }
  } else {
    for (const s of pieceAttacks(type, x, wk, bk)) {
      if (s === wk || s === bk) continue;
      out.push({ wk, x: s, promo: null, from: x, to: s });
    }
  }
  return out;
}

// Black's moves. Each: { bk, captured } (captured = Black king took White's extra piece).
export function blackMoves(type, wk, bk, x) {
  const out = [];
  for (const s of kingSteps(bk)) {
    if (s === wk || adjacent(s, wk)) continue;
    if (s === x) {
      // Capturing is legal only if the piece isn't defended by the white king.
      if (!adjacent(wk, x)) out.push({ bk: s, captured: true, from: bk, to: s });
      continue;
    }
    if (pieceAttacks(type, x, wk, s).includes(s)) continue;
    out.push({ bk: s, captured: false, from: bk, to: s });
  }
  return out;
}

// --- Lookup helpers for the trainer -------------------------------------------------------------

const sqName = (s) => 'abcdefgh'[file(s)] + (rank(s) + 1);
const sqIndex = (n) => (Number(n[1]) - 1) * 8 + 'abcdefgh'.indexOf(n[0]);

// Reads a FEN with exactly three pieces. Returns the normalized position or null.
export function fromFen(fen) {
  const [placement, stm] = fen.split(' ');
  const pieces = [];
  placement.split('/').forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else { pieces.push({ ch, sq: (7 - i) * 8 + f }); f++; }
    }
  });
  if (pieces.length !== 3) return null;
  const extra = pieces.find((p) => p.ch.toLowerCase() !== 'k');
  if (!extra || !'pqrPQR'.includes(extra.ch)) return null;
  const strongWhite = extra.ch === extra.ch.toUpperCase();
  const mirror = (s) => (strongWhite ? s : s ^ 56);
  const wkP = pieces.find((p) => p.ch === (strongWhite ? 'K' : 'k'));
  const bkP = pieces.find((p) => p.ch === (strongWhite ? 'k' : 'K'));
  return {
    type: extra.ch.toLowerCase(),
    wk: mirror(wkP.sq), bk: mirror(bkP.sq), x: mirror(extra.sq),
    strongToMove: (stm === 'w') === strongWhite,
    strongWhite,
    mirror
  };
}

export function probe(tables, pos) {
  const t = tables[pos.type];
  const i = idx(pos.wk, pos.bk, pos.x);
  const v = pos.strongToMove ? t.w[i] : t.b[i];
  return v;
}

// Moves for the side to move, each with the resulting table value, as UCI strings in real coordinates.
export function scoredMoves(tables, pos) {
  const t = tables[pos.type];
  const real = (s) => sqName(pos.mirror(s));
  const res = [];
  if (pos.strongToMove) {
    for (const m of whiteMoves(pos.type, pos.wk, pos.bk, pos.x)) {
      let v;
      if (m.promo) {
        const tt = tables[m.promo];
        v = tt ? tt.b[idx(m.wk, pos.bk, m.x)] : DRAW;
      } else v = t.b[idx(m.wk, pos.bk, m.x)];
      if (v === ILLEGAL) continue;
      res.push({ uci: real(m.from) + real(m.to) + (m.promo || ''), value: v, promo: m.promo });
    }
  } else {
    for (const m of blackMoves(pos.type, pos.wk, pos.bk, pos.x)) {
      const v = m.captured ? DRAW : t.w[idx(pos.wk, m.bk, pos.x)];
      if (v === ILLEGAL) continue;
      res.push({ uci: real(m.from) + real(m.to), value: v, captured: m.captured });
    }
  }
  return res;
}

export { sqName, sqIndex };
