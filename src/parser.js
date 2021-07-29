const chalk = require("chalk");
const yargonaut = require("yargonaut"); // yargonaut first!
const yargs = require("yargs");
const { validate, OPTIONS } = require("./common");

yargonaut.style("blue");
yargonaut.helpStyle("green.underline");
yargonaut.errorsStyle("red.bold");

yargs.scriptName("js-bundler");

yargs.check((args) => validate(args.output));

yargs.option(OPTIONS.interactive.short, {
  alias: OPTIONS.interactive.long,
  describe: "Run in interactive mode.",
  type: "boolean",
  default: OPTIONS.interactive.default,
});
yargs.option(OPTIONS.fast.short, {
  alias: OPTIONS.fast.long,
  describe: "Run in fast mode (disables progress tracking and reports, does not interfere with logging)",
  type: "boolean",
  default: OPTIONS.fast.defualt,
});
yargs.option(OPTIONS.silent.short, {
  alias: OPTIONS.silent.long,
  describe: "Run in silent mode (disables console messages, does not interfere with file logging)",
  type: "boolean",
  default: OPTIONS.silent.default,
});
yargs.option(OPTIONS.log.short, {
  alias: OPTIONS.log.long,
  describe: "Turn on file logging",
  type: "boolean",
  default: OPTIONS.log.default,
});
yargs.option(OPTIONS.output.short, {
  alias: OPTIONS.output.long,
  describe: "Set output folder path",
  type: "string",
  normalize: true,
  default: OPTIONS.output.default,
});
yargs.option(OPTIONS.ignore.short, {
  alias: OPTIONS.ignore.long,
  describe: "Generate a generic bundle ignore file",
  type: "boolean",
  default: OPTIONS.ignore.default,
});

yargs.example([
  ["$0", "Run with defualts"],
  ["$0 -i", "Run in interactive mode"],
  ["$0 -f -o ./somewhere/dist", "Use custom output folder and run in fast mode"],
]);

yargs.help();
yargs.alias("h", "help");
yargs.alias("v", "version");
yargs.epilogue(chalk.whiteBright.italic("NOTE: file/folder paths passed into the bundler will be created if they do not exist."));

module.exports = yargs;
