const inquirer = require("inquirer");
const isValid = require("is-valid-path");
const defaults = require("./defaults");

const convertBackslashes = (input) => input.replace(/\\/g, "/");

const validate = (input) => {
  valid = isValid(input);
  if (valid) return true;
  else return "Please enter a valid folder path";
};

module.exports = async function prompt(options) {
  const settings = await inquirer.prompt([
    {
      name: "output",
      message: "Where should the bundle be generated? ",
      default: options.output,
      validate: validate,
      filter: convertBackslashes,
      when: options.output === defaults.output,
    },
    {
      name: "src",
      message: "Where is the source code located? ",
      default: options.src,
      validate: validate,
      filter: convertBackslashes,
      when: options.src === defaults.src,
    },
    {
      name: "modules",
      message: "Where is the 'node_modules' folder? ",
      default: options.modules,
      validate: validate,
      filter: convertBackslashes,
      when: options.modules === defaults.modules,
    },
    {
      name: "fast",
      type: "list",
      message: "Should is bundler run in fast mode? ",
      choices: ["No", "Yes"],
      default: options.fast ? 1 : 0,
      loop: true,
      when: options.fast === defaults.fast,
    },
  ]);

  var extras = {};
  for (var key in options) {
    if (!(key in settings)) extras[key] = options[key];
  }

  return { ...extras, ...settings };
};
