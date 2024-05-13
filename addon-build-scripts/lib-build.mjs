import { copyFile } from 'node:fs/promises';
import { createDirectory, getPaths, writeJSONFile } from './lib.mjs';

/**
 * @param {string} browser
 * @param {any} manifest
 */
export async function build(browser, manifest) {
  await createDirectory(`./build/${browser}`);
  // merge specific browser manifest with core manifest
  await writeJSONFile(`./build/${browser}/manifest.json`, manifest);
  // copy files over
  for (const path of await getPaths()) {
    await createDirectory(`./build/${browser}/${path}`, true);
    try {
      await copyFile(`./src/${path}`, `./build/${browser}/${path}`);
    } catch (err) {}
  }
}
