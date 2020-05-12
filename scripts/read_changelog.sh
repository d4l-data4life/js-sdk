#!/usr/bin/env node

/**
 * A script that listens to stdin and returns the first section that is
 * distinguished by the VERSION_REGEX. 
 * It is capable of checking if a particular version is  mentioned in
 * the section by getting the version as an argument to the script. 
 * Don't forget to wrap the version within quotes.
 */

const { createInterface } = require('readline');

const VERSION_REGEX = /##[ ]?\[(\d{1,3}[.]?){3}\]/;
const ARG_POS       = 2;
const VERSION       = process.argv[ARG_POS];

const readLine = createInterface(process.stdin);

// helper functions
const firstSection = ((n = 0) => (text) =>
  (VERSION_REGEX.exec(text) ? ++n : n) === 1
)();

const some = (predicate) => (arr) =>
  arr.reduce((sum, value) => {
    return sum || predicate(value); 
  }, false);

const containsVersion = some(element => element.indexOf(VERSION) !== -1);


// listening to stdin
let buffer = [];

readLine.on('line', (chunk) => {
  if (firstSection(chunk)) {
    buffer.push(`${ chunk }\n`);
  }
});

readLine.on('close', () => {
    if (!containsVersion(buffer)) {
      console.error(`Couldn't find ${ VERSION } in text: ${ buffer }`);
      process.exit(1);
    }

    console.log(buffer.join(''));
});
