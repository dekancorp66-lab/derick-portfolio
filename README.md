# Derick Kapele - Portfolio

Static site with no build step. Google Fonts and the portfolio photography load from external URLs.

## Run locally
Open `index.html` in a browser, or serve the folder:

    python -m http.server 8000

Then visit `http://localhost:8000`.

## Edit
- Page content and project details: `index.html`
- Colors, layout, and responsive styles: `css/style.css`
- Menu, dialogs, reveals, and local clock: `js/main.js`
- 3D particle portrait in the hero: `js/particles.js` (three.js from cdnjs). The photo it samples is embedded in `js/portrait-data.js`; to change the picture, replace that image data. If WebGL is unavailable, the original photo in `assets/` is shown instead.
- Replace the image URLs in `index.html` to use your own project photography.

## Deploy
Deploy the folder to Netlify, GitHub Pages, or Vercel.
