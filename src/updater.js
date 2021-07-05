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

module.exports = async function (spinner, silent, modules, cacheLoc) {
  const spinner = ora();
  if (!silent) spinner.start("Scanning local dependencies...");

  const allDeps = (await fs.readJSON("package.json")).dependencies;
  const deps = Object.values(allDeps).filter((value) => /^(file:).*/.test(value));
  if (!deps) return;

  let hashes = {};
  for (let i = 0; i < deps.length; i++) {
    const hash = await hashElement(deps[i].replace("file:", ""));
    hashes[hash.name] = hash;
  }

  spinner.stop();
  if (!silent) spinner.start("Updating local dependencies...");
  const bundleCache = await fs.readJSON(cacheLoc);
  const names = Object.keys(bundleCache);

  for (const [name, hashData] of Object.entries(hashes)) {
    if (!names.includes(name)) await cpy(name, modules, { parents: true });
    else {
      const { toCopy, toDelete } = await compareHashes(hashData, bundleCache[name]);
      for (const { path, parent } in toCopy) {
        const parentPath = path.join(modules, parent);
        await fs.ensureDir(parentPath);
        await fs.copyFile(path, parentPath);
      }
      for (const path in toDelete) await fs.remove(path);
    }
  }

  spinner.stop();
  await fs.writeJSON(cacheLoc, hashes);
};
