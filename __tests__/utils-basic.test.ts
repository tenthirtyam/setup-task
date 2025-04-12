/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
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
  (path.dirname as jest.Mock).mockImplementation((p) => p.substring(0, p.lastIndexOf('/')));
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

  describe('getExecutableDirectoryPath', () => {
    test('should return directory path when input is a file', () => {
      const result = utils.getExecutableDirectoryPath('/usr/bin/task');
      expect(result).toBe('/usr/bin');
      expect(path.dirname).toHaveBeenCalledWith('/usr/bin/task');
    });
  });

  describe('parseMultilineInput', () => {
    test('should handle empty input', () => {
      const result = utils.parseMultilineInput('');
      expect(result).toEqual([]);
    });

    test('should handle single line input', () => {
      const result = utils.parseMultilineInput('line1');
      expect(result).toEqual(['line1']);
    });

    test('should handle multiline input', () => {
      const result = utils.parseMultilineInput('line1\nline2\nline3');
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    test('should trim whitespace', () => {
      const result = utils.parseMultilineInput('  line1  \n  line2  ');
      expect(result).toEqual(['line1', 'line2']);
    });

    test('should skip empty lines', () => {
      const result = utils.parseMultilineInput('line1\n\nline2');
      expect(result).toEqual(['line1', 'line2']);
    });
  });

  describe('logAndFail', () => {
    test('should throw error with message', () => {
      expect(() => utils.logAndFail('test error')).toThrow('test error');
    });
  });
});
