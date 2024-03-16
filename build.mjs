import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import archiver from 'archiver';

JSON.merge = function (text_a, text_b) {
  const obj_a = JSON.parse(text_a);
  const obj_b = JSON.parse(text_b);

  return JSON.stringify({ ...obj_a, ...obj_b });
};

const version_obj = JSON.parse(await readFile('./version.json', { encoding: 'utf8' }));
version_obj.patch++;
await writeFile('./version.json', JSON.stringify(version_obj), { encoding: 'utf8' });
const version = `${version_obj.major}.${version_obj.minor}.${version_obj.patch}`;

const manifest_core = JSON.parse(await readFile('./src/manifest.json', { encoding: 'utf8' }));
manifest_core.version = version;

const paths = [
  'images/icon-128.png',
  'images/icon-16.png',
  'images/icon-32.png',
  'images/icon-48.png',
  'index.css',
  'normalize.css',
  'index.html',
  'helpers.js',
  'index.js',
  'service-worker.js',
];

await rm('./build/', { recursive: true, force: true });

/** @param {string} browser */
async function build(browser) {
  try {
    const manifest_browser = JSON.parse(await readFile(`./src/${browser}/manifest.json`, { encoding: 'utf8' }));
    const manifest_final = JSON.stringify({ ...manifest_core, ...manifest_browser });
    await mkdir(dirname(`./build/${browser}/manifest.json`), { recursive: true });
    await writeFile(`./build/${browser}/manifest.json`, manifest_final, { encoding: 'utf8' });
    for (const path of paths) {
      await mkdir(dirname(`./build/${browser}/${path}`), { recursive: true });
      await copyFile(`./src/${path}`, `./build/${browser}/${path}`);
    }
  } catch (err) {
    console.log(err);
  }
}

/** @param {string} browser */
async function zip(browser) {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.log(err);
    } else {
      throw err;
    }
  });
  archive.on('error', function (err) {
    throw err;
  });
  const output = createWriteStream(`./release/${browser}/search-all-tabs-for-text-v${version}.zip`);
  output.on('close', function () {
    console.log(`${browser}:`, archive.pointer() + ' total bytes');
  });
  output.on('end', function () {
    console.log('Data has been drained');
  });
  archive.pipe(output);
  archive.directory(`./build/${browser}`, false);
  await archive.finalize();
}

const browsers = [
  'Chrome', //
  'Firefox',
];

for (const browser of browsers) {
  build(browser).then(() => {
    zip(browser);
  });
}
