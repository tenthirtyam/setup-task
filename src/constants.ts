/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Constants for the GitHub Action.
 */

// API endpoint for fetching release information.
export const RELEASES_API_URL = 'https://api.github.com/repos/go-task/task/releases';

// OS mapping for download paths.
export const OS_MAPPING: Record<string, string> = {
  'win32': 'windows',
  'darwin': 'darwin',
  'linux': 'linux'
};

// Architecture mapping for download paths.
export const ARCH_MAPPING: Record<string, string> = {
  'x64': 'amd64',
  'arm64': 'arm64',
  'arm': 'arm'
};

// Extension for executable based on platform.
export const EXE_EXTENSION = process.platform === 'win32' ? '.exe' : '';

// Cache directory name.
export const CACHE_DIR = 'task-runner';

// Base URL for Task releases.
export const RELEASES_URL = 'https://github.com/go-task/task/releases/download';
