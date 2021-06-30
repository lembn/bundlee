#!/usr/bin/env node

const parser = require("./parser");
const bundle = require("./bundler");
const prompt = require("./prompt");
const defaults = require("./defaults");

async function main(args) {
  const paths = args.yes ? defaults : await prompt(args);
  await bundle({ fast: args.fast, ...paths });
}

main(parser.argv);
