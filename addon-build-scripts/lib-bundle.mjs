import archiver from 'archiver';
import node_fs from 'node:fs';

import { Config, createDirectory, toSnakeCase } from './lib.mjs';

/**
 * @param {string} browser
 * @param {Config} manifest
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
  const output = node_fs.createWriteStream(`./release/${browser}/${toSnakeCase(manifest.get('name'))}-v${manifest.get('version')}.zip`);
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
