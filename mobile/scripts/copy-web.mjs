import { cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd(), '..');
const out = resolve(process.cwd(), 'www');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const file of ['index.html', 'style.css', 'admin.css']) {
  await cp(join(root, file), join(out, file));
}
await cp(join(root, 'js'), join(out, 'js'), { recursive: true });

console.log('MySchool web assets copied to mobile/www');
