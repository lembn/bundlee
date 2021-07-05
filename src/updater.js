const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const { hashElement } = require("folder-hash");

const maxDepth = 2;

const getNames = (hash) => hash.children.map((childObj) => childObj.name);

async function compareHashes(newHash, oldHash, prefix = "./", result = { toCopy: [], toDelete: [] }, currentDepth = 0) {
  if (oldHash.hash === newHash.hash) return result;

  const root = path.join(prefix, newHash.name);
  if ((await fs.stat(root)).isFile())
    return {
      toCopy: [...result.toCopy, { path: root, parent: prefix }],
      toDelete: result.toDelete,
    };

  const oldChildren = getNames(oldHash);
  const newChildren = getNames(newHash);
  result.toDelete = result.toDelete.concat(oldChildren.filter((name) => !newChildren.includes(name)));

  for (const name in newChildren) {
    const childPath = path.join(root, name);
    if (!oldChildren.includes(name) || currentDepth === maxDepth) {
      const isFile = (await fs.stat(childPath)).isFile();
      result.toCopy.push({ path: childPath, parent: isFile ? root : childPath });
    } else {
      const oldChild = oldHash.children[oldChildren.indexOf(name)];
      result = await compareHashes(newHash.children[newChildren.indexOf(name)], oldChild, root, result, ++currentDepth);
    }
  }

  return result;
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
      const targetLoc = path.join(modules, _path);
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

    for (const [name, hashData] of Object.entries(hashes)) {
      if (!names.includes(name)) {
        const targetLoc = path.join(modules, name);
        const ensureMethod = (await fs.stat(name)).isFile() ? fs.ensureFile : fs.ensureDir;
        await ensureMethod(targetLoc);
        await fs.copy(name, targetLoc);
      } else {
        const { toCopy, toDelete } = await compareHashes(hashData, bundleCache[name]);
        for (const { path, parent } in toCopy) {
          const parentPath = path.join(modules, parent);
          await fs.ensureDir(parentPath);
          await fs.copy(path, parentPath);
        }
        for (const path in toDelete) await fs.remove(path);
      }
    }

    if (!silent) spinner.stop();
    await fs.writeJSON(cacheLoc, hashes);
  }
};
