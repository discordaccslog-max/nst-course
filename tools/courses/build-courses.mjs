// Build-time: assembles every course into train/courses/<slug>.json.
// Inputs: verified positions (data/verified.json), candidate positions for computed exercises
// (cache/candidates.json, or data/exercise-positions.json once frozen), hand-written lessons and
// repertoires (src/), and the endgame tables. Stockfish (build time only) checks the rook-ending
// demonstrations and supplies the evaluations quoted in quiet-move explanations.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { Chess } from 'chess.js';
import { Engine, scoreValue } from './engine.mjs';
import { courses as lessonCourses, endgameDemos, endgamePractice } from './src/lessons.mjs';
import * as repBlack from './src/repertoire-black.mjs';
import * as repWhite from './src/repertoire-white.mjs';
import { fromFen, probe, SIZE } from '../../train/tb-core.js';

const root = new URL('../../', import.meta.url);
const verified = JSON.parse(fs.readFileSync(new URL('data/verified.json', import.meta.url), 'utf8'));
const frozenPath = new URL('data/exercise-positions.json', import.meta.url);
let exercisePositions;
if (fs.existsSync(frozenPath)) exercisePositions = JSON.parse(fs.readFileSync(frozenPath, 'utf8'));
else {
  const cand = JSON.parse(fs.readFileSync(new URL('../cache/candidates.json', import.meta.url), 'utf8'));
  exercisePositions = { visual: cand['cv-visual'].map((p) => ({ id: p.id, fen: p.fen, line: p.sol })), structure: cand['ps-structure'].map((p) => ({ id: p.id, fen: p.fen })) };
  fs.writeFileSync(frozenPath, JSON.stringify(exercisePositions));
}
const products = await loadProducts();
const engine = new Engine('single');
await engine.init({ hash: 128 });
const evalCache = new Map();
async function evaluate(fen, depth = 18) {
  if (evalCache.has(fen)) return evalCache.get(fen);
  const r = await engine.analyse(fen, { depth, multipv: 2 });
  evalCache.set(fen, r);
  return r;
}

