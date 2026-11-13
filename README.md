# Fiancho Chess

Interactive chess training programs that run in the browser, unlocked with a license code.
The site is static (HTML, CSS, JavaScript) and is hosted on Vercel; nothing runs on a server.

## Adding checkout links

Edit `js/products.js` and paste each product's payment link into its `checkoutUrl`. The buy button,
with the "I agree to the Terms of Service and Refund Policy" checkbox, appears only once a link is set.

Configure the payment provider to send buyers to the product's confirmation page after payment
(`confirmationPath`, for example `/thank-you/tactics-fundamentals/`). If the provider can add the order
reference to that URL (`session_id`, `order_id`, `order`, `transaction_id`, `txn_id` or `token`),
the same order always produces the same license code.

## Support email

`js/site-config.js` holds `supportEmail`, shown on the Contact page, in the footer and in the Training Room.

## Commands

Requires Node.js 22+ and Google Chrome (used by the tests, previews and the kit).

| Command | What it does |
| --- | --- |
| `npm run courses` | Builds `train/courses/*.json` from the lessons, repertoires and verified positions |
| `npm run site` | Regenerates every HTML page from `tools/site/` |
| `npm run sw` | Rewrites `sw.js` so offline copies update when files change |
| `npm run build` | All three, in order |
| `npm test` | Unit tests and end-to-end browser tests (including every course on desktop and mobile) |
| `npm run kit` | Rebuilds `fulfillment-kit/` from the live site (not committed or deployed) |

Course content is checked at build time: `node tools/courses/verify.mjs` verifies training positions with
Stockfish and `node tools/courses/check-repertoire.mjs` checks the opening repertoires. The engine is a
development dependency only and is never shipped.

## Layout

- `train/` — the Training Room and course player (`app.js`, `board.js`), course data and endgame tables
- `js/` — licenses (`license.js`), on-device storage (`store.js`), product data, confirmation and product-page scripts
- `thank-you/<slug>/` — order confirmation pages (noindex, unlinked, not in the sitemap)
- `tools/` — site generator, course builder and verification, previews, kit (not deployed)
- `tests/` — unit tests (`node --test`) and end-to-end tests (Playwright with the installed Chrome)

Training positions come from the public-domain (CC0) puzzle database published by the Lichess project or were
composed for these courses; all explanations and annotations are original. The trainer uses
[chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), included in `js/vendor/`.
