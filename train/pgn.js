/*
  Fiancho Chess — PGN export of a course's positions.
  Training positions, worked examples, visualization sequences, endgame practice and structure
  exercises are exported with their starting FEN; opening repertoires are exported as games with
  every branch as a variation. Comments carry the explanations.
*/
const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
const tag = (k, v) => `[${k} "${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;

function header(course, round, fen) {
  const tags = [
    tag('Event', `Fiancho Chess: ${course.name}`),
    tag('Site', 'Fiancho Chess'),
    tag('Date', '????.??.??'),
    tag('Round', round),
    tag('White', '?'),
    tag('Black', '?'),
    tag('Result', '*')
  ];
  if (fen) { tags.push(tag('SetUp', '1')); tags.push(tag('FEN', fen)); }
  tags.push(tag('Annotator', 'Fiancho Chess'));
  return tags.join('\n');
}

// Move text for a list of SAN moves from a FEN, with optional comments after each move.
function moveText(fen, sans, comments = []) {
  const parts = fen.split(' ');
  let color = parts[1] || 'w';
  let num = Number(parts[5] || 1);
  const out = [];
  sans.forEach((san, i) => {
    if (color === 'w') out.push(`${num}. ${san}`);
    else out.push(i === 0 ? `${num}... ${san}` : san);
    if (comments[i]) out.push(`{${clean(comments[i])}}`);
    if (color === 'b') num++;
    color = color === 'w' ? 'b' : 'w';
  });
  return out.join(' ');
}

function treeText(nodes, color, num, first) {
  // Main line is the first child; other children become variations.
  if (!nodes || !nodes.length) return '';
  const [main, ...alts] = nodes;
  const prefix = (forceNumber) => (color === 'w' ? `${num}. ` : forceNumber ? `${num}... ` : '');
  let s = `${prefix(first)}${main.san} {${clean(main.note)}}`;
  for (const alt of alts) s += ` (${prefix(true)}${alt.san} {${clean(alt.note)}}${alt.children.length ? ' ' + treeText(alt.children, color === 'w' ? 'b' : 'w', color === 'b' ? num + 1 : num, true) : ''})`;
  const rest = treeText(main.children, color === 'w' ? 'b' : 'w', color === 'b' ? num + 1 : num, alts.length > 0);
  return rest ? `${s} ${rest}` : s;
}

export function coursePgn(course) {
  const games = [];
  for (const section of course.sections) {
    let n = 0;
    for (const item of section.items) {
      n++;
      const round = `${section.title} ${n}`;
      if (item.type === 'puzzle') {
        // The summary joins the last move's comment: PGN parsers reject two comments in a row.
        const notes = [...item.notes];
        notes[notes.length - 1] = `${notes[notes.length - 1]} ${item.summary}`;
        games.push(`${header(course, round, item.fen)}\n\n{${clean(item.prompt)}} ${moveText(item.fen, item.sans, notes)} *`);
      } else if (item.type === 'example') {
        const notes = item.moves.map((m) => m.note);
        if (item.summary) notes[notes.length - 1] = `${notes[notes.length - 1]} ${item.summary}`;
        games.push(`${header(course, round, item.fen)}\n\n{${clean(item.title)}} ${moveText(item.fen, item.moves.map((m) => m.san), notes)} *`);
      } else if (item.type === 'visual') {
        const sans = item.moves.map((m) => m.replace(/^\d+\.(\.\.)?/, ''));
        games.push(`${header(course, round, item.fen)}\n\n{${clean(item.question)} Answer: ${clean(item.choices[item.answer])}.} ${moveText(item.fen, sans)} {${clean(item.explanation)}} *`);
      } else if (item.type === 'practice') {
        games.push(`${header(course, round, item.fen)}\n\n{${clean(item.prompt)} ${clean(item.explanation)}} *`);
      } else if (item.type === 'structure') {
        const answer = item.mode === 'square' ? item.answers.join(', ') : item.choices[item.answer];
        games.push(`${header(course, round, item.fen)}\n\n{${clean(item.question)} Answer: ${clean(answer)}. ${clean(item.explanation)}} *`);
      } else if (item.type === 'explorer') {
        games.push(`${header(course, section.title, null)}\n\n{${clean(section.paras && section.paras[0])}} ${treeText(item.tree, 'w', 1, true)} *`);
      }
    }
  }
  return games.join('\n\n') + '\n';
}

export function downloadText(filename, text, type = 'application/x-chess-pgn') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
