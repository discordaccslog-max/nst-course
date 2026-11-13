// Original lesson text for every course. `example` and `training` refer to verified position slots
// (tools/courses/data/verified.json) or to generated exercise sets; build-courses.mjs resolves them.

export const courses = {
  'tactics-fundamentals': {
    signature: { fen: 'r3k3/1p3ppp/8/3N4/8/8/PP3PPP/6K1 w - - 0 1', caption: 'A knight fork in the making' },
    sections: [
      {
        id: 'tactical', title: 'What makes a position tactical',
        paras: [
          'Tactics are short, forcing sequences that win material or give mate. They don’t appear out of nowhere: they grow from a handful of weaknesses that you can learn to spot before you calculate anything.',
          'The first warning sign is an <strong>undefended piece</strong>. A piece nobody protects can be won by any attack that also threatens something else. The second is <strong>pieces on one line</strong>: two valuable pieces on the same file, rank or diagonal invite pins and skewers. The third is a <strong>king with few safe squares</strong>, where a single check can be decisive.',
          'Before every move, ask three questions: which of my opponent’s pieces are undefended, which are lined up, and how safe is their king? The answers tell you where to look.'
        ],
        key: 'Loose pieces, pieces on one line and an exposed king are the three clues that a tactic is available.',
        example: { slot: 'tf-mixed', index: 0, prompt: 'Look for the loose piece or the lined-up pieces, then step through the solution.' }
      },
      {
        id: 'forks', title: 'Forks',
        paras: [
          'A fork is one move that attacks two or more targets at once. The opponent can usually save only one of them.',
          'The knight is the most common forking piece. Its attack can’t be blocked, and its L-shaped move is easy to overlook, especially when it lands next to two pieces of different colors from its own square. Pawns, bishops, rooks, queens and even kings can fork too.',
          'A check is the strongest first target, because the opponent must deal with it before anything else. That is why the most powerful forks attack the king and a second piece together.'
        ],
        key: 'Look for a square from which one piece attacks two valuable or undefended targets. If one of them is the king, the fork is usually decisive.',
        example: { slot: 'tf-fork', index: 0 },
        training: { slot: 'tf-fork', from: 1, prompt: 'Find the fork.' }
      },
      {
        id: 'pins', title: 'Pins',
        paras: [
          'A pin happens when a piece can’t move without exposing a more valuable piece behind it on the same line. Only bishops, rooks and queens can pin, because only they attack along lines.',
          'In an <strong>absolute pin</strong> the piece behind is the king, so the pinned piece is not allowed to move at all. In a <strong>relative pin</strong> the piece behind is something valuable, such as the queen or a rook, and moving the pinned piece is legal but costly.',
          'A pinned piece is a weak piece: it can’t defend properly, and you can attack it again, often with a pawn, knowing it can’t run away.'
        ],
        key: 'Pile up on a pinned piece. It can’t move away, so every extra attacker counts.',
        example: { slot: 'tf-pin', index: 0 },
        training: { slot: 'tf-pin', from: 1, prompt: 'Use the pin.' }
      },
      {
        id: 'skewers', title: 'Skewers',
        paras: [
          'A skewer is a pin in reverse: the more valuable piece is in front. When it moves out of the attack, the piece behind it is lost.',
          'Skewers along the back rank and against an exposed king are especially common in endgames, where kings and rooks often stand on open lines. A check that forces the king off a line and wins the rook or queen behind it is the classic example.',
          'To find skewers, look for a valuable piece, especially the king, standing on the same open line as another piece, with nothing between them.'
        ],
        key: 'When the king or queen stands in front of another piece on an open line, a check or attack along that line may win the piece behind.',
        example: { slot: 'tf-skewer', index: 0 },
        training: { slot: 'tf-skewer', from: 1, prompt: 'Find the skewer.' }
      },
      {
        id: 'discovered', title: 'Discovered attacks',
        paras: [
          'In a discovered attack, one piece moves out of the way and unmasks an attack by another piece behind it. The moving piece is free to make a threat of its own, so the opponent faces two problems at once.',
          'A <strong>discovered check</strong> is the strongest form: the king must be answered, which leaves the moving piece free to capture almost anything. In a <strong>double check</strong> both pieces give check, and the only legal reply is a king move.',
          'Watch for your own pieces lined up behind each other on a line that leads to an enemy piece. That arrangement is a discovered attack waiting to happen.'
        ],
        key: 'When one of your pieces blocks another’s line to a target, moving the front piece with a threat creates two attacks at once.',
        example: { slot: 'tf-discovered', index: 0 },
        training: { slot: 'tf-discovered', from: 1, prompt: 'Find the discovered attack.' }
      },
      {
        id: 'double', title: 'Double attacks',
        paras: [
          'A double attack is any move that creates two threats at once. Forks are one kind, but double attacks also come from queens and bishops sweeping across the board, or from a move that combines a mating threat with a threat to win material.',
          'The queen is the best double-attacking piece because it moves in every direction. Many games are decided by a queen move that checks the king and attacks a loose piece on the other side of the board.',
          'When your opponent has two weaknesses, look for a single move that hits both.'
        ],
        key: 'Two threats are better than one. A move that attacks two targets, or threatens mate and material together, often can’t be parried.',
        example: { slot: 'tf-double', index: 0 },
        training: { slot: 'tf-double', from: 1, prompt: 'Find the double attack.' }
      },
      {
        id: 'mixed', title: 'Mixed training positions',
        paras: ['In real games nobody tells you which tactic to look for. In these positions the theme isn’t announced: start with the three clues from the first lesson, then find the move.'],
        key: 'Check for loose pieces, lined-up pieces and king safety before you calculate.',
        training: { slot: 'tf-mixed', from: 1, prompt: 'Find the best move.' }
      }
    ]
  },

  'checkmate-patterns': {
    signature: { fen: '6k1/p4ppp/8/8/8/P7/1r3PPP/3R2K1 w - - 0 1', caption: 'A back-rank mate in one' },
    sections: [
      {
        id: 'reading', title: 'Reading the king’s position',
        paras: [
          'Every checkmate comes down to two facts: the king is in check, and it has no safe square. Recognizing mating patterns starts with counting a king’s escape squares.',
          'Look at every square next to the enemy king. Some are blocked by its own pieces, some are covered by your pieces, and the rest are escape squares. When a king has none or one, a single check may be mate. When it has several, you need more force or a sacrifice to take them away.',
          'Kings that have castled behind unmoved pawns often have no escape squares at all. That is a strength in the opening and a weakness later.'
        ],
        key: 'Count the king’s escape squares before you look for checks. The fewer it has, the closer mate is.',
        example: { slot: 'cm-mixed', index: 0 }
      },
      {
        id: 'backrank', title: 'Back-rank mates',
        paras: [
          'When a king sits on its first rank behind its own pawns, those pawns take away its escape squares. A rook or queen that reaches the back rank with check can then give mate, unless a defender covers that rank in time.',
          'The pattern appears constantly because defenders get pulled away. If the only piece guarding the back rank is attacked or overloaded, the mate becomes possible.',
          'The cure is a single pawn move that gives the king a flight square, often called luft.'
        ],
        key: 'Count the defenders of the back rank. If an attacker arrives there with check and nothing can block or capture, it is mate.',
        example: { slot: 'cm-backrank', index: 0 },
        training: { slot: 'cm-backrank', from: 1, prompt: 'Deliver the mate.' }
      },
      {
        id: 'queen', title: 'Mates with the queen',
        paras: [
          'The queen covers more squares than any other piece, so most mates involve her. On her own she can mate a king on the edge of the board when her own king or another piece protects her.',
          'The most common pattern is the queen landing right next to the enemy king, defended by another piece, so the king can neither capture her nor escape. A queen supported by a pawn or a bishop in front of a castled king is a classic example.',
          'When you see a supported square next to the enemy king, check whether your queen can reach it.'
        ],
        key: 'A defended queen next to the king, with every escape square covered, is mate.',
        example: { slot: 'cm-queen', index: 0 },
        training: { slot: 'cm-queen', from: 1, prompt: 'Mate with the queen.' }
      },
      {
        id: 'rook', title: 'Mates with rooks',
        paras: [
          'Rooks give mate along ranks and files. Two rooks working together can drive a king to the edge by checking on alternate ranks, and a rook on the seventh or eighth rank combined with a minor piece or a pawn produces many standard mates.',
          'A rook on an open file next to the enemy king, supported by another piece, is a recurring finish. So is a rook check on the edge when the king’s escape squares are covered by a knight or bishop.',
          'Look for open files and ranks leading to the king, and for squares where a rook check can’t be blocked.'
        ],
        key: 'A rook check along an open line, with the escape squares covered by another piece, is a common mating finish.',
        example: { slot: 'cm-rook', index: 0 },
        training: { slot: 'cm-rook', from: 1, prompt: 'Mate with the rook.' }
      },
      {
        id: 'minor', title: 'Knight and bishop patterns',
        paras: [
          'Knights and bishops give some of the most striking mates. A knight can mate a king that is completely surrounded by its own pieces, the smothered mate, because nothing can block a knight check.',
          'Two bishops on adjacent diagonals can trap a king in the open, and a knight working with a rook or bishop can cover exactly the squares the king needs.',
          'These patterns are easy to miss because the minor pieces look harmless from a distance. Train your eye to see the squares they control next to the enemy king.'
        ],
        key: 'When the king is hemmed in by its own pieces, a knight check may be mate, because a knight check can’t be blocked.',
        example: { slot: 'cm-minor', index: 0 },
        training: { slot: 'cm-minor', from: 1, prompt: 'Find the mate.' }
      },
      {
        id: 'sacrifice', title: 'Opening the king',
        paras: [
          'A well-protected king can still be mated if the protection is removed. Sacrifices that destroy the pawn cover, deflect a defender or drag the king into the open are the bridge between a strong attack and a mating pattern.',
          'Before you sacrifice, picture the position after the sacrifice and ask which mating pattern you are heading for. If you can name the final pattern, the sacrifice is usually sound.',
          'In the positions that follow, the first move gives up material and the mate comes a move later.'
        ],
        key: 'Sacrifice with a destination: know which mating pattern the sacrifice leads to before you play it.',
        example: { slot: 'cm-sacrifice', index: 0 },
        training: { slot: 'cm-sacrifice', from: 1, prompt: 'Sacrifice and mate.' }
      },
      {
        id: 'mixed', title: 'Mixed training positions',
        paras: ['These positions don’t name the pattern. Count the escape squares, look for checks, and find the mate.'],
        key: 'Escape squares first, checks second.',
        training: { slot: 'cm-mixed', from: 1, prompt: 'Find the mate.' }
      }
    ]
  },

  'calculation-visualization': {
    signature: { fen: '6rk/5Npp/8/8/8/8/6PP/6K1 b - - 0 1', caption: 'A smothered mate at the end of a forcing line' },
    sections: [
      {
        id: 'how', title: 'How to calculate',
        paras: [
          'Calculation is a method, not a talent. Start by listing <strong>candidate moves</strong>, and look first at forcing moves: checks, then captures, then threats. Forcing moves limit your opponent’s replies, which keeps the number of lines small enough to work through accurately.',
          'For each candidate, list all of your opponent’s sensible replies, not just the one you expect. A line is only as good as its weakest point, and most calculation mistakes come from a reply that was never considered.',
          'At the end of a line, stop and look at the final position again before you decide it is good. Count material, check for hanging pieces and ask what your opponent will do next.'
        ],
        key: 'Checks, captures, threats. For every forcing move, list all of the opponent’s replies before going deeper.',
        example: { slot: 'cv-short', index: 0 }
      },
      {
        id: 'basics', title: 'Visualization basics',
        paras: [
          'Seeing the board in your head starts with knowing it by heart. Strong calculators know the color of every square, which squares share a diagonal, and how many moves a knight needs to get anywhere, without looking.',
          'These exercises have no board on purpose. Answer from your mental picture, then check yourself. Speed comes with repetition.'
        ],
        key: 'Know the board without seeing it: square colors, diagonals and knight distances.',
        training: { set: 'basics', prompt: 'Answer without a board.' }
      },
      {
        id: 'short', title: 'Short forcing lines',
        paras: [
          'These positions need a sequence of a few forcing moves. Find the first move, but don’t play it until you have checked every reasonable reply.',
          'If a reply surprises you on the board, that is useful information: it shows which kind of defensive move you tend to miss.'
        ],
        key: 'Calculate to the end of the line before you move the first piece.',
        training: { slot: 'cv-short', from: 1, count: 6, prompt: 'Calculate the forcing line.' }
      },
      {
        id: 'long', title: 'Longer calculations',
        paras: [
          'Longer lines demand discipline. Break them into stages: the forcing start, the position where the opponent has a real choice, and the final position. Re-check each stage before moving on.',
          'Quiet moves in the middle of a forcing line are the hardest to see, for both sides. When a line seems to fizzle out, look for a quiet move that keeps the threat alive.'
        ],
        key: 'Split long lines into stages and re-check each stage, including quiet moves in the middle.',
        example: { slot: 'cv-long', index: 0 },
        training: { slot: 'cv-long', from: 1, count: 6, prompt: 'Calculate the full line.' }
      },
      {
        id: 'head', title: 'Holding the position in your head',
        paras: [
          'In these exercises the board shows the starting position and stays still. You read a sequence of moves and keep track of the changes in your head, then answer a question about the final position.',
          'Say each move to yourself and picture the piece travelling. Keep track of captures especially: a piece that has left the board is the easiest thing to forget.',
          'The sequences start short and grow longer.'
        ],
        key: 'Picture each move as you read it, and keep a running count of captures.',
        training: { set: 'visual', levels: [1, 2], prompt: 'Follow the moves, then answer.' }
      },
      {
        id: 'mixed', title: 'Mixed training sets',
        paras: ['A final run that mixes longer visualization sequences with positions to calculate on the board, arranged in increasing difficulty.'],
        key: 'Use the same method every time: candidate moves, every reply, a final look.',
        training: { mixed: [{ set: 'visual', levels: [3] }, { slot: 'cv-short', from: 7 }, { set: 'visual', levels: [4] }, { slot: 'cv-long', from: 7 }], prompt: 'Calculate or visualize.' }
      }
    ]
  },

  'positional-play-strategy': {
    signature: { fen: '2r3k1/pp1nbppp/3p4/4p3/4P3/1B6/PPP2PPP/1N1R2K1 w - - 0 1', caption: 'The d5 outpost' },
    sections: [
      {
        id: 'structures', title: 'Pawn structures',
        paras: [
          'Pawns can’t move backward, so every pawn move changes the position for good. The pawn structure decides where the pieces belong and which plans make sense.',
          'An <strong>isolated pawn</strong> has no friendly pawns on the neighbouring files, so no pawn can ever defend it. <strong>Doubled pawns</strong> stand on the same file and can’t protect each other. A <strong>passed pawn</strong> has no enemy pawns in front of it on its own file or the neighbouring files, so only pieces can stop it.',
          'Being able to name these features at a glance is the first step toward making plans around them.'
        ],
        key: 'Isolated pawns can’t be defended by pawns, doubled pawns can’t defend each other, and passed pawns can only be stopped by pieces.',
        training: { set: 'structure', kinds: ['isolated', 'passed', 'doubled'], prompt: 'Identify the pawn feature.' }
      },
      {
        id: 'activity', title: 'Piece activity',
        paras: [
          'An active piece controls many squares and has targets to attack. A passive piece defends, blocks its own pawns or has nowhere to go. Positional play often comes down to improving your worst piece while limiting your opponent’s best one.',
          'Open files belong to rooks, long diagonals to bishops, and central squares that pawns can’t attack to knights. When you can’t find a plan, find your least active piece and give it a better square.',
          'In the training positions, the best move is a quiet one: no check, no capture, just a stronger placement or a move that takes something away from the opponent.'
        ],
        key: 'When there is nothing to calculate, improve your worst piece.',
        example: { slot: 'ps-quiet', index: 0 },
        training: { slot: 'ps-quiet', from: 1, count: 3, prompt: 'Find the strongest quiet move.' }
      },
      {
        id: 'outposts', title: 'Weak squares and outposts',
        paras: [
          'A square that no enemy pawn can ever attack is a weak square for your opponent and a potential <strong>outpost</strong> for you. A knight placed on an outpost, especially one supported by a pawn, is very hard to remove: it can only be challenged by trading it for another piece.',
          'Outposts are created by pawn moves. Once the neighbouring pawns have advanced past a square or disappeared, that square can never be covered by a pawn again.',
          'In these exercises an outpost means a square on White’s fourth, fifth or sixth rank that no black pawn can ever attack and that a white pawn defends.'
        ],
        key: 'Before placing a piece, ask: can a pawn ever drive it away? If not, the square may be worth several moves to reach.',
        training: { set: 'structure', kinds: ['outpost'], prompt: 'Find an outpost square.' }
      },
      {
        id: 'pieces', title: 'Good and bad pieces',
        paras: [
          'A bishop is <strong>bad</strong> when most of its own pawns stand on squares of its color. Those pawns block it and leave the opposite-colored squares without protection. A bishop is <strong>good</strong> when its pawns stand on the other color, leaving it free to move.',
          'Pawn structure decides which minor pieces are worth keeping. In closed positions with fixed pawns, knights often outperform bad bishops; in open positions, bishops usually come into their own.',
          'In these exercises, a bishop counts as bad when at least 70% of its side’s pawns stand on its color, and good when no more than 30% do.'
        ],
        key: 'Count your pawns on each color. A bishop that shares a color with most of its pawns is a bad bishop.',
        training: { set: 'structure', kinds: ['bishop'], prompt: 'Judge the bishop.' }
      },
      {
        id: 'exchanges', title: 'Exchanges',
        paras: [
          'Every exchange changes the character of the position. Trade pieces when you are ahead in material, when you are defending against an attack, or when the trade leaves your opponent with a weakness. Avoid trades when you are cramped and need your pieces, or when your opponent’s remaining piece would be much better than yours.',
          'The question to ask before any trade is: which piece will remain, and is it better or worse than the one I am giving up?',
          'Several of the positions that follow turn on this question.'
        ],
        key: 'Before you trade, compare the pieces that will remain on the board.',
        training: { slot: 'ps-quiet', from: 4, count: 3, prompt: 'Find the strongest quiet move.' }
      },
      {
        id: 'planning', title: 'Planning in quiet positions',
        paras: [
          'A practical method for quiet positions: first assess the pawn structure, then list the weaknesses on both sides, then decide where to play, usually on the side of the board where your pawns point and your pieces are better placed.',
          'A plan doesn’t need to be long. Two or three moves that improve your position and take something away from your opponent are often enough.'
        ],
        key: 'Structure, weaknesses, then the side of the board to play on.',
        training: { slot: 'ps-quiet', from: 7, count: 3, prompt: 'Find the strongest quiet move.' }
      },
      {
        id: 'mixed', title: 'Training exercises',
        paras: ['A mixed set that combines structural judgments with quiet best moves.'],
        key: 'Name the structure first; the best moves follow from it.',
        training: { mixed: [{ set: 'structure', kinds: ['isolated', 'passed', 'outpost', 'bishop'], offset: 1 }, { slot: 'ps-quiet', from: 10 }], prompt: 'Judge the position or find the move.' }
      }
    ]
  },

  'endgame-essentials': {
    signature: { fen: '1K6/1P2k3/8/8/8/8/2r5/3R4 w - - 0 1', caption: 'Building the bridge' },
    sections: [
      {
        id: 'principles', title: 'Endgame principles',
        paras: [
          'In the endgame the king becomes a fighting piece. With the queens off the board it is no longer in danger, and it is often the strongest piece you have: bring it toward the centre and toward the pawns.',
          'Passed pawns matter more as material comes off. A passed pawn ties down enemy pieces and can decide the game on its own. The value of the pieces shifts too: rooks grow stronger on open files, and a bishop on an open board can outperform a knight.',
          'Start every endgame by activating your king, creating or stopping passed pawns, and placing rooks behind passed pawns.'
        ],
        key: 'Activate the king, push or stop passed pawns, and put rooks behind passed pawns.',
        demo: 'opposition'
      },
      {
        id: 'king-pawn', title: 'King and pawn endings',
        paras: [
          'King and pawn endings are pure calculation, and they decide many other endings, because a trade of the last pieces can lead straight into one.',
          'The <strong>square of the pawn</strong>: draw a square from the pawn to its promotion rank. If the defending king can step inside that square on its move, it catches the pawn. The <strong>opposition</strong>: when the two kings face each other with one square between them, the side that does not have to move holds the opposition, and the other king must give way.',
          'With the king in front of its pawn and on the sixth rank, the attacker wins whoever is to move (except with a rook pawn). Further back, the opposition decides.'
        ],
        key: 'Use the square to see whether a pawn can be caught, and the opposition to decide whose king must give way.',
        demo: 'square',
        practice: ['square-catch', 'kp-win-6th', 'kp-opposition', 'kp-hold'],
        training: { slot: 'ee-pawn', from: 0, count: 4, prompt: 'Find the winning move.' }
      },
      {
        id: 'rook', title: 'Basic rook endings',
        paras: [
          'Rook endings are the most common endings of all. The guiding rules: keep your rook active rather than tied to passive defense, use it to cut off the enemy king along a rank or file, and place it behind passed pawns, your own or your opponent’s.',
          'A king cut off from a pawn by a rook on a file is often lost for the defender, because the attacking king can escort the pawn without interference.',
          'The training positions put these rules to work.'
        ],
        key: 'An active rook, the enemy king cut off, and rooks behind passed pawns.',
        training: { slot: 'ee-rook', from: 0, count: 4, prompt: 'Find the best move.' }
      },
      {
        id: 'theory', title: 'Key theoretical positions',
        paras: [
          'Two rook and pawn positions are worth knowing by heart, because so many endings head for them.',
          'In the winning position, the attacker’s king is on the promotion square in front of its own pawn on the seventh rank, and the defending king is cut off. The winning method is to <strong>build a bridge</strong>: bring the rook to the fourth rank, step the king out, and block the rook checks with the rook.',
          'In the drawing position, the defender keeps the rook on the sixth rank (the third rank from the defender’s side) to stop the attacking king coming forward. Only when the pawn advances to that rank does the rook drop back and check from behind.'
        ],
        key: 'To win: build a bridge with the rook on the fourth rank. To draw: rook on the third rank until the pawn advances, then checks from behind.',
        demo: ['lucena', 'philidor']
      },
      {
        id: 'convert', title: 'Converting an advantage',
        paras: [
          'Winning a won position is a skill of its own. With a queen or rook against a bare king, the method is to restrict the king step by step and drive it to the edge, using your king to support the final mate.',
          'In these practice positions the trainer defends with exact best play from complete endgame tables, so every move you make must keep the win. You have 50 moves to deliver mate, as in the fifty-move rule.'
        ],
        key: 'Restrict the king, never give stalemate, and bring your own king up for the mate.',
        practice: ['kqk', 'krk', 'kp-convert']
      },
      {
        id: 'training', title: 'Training positions',
        paras: ['A final set of king and pawn and rook endings where you must find the winning or saving move.'],
        key: 'King activity and passed pawns decide most endings.',
        training: { mixed: [{ slot: 'ee-pawn', from: 4 }, { slot: 'ee-rook', from: 4 }], prompt: 'Find the best move.' }
      }
    ]
  }
};