const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const COLOR = { w: 'White', b: 'Black' };
const other = (c) => (c === 'w' ? 'b' : 'w');
const article = (w) => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
const joinList = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const uciObj = (u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
const moveNo = (chess, color) => { const n = Number(chess.fen().split(' ')[5]); return color === 'w' ? `${n}.` : `${n}...`; };

/* ---------------------------------------------------------------- explanations */
function attackedBy(chess, square, byColor) {
  return chess.attackers(square, byColor);
}

function pieceList(chess, color) {
  const out = [];
  for (const row of chess.board()) for (const sq of row) if (sq && sq.color === color) out.push(sq);
  return out;
}

function describeMove(chess, mv, learner) {
  // `chess` is the position after `mv` was played.
  const who = COLOR[mv.color];
  const piece = NAMES[mv.piece];
  const bits = [];
  if (mv.san.includes('#')) {
    bits.push(mv.captured ? `The ${piece} takes the ${NAMES[mv.captured]} on ${mv.to} and gives checkmate.` : `The ${piece} gives checkmate.`);
    return bits.join(' ');
  }
  if (mv.promotion) bits.push(`The pawn promotes to ${article(NAMES[mv.promotion])}.`);
  else if (mv.captured) bits.push(`The ${piece} takes the ${NAMES[mv.captured]} on ${mv.to}${mv.san.includes('+') ? ' with check' : ''}.`);
  else if (mv.san.includes('+')) {
    const checkers = chess.attackers(kingSquare(chess, other(mv.color)), mv.color);
    const discovered = !checkers.includes(mv.to);
    if (checkers.length > 1) bits.push(`A double check: both the ${piece} and the ${NAMES[chess.get(checkers.find((s) => s !== mv.to)).type]} give check, so the king must move.`);
    else if (discovered) bits.push(`Moving the ${piece} uncovers a check from the ${NAMES[chess.get(checkers[0]).type]} on ${checkers[0]}.`);
    else bits.push(`The ${piece} gives check.`);
  } else if (mv.piece === 'k' && !learner) bits.push('The king steps out of danger.');
  if (learner) {
    // Targets the moved piece now attacks: valuable or undefended enemy pieces.
    const targets = [];
    for (const p of pieceList(chess, other(mv.color))) {
      if (p.type === 'k') continue;
      const atk = chess.attackers(p.square, mv.color);
      if (!atk.includes(mv.to)) continue;
      const defended = chess.attackers(p.square, other(mv.color)).length > 0;
      if (VALUES[p.type] > VALUES[mv.piece] || !defended) targets.push(`the ${NAMES[p.type]} on ${p.square}${defended ? '' : ' (undefended)'}`);
    }
    if (targets.length) bits.push(`It ${mv.san.includes('+') ? 'also ' : ''}attacks ${joinList(targets)}.`);
  } else if (!bits.length) {
    bits.push(`${who}’s best defense.`);
  }
  return bits.join(' ');
}

function kingSquare(chess, color) {
  for (const row of chess.board()) for (const sq of row) if (sq && sq.type === 'k' && sq.color === color) return sq.square;
  return null;
}

function materialSummary(gained, lost, learner) {
  const g = gained.map((t) => article(NAMES[t]));
  const l = lost.map((t) => article(NAMES[t]));
  const gv = gained.reduce((s, t) => s + VALUES[t], 0), lv = lost.reduce((s, t) => s + VALUES[t], 0);
  if (gv - lv <= 0) return null;
  return `${COLOR[learner]} wins ${joinList(g)}${l.length ? ` for ${joinList(l)}` : ''}.`;
}

async function explainLine(fen, solution) {
  const chess = new Chess(fen);
  const learner = chess.turn();
  const notes = [];
  const gained = [], lost = [];
  let promo = null;
  for (let i = 0; i < solution.length; i++) {
    const color = chess.turn();
    const label = moveNo(chess, color);
    const mv = chess.move(uciObj(solution[i]));
    if (mv.captured) (color === learner ? gained : lost).push(mv.captured);
    if (mv.promotion && color === learner) promo = mv.promotion;
    notes.push({ uci: solution[i], san: mv.san, label, note: describeMove(chess, mv, color === learner) });
  }
  let summary;
  if (chess.isCheckmate()) summary = 'Checkmate.';
  else {
    summary = materialSummary(gained, lost, learner);
    if (promo && !summary) summary = `${COLOR[learner]} promotes and keeps a decisive material advantage.`;
    if (!summary) {
      const ev = await evaluate(chess.fen(), 18);
      const s = ev[0].score; const v = scoreValue(s) * (chess.turn() === learner ? 1 : -1);
      summary = v >= 300 ? `${COLOR[learner]} now has a decisive advantage.` : v >= 150 ? `${COLOR[learner]} now has a clear advantage.` : `${COLOR[learner]} keeps the advantage.`;
    }
  }
  return { notes, summary, learner };
}

/* ---------------------------------------------------------------- item builders */
function pick(slot, from = 0, count) {
  const list = verified[slot] || [];
  return list.slice(from, count ? from + count : undefined);
}

async function puzzleItem(p, slot, prompt) {
  const ex = await explainLine(p.fen, p.solution);
  const item = {
    type: 'puzzle', id: `${slot}-${p.id}`, fen: p.fen, orientation: ex.learner,
    prompt: `${COLOR[ex.learner]} to move. ${prompt}`,
    solution: p.solution, sans: ex.notes.map((n) => n.san), accepted: p.accepted || {},
    notes: ex.notes.map((n) => n.note), summary: ex.summary
  };
  if (slot === 'ps-quiet') {
    const lines = await evaluate(p.fen, 20);
    const chess = new Chess(p.fen);
    const best = lines[0], alt = lines.find((l) => l.move !== p.solution[0] && !(p.accepted[0] || []).includes(l.move));
    if (alt) {
      const altSan = chess.move(uciObj(alt.move)).san; chess.undo();
      const gap = scoreValue(best.score) - scoreValue(alt.score);
      item.summary += ` Other moves are clearly weaker: the next best, ${altSan}, gives away about ${(gap / 100).toFixed(1)} pawns of advantage.`;
    }
  }
  return item;
}

async function exampleItem(p, slot, prompt) {
  const ex = await explainLine(p.fen, p.solution);
  return {
    type: 'example', id: `${slot}-ex-${p.id}`, fen: p.fen, orientation: ex.learner,
    title: 'Worked example', prompt: prompt || `${COLOR[ex.learner]} to move. Step through the solution.`,
    moves: ex.notes.map((n) => ({ uci: n.uci, san: n.san, label: n.label, note: n.note })), summary: ex.summary
  };
}

function demoItem(id) {
  const d = endgameDemos[id];
  const chess = new Chess(d.fen);
  const moves = d.moves.map(([san, note]) => { const color = chess.turn(); const label = moveNo(chess, color); const mv = chess.move(san); return { uci: mv.lan, san: mv.san, label, note }; });
  return { type: 'example', id: `demo-${id}`, fen: d.fen, orientation: 'w', title: d.title, prompt: 'Step through the moves.', moves, summary: '' };
}

/* -------- visualization */
function visualItems(levels, used) {
  const plyFor = { 1: 2, 2: 4, 3: 6, 4: 8 };
  const perLevel = { 1: 6, 2: 6, 3: 5, 4: 5 };
  const out = [];
  const kinds = ['pieceOn', 'count', 'king', 'check'];
  for (const level of levels) {
    let made = 0, k = 0;
    for (const p of exercisePositions.visual) {
      if (made >= perLevel[level]) break;
      if (used.has(p.id) || p.line.length < plyFor[level]) continue;
      const item = makeVisual(p, plyFor[level], kinds[(k + level) % kinds.length], level) || makeVisual(p, plyFor[level], 'pieceOn', level) || makeVisual(p, plyFor[level], 'count', level);
      if (!item) continue;
      used.add(p.id); out.push(item); made++; k++;
    }
  }
  return out;
}

function makeVisual(p, plies, kind, level) {
  const chess = new Chess(p.fen);
  const start = chess.fen();
  const moved = [];
  const sans = [];
  let label = '';
  for (let i = 0; i < plies; i++) {
    const color = chess.turn();
    const lbl = moveNo(chess, color);
    const mv = chess.move(uciObj(p.line[i]));
    sans.push(i === 0 || color === 'w' ? `${lbl}${mv.san}` : mv.san);
    moved.push(mv);
  }
  const end = chess.fen();
  const id = `vis-${level}-${p.id}`;
  const base = { type: 'visual', id, fen: start, moves: sans, finalFen: end, level, orientation: new Chess(start).turn() };
  if (kind === 'pieceOn') {
    // A square that changed during the sequence (not the final move's destination) and is occupied at the end.
    const candidates = moved.slice(0, -1).map((m) => m.to).filter((sq, i, a) => a.indexOf(sq) === i && chess.get(sq) && sq !== moved[moved.length - 1].to);
    if (!candidates.length) return null;
    const sq = candidates[0];
    const occ = chess.get(sq);
    const correct = `${COLOR[occ.color]} ${NAMES[occ.type]}`;
    const pool = [];
    for (const c of ['w', 'b']) for (const t of ['p', 'n', 'b', 'r', 'q', 'k']) { const s = `${COLOR[c]} ${NAMES[t]}`; if (s !== correct) pool.push(s); }
    const distract = shuffleSeeded(pool, p.id).slice(0, 3);
    const choices = shuffleSeeded([correct, ...distract], p.id + 'c');
    return { ...base, question: `After these moves, which piece stands on ${sq}?`, choices, answer: choices.indexOf(correct), explanation: `The ${NAMES[occ.type]} on ${sq} belongs to ${COLOR[occ.color]}. Compare the final position now shown on the board.` };
  }
  if (kind === 'count') {
    const side = moved[0].color;
    const count = pieceList(chess, side).filter((x) => x.type !== 'p' && x.type !== 'k').length;
    const startCount = pieceList(new Chess(start), side).filter((x) => x.type !== 'p' && x.type !== 'k').length;
    if (count === startCount) return null; // only ask when captures changed the count
    const opts = [...new Set([count, count + 1, Math.max(0, count - 1), count + 2])].slice(0, 4).sort((a, b) => a - b).map(String);
    return { ...base, question: `After these moves, how many pieces does ${COLOR[side]} have, not counting pawns and the king?`, choices: opts, answer: opts.indexOf(String(count)), explanation: `${COLOR[side]} has ${count} ${count === 1 ? 'piece' : 'pieces'} besides pawns and the king (${startCount} at the start). Captures along the way changed the count.` };
  }
  if (kind === 'king') {
    const km = moved.filter((m) => m.piece === 'k');
    if (!km.length) return null;
    const color = km[km.length - 1].color;
    const sq = kingSquare(chess, color);
    const near = neighbours(sq).filter((s) => s !== sq);
    const opts = shuffleSeeded([sq, km[0].from, ...shuffleSeeded(near, p.id).filter((s) => s !== km[0].from).slice(0, 2)], p.id + 'k');
    const uniq = [...new Set(opts)].slice(0, 4);
    if (uniq.length < 3) return null;
    return { ...base, question: `After these moves, on which square is the ${COLOR[color].toLowerCase()} king?`, choices: uniq, answer: uniq.indexOf(sq), explanation: `The ${COLOR[color].toLowerCase()} king ends on ${sq}.` };
  }
  if (kind === 'check') {
    const state = chess.isCheckmate() ? 'Checkmate' : chess.inCheck() ? 'Check' : null;
    if (!state) return null;
    const choices = ['Check', 'Checkmate', 'Neither'];
    return { ...base, question: `After the last move, is ${COLOR[chess.turn()]}’s king in check, in checkmate, or neither?`, choices, answer: choices.indexOf(state), explanation: state === 'Checkmate' ? 'The king is in check and has no legal move: checkmate.' : 'The king is in check but has a way out, so it is check, not checkmate.' };
  }
  return null;
}

function neighbours(sq) {
  const f = sq.charCodeAt(0) - 97, r = Number(sq[1]);
  const out = [];
  for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
    const nf = f + df, nr = r + dr;
    if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) out.push(String.fromCharCode(97 + nf) + nr);
  }
  return out;
}

