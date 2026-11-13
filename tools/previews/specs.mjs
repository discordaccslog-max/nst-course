// Product page previews: screenshots of the real trainer, captured by tools/previews/capture.mjs.
// Each entry: a trainer route (after #) and a caption describing what the screenshot shows.
export const previews = {
  'tactics-fundamentals': [
    { route: '/c/tactics-fundamentals/s/forks', caption: 'A short lesson on forks, with the key idea set apart.' },
    { route: '/c/tactics-fundamentals/s/forks/1', caption: 'A worked example you step through move by move, with a note on each move.' },
    { route: '/c/tactics-fundamentals/s/forks/2', caption: 'A training position: you play the winning move on the board.', solve: true }
  ],
  'checkmate-patterns': [
    { route: '/c/checkmate-patterns/s/backrank', caption: 'A lesson on back-rank mates.' },
    { route: '/c/checkmate-patterns/s/backrank/2', caption: 'A training position: deliver the mate on the board.', solve: true },
    { route: '/c/checkmate-patterns', caption: 'The course overview with your progress and review queue.' }
  ],
  'opening-repertoire-black': [
    { route: '/c/opening-repertoire-black/s/vs-e4/1', caption: 'The line explorer: every move comes with a note on the plan behind it.', explore: 6 },
    { route: '/c/opening-repertoire-black/s/vs-d4/1', caption: 'Branches let you explore White’s alternatives.', explore: 4 },
    { route: '/c/opening-repertoire-black/s/drill/1', caption: 'Drill mode: you play Black’s moves, the trainer plays White.' }
  ],
  'opening-repertoire-white': [
    { route: '/c/opening-repertoire-white/s/vs-e5/1', caption: 'The line explorer with a note on every move.', explore: 7 },
    { route: '/c/opening-repertoire-white/s/vs-e6-c6/1', caption: 'The Advance set-up against 1...e6 and 1...c6.', explore: 5 },
    { route: '/c/opening-repertoire-white/s/drill/1', caption: 'Drill mode: you play White’s moves, the trainer plays Black.' }
  ],
  'endgame-essentials': [
    { route: '/c/endgame-essentials/s/theory/1', caption: 'Building the bridge, stepped through on the board.', step: 4 },
    { route: '/c/endgame-essentials/s/convert/1', caption: 'Practice: mate with king and queen against exact defense.' },
    { route: '/c/endgame-essentials/s/king-pawn/1', caption: 'The square of the pawn, explained move by move.', step: 1 }
  ],
  'positional-play-strategy': [
    { route: '/c/positional-play-strategy/s/outposts', caption: 'A lesson on weak squares and outposts.' },
    { route: '/c/positional-play-strategy/s/structures/1', caption: 'A structure exercise: pick out the pawn feature on the board.' },
    { route: '/c/positional-play-strategy/s/activity/2', caption: 'A training position where the best move is a quiet one.' }
  ],
  'calculation-visualization': [
    { route: '/c/calculation-visualization/s/head/1', caption: 'Visualization: the board stays still while you follow the moves.' },
    { route: '/c/calculation-visualization/s/basics/1', caption: 'No-board drills on the geometry of the board.' },
    { route: '/c/calculation-visualization/s/short/1', caption: 'A forcing line to calculate and play on the board.' }
  ],
  'complete-training-library': [
    { route: '/', caption: 'The Training Room with all seven courses unlocked.' },
    { route: '/c/endgame-essentials/s/convert/1', caption: 'Endgame practice against exact defense.' },
    { route: '/c/opening-repertoire-white/s/vs-e5/1', caption: 'The opening line explorer.', explore: 7 }
  ]
};
