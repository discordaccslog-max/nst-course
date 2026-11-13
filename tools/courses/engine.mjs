// Build-time only: wraps the Stockfish engine (from the `stockfish` dev dependency) over UCI.
// It is used to verify course solutions and is never shipped to buyers.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export class Engine {
  constructor(flavor = 'single') {
    const enginePath = require('stockfish').findEngine(flavor);
    this.proc = spawn(process.execPath, [enginePath], { stdio: 'pipe' });
    this.buffer = '';
    this.listeners = [];
    this.proc.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString();
      let i;
      while ((i = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, i).trim();
        this.buffer = this.buffer.slice(i + 1);
        for (const l of [...this.listeners]) l(line);
      }
    });
  }

  send(cmd) { this.proc.stdin.write(cmd + '\n'); }

  waitFor(prefix) {
    return new Promise((resolve) => {
      const fn = (line) => { if (line.startsWith(prefix)) { this.listeners = this.listeners.filter((l) => l !== fn); resolve(line); } };
      this.listeners.push(fn);
    });
  }

  async init({ hash = 256 } = {}) {
    this.send('uci'); await this.waitFor('uciok');
    this.send(`setoption name Hash value ${hash}`);
    this.send('isready'); await this.waitFor('readyok');
  }

  // Returns [{ move, score: { cp } | { mate }, pv: [...] }] sorted best first, from the side to move's view.
  async analyse(fen, { depth = 18, multipv = 3, searchmoves = null } = {}) {
    this.send('ucinewgame');
    this.send(`setoption name MultiPV value ${multipv}`);
    this.send('isready'); await this.waitFor('readyok');
    const lines = new Map();
    const fn = (line) => {
      if (!line.startsWith('info') || !line.includes(' pv ')) return;
      const d = Number(/ depth (\d+)/.exec(line)?.[1]);
      const k = Number(/ multipv (\d+)/.exec(line)?.[1] || 1);
      const cp = / score cp (-?\d+)/.exec(line);
      const mate = / score mate (-?\d+)/.exec(line);
      if (/ (lowerbound|upperbound)/.test(line)) return;
      const pv = line.split(' pv ')[1].trim().split(/\s+/);
      lines.set(k, { depth: d, move: pv[0], score: mate ? { mate: Number(mate[1]) } : { cp: Number(cp[1]) }, pv });
    };
    this.listeners.push(fn);
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}${searchmoves ? ' searchmoves ' + searchmoves.join(' ') : ''}`);
    await this.waitFor('bestmove');
    this.listeners = this.listeners.filter((l) => l !== fn);
    return [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  }

  quit() { this.send('quit'); this.proc.kill(); }
}

// Converts a score into a single comparable number (mates are huge, shorter mates bigger).
export function scoreValue(s) {
  if (s.mate !== undefined) return s.mate > 0 ? 100000 - s.mate * 100 : -100000 - s.mate * 100;
  return s.cp;
}
