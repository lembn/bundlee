#!/usr/bin/env node

const parser = require("./parser");
const bundle = require("./bundler");
const { prompt } = require("./prompt");
const generate = require("./generator");

async function main(args) {
  if (args.genIgnore) {
    generate();
    return;
  }
  args = args.interactive ? await prompt(args) : args;
  await bundle(args);
}

main(parser.argv);
