const fs = require("fs-extra");

module.exports = async function (options) {
  const srcLoc = `${output}/${src.split("/").pop()}`;
  const modulesLoc = `${output}/${modules.split("/").pop()}`;

  if (fs.existsSync(output)) {
    console.log("Output folder found.");
    if (!fs.existsSync(srcLoc)) fs.mkdirSync(srcLoc);
    if (!fs.existsSync(modulesLoc)) fs.mkdirSync(modulesLoc);
  } else {
    console.log(`Output location: '${output}' not found.`);
    console.log(`Creating:\n${output}\n${srcLoc}\n${modulesLoc}`);
    fs.mkdirSync(output);
    fs.mkdirSync(srcLoc);
    fs.mkdirSync(modulesLoc);
    console.log("Created output location");
  }

  console.log("Bundling");

  fs.copySync(src, srcLoc, { overwrite: true });
  fs.copySync(modules, modulesLoc, { overwrite: true });

  console.log("Bundle Complete.");
};
