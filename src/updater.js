const fs = require("fs-extra");
const { join, basename } = require("path");
const ora = require("ora");
const { hashElement } = require("folder-hash");

const maxDepth = 2;

const getNames = (hash) => hash.children.map((childObj) => childObj.name);

async function compareHashes(newHash, oldHash, prefix = "./", result = { toCopy: [], toDelete: [] }, currentDepth = 0) {
  if (oldHash.hash === newHash.hash) return result;

  const root = join(prefix, newHash.name);
  if ((await fs.stat(root)).isFile())
    return {
      toCopy: [...result.toCopy, root],
      toDelete: result.toDelete,
    };

  const oldChildren = getNames(oldHash);
  const newChildren = getNames(newHash);
  result.toDelete = result.toDelete.concat(oldChildren.filter((name) => !newChildren.includes(name)));

  for (const nameIndex in newChildren) {
    const name = newChildren[nameIndex];
    const childPath = join(root, name);
    if (!oldChildren.includes(name) || currentDepth === maxDepth) result.toCopy.push(childPath);
    else {
      const oldChild = oldHash.children[oldChildren.indexOf(name)];
      result = await compareHashes(newHash.children[nameIndex], oldChild, root, result, ++currentDepth);
    }
  }

  return result;
}

async function copy(parent, path) {
  const targetLoc = join(parent, path);
  if ((await fs.stat(path)).isFile()) await fs.ensureFile(targetLoc);
  else await fs.ensureDir(targetLoc);
  await fs.copy(path, targetLoc);
}

module.exports = async function (silent, modules, cacheLoc, ignore) {
  const spinner = ora();
  if (!silent) spinner.start("Scanning local dependencies...");

  const allDeps = (await fs.readJSON("package.json")).dependencies;
  const deps = Object.values(allDeps).filter((value) => /^(file:).*/.test(value));
  if (!deps) return;

  let noCache = false;
  let bundleCache;
  try {
    bundleCache = await fs.readJSON(cacheLoc);
  } catch {
    noCache = true;
    spinner.stop();
    spinner.start("Updating local dependencies...");
  }

  let hashes = {};
  for (const i in deps) {
    const _path = deps[i].replace("file:", "");
    const hash = await hashElement(_path);
    hashes[hash.name] = hash;
    if (noCache) {
      const targetLoc = join(modules, _path);
      await fs.remove(targetLoc);
      await fs.ensureDir(targetLoc);
      await fs.copy(_path, targetLoc);
    }
  }

  if (noCache) {
    spinner.stop();
    await fs.writeJSON(cacheLoc, hashes);
  } else {
    if (!silent) {
      spinner.stop();
      spinner.start("Updating local dependencies...");
    }

    const names = Object.keys(bundleCache);
    let count;

    for (const [name, hashData] of Object.entries(hashes)) {
      if (!names.includes(name)) {
        await copy(modules, name);
        count++;
      } else {
        const { toCopy, toDelete } = await compareHashes(hashData, bundleCache[name]);
        if (toCopy.length > 0 || toDelete.length > 0) count++;
        for (const i in toCopy) await copy(modules, toCopy[i]);
        for (const i in toDelete) await fs.remove(toDelete[i]);
      }
    }

    if (!silent) spinner.stop();
    await fs.writeJSON(cacheLoc, hashes);
    return count;
  }
};
