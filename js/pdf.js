/*
  Fiancho Chess — a minimal PDF writer for order confirmations (no dependencies).
  Produces a single-page PDF 1.4 with Helvetica text and clickable links.
*/
const WIN_ANSI = { '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '—': 0x97, '–': 0x96, '·': 0xb7, '…': 0x85, ' ': 0x20 };

function encodeText(s) {
  let out = '';
  for (const ch of String(s)) {
    let code = ch.charCodeAt(0);
    if (WIN_ANSI[ch] !== undefined) code = WIN_ANSI[ch];
    else if (code > 255) code = 0x3f; // '?'
    if (ch === '(' || ch === ')' || ch === '\\') out += '\\' + ch;
    else if (code < 32 || code > 126) out += '\\' + code.toString(8).padStart(3, '0');
    else out += String.fromCharCode(code);
  }
  return out;
}

// Helvetica widths (per 1000 units) for wrapping; approximate for characters outside ASCII.
const W = { ' ': 278, '.': 278, ',': 278, ':': 278, '-': 333, '/': 278, '(': 333, ')': 333, i: 222, l: 222, j: 222, t: 278, f: 278, r: 333, I: 278, m: 833, w: 722, M: 833, W: 944 };
const charWidth = (ch, bold) => (W[ch] || (ch >= 'A' && ch <= 'Z' ? 667 : ch >= '0' && ch <= '9' ? 556 : 556)) * (bold ? 1.05 : 1);
export function textWidth(s, size, bold = false) {
  let w = 0;
  for (const ch of String(s)) w += charWidth(ch, bold);
  return (w / 1000) * size;
}

function wrap(text, size, maxWidth, bold) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (textWidth(test, size, bold) > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/*
  blocks: [{ text, size, bold, gap, color: [r,g,b], link }]
  Returns a Uint8Array containing the PDF.
*/
export function buildPdf(blocks, { title = 'Document' } = {}) {
  const pageW = 612, pageH = 792, margin = 56, maxW = pageW - margin * 2;
  let y = pageH - margin;
  const ops = [];
  const links = [];
  for (const b of blocks) {
    const size = b.size || 11;
    y -= b.gap || 0;
    if (b.rule) { ops.push(`0.73 0.54 0.17 RG 1 w ${margin} ${y.toFixed(1)} m ${pageW - margin} ${y.toFixed(1)} l S`); y -= 8; continue; }
    const lines = wrap(b.text, size, maxW, b.bold);
    for (const line of lines) {
      y -= size * 1.35;
      const [r, g, bl] = b.color || [0.1, 0.14, 0.12];
      ops.push(`BT /${b.bold ? 'F2' : 'F1'} ${size} Tf ${r} ${g} ${bl} rg ${margin} ${y.toFixed(1)} Td (${encodeText(line)}) Tj ET`);
      if (b.link) links.push({ x: margin, y: y - 2, w: textWidth(line, size, b.bold), h: size + 3, url: b.link });
    }
  }
  const content = ops.join('\n');
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  const annotRefs = links.map((_, i) => `${7 + i} 0 R`).join(' ');
  objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R${links.length ? ` /Annots [${annotRefs}]` : ''} >>`;
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[6] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  links.forEach((l, i) => {
    objects[7 + i] = `<< /Type /Annot /Subtype /Link /Rect [${l.x.toFixed(1)} ${l.y.toFixed(1)} ${(l.x + l.w).toFixed(1)} ${(l.y + l.h).toFixed(1)}] /Border [0 0 0] /A << /S /URI /URI (${encodeText(l.url)}) >> >>`;
  });
  const infoId = objects.length;
  objects[infoId] = `<< /Title (${encodeText(title)}) /Producer (Fiancho Chess) >>`;

  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  const offsets = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Every character in `pdf` is a single byte (0-255) by construction.
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

export function confirmationBlocks({ productName, price, dateText, orderRef, code, origin, supportEmail, startUrl }) {
  const green = [0.11, 0.29, 0.21], muted = [0.3, 0.35, 0.32];
  const blocks = [
    { text: 'Fiancho Chess', size: 20, bold: true, color: green },
    { text: 'Order confirmation', size: 13, color: muted, gap: 2 },
    { rule: true, gap: 10 },
    { text: 'Your order is complete and your course has been delivered.', size: 14, bold: true, gap: 6 },
    { text: 'Your license code is below. It was activated in the browser where you completed your purchase.', size: 11, gap: 4 },
    { text: `Product: ${productName}`, size: 12, bold: true, gap: 14 },
    { text: `Price: $${price} USD (any applicable taxes were shown at checkout)`, size: 11, gap: 2 },
    { text: `Date and time: ${dateText}`, size: 11, gap: 2 }
  ];
  if (orderRef) blocks.push({ text: `Order reference: ${orderRef}`, size: 11, gap: 2 });
  blocks.push(
    { text: 'License code', size: 11, bold: true, gap: 14, color: muted },
    { text: code, size: 18, bold: true, gap: 2 },
    { text: 'How to start training', size: 12, bold: true, gap: 16 },
    { text: `Open the Training Room: ${startUrl}`, size: 11, gap: 2, link: startUrl },
    { text: 'To use the course on another device, open the Training Room or the course’s product page there and enter the same license code.', size: 11, gap: 4 },
    { text: 'Your licenses and progress are stored only in your own browser. Use Export backup in the Training Room to keep a copy.', size: 11, gap: 4 },
    { text: 'Policies', size: 12, bold: true, gap: 16 },
    { text: `Terms of Service: ${origin}/terms.html`, size: 11, gap: 2, link: `${origin}/terms.html` },
    { text: `Refund Policy: ${origin}/refund-policy.html`, size: 11, gap: 2, link: `${origin}/refund-policy.html` },
    { text: `Delivery Policy: ${origin}/delivery-policy.html`, size: 11, gap: 2, link: `${origin}/delivery-policy.html` },
    { text: 'Support', size: 12, bold: true, gap: 16 },
    { text: supportEmail ? `Email ${supportEmail} or use the Contact page: ${origin}/contact.html. Please include your order number and the email address you used at checkout.` : `Use the Contact page: ${origin}/contact.html. Please include your order number and the email address you used at checkout.`, size: 11, gap: 2, link: `${origin}/contact.html` }
  );
  return blocks;
}