function shuffleSeeded(arr, seedText) {
  const a = [...arr];
  let h = crypto.createHash('sha256').update(String(seedText)).digest();
  for (let i = a.length - 1; i > 0; i--) { const j = h[i % h.length] % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* -------- visualization basics (no board) */
function basicsItems() {
  const sq = (f, r) => String.fromCharCode(97 + f) + (r + 1);
  const out = [];
  const colorSquares = ['f6', 'c4', 'h1', 'a8', 'e5', 'b7', 'g2', 'd3'];
  for (const s of colorSquares) {
    const f = s.charCodeAt(0) - 97, r = Number(s[1]) - 1;
    const dark = (f + r) % 2 === 0;
    out.push({ type: 'quiz', id: `basic-color-${s}`, question: `What color is the square ${s}?`, choices: ['Light', 'Dark'], answer: dark ? 1 : 0, explanation: `${s} is a ${dark ? 'dark' : 'light'} square. A quick check: a1 is dark, and a square is dark when its file number and rank number are both odd or both even (a = 1, b = 2, and so on).` });
  }
  const diag = [['c1', 'h6'], ['b2', 'g6'], ['a3', 'f8'], ['d1', 'h5'], ['e2', 'b6'], ['g1', 'a7']];
  for (const [a, b] of diag) {
    const same = Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) === Math.abs(Number(a[1]) - Number(b[1]));
    out.push({ type: 'quiz', id: `basic-diag-${a}${b}`, question: `Are ${a} and ${b} on the same diagonal?`, choices: ['Yes', 'No'], answer: same ? 0 : 1, explanation: same ? `Yes. From ${a} to ${b} the file and the rank change by the same amount, which is what a diagonal means.` : `No. From ${a} to ${b} the file and the rank change by different amounts, so no bishop could travel between them in one move.` });
  }
  const knight = [['b1', 'b3'], ['g1', 'g2'], ['a1', 'h8'], ['d4', 'e5'], ['c3', 'c4'], ['e1', 'e8']];
  for (const [a, b] of knight) {
    const d = knightDistance(a, b);
    const opts = ['1', '2', '3', '4', '5', '6'].filter((x) => Math.abs(Number(x) - d) <= 2).slice(0, 4);
    out.push({ type: 'quiz', id: `basic-knight-${a}${b}`, question: `What is the fewest number of moves a knight needs to go from ${a} to ${b}?`, choices: opts, answer: opts.indexOf(String(d)), explanation: `The knight needs ${d} ${d === 1 ? 'move' : 'moves'} to get from ${a} to ${b}.` });
  }
  return shuffleSeeded(out, 'basics');
}

function knightDistance(a, b) {
  const start = [a.charCodeAt(0) - 97, Number(a[1]) - 1], goal = [b.charCodeAt(0) - 97, Number(b[1]) - 1];
  const seen = new Set([start.join()]); let frontier = [start], d = 0;
  while (frontier.length) {
    if (frontier.some(([f, r]) => f === goal[0] && r === goal[1])) return d;
    const next = [];
    for (const [f, r] of frontier) for (const [df, dr] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
      const nf = f + df, nr = r + dr; const k = nf + ',' + nr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8 && !seen.has(k)) { seen.add(k); next.push([nf, nr]); }
    }
    frontier = next; d++;
  }
  return -1;
}

