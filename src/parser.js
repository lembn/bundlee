const yargonaut = require("yargonaut"); // yargonaut first!
const yargs = require("yargs");
const defaults = require("./defaults");

yargonaut.style("blue");
yargonaut.helpStyle("green.underline");
yargonaut.errorsStyle("red.bold");

yargs.scriptName("js-bundler");

yargs.option("i", {
  alias: "interactive",
  describe: "Run in interactive mode. Will be disabled if any other flags/options are present",
  type: "boolean",
  default: defaults.interactive,
});
yargs.option("f", {
  alias: "fast",
  describe: "Run in fast mode (disables progress tracking and reports)",
  type: "boolean",
  default: defaults.fast,
});
yargs.option("o", {
  alias: "output",
  describe: "Set output folder path",
  type: "string",
  normalize: true,
  default: defaults.output,
});
yargs.option("s", {
  alias: "src",
  describe: "Set source code folder path",
  type: "string",
  normalize: true,
  default: defaults.src,
});
yargs.option("m", {
  alias: "modules",
  describe: "Set node modules folder path",
  type: "string",
  normalize: true,
  default: defaults.modules,
});

yargs.example([
  ["$0", "Run with defualts"],
  ["$0 -i", "Run in interactive mode"],
  ["$0 -f -o ./somewhere/dist", "Use custom output folder and run in fast mode"],
]);

yargs.help();
yargs.alias("h", "help");
yargs.alias("v", "version");

module.exports = yargs;
