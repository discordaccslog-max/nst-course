// Storefront copy for each product. Section blurbs are keyed by the section ids in the built courses
// (train/courses/<slug>.json), so product pages always describe what the trainer actually contains.

export const products = [
  {
    id: 'tactics-fundamentals', file: 'tactics-fundamentals.html', name: 'Tactics Fundamentals', price: 25, level: 'Beginner',
    icon: { type: 'n', color: 'w' },
    card: 'Forks, pins, skewers, discovered attacks and double attacks: short lessons on each idea, then training positions you solve on the board.',
    metaDescription: 'Tactics Fundamentals: an interactive beginner chess course on forks, pins, skewers, discovered attacks and double attacks, played in your browser. $25.',
    lede: 'An interactive course on the five basic tactical ideas: forks, pins, skewers, discovered attacks and double attacks. Each idea gets a short lesson and a worked example on the board, followed by training positions where you play the winning moves yourself.',
    sections: {
      tactical: 'The warning signs that a tactic is available: loose pieces, pieces lined up on one line, and an exposed king.',
      forks: 'One piece attacking two targets, with the knight fork at the centre.',
      pins: 'Absolute and relative pins, and how to win material against a pinned piece.',
      skewers: 'Attacking a valuable piece so that the piece behind it falls.',
      discovered: 'Unmasking an attack by moving another piece, including discovered check and double check.',
      double: 'Moves that create two threats at once, especially with the queen.',
      mixed: 'Positions where the theme isn’t announced, so you have to recognize it first.'
    },
    forWho: [
      'Players who know the rules and how the pieces move, and want a systematic introduction to tactics.',
      'Players who often miss short tactics in their own games and want to practise the patterns one at a time.',
      'Learners who like to solve positions on a board and get instant feedback on every move.'
    ],
    notFor: [
      'Complete newcomers still learning how the pieces move. The course assumes you know the rules.',
      'Experienced players looking for long, complex combinations.',
      'Anyone looking for video lessons, live classes or personal coaching.'
    ]
  },
  {
    id: 'checkmate-patterns', file: 'checkmate-patterns.html', name: 'Checkmate Patterns', price: 29, level: 'Beginner',
    icon: { type: 'k', color: 'b' },
    card: 'The common mating patterns, how to recognize them, and training positions where you deliver the mate on the board.',
    metaDescription: 'Checkmate Patterns: an interactive beginner chess course on the common mating patterns, with training positions you solve in your browser. $29.',
    lede: 'A pattern-by-pattern course on the checkmates that come up again and again in real games. Each pattern gets a short lesson and a worked example on the board, followed by training positions where you find and play the mate yourself.',
    sections: {
      reading: 'Counting a king’s escape squares and seeing when a single check could be decisive.',
      backrank: 'Mates against a king trapped behind its own pawns.',
      queen: 'Mates where a supported queen lands next to the king.',
      rook: 'Rook checks along open lines, with the escape squares covered.',
      minor: 'Smothered mates and other patterns with knights and bishops.',
      sacrifice: 'Sacrifices that open the king, with the mate a move later.',
      mixed: 'Positions that don’t name the pattern: find the mate.'
    },
    forWho: [
      'Players who know the rules and want to recognize the standard mating patterns quickly.',
      'Players who reach good attacking positions but are unsure how to finish them.',
      'Anyone who wants a companion to Tactics Fundamentals with a sharper focus on the king.'
    ],
    notFor: [
      'Complete newcomers still learning how the pieces move.',
      'Players looking for a study of long attacking games or opening preparation.',
      'Anyone looking for video lessons, live classes or personal coaching.'
    ]
  },
  {
    id: 'opening-repertoire-black', file: 'opening-repertoire-black.html', name: 'Opening Repertoire for Black', price: 45, level: 'Intermediate',
    icon: { type: 'p', color: 'b' },
    card: 'A complete repertoire for Black against White’s main first moves, explained by plans, with a line explorer and a drill mode.',
    metaDescription: 'Opening Repertoire for Black: an interactive repertoire against 1.e4, 1.d4, 1.c4 and 1.Nf3 with a line explorer, plan notes and a drill mode. $45.',
    lede: 'A complete opening repertoire for Black against White’s main first moves. Every line is presented in an interactive explorer with a note on the plan behind every move, and a drill mode where you play Black’s side while the trainer plays White.',
    sections: {
      overview: 'How the repertoire fits together and the structures that link its lines.',
      'vs-e4': 'Line explorer for 1...e5 against 1.e4: the open games and White’s main alternatives.',
      'vs-d4': 'Line explorer for 1...d5 and ...e6 against 1.d4 and the main queen’s-pawn systems.',
      'vs-flank': 'Line explorer against 1.c4 and 1.Nf3, including transpositions.',
      'vs-rare': 'Simple answers to White’s rarer first moves.',
      plans: 'The middlegame plans the repertoire aims for.',
      drill: 'Drill every line: play Black’s moves from memory against the trainer.'
    },
    forWho: [
      'Players who know the basic opening principles and want a complete, connected set of lines for Black.',
      'Players who keep forgetting move orders and would rather learn the reasons behind each move.',
      'Players who want to practise their repertoire by playing it, not just reading it.'
    ],
    notFor: [
      'Beginners still learning the basic opening principles. Tactics Fundamentals and Checkmate Patterns are better starting points.',
      'Players looking for an encyclopedia of every sideline.',
      'Anyone looking for video lessons, game reviews or personal coaching.'
    ]
  },
  {
    id: 'opening-repertoire-white', file: 'opening-repertoire-white.html', name: 'Opening Repertoire for White', price: 49, level: 'Intermediate',
    icon: { type: 'p', color: 'w' },
    card: 'A complete 1.e4 repertoire for White with the main plans and pawn structures, in a line explorer with a drill mode.',
    metaDescription: 'Opening Repertoire for White: an interactive 1.e4 repertoire with a line explorer, plan notes for every move and a drill mode. $49.',
    lede: 'A complete repertoire for White built around 1.e4. Every line is presented in an interactive explorer with a note on the plan behind every move, and a drill mode where you play White’s side while the trainer plays Black’s replies.',
    sections: {
      overview: 'How the repertoire is built and the ideas its lines share.',
      'vs-e5': 'Line explorer against 1...e5: the Italian set-up with c3 and d3, and Black’s other second moves.',
      'vs-c5': 'Line explorer for the 2.c3 system against 1...c5.',
      'vs-e6-c6': 'Line explorer for the Advance set-up against 1...e6 and 1...c6.',
      'vs-other': 'Line explorer against 1...d5, 1...Nf6, 1...d6 and 1...g6.',
      plans: 'The pawn structures the repertoire produces and the plans that go with them.',
      drill: 'Drill every line: play White’s moves from memory against the trainer.'
    },
    forWho: [
      'Players who open with 1.e4, or want to, and need a complete and connected repertoire.',
      'Players who prefer to understand plans and structures instead of memorizing long move orders.',
      'Players who want to practise their repertoire by playing it, not just reading it.'
    ],
    notFor: [
      'Beginners still learning the basic opening principles. Tactics Fundamentals and Checkmate Patterns are better starting points.',
      'Players who open with a first move other than 1.e4.',
      'Anyone looking for video lessons, game reviews or personal coaching.'
    ]
  },
  {
    id: 'endgame-essentials', file: 'endgame-essentials.html', name: 'Endgame Essentials', price: 39, level: 'Beginner to intermediate',
    icon: { type: 'r', color: 'w' },
    card: 'King and pawn endings, basic rook endings and key theoretical positions, with practice where you convert or hold against exact replies.',
    metaDescription: 'Endgame Essentials: interactive lessons on king and pawn endings, rook endings and key theoretical positions, with practice against exact replies. $39.',
    lede: 'The endgame knowledge every player needs, taught through short lessons and theoretical positions you step through on the board. In practice mode you must win or hold the position while the trainer defends or attacks with exact best play from complete endgame tables.',
    sections: {
      principles: 'King activity, passed pawns, and the king on the sixth rank in front of its pawn.',
      'king-pawn': 'The square of the pawn and the opposition, with practice positions to win and to hold.',
      rook: 'Active rooks, cutting off the king, and rooks behind passed pawns.',
      theory: 'Building the bridge to win and the third-rank defense to draw, stepped through move by move.',
      convert: 'Checkmate with king and queen and with king and rook, and promoting a pawn, against exact defense.',
      training: 'King and pawn and rook endings where you find the winning or saving move.'
    },
    forWho: [
      'Players who reach endgames but are unsure of the standard techniques.',
      'Players who want to learn the key theoretical positions properly, one at a time.',
      'Anyone who wants to practise basic endings against a defender that never makes a mistake.'
    ],
    notFor: [
      'Players looking for a deep reference on rare or complex endings.',
      'Complete newcomers still learning how the pieces move.',
      'Anyone looking for video lessons, live classes or personal coaching.'
    ]
  },
  {
    id: 'positional-play-strategy', file: 'positional-play-strategy.html', name: 'Positional Play & Strategy', price: 55, level: 'Intermediate to advanced',
    icon: { type: 'b', color: 'b' },
    card: 'Pawn structures, outposts, good and bad pieces and quiet moves, with exercises on the board.',
    metaDescription: 'Positional Play & Strategy: an interactive course on pawn structures, outposts, good and bad bishops and quiet moves, with board exercises. $55.',
    lede: 'A course on the quiet side of chess: pawn structures, piece activity, weak squares and planning. Short lessons explain each idea, then board exercises ask you to identify structural features, judge bishops, and find the strongest quiet moves.',
    sections: {
      structures: 'Isolated, doubled and passed pawns, with exercises where you pick them out on the board.',
      activity: 'Improving your worst piece, with positions where the best move is a quiet one.',
      outposts: 'Weak squares and outposts, with exercises where you find the outpost square.',
      pieces: 'Good and bad bishops, with exercises where you judge the bishop from its pawns.',
      exchanges: 'When to trade and which pieces to keep, with quiet-move positions.',
      planning: 'A practical method for choosing a plan in quiet positions.',
      mixed: 'A mixed set of structural judgments and quiet best moves.'
    },
    forWho: [
      'Players who are comfortable with basic tactics and want to understand quiet positions better.',
      'Players who often reach the middlegame unsure what to do next.',
      'Learners who want to practise judging positions, not just read about it.'
    ],
    notFor: [
      'Beginners who are still building their tactical foundations. Start with Tactics Fundamentals.',
      'Players looking for opening preparation.',
      'Anyone looking for video lessons, game reviews or personal coaching.'
    ]
  },
  {
    id: 'calculation-visualization', file: 'calculation-visualization.html', name: 'Calculation & Visualization Training', price: 65, level: 'Intermediate to advanced',
    icon: { type: 'q', color: 'w' },
    card: 'Forcing lines to calculate on the board, and visualization exercises where you follow moves without the board moving.',
    metaDescription: 'Calculation & Visualization Training: forcing lines to solve and visualization exercises where the board stays still, growing harder across the course. $65.',
    lede: 'Structured training in calculating forcing lines and visualizing positions. You solve forcing sequences on the board, and in the visualization exercises you see a position, read a sequence of moves while the board stays still, and answer a question about the final position. The exercises grow longer and harder across the course.',
    sections: {
      how: 'A method for calculating: candidate moves, forcing moves first, and every reply.',
      basics: 'No-board drills on square colors, diagonals and knight distances.',
      short: 'Forcing lines a few moves deep, played on the board.',
      long: 'Longer forcing lines that need deeper and wider calculation.',
      head: 'Read a sequence of moves while the board stays still, then answer a question about the final position.',
      mixed: 'Longer visualization sequences mixed with positions to calculate, in increasing difficulty.'
    },
    forWho: [
      'Players who see the right ideas but lose track of the position a few moves into a line.',
      'Players who want structured, progressive exercises instead of random puzzles.',
      'Players who are comfortable with the basic tactical patterns and want to go further.'
    ],
    notFor: [
      'Beginners still learning the basic tactical patterns. Tactics Fundamentals comes first.',
      'Players who want quick, casual puzzles. These exercises are meant for slow, careful work.',
      'Anyone looking for video lessons, live classes or personal coaching.'
    ]
  },
  {
    id: 'complete-training-library', file: 'complete-training-library.html', name: 'Complete Training Library', price: 145, level: 'Beginner to advanced',
    icon: { type: 'k', color: 'w', library: true },
    card: 'All seven courses, unlocked by a single license.',
    metaDescription: 'Complete Training Library: all seven Fiancho Chess interactive training programs, from beginner to advanced, unlocked by one license code. $145.',
    lede: 'All seven Fiancho Chess training programs in one purchase: tactics, checkmate patterns, opening repertoires for both colors, endgames, positional play, and calculation and visualization. One license code unlocks every course, and each course is identical to the version sold on its own.',
    sections: {},
    forWho: [
      'Players who want the whole course range with one license.',
      'Players planning a long-term training program across every part of the game.',
      'Players who already know they want several of the individual courses.'
    ],
    notFor: [
      'Players who only need one or two topics. Each course is also sold on its own.',
      'Complete newcomers still learning how the pieces move.',
      'Anyone looking for video lessons, live classes or personal coaching.'
    ]
  }
];

export const studyOrder = [
  ['Start with tactics and mates', 'Tactics Fundamentals and Checkmate Patterns build the pattern recognition that every other course relies on.'],
  ['Add endgames early', 'Endgame Essentials sits comfortably alongside the beginner courses and runs into intermediate material.'],
  ['Choose your openings', 'The repertoires for White and Black give you a complete, connected set of lines once the basics are in place.'],
  ['Move on to strategy and calculation', 'Positional Play & Strategy and Calculation & Visualization Training are the most demanding courses and work best last.']
];
