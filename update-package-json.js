/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Script to update package.json for GitHub Action.
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

packageJson.description = "A GitHub Action for efficiently setting up Task (go-task/task) task runner in GitHub Actions.";

packageJson.scripts = {
  "test": "jest",
  "test:memory": "node --expose-gc --max-old-space-size=4096 node_modules/.bin/jest --runInBand --detectOpenHandles --forceExit",
  "build": "tsc",
  "lint": "eslint 'src/**/*.ts' '__tests__/**/*.ts'",
  "lint:fix": "eslint --fix 'src/**/*.ts' '__tests__/**/*.ts'",
  "format": "prettier --write 'src/**/*.ts' '__tests__/**/*.ts'",
  "clean": "rm -rf dist coverage"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ package.json description and scripts updated successfully!');
