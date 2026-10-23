# scitools

A small, dependency-free web workspace for research mind maps and radar charts.

## Tools

- **Mind maps:** edit titles and notes directly on the canvas. Add connected ideas with a card's **+ Branch** button or press Tab while the card itself is focused. Click **Link**, then another idea, to connect them. Double-click empty canvas space for a new idea. Drag card padding or its grip to reposition it; drag the background to pan. Ctrl/Cmd + mouse wheel zooms around the pointer. Double-click a connection to remove it. Undo/redo buttons and Ctrl/Cmd+Z restore edits, movements, additions and deletions. Research references and colours remain available in the sidebar.
- **Radar charts:** add and name as many variables as needed, with a 0–10 slider in 0.1 steps or a numeric field for more precise decimal values. At least three axes are required. All axes and their values appear on the chart. The chart grows with the variable count and label length.
- **Export:** tightly cropped SVGs and high-resolution PNGs with white or transparent backgrounds. Include or omit research from mind map exports. PNGs default to 3× resolution; exceptionally large images are automatically reduced to fit browser canvas limits. Use SVG for lossless scaling of very large projects.
- **Local work:** autosave in browser storage and JSON project backups. No account, tracking, API keys, backend or external runtime dependencies. Save project files for durable backups; clearing browser storage removes autosaved work.

## Run locally

Requires Node.js 20+ for the build/tests and Python 3 for the development server.

```sh
npm test
npm run build
npm start
```

Open http://localhost:8145. Serve through HTTP rather than opening the HTML as a local file, because ES modules need an HTTP origin.

## Deploy to GitHub Pages

The repository includes `.github/workflows/pages.yml`, which tests, builds and deploys the static `dist/` folder on pushes to `main`.

1. Create a public repository named `scitools` and push this project to `main`.
2. In repository Settings → Pages, set the source to **GitHub Actions**.
3. Run the **Deploy scitools to GitHub Pages** workflow, or push a new commit.

Live site: https://blahajcoding.github.io/scitools/

Repository: https://github.com/blahajcoding/scitools

## Documents

Use PNG with the 3× preset for Word, Google Docs and slide decks. Use SVG when your document editor supports it, especially for large maps or charts. The exported graphic includes the document title; app controls, canvas dots and selection outlines are excluded. Transparent mode removes the page background but keeps card colours.

## Tests and current verification

`npm test` covers XML escaping, decimal values, long labels, variable counts up to 200, growing export bounds, research inclusion, empty maps, safe colours, branch placement, connection validation and boundaries, undo/redo and removal of the promotional heading. `npm run build` copies the static files without a bundler.

Browser interaction and actual PNG download testing remain pending until Chromium's missing system libraries are available in the development sandbox. The repository is deployed through GitHub Actions; build and HTTP asset checks have passed.