/* -------- pawn structure exercises */
function pawnsOf(chess, color) { return pieceList(chess, color).filter((p) => p.type === 'p').map((p) => p.square); }
const fileOf = (s) => s.charCodeAt(0) - 97, rankOf = (s) => Number(s[1]);

function structureFacts(fen) {
  const chess = new Chess(fen);
  const facts = { isolated: { w: [], b: [] }, passed: [], doubled: { w: [], b: [] }, outposts: [], bishops: [] };
  for (const c of ['w', 'b']) {
    const mine = pawnsOf(chess, c), theirs = pawnsOf(chess, other(c));
    for (const s of mine) {
      const f = fileOf(s);
      if (!mine.some((t) => Math.abs(fileOf(t) - f) === 1)) facts.isolated[c].push(s);
      const ahead = (t) => (c === 'w' ? rankOf(t) > rankOf(s) : rankOf(t) < rankOf(s));
      if (!theirs.some((t) => Math.abs(fileOf(t) - f) <= 1 && ahead(t))) facts.passed.push({ sq: s, color: c });
      if (mine.some((t) => t !== s && fileOf(t) === f)) facts.doubled[c].push(s);
    }
    // Bishops
    const bishops = pieceList(chess, c).filter((p) => p.type === 'b');
    if (bishops.length === 1 && mine.length >= 5) {
      const bsq = bishops[0].square;
      const dark = (fileOf(bsq) + rankOf(bsq) - 1) % 2 === 0;
      const same = mine.filter((s) => ((fileOf(s) + rankOf(s) - 1) % 2 === 0) === dark).length;
      const ratio = same / mine.length;
      if (ratio >= 0.7 || ratio <= 0.3) facts.bishops.push({ color: c, sq: bsq, dark, same, total: mine.length, bad: ratio >= 0.7 });
    }
  }
  // White outposts on ranks 4-6
  const wp = pawnsOf(chess, 'w'), bp = pawnsOf(chess, 'b');
  for (let f = 0; f < 8; f++) for (let r = 4; r <= 6; r++) {
    const s = String.fromCharCode(97 + f) + r;
    const occ = chess.get(s);
    if (occ && (occ.type === 'p' || occ.color === 'b')) continue;
    const attackable = bp.some((t) => Math.abs(fileOf(t) - f) === 1 && rankOf(t) > r);
    const supported = wp.some((t) => Math.abs(fileOf(t) - f) === 1 && rankOf(t) === r - 1);
    if (!attackable && supported) facts.outposts.push(s);
  }
  return facts;
}

