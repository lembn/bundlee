const inquirer = require("inquirer");
const { validate, defaults } = require("./common");
const chalk = require("chalk");

const convertBackslashes = (input) => input.replace(/\\/g, "/");

module.exports.prompt = async function (options) {
  console.log();
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
      name: "log",
      type: "list",
      message: "Should the bundler log to a file? ",
      choices: ["No", "Yes"],
      default: options.log ? 1 : 0,
      loop: true,
      when: options.log === defaults.log,
    },
    {
      name: "fast",
      type: "list",
      message: "Should the bundler run in fast mode? ",
      choices: ["No", "Yes"],
      default: options.fast ? 1 : 0,
      loop: true,
      when: options.fast === defaults.fast,
    },
    {
      name: "silent",
      type: "list",
      message: "Should the bundler run in silent mode? ",
      choices: ["No", "Yes"],
      default: options.silent ? 1 : 0,
      loop: true,
      when: options.silent === defaults.silent,
    },
  ]);

  let extras = {};
  for (let key in options) {
    if (!(key in settings)) extras[key] = options[key];
  }

  return { ...extras, ...settings };
};

module.exports.summarise = function (success, message, time, updated, files, size, units) {
  const addLine = (content) => console.log(`| ${content}`);
  const getSpace = (length) => `${" ".repeat(length)}`;

  const width = process.stdout.columns;
  const bar = `${"=".repeat(width)}`;
  const spaces = (width - 9) / 2;
  const space1 = getSpace(Math.floor(spaces));
  const space2 = getSpace(spaces % 1 === 0 ? spaces : Math.ceil(spaces));
  const summary = `|${space1}${chalk.underline("SUMMARY")}${space2}|`;

  console.log(`\n${bar}\n${summary}\n${bar}`);

  addLine(`${success ? "✅ " : "❌ "} ${chalk.bold("BUNDLE")} ${success ? chalk.green("SUCCESS") : chalk.red("FAILED")}`);
  addLine(`${chalk.bold("Messages:")} ${chalk.italic(message)}.`);
  addLine(`${chalk.bold("Completed in:")} ${chalk.yellowBright(Math.round(time / 1000))} seconds.`);
  addLine(`${chalk.bold("Updated")} ${chalk.yellowBright(updated)} packages.`);
  addLine(
    `${chalk.bold("Bundled")} ${chalk.yellowBright(files)} files. ${chalk.bold("TOTAL")}: ${chalk.yellowBright(size)} ${chalk.blue(units)}.`
  );

  console.log(`└ ${"─".repeat(width - 2)}`);
};
