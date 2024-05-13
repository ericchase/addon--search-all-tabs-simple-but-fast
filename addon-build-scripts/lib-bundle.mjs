import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { createDirectory, toSnakeCase } from './lib.mjs';

/**
 * @param {string} browser
 * @param {any} manifest
 */
export async function bundle(browser, manifest) {
  await createDirectory(`./release/${browser}`);
  // create archive
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
  const output = createWriteStream(`./release/${browser}/${toSnakeCase(manifest.name)}-v${manifest.version}.zip`);
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
