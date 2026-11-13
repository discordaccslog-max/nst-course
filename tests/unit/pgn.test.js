import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Chess } from 'chess.js';
import { coursePgn } from '../../train/pgn.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../../train/courses/index.json', import.meta.url)));

for (const slug of Object.keys(manifest)) {
  test(`PGN export of ${slug} parses and replays every game`, () => {
    const course = JSON.parse(fs.readFileSync(new URL(`../../train/courses/${slug}.json`, import.meta.url)));
    const pgn = coursePgn(course);
    const games = pgn.trim().split(/\n\n(?=\[Event )/);
    assert.ok(games.length > 0);
    let withMoves = 0;
    for (const g of games) {
      const chess = new Chess();
      chess.loadPgn(g); // throws on any illegal move or malformed text
      if (chess.history().length) withMoves++;
      assert.match(g, /\[Event "Fiancho Chess: /);
    }
    const expected = course.sections.reduce((n, sec) => n + sec.items.filter((i) => ['puzzle', 'example', 'visual', 'explorer'].includes(i.type)).length, 0);
    assert.equal(withMoves, expected, 'every exported item with moves replays them');
  });
}
