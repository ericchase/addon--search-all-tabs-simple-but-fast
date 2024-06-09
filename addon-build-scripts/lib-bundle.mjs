import node_fs from 'node:fs/promises';

import { Config, createDirectory, run, toSnakeCase } from './lib.mjs';

/**
 * @param {string} browser
 * @param {Config} manifest
 */
export async function bundle(browser, manifest) {
  await createDirectory(`./release/${browser}`);
  const archive_name = `${toSnakeCase(manifest.get('name'))}-v${manifest.get('version')}.zip`;
  await node_fs.rm(`./release/${browser}/${archive_name}`);
  run('7z', ['a', '-tzip', `./release/${browser}/${archive_name}`, `./build/${browser}/*`]);
}
