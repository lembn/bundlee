#!/usr/bin/env node

const parser = require("./parser");
const bundle = require("./bundler");
const { prompt } = require("./prompt");
const generate = require("./generator");
const checkUpdates = require("./versioning");

async function main(args) {
  if (args.update) {
    await checkUpdates();
    return;
  }
  if (args.genIgnore) {
    await generate();
    return;
  }
  args = args.interactive ? await prompt(args) : args;
  await bundle(args);
}

main(parser.argv);
