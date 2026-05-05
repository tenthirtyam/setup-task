/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025-2026 Ryan Johnson
 *
 * Setup file for Jest tests.
 */

const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

// Enable mocks for @actions packages (implementations in __mocks__ directory)
jest.mock('@actions/core');
jest.mock('@actions/tool-cache');
jest.mock('@actions/cache');
jest.mock('@actions/exec');

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
