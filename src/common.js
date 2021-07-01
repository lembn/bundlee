const isValid = require("is-valid-path");

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
};
