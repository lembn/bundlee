const fs = require("fs-extra");
const { join, basename } = require("path");
const ora = require("ora");
const { hashElement } = require("folder-hash");
const { BUNDLEIGNORE, readIgnore, BUNDLECAHCE, MODULESPATH } = require("./common");

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

async function getPackageData(deps, noCache) {
  let hashes = {};
  for (const dep of deps) {
    const path = dep.replace("file:", "");
    const ignore = await readIgnore(join(path, BUNDLEIGNORE));
    const hash = await hashElement(path, {
      files: {
        exclude: ignore.files,
      },
      folders: {
        exclude: ignore.folders,
      },
    });
    hashes[basename(path)] = hash;
    if (noCache) {
      const targetLoc = join(MODULESPATH, path);
      await fs.remove(targetLoc);
      await fs.ensureDir(targetLoc);
      await fs.copy(path, targetLoc);
    }
  }

  return hashes;
}

async function updatePackages(hashes, bundleCache) {
  let count;
  for (const name of hashes) {
    if (!(name in bundleCache)) {
      await copy(MODULESPATH, name);
      count++;
    } else {
      const { toCopy, toDelete } = await compareHashes(hashes[key], bundleCache[name]);
      if (toCopy.length > 0 || toDelete.length > 0) count++;
      for (const i in toCopy) await copy(MODULESPATH, toCopy[i]);
      for (const i in toDelete) await fs.remove(toDelete[i]);
    }
  }

  return count;
}

module.exports = async function (silent) {
  const spinner = ora();
  if (!silent) spinner.start("Scanning local dependencies...");

  //Get deps
  const deps = Object.values((await fs.readJSON("package.json")).dependencies).filter((value) => /^(file:).*/.test(value));
  if (deps.length === 0) {
    if (!silent) spinner.stop();
    return 0;
  }

  //Read bundlecache
  let noCache = false;
  let bundleCache;
  try {
    bundleCache = await fs.readJSON(BUNDLECAHCE);
  } catch {
    noCache = true;
    if (!silent) {
      spinner.stop();
      spinner.start("Updating local dependencies...");
    }
  }

  const hashes = await getPackageData(deps, noCache);

  if (noCache) {
    if (!silent) spinner.stop();
    await fs.writeJSON(BUNDLECAHCE, hashes);
  } else {
    if (!silent) {
      spinner.stop();
      spinner.start("Updating local dependencies...");
    }

    const count = await updatePackages(hashes, bundleCache);
    if (!silent) spinner.stop();
    await fs.writeJSON(BUNDLECAHCE, hashes);
    return count;
  }
};
