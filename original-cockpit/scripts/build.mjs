import { cp, mkdir, rm } from 'node:fs/promises';

await rm('out', { recursive: true, force: true });
await mkdir('out', { recursive: true });
for (const file of ['index.html', 'resume.html', 'styles.css', 'resume.css', 'app.js', 'resume.js', 'data.js', 'favicon.svg']) {
  await cp(file, `out/${file}`);
}
console.log('Static site ready in out/');
