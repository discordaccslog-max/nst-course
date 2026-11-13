// Build-time verification with Stockfish (never shipped).
//
// For every candidate training position, at each move the learner must play:
//   * the solution move must be as good as the engine's best move;
//   * every other move that is equally good is recorded as an accepted answer, so the trainer
//     never marks an equally good alternative as wrong;
//   * positions where an inferior move comes too close to the best are rejected as ambiguous;
//   * the opponent's replies must be the best defense.
// Output: tools/courses/data/verified.json (committed, so course builds don't need the database).
import fs from 'node:fs';
import { Chess } from 'chess.js';
import { Engine, scoreValue } from './engine.mjs';

const CANDIDATES = new URL('../cache/candidates.json', import.meta.url);
const OUT = new URL('./data/verified.json', import.meta.url);
const quota = {
  'tf-fork': 4, 'tf-pin': 4, 'tf-skewer': 4, 'tf-discovered': 4, 'tf-double': 4, 'tf-mixed': 8,
  'cm-backrank': 4, 'cm-queen': 4, 'cm-rook': 4, 'cm-minor': 4, 'cm-sacrifice': 4, 'cm-mixed': 8,
  'cv-short': 8, 'cv-long': 8, 'ps-quiet': 12, 'ee-pawn': 6, 'ee-rook': 6
};

const EQUAL_CP = 60;        // a move within 60 centipawns of the best is "equally good"
const CRUSHING_CP = 600;    // two moves that both keep a crushing advantage are equally good
const MIN_GAP_CP = 150;     // the best wrong move must be at least this much worse than the worst accepted move
const DEFENSE_SLACK_CP = 120;

const candidates = JSON.parse(fs.readFileSync(CANDIDATES, 'utf8'));
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const engine = new Engine('single');
await engine.init({ hash: 256 });

function equallyGood(best, s) {
  if (best.mate !== undefined && best.mate > 0) return s.mate !== undefined && s.mate > 0 && s.mate <= best.mate;
  if (s.mate !== undefined) return s.mate > 0; // a forced mate is at least as good as any material win
  const b = best.cp;
  return s.cp >= b - EQUAL_CP || (b >= CRUSHING_CP && s.cp >= CRUSHING_CP);
}

async function verifyPosition(p) {
  const chess = new Chess(p.fen);
  const accepted = {};
  const depth = p.sol.length >= 7 ? 22 : 20;
  for (let i = 0; i < p.sol.length; i++) {
    const legal = chess.moves().length;
    if (i % 2 === 0) {
      // Learner to move
      const multipv = Math.min(legal, 8);
      const lines = await engine.analyse(chess.fen(), { depth, multipv });
      if (!lines.length) return { ok: false, why: 'no engine lines' };
      const best = lines[0].score;
      if (best.mate === undefined && best.cp < 150) return { ok: false, why: `not winning enough (${best.cp})` };
      const good = lines.filter((l) => equallyGood(best, l.score));
      const solLine = lines.find((l) => l.move === p.sol[i]);
      if (!solLine || !equallyGood(best, solLine.score)) return { ok: false, why: `solution ${p.sol[i]} not best at ply ${i}` };
      if (good.length === lines.length && lines.length < legal) return { ok: false, why: `too many good moves at ply ${i}` };
      const worstGood = Math.min(...good.map((l) => scoreValue(l.score)));
      const bad = lines.filter((l) => !equallyGood(best, l.score));
      if (bad.length && worstGood - scoreValue(bad[0].score) < MIN_GAP_CP) return { ok: false, why: `ambiguous at ply ${i}` };
      const alts = good.map((l) => l.move).filter((m) => m !== p.sol[i]);
      if (alts.length) accepted[i] = alts;
    } else {
      // Opponent to move: the stored reply must be a best defense.
      const lines = await engine.analyse(chess.fen(), { depth: 18, multipv: Math.min(legal, 3) });
      const bestVal = scoreValue(lines[0].score);
      const replyLine = lines.find((l) => l.move === p.sol[i]);
      if (!replyLine) {
        const forced = await engine.analyse(chess.fen(), { depth: 18, multipv: 1, searchmoves: [p.sol[i]] });
        if (!forced.length || bestVal - scoreValue(forced[0].score) > DEFENSE_SLACK_CP) return { ok: false, why: `reply ${p.sol[i]} not best defense` };
      } else if (bestVal - scoreValue(replyLine.score) > DEFENSE_SLACK_CP) return { ok: false, why: `reply ${p.sol[i]} weak` };
    }
    chess.move({ from: p.sol[i].slice(0, 2), to: p.sol[i].slice(2, 4), promotion: p.sol[i][4] });
  }
  return { ok: true, accepted };
}

const out = {};
for (const [slot, want] of Object.entries(quota)) {
  out[slot] = existing[slot] && existing[slot].length >= want ? existing[slot] : [];
  if (out[slot].length >= want) { console.log(slot, 'already verified'); continue; }
  let tried = 0;
  for (const p of candidates[slot] || []) {
    if (out[slot].length >= want) break;
    tried++;
    const res = await verifyPosition(p);
    if (res.ok) {
      out[slot].push({ id: p.id, fen: p.fen, solution: p.sol, accepted: res.accepted, rating: p.rating, themes: p.themes, source: 'cc0' });
      process.stdout.write('+');
    } else process.stdout.write('.');
  }
  console.log(`\n${slot}: ${out[slot].length}/${want} verified after ${tried} tried`);
  fs.mkdirSync(new URL('./data/', import.meta.url), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
}
engine.quit();
console.log('done');
