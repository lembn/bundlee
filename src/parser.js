const chalk = require("chalk");
const yargonaut = require("yargonaut"); // yargonaut first!
const yargs = require("yargs");
const { validate, OPTIONS } = require("./common");

function createOption(option, description) {
  yargs.option(option.short, {
    alias: option.long,
    describe: description,
    type: typeof option.default,
    default: option.default,
  });
}

yargonaut.style("blue");
yargonaut.helpStyle("green.underline");
yargonaut.errorsStyle("red.bold");

yargs.scriptName("jsbundler");

yargs.check((args) => validate(args.output));

createOption(OPTIONS.interactive, "Run in interactive mode.");
createOption(OPTIONS.fast, "Run in fast mode (disables progress tracking and reports, does not interfere with logging)");
createOption(OPTIONS.silent, "Run in silent mode (disables console messages, does not interfere with file logging)");
createOption(OPTIONS.log, "Turn on file logging");
createOption(OPTIONS.output, "Set output folder path");
createOption(OPTIONS.genIgnore, "Generate a generic bundle ignore file");
createOption(OPTIONS.update, "Check for updates and upadate the package if one is available");

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
