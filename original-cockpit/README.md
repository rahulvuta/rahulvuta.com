# rahulvuta.com (cockpit)

Static portfolio site. No build step required for local dev.

## Run locally

Run these as **separate** commands (do not paste the comment on the same line as `npm install`):

```bash
cd /Users/rahulvuta/Desktop/Projects/rahulvuta.com
npm install
npm run dev
```

Open the URL printed in the terminal (default **http://127.0.0.1:4173**).

If you see `EADDRINUSE`, either close the other terminal running `npm run dev`, or use another port:

```bash
PORT=3000 npm run dev
```

## Production build

```bash
npm run build
node scripts/serve.mjs --out
```

Serves the `out/` folder (same port rules as above).
