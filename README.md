# Rahul Vuta’s cockpit portfolio

[Live site](https://rahul-vuta-portfolio.onrender.com/) · [GitHub repository](https://github.com/rahulvuta/rahulvuta.com)

The desktop site puts a seated camera inside a Three.js spacecraft. Moving the cursor turns the camera up to 56 degrees in either direction. The hull and consoles stay fixed around the visitor. Portfolio text and controls are DOM surfaces placed in the same scene.

On mobile, the site uses stacked consoles. The deployed site is static.

The first version is preserved in `original-cockpit/`, including its source, scripts, and built output. With the development server running, open `/original-cockpit/index.html` to compare it with the new version. The backup is not included in the new production build.

## Rendering budget

Camera interaction and thruster vibration render at up to 60 FPS. A settled cabin renders at 4 FPS while its DOM instruments and hologram keep animating. Alert lighting uses 30 FPS when the camera is settled. Hidden tabs stop rendering, pause CSS animations and the clock, and suspend ambient audio. Reduced-motion mode stops the settled render loop entirely.

WebGL resolution starts at a maximum DPR of 1.5. Sustained render cost or missed frames reduce it to 1.375, then 1.25; recovery uses longer thresholds to avoid flickering between resolutions. DOM text keeps its native resolution. Repeated cabin parts share geometry and use instancing, other opaque static parts are batched by material and depth, and static shadow maps are reused. Moving the physical thruster lever refreshes its shadow. The cabin retains its geometry, materials, antialiasing, lighting, and glow effects.

Append `?profile=1` to the local URL to collect asynchronous GPU timings. CPU timings, FPS, draw calls, DPR, render mode, and hidden-tab frame counts are available in the `data-render-profile` attribute on `#world`. GPU queries are disabled during normal use. No React state is used in the render loop.

The adaptive budget and scheduler tests run with `node --test tests/*.test.mjs`.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal, normally `http://127.0.0.1:4173`. The server watches JavaScript changes and rebuilds `runtime.js`. Refresh the browser to see changes.

To use another port:

```bash
PORT=3000 npm run dev
```

## Build for Render

```bash
npm run build
```

Publish `out/`. `render.yaml` configures a static site with this build command and automatic deployment from `main` once the repository is connected to Render.

The Render service `rahul-vuta-portfolio` is connected to `main` with deployment on each commit, build command `npm run build`, and publish directory `out`.

To inspect the production output locally:

```bash
node scripts/serve.mjs --out
```

Edit portfolio content in `data.js`. Cabin geometry and camera behavior live in `cockpit3d.js`; display styling is in `cockpit3d.css`. The generated `runtime.js` bundles the browser code and Three.js, so deployment does not need a Node server.
