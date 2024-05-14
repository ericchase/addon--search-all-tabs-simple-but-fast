import { build } from './lib-build.mjs';
import { bundle } from './lib-bundle.mjs';
import { deleteDirectory, getSemanticVersion, mergeConfigs, readConfig, run, subConfig, writeFile } from './lib.mjs';

await run('bun', ['run', 'format']);
await deleteDirectory('./build/');

const buildConfig = await readConfig('./build-config.json');
const bundleConfig = await readConfig('./bundle-config.json');
const coreManifest = await readConfig('./src/manifest.json');

// await incrementVersionPatch();
coreManifest.set('version', await getSemanticVersion());

for (const browser of /**@type{string[]}*/ (buildConfig.get('browsers'))) {
  (async function () {
    const browserManifest = await readConfig(`./src/${browser}/manifest.json`);
    const buildManifest = mergeConfigs(coreManifest, browserManifest);
    const bundleManifest = mergeConfigs(buildManifest, await subConfig(bundleConfig, browser));
    await build(buildConfig, browser, bundleManifest);
    await bundle(browser, bundleManifest);
    // cleanup
    writeFile(`./build/${browser}/manifest.json`, buildManifest.toJSON());
  })();
}
