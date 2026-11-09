/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025-2026 Ryan Johnson
 */

/* eslint-env node */

/* global require, __dirname, console */

const fs = require('fs');
const path = require('path');

// @actions/glob 0.7.0 calls Minimatch#matchOne(), which minimatch 11 removed.
// Partial matching is still available as Minimatch#match(path, true). Patterns
// are stored with forward slashes, so Windows paths are normalized first.
const patternFile = path.resolve(
  __dirname,
  '../node_modules/@actions/glob/lib/internal-pattern.js'
);
const patchedMarker = 'this.minimatch.match(IS_WINDOWS ? itemPath.replace(';
const patchedReturn =
  "return this.minimatch.match(IS_WINDOWS ? itemPath.replace(/\\\\/g, '/') : itemPath, true);";

if (!fs.existsSync(patternFile)) {
  console.error(`Missing ${patternFile}. Install dependencies first.`);
  process.exit(1);
}

const lines = fs.readFileSync(patternFile, 'utf8').split('\n');
const matchOneIndex = lines.findIndex(line => line.includes('this.minimatch.matchOne('));

if (matchOneIndex === -1) {
  if (lines.some(line => line.includes(patchedMarker))) {
    process.exit(0);
  }

  console.error(
    '@actions/glob no longer calls minimatch.matchOne, and the minimatch 11 patch was not found.'
  );
  process.exit(1);
}

const indent = lines[matchOneIndex].match(/^\s*/)[0];
lines[matchOneIndex] = `${indent}${patchedReturn}`;
fs.writeFileSync(patternFile, `${lines.join('\n')}`);
