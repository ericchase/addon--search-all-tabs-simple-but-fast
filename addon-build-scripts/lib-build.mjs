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
  const paths = /**@type{Record<string,string[]>}*/ (buildConfig.get('paths'));
  for (const base of Object.keys(paths)) {
    for (const path of paths[base]) {
      await createDirectory(`./build/${browser}/${path}`, true);
      try {
        await node_fs.copyFile(`./${base}/${path}`, `./build/${browser}/${path}`);
      } catch (err) {}
    }
  }
}
