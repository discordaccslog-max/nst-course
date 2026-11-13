/*
  Fiancho Chess — license codes (runs entirely in the browser).

  Format: FIAN-PC-RRRR-RRRR-RRRC
    FIAN  fixed prefix
    PC    two-character product code (see js/products.js)
    R     11 random characters (derived from the order reference when the payment provider supplies one)
    C     check character

  Alphabet: 31 characters with no look-alikes (no 0/O, no 1/I/L). Because 31 is prime and every
  character carries a distinct non-zero weight (1..14), the check character catches every
  single-character error and every swap of two adjacent characters.
*/
export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const PREFIX = 'FIAN';
const RANDOM_LENGTH = 11;
const BODY_LENGTH = 2 + RANDOM_LENGTH + 1;
const MOD = ALPHABET.length; // 31, prime
const INV_14 = 20; // 14 * 20 = 280 = 9 * 31 + 1

export const ORDER_PARAMS = ['session_id', 'order_id', 'order', 'transaction_id', 'txn_id', 'token'];

function products() {
  return globalThis.SITE_PRODUCTS || {};
}

export function productByCode(code) {
  const list = products();
  for (const slug of Object.keys(list)) if (list[slug].code === code) return { slug, ...list[slug] };
  return null;
}

export function productBySlug(slug) {
  const p = products()[slug];
  return p ? { slug, ...p } : null;
}

function value(ch) {
  return ALPHABET.indexOf(ch);
}

// Check character for the 13 characters of product code + random section.
export function checkChar(payload) {
  let sum = 0;
  for (let i = 0; i < payload.length; i++) sum += (i + 1) * value(payload[i]);
  const c = (((-sum * INV_14) % MOD) + MOD) % MOD;
  return ALPHABET[c];
}

function weightedSum(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (i + 1) * value(body[i]);
  return sum % MOD;
}

export function format(body) {
  return `${PREFIX}-${body.slice(0, 2)}-${body.slice(2, 6)}-${body.slice(6, 10)}-${body.slice(10, 14)}`;
}

// Turns whatever the buyer typed into the canonical character string (or null if it can't be one).
export function normalize(input) {
  let s = String(input || '').toUpperCase().replace(/[\s\-_.‐-―]/g, '');
  if (s.length >= 4) {
    // The prefix is fixed, so forgive look-alikes typed in it (F1AN, FLAN).
    const prefix = s.slice(0, 4).replace(/[1L|]/g, 'I').replace(/0/g, 'O');
    s = prefix + s.slice(4);
  }
  return s;
}

export function validate(input) {
  const s = normalize(input);
  if (!s) return { ok: false, reason: 'empty', message: 'Enter your license code.' };
  if (!s.startsWith(PREFIX)) return { ok: false, reason: 'prefix', message: 'License codes start with FIAN. Please check the code and try again.' };
  const body = s.slice(PREFIX.length);
  if (body.length !== BODY_LENGTH) return { ok: false, reason: 'length', message: 'That code is the wrong length. A license code looks like FIAN-TF-K7Q9-W3XM-4PRC.' };
  for (const ch of body) {
    if (value(ch) < 0) return { ok: false, reason: 'chars', message: `The character "${ch}" never appears in license codes. Please check the code and try again.` };
  }
  if (weightedSum(body) !== 0) return { ok: false, reason: 'checksum', message: 'That code doesn’t check out. One character may be mistyped or two swapped. Please check it and try again.' };
  const product = productByCode(body.slice(0, 2));
  if (!product) return { ok: false, reason: 'product', message: 'That code doesn’t match any Fiancho Chess course. Please check it and try again.' };
  return { ok: true, code: format(body), body, product };
}

function mapBytes(bytes, out, need) {
  for (const b of bytes) {
    if (out.length >= need) break;
    if (b < MOD * 8) out.push(ALPHABET[b % MOD]); // rejection sampling keeps the mapping uniform
  }
  return out;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

// Codes never spell these (checked across the whole code, so words split by dashes are caught too).
const AVOID = /NSFW|SEX|XXX|FUCK|FUK|SHT|CUNT|DCK|DICK|COCK|PUSSY|NAZ|KKK|PORN|FAG|TWAT|ANAL|ANUS|CUM|NUDE|KYS|RAPE|ASS|WTF|STD|HATE|KXLL|DEAD|DRUG/;
export const isAcceptable = (code) => !AVOID.test(code.replace(/-/g, ''));

// Random section: from the order reference when present (same order -> same code), otherwise random.
// A section that would make an unsuitable code is replaced by the next one (still deterministic per order).
export async function randomSection(productCode, orderRef) {
  for (let attempt = 0; ; attempt++) {
    const out = [];
    if (orderRef) {
      let round = attempt * 8;
      while (out.length < RANDOM_LENGTH) mapBytes(await sha256(`fiancho-chess|${productCode}|${String(orderRef).trim()}|${round++}`), out, RANDOM_LENGTH);
    } else {
      while (out.length < RANDOM_LENGTH) mapBytes(crypto.getRandomValues(new Uint8Array(32)), out, RANDOM_LENGTH);
    }
    const section = out.join('');
    const payload = productCode + section;
    if (isAcceptable(PREFIX + payload + checkChar(payload))) return section;
  }
}

export async function generate(slug, orderRef = null) {
  const product = productBySlug(slug);
  if (!product) throw new Error(`Unknown product: ${slug}`);
  const payload = product.code + (await randomSection(product.code, orderRef));
  return format(payload + checkChar(payload));
}

// Reads the first order reference the payment provider added to the URL, if any.
export function orderRefFrom(search) {
  const params = new URLSearchParams(search);
  for (const key of ORDER_PARAMS) {
    const v = params.get(key);
    if (v && v.trim()) return { key, value: v.trim() };
  }
  return null;
}