// Endgame demonstrations (stepped through on the board) and practice positions (played against exact replies).
export const endgameDemos = {
  opposition: {
    title: 'The king on the sixth rank', fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    moves: [
      ['Kd6', 'The king steps to the side of the pawn while keeping control of d7 and e7, the squares in front of it.'],
      ['Kd8', 'Black takes the opposition.'],
      ['e6', 'Now the pawn advances with tempo.'],
      ['Ke8', 'Black has to give way.'],
      ['e7', 'The pawn reaches the seventh rank.'],
      ['Kf7', 'The black king leaves e8, but it is too late.'],
      ['Kd7', 'White controls the promotion square, and the pawn queens next move.']
    ]
  },
  square: {
    title: 'The square of the pawn', fen: '8/8/8/8/p7/4K3/8/6k1 w - - 0 1',
    moves: [
      ['Kd3', 'The square of the a4-pawn runs from a4 to d4 and down to a1 and d1. The king steps into it, so it is in time.'],
      ['a3', 'The pawn runs.'],
      ['Kc2', 'The king keeps pace.'],
      ['a2', 'One step from promotion.'],
      ['Kb2', 'The king catches the pawn: it falls on the next move.']
    ]
  },
  lucena: {
    title: 'Building the bridge', fen: '1K6/1P2k3/8/8/8/8/2r5/3R4 w - - 0 1',
    moves: [
      ['Rd4', 'The key move: the rook goes to the fourth rank, ready to block checks later.'],
      ['Rc1', 'Black waits.'],
      ['Ka7', 'The king steps out from in front of the pawn.'],
      ['Ra1+', 'Black starts checking.'],
      ['Kb6', 'The king walks back toward its own rook.'],
      ['Rb1+', 'Another check, from behind.'],
      ['Kc6', 'The king keeps walking toward the rook on d4, which will soon shelter it.'],
      ['Rc1+', 'Black checks from the side.'],
      ['Kb5', 'Now the king stands right next to the rook’s rank.'],
      ['Rb1+', 'The last check.'],
      ['Rb4', 'The bridge: the rook blocks the check, and the pawn will queen.']
    ]
  },
  philidor: {
    title: 'The third-rank defense', fen: '4k3/R7/1r6/3KP3/8/8/8/8 w - - 0 1',
    moves: [
      ['e6', 'White pushes the pawn to the sixth rank, the only way to make progress.'],
      ['Rb1', 'Now Black’s rook drops back, ready to check from behind. The white king has no shelter in front of its pawn.'],
      ['Kd6', 'White’s king tries to advance.'],
      ['Rd1+', 'Checks from behind begin.'],
      ['Ke5', 'The king can’t escape the checks without leaving the pawn.'],
      ['Re1+', 'Black keeps checking, and the position is a draw.']
    ]
  }
};

