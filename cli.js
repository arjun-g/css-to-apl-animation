#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const { convert } = require("./convert");

const inputFileName = path.resolve(process.cwd(), argv._[0]);
const outputFileName = path.resolve(process.cwd(), argv._[1]);

const css = fs.readFileSync(inputFileName).toString();

convert({ css }).then(apl => fs.writeFileSync(outputFileName, JSON.stringify(apl)));