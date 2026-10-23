# scitools

A small, dependency-free web workspace for research mind maps and radar charts.

## Tools

- **Mind maps:** draggable ideas, directed connections, research notes, source references and card colours. Zoom or fit the canvas. Link any ideas to create chains, branches or cycles.
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

The expected URL for the `blahajcoding` account is https://blahajcoding.github.io/scitools/. This is an expected destination, not a claim that deployment has completed.

## Documents

Use PNG with the 3× preset for Word, Google Docs and slide decks. Use SVG when your document editor supports it, especially for large maps or charts. The exported graphic includes the document title; app controls, canvas dots and selection outlines are excluded. Transparent mode removes the page background but keeps card colours.

## Tests and current verification

`npm test` covers XML escaping, decimal values, long labels, variable counts up to 200, growing export bounds, research inclusion, empty maps, safe colours and directed connections. `npm run build` copies the static files without a bundler.

Browser interaction and actual PNG download testing remain pending until Chromium's missing system libraries are available in the development sandbox. No GitHub repository or deployment is claimed by this local build.
