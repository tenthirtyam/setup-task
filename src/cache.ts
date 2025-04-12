/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Cache management for GitHub Action.
 */

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as path from 'path';
import * as fs from 'fs';
import { getCacheDirectory } from './utils';

/**
 * Get the cache key for a specific version
 * @param version Task version
 * @returns Cache key
 */
function getCacheKey(version: string): string {
  const platform = process.platform;
  const arch = process.arch;
  return `task-runner-${version}-${platform}-${arch}`;
}

/**
 * Gets the executable filename with appropriate extension for the current platform
 * @returns Task executable filename
 */
function getTaskExecutableName(): string {
  const exeExt = process.platform === 'win32' ? '.exe' : '';
  return `task${exeExt}`;
}

/**
 * Restore Task from cache
 * @param version Task version
 * @returns Path to the restored Task or empty string if not found
 */
export async function restoreCache(version: string): Promise<string> {
  const cacheDir: string = getCacheDirectory();
  const cacheKey: string = getCacheKey(version);
  const executableName: string = getTaskExecutableName();

  try {
    core.debug(`Looking for Task ${version} in cache with key ${cacheKey}`);

    const hitKey: string | undefined = await cache.restoreCache([cacheDir], cacheKey);

    if (!hitKey) {
      core.debug(`Task ${version} not found in cache`);
      return '';
    }

    core.info(`Task ${version} found in cache`);

    const taskPath: string = path.join(cacheDir, executableName);

    if (!fs.existsSync(taskPath)) {
      core.warning(`Cache was hit but Task was not found at ${taskPath}`);
      return '';
    }

    core.debug(`Verified Task exists at ${taskPath}`);

    if (process.platform !== 'win32') {
      fs.chmodSync(taskPath, '755');
    }

    return taskPath;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    core.warning(`Failed to restore from cache: ${errorMessage}`);
    return '';
  }
}

/**
 * Save Task to cache
 * @param taskPath Path to the Task executable
 * @param version Task version
 */
export async function saveCache(taskPath: string, version: string): Promise<void> {
  const cacheDir: string = getCacheDirectory();
  const cacheKey: string = getCacheKey(version);
  const executableName: string = getTaskExecutableName();

  try {
    core.debug(`Saving Task ${version} to cache with key ${cacheKey}`);

    fs.mkdirSync(cacheDir, { recursive: true });

    const destPath: string = path.join(cacheDir, executableName);

    if (taskPath !== destPath) {
      core.debug(`Copying ${taskPath} to ${destPath}`);
      fs.copyFileSync(taskPath, destPath);
    }

    await cache.saveCache([cacheDir], cacheKey);
    core.info(`Task ${version} saved to cache`);
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    core.warning(`Failed to save Task to cache: ${errorMessage}`);
    core.warning(`Failed to save cache: ${errorMessage}`);
  }
}
