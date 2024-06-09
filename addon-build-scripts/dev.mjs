import { debounce, run, stdpipe } from './lib.mjs';
import { watch } from './lib.watch.mjs';

try {
  const run_build = debounce(async () => {
    stdpipe(await run('bun', ['run', 'build']));
  }, 250);

  await watch({
    path: './src', //
    debounce_interval: 250,
    change_cb: () => {
      run_build();
    },
    error_cb: (error) => {
      console.error('ERROR:', error);
    },
  });
} catch (err) {
  console.log(err);
}
