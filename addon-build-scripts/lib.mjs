import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** @param {any[]} objects */
export function mergeObjects(...objects) {
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
 * @param {any} obj
 */
export async function writeJSONFile(path, obj) {
  await writeFile(path, JSON.stringify(obj), { encoding: 'utf8' });
}

/**
 * @param {string} path
 * @param {string} string
 */
export async function writeTextFile(path, string) {
  await writeFile(path, string, { encoding: 'utf8' });
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

// config files

export async function getBrowsers() {
  return (await readJSONFile('./build-config.json')).browsers;
}

/** @param {string} browser */
export async function getBundleConfig(browser) {
  return (await readJSONFile('./bundle-config.json'))[browser];
}

export async function getPaths() {
  return (await readJSONFile('./build-config.json')).paths;
}

export async function getSemanticVersion() {
  const { major, minor, patch } = await readJSONFile('./version.json');
  return `${major}.${minor}.${patch}`;
}

export async function incrementVersionPatch() {
  const { major, minor, patch } = await readJSONFile('./version.json');
  await writeJSONFile('./version.json', { major, minor, patch: patch + 1 });
}
