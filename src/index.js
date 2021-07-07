#!/usr/bin/env node

const parser = require("./parser");
const bundle = require("./bundler");
const { prompt } = require("./prompt");

async function main(args) {
  args = args.interactive ? await prompt(args) : args;
  //await bundle(args);
}

//main(parser.argv);
