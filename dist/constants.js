"use strict";
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Constants for the GitHub Action.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASES_URL = exports.CACHE_DIR = exports.EXE_EXTENSION = exports.ARCH_MAPPING = exports.OS_MAPPING = exports.RELEASES_API_URL = void 0;
// API endpoint for fetching release information.
exports.RELEASES_API_URL = 'https://api.github.com/repos/go-task/task/releases';
// OS mapping for download paths.
exports.OS_MAPPING = {
    'win32': 'windows',
    'darwin': 'darwin',
    'linux': 'linux'
};
// Architecture mapping for download paths.
exports.ARCH_MAPPING = {
    'x64': 'amd64',
    'arm64': 'arm64',
    'arm': 'arm'
};
// Extension for executable based on platform.
exports.EXE_EXTENSION = process.platform === 'win32' ? '.exe' : '';
// Cache directory name.
exports.CACHE_DIR = 'task-runner';
// Base URL for Task releases.
exports.RELEASES_URL = 'https://github.com/go-task/task/releases/download';
