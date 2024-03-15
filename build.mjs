import { dirname } from 'node:path';
import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';

JSON.merge = function (text_a, text_b) {
  const obj_a = JSON.parse(text_a);
  const obj_b = JSON.parse(text_b);

  return JSON.stringify({ ...obj_a, ...obj_b });
};

const manifest_core = await readFile('./src/manifest.json', { encoding: 'utf8' });

const paths = [
  'images/icon-128.png', //
  'images/icon-16.png',
  'images/icon-32.png',
  'images/icon-48.png',
  'index.css',
  'index.html',
  'index.js',
  'service-worker.js',
];

await rm('./build/', { recursive: true, force: true });

for (const browser of ['Chrome', 'Firefox']) {
  readFile(`./src/${browser}/manifest.json`, { encoding: 'utf8' }).then((manifest_browser) => {
    writeFile(`./build/${browser}/manifest.json`, JSON.merge(manifest_core, manifest_browser), { encoding: 'utf8', flush: true });
  });

  for (const path of paths) {
    Promise.allSettled([mkdir(dirname(`./build/${browser}/${path}`), { recursive: true })]).then(() => {
      copyFile(`./src/${path}`, `./build/${browser}/${path}`);
    });
  }
}