export const endgamePractice = {
  'square-catch': { fen: '8/8/8/8/p7/4K3/8/6k1 w - - 0 1', goal: 'draw', prompt: 'White to move. Stop the pawn.', explanation: 'Kd3 steps into the square of the pawn, and the king catches it. A king move that stays outside the square is too slow.' },
  'kp-win-6th': { fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', goal: 'win', prompt: 'White to move. Win by promoting the pawn safely.', explanation: 'With the king on the sixth rank in front of the pawn, White wins. Kd6 or Kf6 takes the opposition, and the pawn walks through.' },
  'kp-opposition': { fen: '8/4k3/8/3K4/4P3/8/8/8 w - - 0 1', goal: 'win', prompt: 'White to move. Win by promoting the pawn safely.', explanation: 'Ke5 takes the opposition: the kings face each other on the e-file with one square between them, and Black has to give way. Any other move lets Black take the opposition and draw.' },
  'kp-hold': { fen: '8/4k3/8/4PK2/8/8/8/8 b - - 0 1', goal: 'draw', holdMoves: 12, prompt: 'Black to move. Hold the draw for 12 moves.', explanation: 'Black keeps the king in front of the pawn and takes the opposition whenever White’s king comes forward. Stepping aside lets White’s king through.' },
  'kqk': { fen: '8/8/8/4k3/8/8/8/Q3K3 w - - 0 1', goal: 'win', prompt: 'White to move. Checkmate with king and queen.', explanation: 'Use the queen to box the king in, a knight’s move away, then bring your king up. Watch for stalemate when the black king has only a few squares.' },
  'krk': { fen: '8/8/3k4/8/8/8/8/R3K3 w - - 0 1', goal: 'win', prompt: 'White to move. Checkmate with king and rook.', explanation: 'Cut the king off with the rook, bring your king up in opposition, and check when the kings face each other. Step by step the box shrinks.' },
  'kp-convert': { fen: '8/4k3/8/8/3KP3/8/8/8 w - - 0 1', goal: 'win', prompt: 'White to move. Win by promoting the pawn safely.', explanation: 'Ke5 puts the king in front of its pawn on a key square. Pushing the pawn first lets the black king block it and draw.' }
};
