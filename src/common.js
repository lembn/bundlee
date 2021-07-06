const isValid = require("is-valid-path");
const { join } = require("path");

const MODULESPATH = "node_modules";

module.exports.appendModules = (path) => join(MODULESPATH, path);

module.exports.validate = function (input) {
  valid = isValid(input);
  if (valid) return true;
  else return "Please enter a valid folder path";
};

module.exports.defaults = {
  interactive: false,
  fast: false,
  silent: false,
  log: null,
  output: "./dist",
  src: "./src",
  modules: "./node_modules",
  cacheLoc: "./.bundlecache",
  ignore: "./.bundleignore",
  genIgnore: false,
};

module.exports.BUNDLEIGNORE = ".bundleignore";
module.exports.BUNDLECAHCE = ".bundlecache";

module.exports.IGNORESTRUCTURE = {
  files: [],
  folders: [],
};
