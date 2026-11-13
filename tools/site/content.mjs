// Course data and copy for the Fiancho Chess site generator.

const P = {
  tactics: {
    diagram: {
      fen: 'r3k3/1p3ppp/8/3N4/8/8/PP3PPP/6K1 w',
      side: 'White to move',
      task: 'Find the move that wins material.',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'The knight fork on c7',
      fen: 'r3k3/1p3ppp/8/3N4/8/8/PP3PPP/6K1 w',
      side: 'White to move',
      theme: ['Knight fork'],
      entries: [
        { move: '1.Nc7+', lines: ['The knight checks the king on e8 and', 'attacks the rook on a8 at the same time.'] },
        { move: '1...Kd7 2.Nxa8', lines: ['Every king move leaves the rook', 'undefended, and White wins a whole rook.'] }
      ]
    },
    explanation: {
      title: 'The knight fork',
      para: [
        'A fork is a single move that attacks two',
        'or more targets at once. The knight is the',
        'most common forking piece: its attack',
        'cannot be blocked, and its L-shaped move',
        'is easy for a defender to overlook.'
      ],
      key: [
        'Look for a square from which a knight',
        'would attack two valuable or undefended',
        'pieces at the same time.'
      ],
      para2: [
        'A check is the strongest first target,',
        'because the opponent must answer it',
        'before saving anything else.'
      ]
    }
  },
  mates: {
    diagram: {
      fen: '6k1/p4ppp/8/8/8/P7/1r3PPP/3R2K1 w',
      side: 'White to move',
      task: 'Find the checkmate.',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'Mate on the back rank',
      fen: '6k1/p4ppp/8/8/8/P7/1r3PPP/3R2K1 w',
      side: 'White to move',
      theme: ['Back-rank mate'],
      entries: [
        { move: '1.Rd8#', lines: ['The rook checks along the eighth rank.', 'The king’s own pawns on f7, g7 and h7', 'take away every escape square.'] },
        { move: 'Why it works', lines: ['Black’s rook is busy on the second', 'rank, so nothing can block on e8 or f8', 'or capture the white rook.'] }
      ]
    },
    explanation: {
      title: 'The back rank',
      para: [
        'When a king sits behind its own unmoved',
        'pawns, its escape squares are taken by its',
        'own army. A rook or queen that reaches the',
        'back rank can then give mate, unless a',
        'defender covers that rank in time.'
      ],
      key: [
        'Count the defenders of the back rank. If',
        'an attacker arrives there with check and',
        'nothing can block or capture, it is mate.'
      ],
      para2: [
        'A single pawn move that gives the king',
        'an escape square, often called a luft,',
        'removes the danger.'
      ]
    }
  },
  black: {
    diagram: {
      fen: 'r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1N1PPP/R2QK2R b',
      side: 'Black to move',
      task: 'How should Black react in the center?',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'Striking with ...d5',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1N1PPP/R2QK2R b',
      side: 'Black to move',
      theme: ['Central pawn break'],
      entries: [
        { move: '8...d5!', lines: ['Black hits the center before White can', 'gain space with e4-e5 or d4-d5.'] },
        { move: '9.exd5 Nxd5 10.Qb3 Nce7 11.O-O O-O', lines: ['Black’s pieces are active, and the', 'isolated d4-pawn is a long-term target.'] }
      ]
    },
    explanation: {
      title: 'Striking at the center',
      para: [
        'In open positions Black often equalizes',
        'by hitting the center with ...d5 before',
        'White can consolidate. The pawn break',
        'frees the c8-bishop and opens lines for',
        'pieces that are already developed.'
      ],
      key: [
        'Before playing a pawn break, check that',
        'your pieces are ready to use the lines',
        'it opens.'
      ],
      para2: [
        'Each line in the repertoire names its',
        'main break, so you always know what',
        'Black is aiming for.'
      ]
    }
  },
  white: {
    diagram: {
      fen: 'r1bq1rk1/bpp2pp1/p1np1n1p/4p3/P1B1P3/2PP1N1P/1P3PP1/RNBQR1K1 w',
      side: 'White to move',
      task: 'Where does the b1-knight belong?',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'Rerouting the knight',
      fen: 'r1bq1rk1/bpp2pp1/p1np1n1p/4p3/P1B1P3/2PP1N1P/1P3PP1/RNBQR1K1 w',
      side: 'White to move',
      theme: ['Piece regrouping'],
      entries: [
        { move: '10.Nbd2!', lines: ['On c3 the knight would block the c-pawn.', 'Instead it travels d2-f1 and on to g3', 'or e3, where it eyes f5 and d5.'] },
        { move: 'The plan', lines: ['Nf1 and Ng3 first, then prepare d3-d4', 'once the pieces support the break.'] }
      ]
    },
    explanation: {
      title: 'The slow build-up',
      para: [
        'With pawns on c3 and d3, neither side',
        'can win quickly by force. White improves',
        'the pieces first, keeps the option of',
        'd3-d4 in reserve, and waits for the right',
        'moment to open the center.'
      ],
      key: [
        'Regroup before you break: a knight on',
        'g3 or e3 makes d3-d4 far more',
        'effective.'
      ],
      para2: [
        'The same regrouping appears in several',
        'lines, which keeps the repertoire',
        'consistent from one reply to the next.'
      ]
    }
  },
  endgame: {
    diagram: {
      fen: '8/6k1/8/8/p7/4K3/8/8 w',
      side: 'White to move',
      task: 'Can the white king catch the pawn?',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'The square of the pawn',
      fen: '8/6k1/8/8/p7/4K3/8/8 w',
      side: 'White to move',
      theme: ['King against pawn'],
      entries: [
        { move: '1.Kd3!', lines: ['The king steps into the square a4-a1-', 'd1-d4, so it is in time.'] },
        { move: '1...a3 2.Kc2 a2 3.Kb2', lines: ['The pawn falls on the next move.'] },
        { move: 'The rule', lines: ['If the king can step into the pawn’s', 'square, it catches the pawn.'] }
      ]
    },
    explanation: {
      title: 'The opposition',
      para: [
        'When the two kings stand on the same file',
        'with one square between them, the side',
        'that does not have to move holds the',
        'opposition. In king and pawn endings this',
        'often decides whether a pawn promotes.'
      ],
      key: [
        'If you can take the opposition, the',
        'enemy king usually has to give way and',
        'let your king advance.'
      ],
      para2: [
        'Spare pawn moves matter too: a single',
        'tempo can hand the opposition back to',
        'the other side.'
      ]
    }
  },
  positional: {
    diagram: {
      fen: '2r3k1/pp1nbppp/3p4/4p3/4P3/1B6/PPP2PPP/1N1R2K1 w',
      side: 'White to move',
      task: 'Find the best square for the knight.',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'An outpost on d5',
      fen: '2r3k1/pp1nbppp/3p4/4p3/4P3/1B6/PPP2PPP/1N1R2K1 w',
      side: 'White to move',
      theme: ['Outpost', 'bad bishop'],
      entries: [
        { move: '1.Nc3! followed by Nd5', lines: ['No black pawn can ever attack d5: the', 'c-pawn is gone and the e-pawn has', 'already moved past it.'] },
        { move: 'If Black trades on d5', lines: ['Bxd5 keeps a white piece on the square,', 'while the e7-bishop stays hemmed in by', 'its own pawns on d6 and e5.'] }
      ]
    },
    explanation: {
      title: 'Outposts',
      para: [
        'An outpost is a square in or near enemy',
        'territory that no enemy pawn can attack.',
        'A knight placed there is hard to remove',
        'and can only be challenged by trading it',
        'for another piece.'
      ],
      key: [
        'Before placing a piece, ask: can a pawn',
        'ever drive it away? If not, the square',
        'may be worth several moves to reach.'
      ],
      para2: [
        'Outposts are created by pawn moves, so',
        'every pawn advance is also a decision',
        'about which squares to give up.'
      ]
    }
  },
  calculation: {
    diagram: {
      fen: '3r2k1/pp4pp/8/6N1/8/8/Pq2QPPP/6K1 w',
      side: 'White to move',
      task: 'Calculate a forced checkmate.',
      note: 'The worked solution follows in the solutions section.'
    },
    solution: {
      title: 'Double check, then smother',
      fen: '3r2k1/pp4pp/8/6N1/8/8/Pq2QPPP/6K1 w',
      side: 'White to move',
      theme: ['Forcing sequence'],
      entries: [
        { move: '1.Qe6+ Kh8', lines: ['(1...Kf8 2.Qf7#)'] },
        { move: '2.Nf7+ Kg8 3.Nh6+ Kh8', lines: ['(3...Kf8 4.Qf7#)'] },
        { move: '4.Qg8+! Rxg8 5.Nf7#', lines: ['The double check drives the king back to', 'the corner, and the queen sacrifice lets', 'its own rook block its last square.'] }
      ]
    },
    explanation: {
      title: 'Forcing moves first',
      para: [
        'When you calculate, look at checks, then',
        'captures, then threats. Forcing moves',
        'limit the opponent’s replies, which keeps',
        'the number of lines small enough to work',
        'through accurately.'
      ],
      key: [
        'For every forcing move, list all of the',
        'opponent’s legal replies before going',
        'deeper, not just the obvious one.'
      ],
      para2: [
        'At the end of a line, stop and look at',
        'the final position again before you',
        'decide it is good.'
      ]
    }
  }
};