function structureItems(kinds, offset = 0, used) {
  const want = { isolated: 3, passed: 3, doubled: 3, outpost: 4, bishop: 4 };
  const out = [];
  for (const kind of kinds) {
    let skip = offset, made = 0;
    const need = offset ? 1 : want[kind];
    for (const p of exercisePositions.structure) {
      if (made >= need) break;
      if (used.has(p.id)) continue;
      const f = structureFacts(p.fen);
      let item = null;
      const base = { type: 'structure', id: `st-${kind}-${p.id}`, fen: p.fen, orientation: 'w' };
      if (kind === 'isolated') {
        const c = f.isolated.w.length === 1 ? 'w' : f.isolated.b.length === 1 ? 'b' : null;
        if (c && f.isolated[other(c)].length <= 1) {
          const s = f.isolated[c][0];
          const fl = fileOf(s);
          const nb = [fl - 1, fl + 1].filter((x) => x >= 0 && x < 8).map((x) => String.fromCharCode(97 + x) + '-');
          item = { ...base, mode: 'square', question: `Click ${COLOR[c]}’s isolated pawn.`, answers: [s], explanation: `The pawn on ${s} has no ${COLOR[c].toLowerCase()} pawns on the ${joinList(nb)}file${nb.length > 1 ? 's' : ''}, so no pawn can ever defend it.` };
          if (f.isolated[other(c)].length === 1) item = null; // keep the question unambiguous
        }
      } else if (kind === 'passed') {
        if (f.passed.length === 1) {
          const { sq, color } = f.passed[0];
          item = { ...base, mode: 'square', question: 'Click the passed pawn.', answers: [sq], explanation: `No ${COLOR[other(color)].toLowerCase()} pawn stands in front of the ${COLOR[color].toLowerCase()} pawn on ${sq}, on its own file or a neighbouring one, so only pieces can stop it.` };
        }
      } else if (kind === 'doubled') {
        const c = f.doubled.b.length === 2 ? 'b' : f.doubled.w.length === 2 ? 'w' : null;
        if (c && f.doubled[other(c)].length === 0) {
          const [a, b] = f.doubled[c];
          item = { ...base, mode: 'square', question: `Click one of ${COLOR[c]}’s doubled pawns.`, answers: [a, b], explanation: `The pawns on ${a} and ${b} stand on the same file, so they can’t protect each other, and the front one blocks the back one.` };
        }
      } else if (kind === 'outpost') {
        if (f.outposts.length >= 1 && f.outposts.length <= 3) {
          item = { ...base, mode: 'square', question: 'Click an outpost square for White: a square on the fourth, fifth or sixth rank that a white pawn defends and no black pawn can ever attack.', answers: f.outposts, explanation: `${f.outposts.length === 1 ? `${f.outposts[0]} is the outpost` : `The outposts are ${joinList(f.outposts)}`}: a white pawn defends ${f.outposts.length === 1 ? 'it' : 'each of them'}, and no black pawn on a neighbouring file is left in front to attack ${f.outposts.length === 1 ? 'it' : 'them'}.` };
        }
      } else if (kind === 'bishop') {
        if (f.bishops.length) {
          const b = f.bishops[0];
          const choices = ['Good bishop', 'Bad bishop'];
          item = { ...base, mode: 'choice', highlight: [b.sq], question: `Is ${COLOR[b.color]}’s bishop on ${b.sq} a good bishop or a bad bishop?`, choices, answer: b.bad ? 1 : 0, explanation: `Of ${COLOR[b.color]}’s ${b.total} pawns, ${b.same} stand on ${b.dark ? 'dark' : 'light'} squares, the same color as the bishop. ${b.bad ? 'They block it and leave the other color weak, so it is a bad bishop.' : 'Its pawns are mostly on the other color, leaving it free to move, so it is a good bishop.'}` };
        }
      }
      if (!item) continue;
      if (skip > 0) { skip--; continue; }
      used.add(p.id); out.push(item); made++;
    }
  }
  return out;
}

