import node_fs from 'node:fs/promises';

import { Config, createDirectory, writeFile } from './lib.mjs';

/**
 * @param {Config} buildConfig
 * @param {string} browser
 * @param {Config} manifest
 */
export async function build(buildConfig, browser, manifest) {
  await createDirectory(`./build/${browser}`);
  await writeFile(`./build/${browser}/manifest.json`, manifest.toJSON());
  // copy files over
  for (const path of /**@type{string[]}*/ (buildConfig.get('paths'))) {
    await createDirectory(`./build/${browser}/${path}`, true);
    try {
      await node_fs.copyFile(`./src/${path}`, `./build/${browser}/${path}`);
    } catch (err) {}
  }
}
