const fs = require("fs-extra");
const inquirer = require("inquirer");
const isValid = require("is-valid-path");
const yargs = require("yargs");

yargs.scriptName("bundler");
yargs.option("y", {
  alias: "yes",
  describe: "Use default settings.",
  type: "boolean",
  normalize: true,
});
yargs.help();
yargs.alias("h", "help");
yargs.alias("v", "version");
const { argv } = yargs;

const defaults = {
  output: "./dist",
  src: "./src",
  modules: "./node_modules",
};

const convertBackslashes = (input) => input.replace(/\\/g, "/");

const validate = (input) => {
  valid = isValid(input);
  if (valid) return true;
  else return "Please enter a valid folder path";
};

async function setup() {
  return await inquirer.prompt([
    {
      name: "output",
      message: "Where should the bundle be generated?: ",
      default: defaults.output,
      validate: validate,
      filter: convertBackslashes,
    },
    {
      name: "src",
      message: "Where should is the source code located?: ",
      default: defaults.src,
      validate: validate,
      filter: convertBackslashes,
    },
    {
      name: "modules",
      message: "Where should is the 'node_modules' folder?: ",
      default: defaults.modules,
      validate: validate,
      filter: convertBackslashes,
    },
  ]);
}

async function main(useDefaults) {
  const { output, src, modules } = useDefaults ? defaults : await setup();

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
}

main(argv.y);
