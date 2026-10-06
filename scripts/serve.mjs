import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { context } from 'esbuild';

if (!process.argv.includes('--out')) {
  const bundler = await context({ entryPoints: ['app.js'], outfile: 'runtime.js', bundle: true, format: 'esm', target: 'es2022', legalComments: 'eof' });
  await bundler.rebuild();
  await bundler.watch();
}

const root = resolve(process.argv.includes('--out') ? 'out' : '.');
const preferred = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, `http://${req.headers.host}`).pathname,
    );
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(`${root}/`)) throw new Error('Invalid path');
    const info = await stat(path);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, {
      'Content-Type': `${types[extname(path)] || 'application/octet-stream'}; charset=utf-8`,
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

function listen(port) {
  server.listen(port, '127.0.0.1', () => {
    console.log(`Cockpit ready at http://127.0.0.1:${port}`);
    if (port !== preferred) {
      console.log(`(Port ${preferred} was busy; using ${port} instead.)`);
    }
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (process.env.PORT) {
      console.error(
        `Port ${preferred} is already in use. Stop the other process or run: PORT=<other> npm run dev`,
      );
      process.exit(1);
    }
    listen(preferred + 1);
    return;
  }
  console.error(err);
  process.exit(1);
});

listen(preferred);