export const products = [
  {
    id: 'tactics-fundamentals',
    file: 'tactics-fundamentals.html',
    name: 'Tactics Fundamentals',
    run: 'Tactics Fundamentals',
    price: 25,
    level: 'Beginner',
    icon: { type: 'n', color: 'w' },
    card: 'Forks, pins, skewers, discovered attacks and double attacks, each explained with examples and followed by training positions with worked solutions.',
    metaDescription: 'Tactics Fundamentals: a beginner chess workbook on forks, pins, skewers, discovered attacks and double attacks. PDF workbook and PGN files, $25.',
    lede: 'A structured workbook on the five basic tactical ideas: forks, pins, skewers, discovered attacks and double attacks. Each one is explained on its own, shown in annotated examples, and then practiced in training positions with fully worked solutions.',
    contents: [
      ['What makes a position tactical', 'An opening section on the warning signs that tactics are available: undefended pieces, pieces lined up on the same file, rank or diagonal, and a king with few safe squares. These clues come up again in every chapter that follows.'],
      ['Forks', 'Attacks on two targets with a single piece, starting with the knight and moving on to forks by pawns, bishops, rooks, queens and the king. Includes how a preliminary check or capture can set a fork up.'],
      ['Pins', 'Absolute and relative pins, how to win material by adding pressure to a pinned piece, and how to break a pin when you are the one caught in it.'],
      ['Skewers', 'The skewer as the reverse of a pin: a valuable piece is attacked and has to move, exposing the piece behind it. Covers skewers along files, ranks and diagonals, including skewers against the king.'],
      ['Discovered attacks', 'Moving one piece to unmask an attack from another, including discovered checks and double checks, and why the piece that moves is so often free to cause damage of its own.'],
      ['Double attacks', 'Threats against two targets at once using any combination of pieces, including moves that combine a mating threat with a threat to win material.'],
      ['Mixed training positions', 'A closing set of positions where the theme is not announced in advance, so the first task is recognizing which idea fits. Every position has a fully worked solution.']
    ],
    forWho: [
      'Players who know the rules and how the pieces move, and want a systematic introduction to tactics.',
      'Players who often miss short tactics in their own games and want to study the patterns one at a time.',
      'Adult learners and older juniors who prefer a written workbook they can study at their own board.'
    ],
    notFor: [
      'Complete newcomers still learning how the pieces move. The course assumes you know the rules.',
      'Experienced players looking for long, complex combinations. The positions here focus on clear ideas.',
      'Anyone looking for video lessons or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.tactics, solution: P.tactics, explanation: P.tactics }
  },
  {
    id: 'checkmate-patterns',
    file: 'checkmate-patterns.html',
    name: 'Checkmate Patterns',
    run: 'Checkmate Patterns',
    price: 29,
    level: 'Beginner',
    icon: { type: 'k', color: 'b' },
    card: 'The common mating patterns, how to recognize them, and training positions for spotting them in play.',
    metaDescription: 'Checkmate Patterns: a beginner chess workbook on the common mating patterns and how to recognize them. PDF workbook and PGN files, $29.',
    lede: 'A pattern-by-pattern study of the checkmates that appear again and again in real games: what each mating net looks like, which pieces it needs, and the warning signs that one is available. Every pattern is followed by training positions with worked solutions.',
    contents: [
      ['Reading the king’s position', 'How to count a king’s escape squares, see which of them are covered, and recognize when a single check would be decisive.'],
      ['Back-rank mates', 'Mates against a king trapped behind its own pawns, the defensive resources that prevent them, and the tactics that remove a defender of the back rank.'],
      ['Mates with the queen', 'Patterns where the queen works with the king, a knight or a bishop to cover the last escape squares, including mates on the edge of the board and in front of a castled king.'],
      ['Mates with rooks', 'Two rooks working together, the rook and king mate, and rooks combining on the seventh and eighth ranks.'],
      ['Knight and bishop patterns', 'Smothered mates, mates along the long diagonal, and patterns where the minor pieces work together against a cramped king.'],
      ['Opening the king', 'Common sacrifices that remove pawn cover or draw the king into the open, with the mating pattern shown at the end of each line.'],
      ['Mixed training positions', 'Positions where the pattern is not named in advance, so you have to recognize it first. Each worked solution covers the defender’s tries as well as the mate.']
    ],
    forWho: [
      'Players who know the rules and want to recognize the standard mating patterns quickly.',
      'Players who reach good attacking positions but are unsure how to finish them.',
      'Anyone who wants a companion to Tactics Fundamentals with a sharper focus on the king.'
    ],
    notFor: [
      'Complete newcomers still learning how the pieces move.',
      'Players looking for a study of long attacking games or opening preparation.',
      'Anyone looking for video lessons or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.mates, solution: P.mates, explanation: P.mates }
  },
  {
    id: 'opening-repertoire-black',
    file: 'opening-repertoire-black.html',
    name: 'Opening Repertoire for Black',
    run: 'Repertoire for Black',
    price: 45,
    level: 'Intermediate',
    icon: { type: 'p', color: 'b' },
    card: 'A complete repertoire for Black against White’s main first moves, organized by the ideas and plans behind each line rather than memorized move orders.',
    metaDescription: 'Opening Repertoire for Black: a complete intermediate repertoire against White’s main first moves, organized by plans and ideas. PDF and PGN, $45.',
    lede: 'A complete opening repertoire for Black against White’s main first moves. Every line is explained through its plans, pawn structures and typical piece placements, so the repertoire is something you understand rather than a list of move orders to memorize.',
    contents: [
      ['How the repertoire fits together', 'An overview of the whole repertoire, how the lines connect, and the recurring structures that link them, so you see the big picture before studying any single line.'],
      ['Against 1.e4', 'Black’s replies, the key decisions in the first moves, and the central breaks and piece set-ups to aim for in each variation.'],
      ['Against 1.d4', 'A solid set-up against White’s queen’s-pawn openings, with the typical plans for both sides and the pawn structures that arise most often.'],
      ['Against 1.c4 and 1.Nf3', 'How to meet White’s flank openings, including the move-order choices that can transpose into other lines and how to steer toward familiar structures.'],
      ['Less common first moves', 'Straightforward ways to handle White’s rarer first moves without a separate body of theory for each one.'],
      ['Typical middlegame plans', 'The positions the repertoire tends to produce and the plans that go with them: where the pieces belong, which pawn breaks matter, and which exchanges suit Black.'],
      ['Training positions', 'Positions taken from the repertoire lines that ask for the right plan or move, each followed by a worked solution.']
    ],
    forWho: [
      'Players who know the basic opening principles and want a complete, connected set of lines for Black.',
      'Players who keep forgetting move orders and would rather learn the reasons behind each move.',
      'Players who want to load a repertoire into their own chess software and review it there.'
    ],
    notFor: [
      'Beginners still learning the basic opening principles. Tactics Fundamentals and Checkmate Patterns are better starting points.',
      'Players looking for an encyclopedia of every sideline.',
      'Anyone looking for video lessons, game reviews or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.black, solution: P.black, explanation: P.black }
  },
  {
    id: 'opening-repertoire-white',
    file: 'opening-repertoire-white.html',
    name: 'Opening Repertoire for White',
    run: 'Repertoire for White',
    price: 49,
    level: 'Intermediate',
    icon: { type: 'p', color: 'w' },
    card: 'A complete repertoire for White built around 1.e4, with the main plans, typical pawn structures, and how to handle Black’s common replies.',
    metaDescription: 'Opening Repertoire for White: a complete intermediate 1.e4 repertoire with main plans, pawn structures and Black’s common replies. PDF and PGN, $49.',
    lede: 'A complete repertoire for White built around 1.e4. For each of Black’s common replies it sets out White’s main plans, the pawn structures that result, and how to handle the positions that follow, with every line explained rather than simply listed.',
    contents: [
      ['How the repertoire is built', 'Why the repertoire is built on 1.e4, how its lines fit together, and the handful of structures that come up again and again.'],
      ['Against 1...e5', 'White’s set-up against the symmetrical reply, the main plans in the resulting positions, and how to meet Black’s most common defensive systems.'],
      ['Against 1...c5', 'A clear system against the most popular asymmetrical reply, with the typical plans for both sides explained.'],
      ['Against 1...e6 and 1...c6', 'The pawn structures that arise when Black challenges the center with ...d5, and White’s plans for space and piece play in each.'],
      ['Against other replies', 'How to handle 1...d5, set-ups with ...d6 and ...g6, and Black’s rarer first moves without a mountain of extra theory.'],
      ['Pawn structures and plans', 'The structures the repertoire produces most often, from locked centers to positions with an isolated pawn, with White’s standard plans in each.'],
      ['Training positions', 'Positions from the repertoire lines that ask for the right plan or move, each followed by a worked solution.']
    ],
    forWho: [
      'Players who open with 1.e4, or want to, and need a complete and connected repertoire.',
      'Players who prefer to understand plans and structures instead of memorizing long move orders.',
      'Players who want every line in PGN so they can review it in their own software.'
    ],
    notFor: [
      'Beginners still learning the basic opening principles. Tactics Fundamentals and Checkmate Patterns are better starting points.',
      'Players who open with a first move other than 1.e4.',
      'Anyone looking for video lessons, game reviews or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.white, solution: P.white, explanation: P.white }
  },
  {
    id: 'endgame-essentials',
    file: 'endgame-essentials.html',
    name: 'Endgame Essentials',
    run: 'Endgame Essentials',
    price: 39,
    level: 'Beginner to intermediate',
    icon: { type: 'r', color: 'w' },
    card: 'King and pawn endings, basic rook endings, and the key theoretical positions every player should know, with training positions to practice converting them.',
    metaDescription: 'Endgame Essentials: king and pawn endings, basic rook endings and key theoretical positions. Beginner to intermediate PDF and PGN workbook, $39.',
    lede: 'The endgame knowledge every player needs: king and pawn endings, basic rook endings, and the key theoretical positions, set out step by step. Each topic ends with training positions where you practice converting the win or holding the draw.',
    contents: [
      ['Endgame principles', 'King activity, passed pawns, and how the value of the pieces changes once the queens are off the board.'],
      ['King and pawn endings', 'The square of the pawn, the opposition, key squares, outflanking, and races between passed pawns.'],
      ['Basic rook endings', 'Active and passive rooks, cutting off the enemy king, rooks behind passed pawns, and the standard methods for the attacking and defending side.'],
      ['Key theoretical positions', 'The essential won and drawn positions in rook and pawn endings, including the bridge-building method for winning and the third-rank defense for drawing.'],
      ['Converting an advantage', 'How to turn an extra pawn or a better king into a win, step by step, without giving the opponent counterplay.'],
      ['Training positions', 'Positions where you must find the winning or drawing technique, each with a fully worked solution.']
    ],
    forWho: [
      'Players who reach endgames but are unsure of the standard techniques.',
      'Players who want to learn the key theoretical positions properly, one at a time.',
      'Anyone who prefers to study endgames from a written workbook at their own board.'
    ],
    notFor: [
      'Players looking for a deep reference on rare or complex endings.',
      'Complete newcomers still learning how the pieces move.',
      'Anyone looking for video lessons or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.endgame, solution: P.endgame, explanation: P.endgame }
  },
  {
    id: 'positional-play-strategy',
    file: 'positional-play-strategy.html',
    name: 'Positional Play & Strategy',
    run: 'Positional Play',
    price: 55,
    level: 'Intermediate to advanced',
    icon: { type: 'b', color: 'b' },
    card: 'Pawn structures, piece activity, weak squares and planning in quiet positions, explained through annotated examples and training exercises.',
    metaDescription: 'Positional Play & Strategy: pawn structures, piece activity, weak squares and planning in quiet positions. Intermediate to advanced PDF and PGN, $55.',
    lede: 'A course on the quiet side of chess: pawn structures, piece activity, weak squares and how to make a plan when there is nothing to calculate. Each idea is explained through annotated examples and then practiced in training exercises with worked solutions.',
    contents: [
      ['Pawn structures', 'Isolated, doubled, backward and passed pawns, pawn chains and pawn majorities, and the plans each structure suggests for both sides.'],
      ['Piece activity', 'Active and passive pieces, open files and diagonals, and how to improve your worst-placed piece.'],
      ['Weak squares and outposts', 'How pawn moves create holes, how to occupy them with pieces, and how to avoid creating them in your own camp.'],
      ['Good and bad pieces', 'Good and bad bishops, knights against bishops, and how pawn structure decides which minor pieces are worth keeping.'],
      ['Exchanges', 'When to trade pieces, which pieces to trade, and how exchanges change the character of a position.'],
      ['Planning in quiet positions', 'A practical method for choosing a plan: assess the structure, identify the weaknesses on both sides, and decide where to play.'],
      ['Training exercises', 'Positions that ask for a plan, an assessment or the best regrouping, each with a worked solution explaining the reasoning.']
    ],
    forWho: [
      'Players who are comfortable with basic tactics and want to understand quiet positions better.',
      'Players who often reach the middlegame unsure what to do next.',
      'Players who want annotated examples explained in words, not long move lists.'
    ],
    notFor: [
      'Beginners who are still building their tactical foundations. Start with Tactics Fundamentals.',
      'Players looking for opening preparation or a collection of puzzles.',
      'Anyone looking for video lessons, game reviews or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.positional, solution: P.positional, explanation: P.positional }
  },
  {
    id: 'calculation-visualization',
    file: 'calculation-visualization.html',
    name: 'Calculation & Visualization Training',
    run: 'Calculation Training',
    price: 65,
    level: 'Intermediate to advanced',
    icon: { type: 'q', color: 'w' },
    card: 'Structured exercises for calculating forcing lines and visualizing positions without moving pieces, increasing in difficulty across the course.',
    metaDescription: 'Calculation & Visualization Training: structured exercises in calculating forcing lines and visualizing positions. Intermediate to advanced, PDF and PGN, $65.',
    lede: 'A structured training course in calculating forcing lines and visualizing positions without moving the pieces. The exercises start short and grow longer and harder across the course, and every one comes with a worked solution that shows the full line and the replies that had to be checked.',
    contents: [
      ['How to calculate', 'A simple method for working through variations: list candidate moves, start with forcing moves, check every reply, and assess the final position.'],
      ['Visualization basics', 'Exercises in seeing the board without moving pieces: square colors, diagonals, knight routes, and following short sequences in your head.'],
      ['Short forcing lines', 'Sequences of checks, captures and threats a few moves deep, where every reply has to be found and answered.'],
      ['Longer calculations', 'Positions that need deeper and wider calculation, including quiet moves in the middle of a forcing line and defensive resources that are easy to miss.'],
      ['Holding the position in your head', 'Exercises that give a position and a sequence of moves in writing, and ask you to assess the final position without setting it up on a board.'],
      ['Mixed training sets', 'A final run of exercises that mixes every type, arranged in increasing difficulty, each with a fully worked solution.']
    ],
    forWho: [
      'Players who see the right ideas but lose track of the position a few moves into a line.',
      'Players who want structured, progressive exercises instead of random puzzles.',
      'Players who are comfortable with the basic tactical patterns and want to go further.'
    ],
    notFor: [
      'Beginners still learning the basic tactical patterns. Tactics Fundamentals comes first.',
      'Players who want quick puzzles to solve on screen. These exercises are meant for slow, careful work.',
      'Anyone looking for video lessons or personal feedback. This is a self-study workbook.'
    ],
    preview: { diagram: P.calculation, solution: P.calculation, explanation: P.calculation }
  },
  {
    id: 'complete-training-library',
    file: 'complete-training-library.html',
    name: 'Complete Training Library',
    run: 'Training Library',
    price: 145,
    level: 'Beginner to advanced',
    icon: { type: 'k', color: 'w', library: true },
    card: 'All seven courses together: tactics, checkmates, both opening repertoires, endgames, strategy, and calculation and visualization.',
    metaDescription: 'Complete Training Library: all seven Fiancho Chess chess training courses together, from beginner to advanced. PDF workbooks and PGN files, $145.',
    lede: 'All seven Fiancho Chess training courses together in one download: tactics, checkmate patterns, opening repertoires for both colors, endgames, positional play, and calculation and visualization. Every course is complete and identical to the version sold on its own.',
    contents: null,
    forWho: [
      'Players who want the whole course range in one purchase.',
      'Players planning a long-term study program across every part of the game.',
      'Players who already know they want several of the individual courses.'
    ],
    notFor: [
      'Players who only need one or two topics. Each course is also sold on its own.',
      'Complete newcomers still learning how the pieces move.',
      'Anyone looking for video lessons, coaching or personal feedback. These are self-study workbooks.'
    ],
    preview: { diagram: P.calculation, solution: P.tactics, explanation: P.endgame, runFrom: { diagram: 'Calculation Training', solution: 'Tactics Fundamentals', explanation: 'Endgame Essentials' } }
  }
];

export const studyOrder = [
  ['Start with tactics and mates', 'Tactics Fundamentals and Checkmate Patterns build the pattern recognition that every other course relies on.'],
  ['Add endgames early', 'Endgame Essentials sits comfortably alongside the beginner courses and runs into intermediate material.'],
  ['Choose your openings', 'The repertoires for White and Black give you a complete, connected set of lines once the basics are in place.'],
  ['Move on to strategy and calculation', 'Positional Play & Strategy and Calculation & Visualization Training are the most demanding courses and work best last.']
];
