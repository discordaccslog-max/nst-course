// Shared drawing helpers: original SVG chess pieces and the animated hero board.
const r = (n) => Math.round(n * 100) / 100;

const BASE = '<rect x="22" y="76" width="56" height="11" rx="4"/>';
const SYMBOLS = {
  p: `<circle cx="50" cy="30" r="13"/><rect x="35" y="43" width="30" height="8" rx="3"/><path d="M41 50h18l9 27H32z"/>${BASE}`,
  r: `<path d="M27 16h11v8h7v-8h10v8h7v-8h11v20H27z"/><path d="M33 35h34l-2 32H35z"/><path d="M30 65h40l6 12H24z"/>${BASE}`,
  n: `<path d="M30 77c1-14 7-22 16-29-7 2-13 4-19 9-6-2-9-8-6-14 6-10 15-18 22-24l2-9 6 7c15 3 25 17 25 36 0 9-1 17-2 24z"/>${BASE}<circle cx="41" cy="31" r="3.4" fill="currentColor"/><circle cx="26.5" cy="45" r="1.9" fill="currentColor"/>`,
  b: `<circle cx="50" cy="14" r="6"/><path d="M50 20c-11 9-16 19-14 29 1 4 3 7 5 8h18c2-1 4-4 5-8 2-10-3-20-14-29z"/><rect x="34" y="55" width="32" height="8" rx="3"/><path d="M40 62h20l8 15H32z"/>${BASE}<rect x="49" y="27" width="4" height="15" rx="2" transform="rotate(38 51 34.5)" fill="currentColor"/>`,
  q: `<circle cx="18" cy="29" r="5.5"/><circle cx="34" cy="19" r="5.5"/><circle cx="50" cy="14" r="5.5"/><circle cx="66" cy="19" r="5.5"/><circle cx="82" cy="29" r="5.5"/><path d="M18 32l14 32h36l14-32-14 14-2-24-10 20-6-24-6 24-10-20-2 24z"/><rect x="30" y="62" width="40" height="8" rx="3"/><path d="M33 69h34l7 8H26z"/>${BASE}`,
  k: `<rect x="46" y="3" width="8" height="22" rx="2"/><rect x="38" y="9" width="24" height="8" rx="2"/><path d="M50 25c-14 0-23 9-21 21l4 17h34l4-17c2-12-7-21-21-21z"/><rect x="30" y="61" width="40" height="8" rx="3"/><path d="M33 68h34l7 9H26z"/>${BASE}`
};

const sprite = () =>
  `<svg class="sprite" aria-hidden="true" focusable="false"><defs>${Object.entries(SYMBOLS)
    .map(([k, v]) => `<symbol id="s-${k}" viewBox="0 0 100 100">${v}</symbol>`)
    .join('')}</defs></svg>`;

const pieceUses = (type) =>
  `<use href="#s-${type}" class="po" width="100" height="100"/><use href="#s-${type}" class="pf" width="100" height="100"/>`;

const pieceAt = (type, color, x, y, size) =>
  `<g class="pc pc--${color}" transform="translate(${r(x)} ${r(y)}) scale(${r(size / 100)})">${pieceUses(type)}</g>`;

function parseFen(fen) {
  const [placement, side] = fen.split(' ');
  const pieces = [];
  placement.split('/').forEach((row, ri) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else {
        pieces.push({ type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b', file: f, row: ri });
        f += 1;
      }
    }
  });
  return { pieces, side };
}

function heroBoard() {
  const start = [];
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const files = 'abcdefgh';
  for (const color of ['b', 'w']) {
    back.forEach((t, i) => {
      const id = t === 'q' || t === 'k' ? `${color}${t}` : `${color}${t}-${files[i]}`;
      start.push({ id, type: t, color, sq: `${files[i]}${color === 'w' ? 1 : 8}` });
    });
    for (let i = 0; i < 8; i++) start.push({ id: `${color}p-${files[i]}`, type: 'p', color, sq: `${files[i]}${color === 'w' ? 2 : 7}` });
  }
  const finalSq = { 'wp-e': 'e4', 'bp-e': 'e5', 'wb-f': 'c4', 'bn-b': 'c6', wq: 'f7', 'bn-g': 'f6' };
  const xy = (sq) => [(sq.charCodeAt(0) - 97) * 100, (8 - Number(sq[1])) * 100];
  let squares = '';
  for (let row = 0; row < 8; row++) {
    for (let f = 0; f < 8; f++) {
      squares += `<rect x="${f * 100}" y="${row * 100}" width="100" height="100" class="${(f + row) % 2 === 0 ? 'sq-l' : 'sq-d'}"/>`;
    }
  }
  let coords = '';
  for (let i = 0; i < 8; i++) {
    coords += `<text x="${i * 100 + 50}" y="836" text-anchor="middle" class="hb-coord">${files[i]}</text>`;
    coords += `<text x="-22" y="${i * 100 + 56}" text-anchor="middle" class="hb-coord">${8 - i}</text>`;
  }
  const pieces = start
    .map((p) => {
      const sq = finalSq[p.id] || p.sq;
      const [x, y] = xy(sq);
      const hidden = p.id === 'bp-f' ? ';opacity:0' : '';
      return `<g class="hb-piece pc pc--${p.color}" data-piece="${p.id}" data-start="${p.sq}" style="transform:translate(${x}px, ${y}px)${hidden}"><g transform="translate(6 6) scale(.88)">${pieceUses(p.type)}</g></g>`;
    })
    .join('');
  return `<svg viewBox="-44 -6 852 856" role="img" aria-labelledby="hb-title hb-desc"><title id="hb-title">Chessboard showing a four-move checkmate</title><desc id="hb-desc">A chessboard on which White plays 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7, checkmate. The white queen on f7, protected by the bishop on c4, attacks the black king on e8.</desc>${coords}${squares}<rect x="-2" y="-2" width="804" height="804" class="hb-border"/><rect class="hb-hl is-on" data-hl="from" width="100" height="100" style="transform:translate(700px, 300px)"/><rect class="hb-hl is-on" data-hl="to" width="100" height="100" style="transform:translate(500px, 100px)"/><rect class="hb-mate is-on" data-mate x="404" y="4" width="92" height="92" rx="8"/><g class="hb-pieces">${pieces}</g></svg>`;
}

export { SYMBOLS, sprite, pieceUses, pieceAt, parseFen, heroBoard };
