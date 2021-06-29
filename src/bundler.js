const fs = require("fs-extra");

const argv = require("yargs")
  .alias("o", "output")
  .alias("s", "src")
  .alias("m", "modules")
  .alias("h", "help")
  .help("h")
  .usage("Usage: $0 [options]")
  .describe("o", "Specify build path output location. Default: ./dist")
  .describe("s", "Specify source code folder. Default: ./src")
  .describe("m", "Specify node_modules folder. Default: ./node_modules").argv;

var { output = "./dist", src = "./src", modules = "./node_modules" } = argv;

output = output.replace(/\\/g, "/");
src = src.replace(/\\/g, "/");
modules = modules.replace(/\\/g, "/");

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
