import node_child_process from 'node:child_process';
import node_fs from 'node:fs/promises';
import node_path from 'node:path';

/** @param {string[]} strings */
export function mergeJSON(...strings) {
  /** @param {any[]} objects */
  function mergeObjects(...objects) {
    const to = /** @type {Record<any,any>} */ ({});
    for (const from of objects) {
      if (typeof from !== 'object') continue;
      for (const key in from) {
        if (from.hasOwnProperty(key)) {
          if (typeof from[key] === 'object' && Array.isArray(from[key]) === false) {
            to[key] = mergeObjects(to[key], from[key]);
          } else {
            to[key] = from[key];
          }
        }
      }
    }
    return to;
  }
  return mergeObjects(strings.map((s) => JSON.parse(s)));
}

/** @param {string} path */
export async function readFile(path) {
  return await node_fs.readFile(path, { encoding: 'utf8' });
}

/**
 * @param {string} path
 * @param {string} string
 */
export async function writeFile(path, string) {
  await node_fs.writeFile(path, string, { encoding: 'utf8' });
}

/** @param {string} path */
export async function deleteFile(path) {
  await node_fs.rm(path, { force: true });
}

/**
 * @param {string} path
 * @param {boolean} isFile
 */
export async function createDirectory(path, isFile = false) {
  if (isFile === true) {
    await node_fs.mkdir(node_path.dirname(path), { recursive: true });
  } else {
    await node_fs.mkdir(path, { recursive: true });
  }
}

/** @param {string} path */
export async function deleteDirectory(path) {
  await node_fs.rm(path, { recursive: true, force: true });
}

/** @param {string} text */
export function toSnakeCase(text) {
  return text.toLowerCase().replace(/ /g, '-');
}

/**
 * @param {string} program
 * @param {string[]} args
 * @param {import('node:fs').ObjectEncodingOptions & import('node:child_process').ExecFileOptions} options
 * @returns {Promise<{stdout:string,stderr:string}>}
 */
export function run(program, args, options = {}) {
  return new Promise((resolve, reject) => {
    node_child_process.execFile(program, args, (error, stdout, stderr) => {
      if (error) return reject(error);
      return resolve({ stdout, stderr });
    });
  });
}

/**
 * @param {()=>void} callback
 * @param {number} delay
 */
export function debounce(callback, delay) {
  let timer = /**@type{NodeJS.Timeout | undefined}*/ (undefined);
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}

/**
 * @param {object} params
 * @param {string=} params.stdout
 * @param {string=} params.stderr
 */
export function stdpipe({ stdout = '', stderr = '' }) {
  if (stdout) console.log(stdout.slice(0, stdout.lastIndexOf('\n')));
  if (stderr) console.log(stderr.slice(0, stderr.lastIndexOf('\n')));
}

// config files

export class Config {
  /**
   * @param {object} pojo
   */
  constructor(pojo) {
    this.pojo = /**@type{Record<string,any>}*/ (pojo);
  }
  /**
   * @param {string} key
   * @memberof Config
   */
  get(key) {
    return this.pojo[key];
  }
  /**
   * @param {string} key
   * @param {any} value
   * @memberof Config
   */
  set(key, value) {
    this.pojo[key] = value;
  }
  toJSON() {
    return JSON.stringify(this.pojo);
  }
}

/**
 * @param {string} path
 */
export async function readConfig(path) {
  return new Config(JSON.parse(await readFile(path)));
}
/**
 * @param {Config} config
 * @param {string} key
 */

export async function subConfig(config, key) {
  return new Config(config.get(key));
}
/**
 * @param {Config} configA
 * @param {Config} configB
 */

export function mergeConfigs(configA, configB) {
  /** @param {Record<string,any>[]} objects */
  function mergeObjects(...objects) {
    const to = /** @type {Record<string,any>} */ ({});
    for (const from of objects) {
      if (typeof from !== 'object') continue;
      for (const key in from) {
        if (from.hasOwnProperty(key)) {
          if (typeof from[key] === 'object' && Array.isArray(from[key]) === false) {
            to[key] = mergeObjects(to[key], from[key]);
          } else {
            to[key] = from[key];
          }
        }
      }
    }
    return to;
  }
  return new Config(mergeObjects(configA.pojo, configB.pojo));
}

// addon version

export async function getSemanticVersion() {
  const { major, minor, patch } = JSON.parse(await readFile('./version.json'));
  return `${major}.${minor}.${patch}`;
}

export async function incrementVersionPatch() {
  const { major, minor, patch } = JSON.parse(await readFile('./version.json'));
  await writeFile('./version.json', JSON.stringify({ major, minor, patch: patch + 1 }));
}
