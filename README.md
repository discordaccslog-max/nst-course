# NST COURSE

Static website for NST COURSE: self-paced chess training courses delivered as digital downloads (PDF workbook + PGN files).

Plain HTML, CSS and JavaScript. No build step. Served by GitHub Pages from the root of `main`.

## Adding contact details and checkout links

- **Support email:** set `supportEmail` in `js/site-config.js`. It then appears as a mailto link on the Contact page and in every footer. Left empty, the line doesn't render.
- **Checkout links:** set `checkoutUrl` for each product in `js/products.js`. That product's buy button appears automatically. Left empty, no button renders. Prices also live in this file.
