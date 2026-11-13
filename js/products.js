/*
  Fiancho Chess — product data
  Prices are in USD. Product pages render their price, buy button and license activation from this file.

  checkoutUrl: paste the payment provider's checkout link for each product between the quotes.
  While it is empty (""), no buy button is shown on that product's page.
  After payment, the payment provider should send the buyer to the product's confirmationPath,
  which issues and activates their license code.
*/
globalThis.SITE_PRODUCTS = {
  "tactics-fundamentals": {
    name: "Tactics Fundamentals",
    code: "TF",
    price: 25,
    level: "Beginner",
    summary: "Forks, pins, skewers, discovered attacks and double attacks: short lessons on each idea, then training positions you solve on the board.",
    description: "An interactive course on the five basic tactical ideas. Each idea gets a short lesson with board examples, followed by training positions where you play the winning moves yourself.",
    confirmationPath: "/thank-you/tactics-fundamentals/",
    checkoutUrl: ""
  },
  "checkmate-patterns": {
    name: "Checkmate Patterns",
    code: "CM",
    price: 29,
    level: "Beginner",
    summary: "The common mating patterns, how to recognize them, and training positions where you deliver the mate on the board.",
    description: "A pattern-by-pattern course on the checkmates that come up again and again in real games, with training positions where you find and play the mate yourself.",
    confirmationPath: "/thank-you/checkmate-patterns/",
    checkoutUrl: ""
  },
  "opening-repertoire-black": {
    name: "Opening Repertoire for Black",
    code: "RB",
    price: 45,
    level: "Intermediate",
    summary: "A complete repertoire for Black against White’s main first moves, explained by plans, with a line explorer and a drill mode.",
    description: "A complete opening repertoire for Black, presented in an interactive line explorer that explains the plan behind every move, with a drill mode where you play Black’s side of each line.",
    confirmationPath: "/thank-you/opening-repertoire-black/",
    checkoutUrl: ""
  },
  "opening-repertoire-white": {
    name: "Opening Repertoire for White",
    code: "RW",
    price: 49,
    level: "Intermediate",
    summary: "A complete 1.e4 repertoire for White with the main plans and pawn structures, in a line explorer with a drill mode.",
    description: "A complete repertoire for White built around 1.e4, presented in an interactive line explorer that explains the plan behind every move, with a drill mode where you play White’s side of each line.",
    confirmationPath: "/thank-you/opening-repertoire-white/",
    checkoutUrl: ""
  },
  "endgame-essentials": {
    name: "Endgame Essentials",
    code: "EE",
    price: 39,
    level: "Beginner to intermediate",
    summary: "King and pawn endings, basic rook endings and key theoretical positions, with practice where you convert or hold against exact replies.",
    description: "The endgame knowledge every player needs, taught through short lessons and theoretical positions, with a practice mode where you must win or hold the position against the trainer’s exact replies.",
    confirmationPath: "/thank-you/endgame-essentials/",
    checkoutUrl: ""
  },
  "positional-play-strategy": {
    name: "Positional Play & Strategy",
    code: "PS",
    price: 55,
    level: "Intermediate to advanced",
    summary: "Pawn structures, outposts, good and bad pieces and quiet moves, with exercises on the board.",
    description: "A course on the quiet side of chess: pawn structures, piece activity, weak squares and planning, with board exercises where you identify structural features and find the strongest quiet moves.",
    confirmationPath: "/thank-you/positional-play-strategy/",
    checkoutUrl: ""
  },
  "calculation-visualization": {
    name: "Calculation & Visualization Training",
    code: "CV",
    price: 65,
    level: "Intermediate to advanced",
    summary: "Forcing lines to calculate on the board, and visualization exercises where you follow moves without the board moving.",
    description: "Structured training in calculating forcing lines and visualizing positions: exercises where you read a sequence of moves without the board updating and answer questions about the final position, growing harder across the course.",
    confirmationPath: "/thank-you/calculation-visualization/",
    checkoutUrl: ""
  },
  "complete-training-library": {
    name: "Complete Training Library",
    code: "AC",
    price: 145,
    level: "Beginner to advanced",
    summary: "All seven courses, unlocked by a single license.",
    description: "All seven Fiancho Chess training programs in one purchase, unlocked by a single license code.",
    confirmationPath: "/thank-you/complete-training-library/",
    checkoutUrl: "",
    includes: [
      "tactics-fundamentals",
      "checkmate-patterns",
      "opening-repertoire-black",
      "opening-repertoire-white",
      "endgame-essentials",
      "positional-play-strategy",
      "calculation-visualization"
    ]
  }
};
