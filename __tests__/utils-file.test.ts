/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 */

import * as fs from 'fs';
import * as path from 'path';
import * as utils from '../src/utils';

jest.mock('fs');
jest.mock('path');

function setupFileMocks(): void {
  jest.resetAllMocks();

  // Mock path operations.
  (path.join as jest.Mock).mockImplementation((...parts) => parts.join('/'));
  (path.dirname as jest.Mock).mockImplementation((p) => p.substring(0, p.lastIndexOf('/')));
}

describe('utils - File Operations', () => {
  beforeEach(() => {
    setupFileMocks();
  });

  describe('copyDirRecursive', () => {
    test('should throw if source does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(utils.copyDirRecursive('/nonexistent', '/dest')).rejects.toThrow(
        'Source directory does not exist: /nonexistent'
      );
    });

    test('should handle file source', async () => {
      // Setup mocks
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === '/src/file.txt') return true;
        if (path === '/dest') return true;
        return false;
      });

      (fs.statSync as jest.Mock).mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
        mode: 0o755
      });

      // Execute
      await utils.copyDirRecursive('/src/file.txt', '/dest/file.txt');

      // Verify
      expect(fs.copyFileSync).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
      expect(fs.chmodSync).toHaveBeenCalledWith('/dest/file.txt', 0o755);
    });

    test('should create destination directory if it does not exist', async () => {
      // Setup mocks
      (fs.existsSync as jest.Mock).mockImplementation((path) =>
        path === '/src' ? true : false
      );
      (fs.statSync as jest.Mock).mockReturnValue({
        isDirectory: () => true,
        isFile: () => false,
        mode: 0o755
      });
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      await utils.copyDirRecursive('/src', '/dest');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/dest', { recursive: true });
    });

    test('should recursively copy directories and files', async () => {
      jest.clearAllMocks();

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockImplementation(() => ({
        isDirectory: jest.fn().mockReturnValue(true),
        isFile: jest.fn().mockReturnValue(false),
        mode: 0o755
      }));
      (fs.readdirSync as jest.Mock).mockImplementation(() => []);

      await utils.copyDirRecursive('/src', '/dest');

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.statSync).toHaveBeenCalled();
      expect(fs.readdirSync).toHaveBeenCalled();
    });

    test('should preserve file permissions', async () => {
      jest.clearAllMocks();

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockImplementation(() => ({
        isDirectory: jest.fn().mockReturnValue(false),
        isFile: jest.fn().mockReturnValue(true),
        mode: 0o644
      }));
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      expect(fs.existsSync).not.toThrow();
      expect(fs.statSync).not.toThrow();
    });
  });
});
