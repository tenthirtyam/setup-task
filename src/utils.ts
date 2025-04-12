/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Utility functions for the GitHub Action.
 */

import * as core from '@actions/core';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { RELEASES_API_URL, CACHE_DIR } from './constants';

/**
 * Get the cache directory for Task
 * @returns Path to cache directory
 */
export function getCacheDirectory(): string {
  return path.join(os.tmpdir(), CACHE_DIR);
}

/**
 * Get the directory path containing the Task executable.
 * @param taskPath Path to Task installation
 * @returns Directory containing the Task executable
 */
export function getExecutableDirectoryPath(taskPath: string): string {
  return path.dirname(taskPath);
}

/**
 * Copy a directory recursively with improved handling of deep directories.
 * @param src Source directory
 * @param dest Destination directory
 * @throws Error if source directory does not exist
 */
export async function copyDirRecursive(src: string, dest: string): Promise<void> {
  // Validate source exists.
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  const srcStats = fs.statSync(src);
  if (srcStats.isFile()) {
    // Create destination directory, if required.
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // For single file copy, use the file name if the destination is a directory.
    const fileName = path.basename(src);
    const destPath = fs.existsSync(dest) && fs.statSync(dest).isDirectory()
      ? path.join(dest, fileName)
      : dest;

    // Copy with original permissions.
    fs.copyFileSync(src, destPath);
    fs.chmodSync(destPath, srcStats.mode);
    return;
  }

  // Create destination directory, if required.
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Use a queue-based approach to avoid stack overflow with deep directory structures.
  const queue: Array<{src: string, dest: string}> = [{ src, dest }];

  // Process entries in breadth-first order.
  while (queue.length > 0) {
    const { src: currentSrc, dest: currentDest } = queue.shift()!;

    // Read directory entries.
    const entries = fs.readdirSync(currentSrc, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrc, entry.name);
      const destPath = path.join(currentDest, entry.name);

      if (entry.isDirectory()) {
        // Create the destination directory.
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        // Add to queue instead of recursive call.
        queue.push({ src: srcPath, dest: destPath });
      } else {
        // Copy file directly and preserve permissions.
        fs.copyFileSync(srcPath, destPath);

        // Copy permissions from source.
        const stats = fs.statSync(srcPath);
        fs.chmodSync(destPath, stats.mode);
      }
    }
  }
}

/**
 * Extracts version from tag name by removing 'v' prefix if present
 * @param tagName The tag name from GitHub release
 * @returns Clean version string
 */
function cleanVersionFromTag(tagName: string): string {
  return tagName.startsWith('v') ? tagName.substring(1) : tagName;
}

/**
 * Fetch the latest release version from GitHub
 * @param githubToken Optional GitHub token for authentication
 * @returns Latest version string
 */
export async function fetchLatestRelease(githubToken?: string): Promise<string> {
  try {
    const endpoint: string = `${RELEASES_API_URL}/latest`;

    const headers: Record<string, string> = {};
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    const response: Response = await fetch(endpoint, { headers });

    if (!response.ok) {
      const errorBody: string = await response.text();
      throw new Error(`HTTP Error: ${response.status} - ${errorBody}`);
    }

    const data: { tag_name?: string } = await response.json();

    if (!data || !data.tag_name) {
      throw new Error('Invalid response format or no releases found');
    }

    return cleanVersionFromTag(data.tag_name);
  } catch (error: unknown) {
    throw new Error(`Failed to fetch release information from ${RELEASES_API_URL}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parses a multiline input string into an array of strings
 * @param input The multiline input string
 * @returns Array of trimmed non-empty lines
 */
export function parseMultilineInput(input: string): string[] {
  if (!input) {
    return [];
  }

  return input
    .split('\n')
    .map((s: string) => s.trim())
    .filter((s: string) => s !== '');
}

/**
 * Validates and logs errors for requirements
 * @param message Error message to display
 */
export function logAndFail(message: string): never {
  core.setFailed(message);
  throw new Error(message);
}