/* -------- endgame practice */
let tables = null;
function loadTables() {
  if (tables) return tables;
  tables = {};
  for (const t of ['q', 'r', 'p']) { const raw = zlib.gunzipSync(fs.readFileSync(new URL(`train/tb/${t}.bin.gz`, root))); tables[t] = { w: raw.subarray(0, SIZE), b: raw.subarray(SIZE) }; }
  return tables;
}
function practiceItem(id) {
  const p = endgamePractice[id];
  const pos = fromFen(p.fen);
  const v = probe(loadTables(), pos);
  const result = v === 0 ? 'draw' : pos.strongToMove ? 'win' : 'loss';
  if ((p.goal === 'win' && result !== 'win') || (p.goal === 'draw' && result !== 'draw')) throw new Error(`Practice ${id}: table says ${result}, goal ${p.goal}`);
  return { type: 'practice', id: `practice-${id}`, fen: p.fen, orientation: p.fen.split(' ')[1], table: pos.type, goal: p.goal, holdMoves: p.holdMoves || null, prompt: p.prompt, explanation: p.explanation };
}

/* -------- repertoire trees */
// Notes keyed by move sequence, gathered across every section of a repertoire, so a move shared by
// several sections (such as 1.e4) only needs its note written once.
function noteMap(rep) {
  const map = new Map();
  for (const s of rep.sections) for (const line of s.lines) {
    const path = [];
    for (const [san, note] of line) { path.push(san); if (note && !map.has(path.join(" "))) map.set(path.join(" "), note); }
  }
  return map;
}

