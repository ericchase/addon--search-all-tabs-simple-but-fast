import { run } from './lib.mjs';
import { watch } from './lib.watch.mjs';

/**
 * @param {()=>void} callback
 * @param {number} delay
 */
function debounce(callback, delay) {
  let timer = /**@type{NodeJS.Timeout | undefined}*/ (undefined);
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}

try {
  const bun_build = debounce(async () => {
    const { stdout, stderr } = await run('bun', ['run', 'build']);
    if (stdout) console.log(stdout.slice(0, stdout.lastIndexOf('\n')));
    if (stderr) console.log(stderr.slice(0, stderr.lastIndexOf('\n')));
  }, 250);

  await watch({
    path: './src', //
    debounce_interval: 250,
    change_cb: (changes) => {
      for (const change of changes) {
        switch (change[0]) {
          case '0':
            console.log('watching >', change.slice(2));
            break;
          case '1':
            console.log('   added >', change.slice(2));
            break;
          case '2':
            console.log(' removed >', change.slice(2));
            break;
          case '3':
            console.log('modified >', change.slice(2));
            break;
          case '4':
            console.log(' renamed >', change.slice(2).split('\t').join(' -> '));
            break;
        }
        bun_build();
      }
    },
    error_cb: (error) => console.error('ERROR:', error),
  });
} catch (err) {
  console.log(err);
}
