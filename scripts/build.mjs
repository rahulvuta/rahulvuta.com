import { cp, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

await rm('out', { recursive: true, force: true });
await mkdir('out', { recursive: true });
for (const file of ['index.html', 'resume.html', 'styles.css', 'cockpit3d.css', 'resume.css', 'resume.js', 'data.js', 'favicon.svg']) {
  await cp(file, `out/${file}`);
}
await build({ entryPoints: ['app.js'], outfile: 'out/runtime.js', bundle: true, minify: true, format: 'esm', target: 'es2022', legalComments: 'eof' });
await cp('out/runtime.js', 'runtime.js');
console.log('Static site ready in out/');
