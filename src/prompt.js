const inquirer = require("inquirer");
const isValid = require("is-valid-path");

const convertBackslashes = (input) => input.replace(/\\/g, "/");

const validate = (input) => {
  valid = isValid(input);
  if (valid) return true;
  else return "Please enter a valid folder path";
};

module.exports = async function prompt(options) {
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
};
