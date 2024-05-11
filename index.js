#!/usr/bin/env node

const {createApp} = require('./dist/convert');

//
// Usage:
//   $ convert.js swagger.json ./outpath
//
const schema = process.argv[2];

if (schema) {
  createApp(schema, process.argv[3]);
} else {
  console.error('Usage:\n  $ convert.js swagger.json ./outpath');
}
