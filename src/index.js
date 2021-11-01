#!/usr/bin/env node

const parser = require("./parser");
const bundle = require("./bundler");
const { prompt } = require("./prompt");
const generate = require("./generator");

async function main(args) {
  const AutoGitUpdate = require("auto-git-update");

  const config = {
    repository: "https://github.com/lembn/js-bundler",
    tempLocation: "./js-bundler-tmp/",
    executeOnComplete: process.argv0,
  };

  const updater = new AutoGitUpdate(config);

  updater.autoUpdate();

  if (args.genIgnore) {
    generate();
    return;
  }
  args = args.interactive ? await prompt(args) : args;
  await bundle(args);
}

main(parser.argv);
