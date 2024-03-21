import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const build_config = await readJSONFile('./build-config.json');
const bundle_config = await readJSONFile('./bundle-config.json');

export function getBrowsers() {
  return build_config.browsers;
}

export function getPaths() {
  return build_config.paths;
}

/** @param {string} browser */
export function getBundleConfig(browser) {
  return bundle_config[browser];
}

/**
 * @param {*[]} objects
 */
export function mergeObjects(...objects) {
  // console.log('--- start');
  const out = {};
  for (const from of objects) {
    // console.log('from', from);
    if (typeof from !== 'object') continue;
    for (const key in from) {
      if (from.hasOwnProperty(key)) {
        if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
          out[key] = mergeObjects(out[key], from[key]);
        } else {
          out[key] = from[key];
        }
      }
    }
  }
  // console.log('out', out);
  // console.log('--- end');
  return out;
  // props in `b` will overwrite props in `a` with same name
  //return { ...a, ...b };
}

/** @param {string} path */
export async function readJSONFile(path) {
  return JSON.parse(await readFile(path, { encoding: 'utf8' }));
}

/** @param {string} path */
export async function readTextFile(path) {
  return await readFile(path, { encoding: 'utf8' });
}

/**
 * @param {string} path
 * @param {*} obj
 */
export async function writeJSONFile(path, obj) {
  await writeFile(path, JSON.stringify(obj), { encoding: 'utf8' });
}

/**
 * @param {string} path
 * @param {boolean} isFile
 */
export async function createDirectory(path, isFile = false) {
  if (isFile === true) {
    await mkdir(dirname(path), { recursive: true });
  } else {
    await mkdir(path, { recursive: true });
  }
}

/** @param {string} path */
export async function deleteDirectory(path) {
  await rm(path, { recursive: true, force: true });
}

export async function getSemanticVersion() {
  const { major, minor, patch } = await readJSONFile('./version.json');
  return `${major}.${minor}.${patch}`;
}

export async function incrementVersionPatch() {
  const { major, minor, patch } = await readJSONFile('./version.json');
  await writeJSONFile('./version.json', { major, minor, patch: patch + 1 });
}

/** @param {string} text */
export function toSnakeCase(text) {
  return text.toLowerCase().replace(/ /g, '-');
}

/**
 * @param {string} program
 * @param {string[]} args
 * @returns {Promise<{stdout:string,stderr:string}>}
 */
export function run(program, args) {
  return new Promise((resolve, reject) => {
    execFile(program, args, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      return resolve({ stdout, stderr });
    });
  });
}
