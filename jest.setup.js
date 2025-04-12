/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Setup file for Jest tests.
 */

const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  exportVariable: jest.fn(),
  addPath: jest.fn()
}));

jest.mock('@actions/tool-cache', () => ({
  downloadTool: jest.fn(),
  extractTar: jest.fn(),
  extractZip: jest.fn()
}));

jest.mock('@actions/cache', () => ({
  saveCache: jest.fn(),
  restoreCache: jest.fn()
}));

jest.mock('@actions/exec', () => ({
  exec: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  readdirSync: jest.fn(),
  chmodSync: jest.fn(),
  copyFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));
