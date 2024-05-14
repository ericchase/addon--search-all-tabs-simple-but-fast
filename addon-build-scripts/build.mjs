import { build } from './lib-build.mjs';
import { deleteDirectory, getSemanticVersion, mergeConfigs, readConfig, run } from './lib.mjs';

await run('bun', ['run', 'format']);
await deleteDirectory('./build/');

const buildConfig = await readConfig('./build-config.json');
const coreManifest = await readConfig('./src/manifest.json');

coreManifest.set('version', await getSemanticVersion());

for (const browser of /**@type{string[]}*/ (buildConfig.get('browsers'))) {
  (async function () {
    const browserManifest = await readConfig(`./src/${browser}/manifest.json`);
    const buildManifest = mergeConfigs(coreManifest, browserManifest);
    await build(buildConfig, browser, buildManifest);
  })();
}
