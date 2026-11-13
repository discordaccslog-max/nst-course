// Build-time: checks every repertoire move is legal and that each move for the repertoire side
// is close to Stockfish's best (the engine is never shipped).
import { Chess } from 'chess.js';
import { Engine, scoreValue } from './engine.mjs';

const MAX_DROP = 70;     // centipawns below the engine's best
const MIN_EVAL = -90;    // the repertoire side must not end up clearly worse

const engine = new Engine('single');
await engine.init({ hash: 128 });
let problems = 0, checked = 0;
for (const name of ['black', 'white']) {
  const rep = await import(`./src/repertoire-${name}.mjs`);
  const seen = new Set();
  for (const sec of rep.sections) {
    for (const line of sec.lines) {
      const chess = new Chess();
      for (const [san] of line) {
        const fen = chess.fen();
        const mover = chess.turn();
        let mv;
        try { mv = chess.move(san); } catch { console.log(`ILLEGAL ${name}/${sec.id}: ${san} after ${chess.history().join(' ')}`); problems++; break; }
        const key = fen + '|' + mv.lan;
        if (mover !== rep.side || seen.has(key)) continue;
        seen.add(key);
        checked++;
        const best = await engine.analyse(fen, { depth: 16, multipv: 1 });
        const mine = await engine.analyse(fen, { depth: 16, multipv: 1, searchmoves: [mv.lan] });
        const drop = scoreValue(best[0].score) - scoreValue(mine[0].score);
        const ev = scoreValue(mine[0].score);
        if (drop > MAX_DROP || ev < MIN_EVAL) {
          problems++;
          console.log(`CHECK ${name}/${sec.id}: ${chess.history().slice(0, -1).join(' ')} ${san} -> eval ${ev}, best ${best[0].move} (${scoreValue(best[0].score)}), drop ${drop}`);
        }
      }
    }
  }
}
engine.quit();
console.log(`${checked} repertoire moves checked, ${problems} to review`);
