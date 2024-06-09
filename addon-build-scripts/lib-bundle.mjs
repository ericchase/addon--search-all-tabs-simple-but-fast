import { Config, createDirectory, deleteFile, run, toSnakeCase } from './lib.mjs';

/**
 * @param {string} browser
 * @param {Config} manifest
 */
export async function bundle(browser, manifest) {
  await createDirectory(`./release/${browser}`);
  const archive_name = `${toSnakeCase(manifest.get('name'))}-v${manifest.get('version')}.zip`;
  await deleteFile(`./release/${browser}/${archive_name}`);
  run('7z', ['a', '-tzip', `./release/${browser}/${archive_name}`, `./build/${browser}/*`]);
}
