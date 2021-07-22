const { red } = require("chalk");
const isValid = require("is-valid-path");
const { join } = require("path");

module.exports.MODULESPATH = "node_modules";

module.exports.validate = function (input) {
  valid = isValid(input);
  if (valid) return true;
  else return red("Please enter a valid folder path");
};

module.exports.DEFAULTS = {
  interactive: false,
  fast: false,
  silent: false,
  log: false,
  output: "./dist",
  src: "./src",
  ignore: false,
};

module.exports.BUNDLEPREFIX = ".bundle";
module.exports.BUNDLEIGNORE = join(this.BUNDLEPREFIX, "ignore");
module.exports.BUNDLECAHCE = join(this.BUNDLEPREFIX, "cache");
module.exports.BUNDLELOG = join(this.BUNDLEPREFIX, "log");

module.exports.IGNORESTRUCTURE = {
  files: [],
  folders: [],
};

module.exports.readIgnore = async function (path = this.BUNDLEIGNORE) {
  const ignore = await fs.readJSON(path);
  let valid = true;

  for (const key in this.IGNORESTRUCTURE) if (!ignore[key]) ignore[key] = [];
  for (const key in ignore) {
    valid = Object.keys(this.IGNORESTRUCTURE).contains(key) && ignore[key].constructor === Array;
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
    short: "S",
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
  src: {
    short: "s",
    long: "src",
    default: "./src",
  },
  ignore: {
    short: "I",
    long: "ignore",
    default: false,
  },
};
