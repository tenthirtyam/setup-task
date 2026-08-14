/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025-2026 Ryan Johnson
 */

import * as os from 'os';
import * as path from 'path';
import * as utils from '../src/utils';

// Mock only the modules needed for basic tests
// fs is mocked but not directly used
jest.mock('fs');
jest.mock('os');
jest.mock('path');

// Consolidated helper function for repetitive mock setups
function setupPathAndOSMocks(): void {
  jest.resetAllMocks();
  (path.join as jest.Mock).mockImplementation((...parts) => parts.join('/'));
  (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
}

beforeEach(() => {
  setupPathAndOSMocks();
});

describe('utils - Basic Functions', () => {
  describe('getCacheDirectory', () => {
    test('should return the correct cache directory path', () => {
      const result = utils.getCacheDirectory();
      expect(result).toBe('/tmp/task-runner');
      expect(os.tmpdir).toHaveBeenCalled();
    });
  });

  describe('logAndFail', () => {
    test('should throw error with message', () => {
      expect(() => utils.logAndFail('test error')).toThrow('test error');
    });
  });
});
