const fs = require("fs-extra");
const { join, basename } = require("path");
const ora = require("ora");
const { hashElement } = require("folder-hash");
const glob = require("glob-promise");
const { BUNDLEIGNORE, readIgnore, BUNDLECAHCE, MODULESPATH } = require("./common");

const getNames = (hash) => hash.children.map((childObj) => childObj.name);

async function compareHashes(newHash, oldHash, prefix = "./", result = { toCopy: [], toDelete: [] }) {
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
    if (!oldChildren.includes(name)) result.toCopy.push(childPath);
    else {
      const oldChild = oldHash.children[oldChildren.indexOf(name)];
      result = await compareHashes(newHash.children[nameIndex], oldChild, root, result);
    }
  }

  return result;
}

async function copyFilter(item, ignore) {
  const patterns = (await fs.stat(item)).isFile() ? ignore.files : ignore.folders;
  return !(await glob(`{${patterns.join(",")}}`, { cwd: "test" })).includes(item);
}

async function copy(parent, path) {
  const targetLoc = join(parent, path);
  if ((await fs.stat(path)).isFile()) await fs.ensureFile(targetLoc);
  else await fs.ensureDir(targetLoc);
  await fs.copy(path, targetLoc);
}

async function getPackageData(deps) {
  let packageData = {};
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
    packageData[basename(path)] = { hash, ignore };
  }

  return packageData;
}

async function updatePackages(packageData, bundleCache) {
  if (bundleCache) {
    let count = 0;
    for (const name in packageData) {
      if (!(name in bundleCache)) {
        await copy(MODULESPATH, name);
        count++;
      } else {
        const { toCopy, toDelete } = await compareHashes(packageData[name].hash, bundleCache[name]);
        if (toCopy.length > 0 || toDelete.length > 0) count++;
        for (const item of toCopy) await copy(MODULESPATH, item);
        for (const item of toDelete) await fs.remove(item);
      }
    }
    return count;
  } else {
    for (const name in packageData) {
      const targetLoc = join(MODULESPATH, name);
      await fs.remove(targetLoc);
      await fs.ensureDir(targetLoc);
      await fs.copy(name, targetLoc, {
        filter: async (item) => await copyFilter(item, packageData[name].ignore),
      });
    }

    return Object.keys(packageData).length;
  }
}

module.exports = async function (silent) {
  const spinner = ora();
  if (!silent) spinner.start("Scanning local dependencies...");

  //Get deps
  const deps = (await fs.readJSON("package.json")).dependencies;
  if (!deps) {
    if (!silent) spinner.stop();
    return 0;
  }

  const localDeps = Object.values(deps).filter((value) => /^(file:).*/.test(value));
  if (!localDeps.length === 0) {
    if (!silent) spinner.stop();
    return 0;
  }

  //Read bundlecache
  let bundleCache;
  try {
    bundleCache = await fs.readJSON(BUNDLECAHCE);
  } catch {
    bundleCache = undefined;
  }

  const packageData = await getPackageData(localDeps);
  if (!silent) {
    spinner.stop();
    spinner.start("Updating local dependencies...");
  }

  const count = await updatePackages(packageData, bundleCache);
  if (!silent) spinner.stop();
  hashes = {};
  for (const name in packageData) hashes[name] = packageData[name].hash;
  await fs.writeJSON(BUNDLECAHCE, hashes);
  return count;
};
