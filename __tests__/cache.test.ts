/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 */

import * as core from '@actions/core';
import * as actionsCache from '@actions/cache';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cache from '../src/cache';
import * as utils from '../src/utils';

// Mock all external modules
jest.mock('@actions/core');
jest.mock('@actions/cache');
jest.mock('fs');
jest.mock('os');
jest.mock('path');
jest.mock('../src/utils');

function setupFileSystemMocks(): void {
  jest.resetAllMocks();
  (fs.existsSync as jest.Mock).mockReturnValue(true);
  (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
  (fs.chmodSync as jest.Mock).mockReturnValue(undefined);
}

describe('cache', () => {
  const mockVersion = '3.43.1';
  const mockPlatform = 'linux';
  const mockArch = 'x64';
  const mockCacheDir = '/tmp/task-runner';
  const mockTaskPath = '/cached/path/to/task';

  beforeEach(() => {
    setupFileSystemMocks();

    // Mock platform and arch for OS module
    (os.platform as jest.Mock).mockReturnValue(mockPlatform);
    (os.arch as jest.Mock).mockReturnValue(mockArch);

    // Mock process.platform and process.arch to ensure consistency in tests
    // These are what the cache.ts module uses to build the cache key
    Object.defineProperty(process, 'platform', { value: mockPlatform });
    Object.defineProperty(process, 'arch', { value: mockArch });

    // Mock path operations
    (path.join as jest.Mock).mockImplementation((...parts) => parts.join('/'));

    // Mock utils
    (utils.getCacheDirectory as jest.Mock).mockReturnValue(mockCacheDir);
    (utils.copyDirRecursive as jest.Mock).mockResolvedValue(undefined);
  });

  describe('restoreCache', () => {
    test('should return empty string if cache is not found', async () => {
      // Mock cache miss.
      (actionsCache.restoreCache as jest.Mock).mockResolvedValue(undefined);

      const result = await cache.restoreCache(mockVersion);

      // Verify attempt to restore cache.
      expect(actionsCache.restoreCache).toHaveBeenCalledWith(
        [mockCacheDir],
        expect.stringContaining(`task-runner-${mockVersion}-${mockPlatform}-${mockArch}`)
      );

      // Verify empty result on cache miss.
      expect(result).toBe('');
    });

    test('should return path if cache is found and valid', async () => {
      // Mock cache hit.
      (actionsCache.restoreCache as jest.Mock).mockResolvedValue(mockCacheDir);

      // Mock executable exists.
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await cache.restoreCache(mockVersion);

      // Verify executable permissions set.
      expect(fs.chmodSync).toHaveBeenCalledWith(expect.any(String), '755');

      // Verify return path.
      expect(result).toBe(path.join(mockCacheDir, 'task'));
    });

    test('should return empty string if executable not found in cache', async () => {
      // Mock cache hit but invalid.
      (actionsCache.restoreCache as jest.Mock).mockResolvedValue(mockCacheDir);

      // Mock executable not found.
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        if (p.includes('task')) return false;
        return true;
      });

      const result = await cache.restoreCache(mockVersion);

      // Verify warning logged.
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('not found'));

      // Verify empty result on invalid cache.
      expect(result).toBe('');
    });

    test('should handle errors gracefully', async () => {
      // Mock error during cache restore.
      (actionsCache.restoreCache as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const result = await cache.restoreCache(mockVersion);

      // Verify warning logged.
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to restore from cache'));

      // Verify empty result on error.
      expect(result).toBe('');
    });
  });

  describe('saveCache', () => {
    test('should create cache directory if it does not exist', async () => {
      // Mock directory doesn't exist.
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await cache.saveCache(mockTaskPath, mockVersion);

      // Verify directory creation.
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockCacheDir, { recursive: true });
    });

    test('should copy Task to cache directory', async () => {
      await cache.saveCache(mockTaskPath, mockVersion);

      // Verify copy operation.
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    test('should save to cache with correct key', async () => {
      await cache.saveCache(mockTaskPath, mockVersion);

      // Verify cache save.
      expect(actionsCache.saveCache).toHaveBeenCalledWith(
        [mockCacheDir],
        expect.stringContaining(`task-runner-${mockVersion}-${mockPlatform}-${mockArch}`)
      );
    });

    test('should handle cache save errors gracefully', async () => {
      // Mock error during cache save.
      (actionsCache.saveCache as jest.Mock).mockRejectedValue(new Error('Cache save error'));

      await cache.saveCache(mockTaskPath, mockVersion);

      // Verify warning logged but action continues.
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to save cache'));
    });

    test('should handle general errors gracefully', async () => {
      // Mock error during copy process.
      (fs.copyFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Copy error');
      });

      await cache.saveCache(mockTaskPath, mockVersion);

      // Verify warning logged.
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to save Task to cache'));
    });
  });
});
