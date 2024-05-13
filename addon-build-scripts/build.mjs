import { build } from './lib-build.mjs';
import { deleteDirectory, getBrowsers, getSemanticVersion, mergeObjects, readJSONFile, run } from './lib.mjs';

await run('bun', ['run', 'format']);
await deleteDirectory('./build/');

const core_manifest = await readJSONFile('./src/manifest.json');
core_manifest.version = await getSemanticVersion();

for (const browser of await getBrowsers()) {
  (async function () {
    const browser_manifest = await readJSONFile(`./src/${browser}/manifest.json`);
    const build_manifest = mergeObjects(core_manifest, browser_manifest);
    await build(browser, build_manifest);
  })();
}
