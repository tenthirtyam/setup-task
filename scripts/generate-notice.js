/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 */

/* eslint-env node */

/* global require, __dirname, console */

const fs = require('fs');
const path = require('path');

// Define file paths.
const licensesFilePath = path.resolve(__dirname, '../.licenses/licenses.json');
const noticeFilePath = path.resolve(__dirname, '../NOTICE.md');

// Helper function to read JSON data from a file.
function readJSONFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper function to write content to a file.
function writeToFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Generate the introductory text.
function generateIntroText() {
  return `# Notice

This product is licensed to you under the MIT License (the "License"). You may
use this product freely, including the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the product, subject to
the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the product.

This product includes a number of components with separate copyright
notices and license terms. Your use of the components is subject to the
terms and conditions of the component's license.

## Third-Party Licenses\n\n`;
}

// Generate the table header.
function generateTableHeader() {
  return `| Package | License |\n|---------|---------|\n`;
}

// Generate the table rows.
function generateTableRows(licensesData) {
  const uniquePackages = new Map();
  
  Object.entries(licensesData).forEach(([packageName, details]) => {
    let normalizedName;
    if (packageName.startsWith('@')) {
      const parts = packageName.split('/');
      if (parts.length >= 2) {
        const scope = parts[0];
        const pkgPart = parts[1].split('@')[0];
        normalizedName = `${scope}/${pkgPart}`;
      } else {
        normalizedName = packageName.split('@')[0];
      }
    } else {
      normalizedName = packageName.split('@')[0];
    }

    if (!uniquePackages.has(normalizedName)) {
      uniquePackages.set(normalizedName, {
        repository: details.repository || '#',
        licenses: details.licenses
      });
    }
  });

  return Array.from(uniquePackages.entries())
    .map(([packageName, details]) => {
      return `| [\`${packageName}\`](${details.repository}) | ${details.licenses} |`;
    })
    .join('\n');
}

// Generate the content.
function generateNoticeFile() {
  const licensesData = readJSONFile(licensesFilePath);

  const noticeContent = [
    generateIntroText(),
    generateTableHeader(),
    generateTableRows(licensesData),
  ].join('');

  writeToFile(noticeFilePath, noticeContent);
  console.log('==> NOTICE.md has been generated successfully.');
}

// Execute the script
generateNoticeFile();