function buildTree(lines, sideToTrain, notes = new Map()) {
  const rootNode = { children: [] };
  for (const line of lines) {
    const chess = new Chess();
    let node = rootNode;
    const path = [];
    for (const [san, rawNote] of line) {
      path.push(san);
      const note = rawNote || notes.get(path.join(" ")) || "";
      const mv = chess.move(san);
      let child = node.children.find((c) => c.uci === mv.lan);
      if (!child) { child = { san: mv.san, uci: mv.lan, color: mv.color, note: note || '', children: [] }; node.children.push(child); }
      else if (!child.note && note) child.note = note;
      node = child;
    }
  }
  // Every node needs a note; every training-side node must be a single move (one repertoire choice).
  (function walk(n, path) {
    for (const c of n.children) {
      if (!c.note) throw new Error(`Missing note: ${path} ${c.san}`);
      walk(c, `${path} ${c.san}`);
    }
    const mine = n.children.filter((c) => c.color === sideToTrain);
    if (mine.length > 1) throw new Error(`Two repertoire moves after ${path}: ${mine.map((m) => m.san).join(', ')}`);
  })(rootNode, '');
  return rootNode.children;
}

function repertoireCourse(rep) {
  const notes = noteMap(rep);
  const sections = [{ id: 'overview', title: 'How the repertoire fits together', paras: rep.intro, key: 'Read each line in the explorer, then drill it until you can play your side without help.', items: [] }];
  for (const s of rep.sections) {
    sections.push({ id: s.id, title: s.title, paras: [s.intro], key: '', items: [{ type: 'explorer', id: `explorer-${s.id}`, side: rep.side, tree: buildTree(s.lines, rep.side, notes) }] });
  }
  sections.push({ id: 'plans', title: 'Typical middlegame plans', paras: rep.plans.map((p) => `<strong>${p.title}.</strong> ${p.text}`), key: 'Every line has a plan: know which structure you are aiming for.', items: [] });
  sections.push({ id: 'drill', title: 'Drill: every line', paras: ['The trainer plays your opponent’s moves, choosing among the branches of the repertoire, and you play your side. When you leave the repertoire, the trainer shows the move and its explanation, and the line goes into your review queue.'], key: 'Play your side from memory; read the note whenever a move surprises you.', items: rep.sections.map((s) => ({ type: 'drill', id: `drill-${s.id}`, title: s.title, side: rep.side, explorer: `explorer-${s.id}` })) });
  return sections;
}

/* ---------------------------------------------------------------- assemble */
async function buildLessonCourse(slug) {
  const def = lessonCourses[slug];
  const usedVisual = new Set(), usedStructure = new Set();
  const sections = [];
  for (const s of def.sections) {
    const items = [];
    if (s.example) {
      const ex = pick(s.example.slot, s.example.index, 1)[0];
      if (ex) items.push(await exampleItem(ex, s.example.slot, s.example.prompt));
      else if (!process.env.PROVISIONAL) throw new Error(`Missing verified example for ${slug}/${s.id}`);
    }
    if (s.demo) for (const d of [].concat(s.demo)) items.push(demoItem(d));
    if (s.practice) for (const pid of s.practice) items.push(practiceItem(pid));
    const addTraining = async (t, prompt) => {
      if (t.slot) for (const p of pick(t.slot, t.from, t.count)) items.push(await puzzleItem(p, t.slot, prompt));
      if (t.set === 'basics') items.push(...basicsItems());
      if (t.set === 'visual') items.push(...visualItems(t.levels, usedVisual));
      if (t.set === 'structure') items.push(...structureItems(t.kinds, t.offset || 0, usedStructure));
    };
    if (s.training) {
      if (s.training.mixed) for (const t of s.training.mixed) await addTraining(t, s.training.prompt);
      else await addTraining(s.training, s.training.prompt);
    }
    sections.push({ id: s.id, title: s.title, paras: s.paras, key: s.key, items });
  }
  return { sections, signature: def.signature };
}

