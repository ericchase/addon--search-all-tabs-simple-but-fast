import { build } from './lib-build.mjs';
import { bundle } from './lib-bundle.mjs';
import {
  deleteDirectory,
  getBrowsers,
  getBundleConfig,
  getSemanticVersion,
  incrementVersionPatch,
  mergeObjects,
  readJSONFile,
  run,
  writeJSONFile,
} from './lib.mjs';

await run('bun', ['run', 'format']);
await deleteDirectory('./build/');

await incrementVersionPatch();

const core_manifest = await readJSONFile('./src/manifest.json');
core_manifest.version = await getSemanticVersion();

for (const browser of await getBrowsers()) {
  (async function () {
    const browser_manifest = await readJSONFile(`./src/${browser}/manifest.json`);
    const build_manifest = mergeObjects(core_manifest, browser_manifest);
    const bundle_manifest = mergeObjects(build_manifest, getBundleConfig(browser));
    await build(browser, bundle_manifest);
    await bundle(browser, bundle_manifest);
    // cleanup
    writeJSONFile(`./build/${browser}/manifest.json`, build_manifest);
  })();
}
