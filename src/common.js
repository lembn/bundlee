const { red } = require("chalk");
const isValid = require("is-valid-path");
const { join } = require("path");
const { readJSON, pathExists } = require("fs-extra");

module.exports.MODULESPATH = "node_modules";
module.exports.SRCPATH = "src";

module.exports.DEFAULTS = {
  interactive: false,
  fast: false,
  silent: false,
  log: false,
  output: "./dist",
  ignore: false,
};

module.exports.BUNDLEPREFIX = BUNDLEPREFIX = ".bundle";
module.exports.BUNDLEIGNORE = join(BUNDLEPREFIX, "ignore.json");
module.exports.BUNDLECAHCE = join(BUNDLEPREFIX, "cache");
module.exports.BUNDLELOG = join(BUNDLEPREFIX, "log");

module.exports.IGNORESTRUCTURE = IGNORESTRUCTURE = {
  files: [],
  folders: [],
};

module.exports.validate = function (input) {
  valid = isValid(input);
  if (valid) return true;
  else return red("Please enter a valid folder path");
};

module.exports.readIgnore = async function (path = module.exports.BUNDLEIGNORE) {
  if (!(await pathExists(path))) return IGNORESTRUCTURE;
  const ignore = await readJSON(path);
  let valid = true;

  for (const key in IGNORESTRUCTURE) if (!ignore[key]) ignore[key] = [];
  for (const key in ignore) {
    valid = key in IGNORESTRUCTURE && ignore[key].constructor === Array;
    if (valid) ignore[key].map((item) => join(path, item));
  }

  if (!valid) throw `Invalid ignore file at '${path}'.`;
  else return ignore;
};

module.exports.OPTIONS = {
  interactive: {
    short: "i",
    long: "interactive",
    default: false,
  },
  fast: {
    short: "f",
    long: "fast",
    defualt: false,
  },
  silent: {
    short: "s",
    long: "silent",
    default: false,
  },
  log: {
    short: "l",
    long: "log",
    default: false,
  },
  output: {
    short: "o",
    long: "output",
    default: "./dist",
  },
  ignore: {
    short: "I",
    long: "ignore",
    default: false,
  },
};