async function verifyRookDemos() {
  for (const id of ['lucena', 'philidor']) {
    const d = endgameDemos[id];
    const chess = new Chess(d.fen);
    for (const [san] of d.moves) {
      const mover = chess.turn();
      chess.move(san);
      const r = await engine.analyse(chess.fen(), { depth: 20, multipv: 1 });
      const v = scoreValue(r[0].score) * (chess.turn() === 'w' ? 1 : -1); // from White's view
      if (id === 'lucena' && mover === 'w' && v < 400) throw new Error(`Lucena demo: ${san} lets the win slip (${v})`);
      if (id === 'philidor' && mover === 'b' && v > 150) throw new Error(`Philidor demo: ${san} doesn’t hold (${v})`);
    }
  }
  // Three-piece demos are checked against the exact tables.
  for (const id of ['opposition', 'square']) {
    const d = endgameDemos[id]; const chess = new Chess(d.fen); const learner = chess.turn();
    for (const [san] of d.moves) {
      const mover = chess.turn(); chess.move(san);
      if (mover !== learner) continue;
      const pos = fromFen(chess.fen()); if (!pos) continue;
      const v = probe(loadTables(), pos);
      if (id === 'opposition' && v === 0) throw new Error(`Opposition demo: ${san} draws`);
      // After White's move the pawn side (Black) is to move: any non-draw value means the pawn gets through.
      if (id === 'square' && v !== 0 && pos.strongToMove) throw new Error(`Square demo: ${san} lets the pawn through`);
    }
  }
}

async function loadProducts() {
  const src = fs.readFileSync(new URL('js/products.js', root), 'utf8');
  const g = {}; new Function('globalThis', src)(g);
  return g.SITE_PRODUCTS;
}

await verifyRookDemos();
fs.mkdirSync(new URL('train/courses/', root), { recursive: true });
const manifest = {};
for (const slug of Object.keys(products)) {
  if (slug === 'complete-training-library') continue;
  let data;
  if (slug === 'opening-repertoire-black') data = { sections: repertoireCourse(repBlack), signature: { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', caption: 'The open games after 1.e4 e5' } };
  else if (slug === 'opening-repertoire-white') data = { sections: repertoireCourse(repWhite), signature: { fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4', caption: 'The Italian set-up with c3' } };
  else data = await buildLessonCourse(slug);
  const course = { slug, name: products[slug].name, level: products[slug].level, signature: data.signature, sections: data.sections };
  const body = JSON.stringify(course);
  const version = crypto.createHash('sha256').update(body).digest('hex').slice(0, 10);
  course.version = version;
  fs.writeFileSync(new URL(`train/courses/${slug}.json`, root), JSON.stringify(course));
  const counts = {};
  for (const s of course.sections) for (const it of s.items) counts[it.type] = (counts[it.type] || 0) + 1;
  const leaves = (nodes) => nodes.reduce((n, x) => n + (x.children.length ? leaves(x.children) : 1), 0);
  const explorers = Object.fromEntries(course.sections.flatMap((s) => s.items.filter((i) => i.type === 'explorer').map((i) => [i.id, i])));
  // Trainable positions: training positions and exercises, plus one per drill line in the repertoires.
  const positions = course.sections.reduce((n, s) => n + s.items.reduce((m, i) => m + (['puzzle', 'visual', 'structure', 'practice', 'quiz'].includes(i.type) ? 1 : i.type === 'drill' ? leaves(explorers[i.explorer].tree) : 0), 0), 0);
  manifest[slug] = { version, signature: course.signature, sections: course.sections.length, positions };
  console.log(slug.padEnd(28), JSON.stringify(counts));
}
fs.writeFileSync(new URL('train/courses/index.json', root), JSON.stringify(manifest, null, 1));
engine.quit();
console.log('courses written');
