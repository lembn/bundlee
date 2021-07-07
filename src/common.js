const isValid = require("is-valid-path");
const { join } = require("path");

module.exports.MODULESPATH = "node_modules";

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
  ignore: false,
};

module.exports.BUNDLEIGNORE = ".bundleignore";
module.exports.BUNDLECAHCE = ".bundlecache";

module.exports.IGNORESTRUCTURE = {
  files: [],
  folders: [],
};

module.exports.readIgnore = async function (path = this.BUNDLEIGNORE) {
  const ignore = await fs.readJSON(path);
  let valid = true;

  for (const key in this.IGNORESTRUCTURE) if (!ignore[key]) ignore[key] = [];
  for (const key in ignore) {
    valid = this.IGNORESTRUCTURE.keys.contains(key) && ignore[key].constructor === Array;
    if (valid) ignore[key].map((item) => join(path, item));
  }

  if (!valid) throw `Invalid ignore file at '${path}'.`;
  else return ignore;
};
