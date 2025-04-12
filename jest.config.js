/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Jest configuration optimized for memory usage and performance.
 */

module.exports = {
  // Test configuration.
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Optimize for memory usage
  maxWorkers: 1,            // Run tests sequentially to reduce memory pressure.
  forceExit: true,          // Force exit the Jest process once all tests complete.
  detectOpenHandles: true,  // Detect open handles to prevent memory leaks.
  testTimeout: 30000,       // Longer timeout for network operations.

  // Transform with ts-jest.
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json', // Use test-specific tsconfig.
      diagnostics: {
        warnOnly: true, // Only warn on TS errors to reduce memory impact.
        ignoreCodes: [
          2571, // Object is of type 'unknown'.
          6133, // Unused variable.
          18003 // No inputs were found in config file.
        ]
      }
    }]
  },

  // Reporting and coverage - disable by default for better performance.
  // Enable explicitly with --coverage flag only when needed.
  verbose: true,
  coverageDirectory: "./coverage/",
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/types.ts",
    "!src/constants.ts"
  ],

  // Setup for Node.js compatibility with @actions packages.
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
