const inquirer = require("inquirer");
const { validate, OPTIONS } = require("./common");
const chalk = require("chalk");

const convertBackslashes = (input) => input.replace(/\\/g, "/");

module.exports.prompt = async function (options) {
  console.log();
  const flags = process.argv
    .slice(2)
    .map((arg) => arg.replace(/-{1,2}(?=\w)/g, ""))
    .filter((arg) => {
      for (const opt in OPTIONS) if (arg === OPTIONS[opt].short || arg === OPTIONS[opt].long) return true;
      return false;
    });

  const settings = await inquirer.prompt([
    {
      name: OPTIONS.output.long,
      message: "Where should the bundle be generated? ",
      default: options.output,
      validate: validate,
      filter: convertBackslashes,
      when: !(flags.includes(OPTIONS.output.long) || flags.includes(OPTIONS.output.short)),
    },
    {
      name: OPTIONS.src.long,
      message: "Where is the source code located? ",
      default: options.src,
      validate: validate,
      filter: convertBackslashes,
      when: !(flags.includes(OPTIONS.src.long) || flags.includes(OPTIONS.src.short)),
    },
    {
      name: OPTIONS.log.long,
      type: "list",
      message: "Should the bundler log to a file? ",
      choices: ["No", "Yes"],
      default: options.log ? 1 : 0,
      loop: true,
      when: !(flags.includes(OPTIONS.log.long) || flags.includes(OPTIONS.log.short)),
    },
    {
      name: OPTIONS.fast.long,
      type: "list",
      message: "Should the bundler run in fast mode? ",
      choices: ["No", "Yes"],
      default: options.fast ? 1 : 0,
      loop: true,
      when: !(flags.includes(OPTIONS.fast.long) || flags.includes(OPTIONS.fast.short)),
    },
    {
      name: OPTIONS.silent.long,
      type: "list",
      message: "Should the bundler run in silent mode? ",
      choices: ["No", "Yes"],
      default: options.silent ? 1 : 0,
      loop: true,
      when: !(flags.includes(OPTIONS.silent.long) || flags.includes(OPTIONS.silent.short)),
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
