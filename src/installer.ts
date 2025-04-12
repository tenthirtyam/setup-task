/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Installer for the Task CLI tool.
 */

import * as core from '@actions/core';
import * as toolCache from '@actions/tool-cache';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import {
  RELEASES_URL,
  OS_MAPPING,
  ARCH_MAPPING,
  EXE_EXTENSION
} from './constants';
import { fetchLatestRelease, logAndFail } from './utils';
import { TaskOptions } from './types';

// Set up required GitHub Actions environment variables if they don't exist
if (!process.env.RUNNER_TEMP) {
  process.env.RUNNER_TEMP = os.tmpdir();
  core.debug(`Setting RUNNER_TEMP to ${process.env.RUNNER_TEMP}`);
}

if (!process.env.RUNNER_TOOL_CACHE) {
  process.env.RUNNER_TOOL_CACHE = path.join(os.tmpdir(), 'runner', 'tools');
  // Ensure directory exists
  if (!fs.existsSync(process.env.RUNNER_TOOL_CACHE)) {
    fs.mkdirSync(process.env.RUNNER_TOOL_CACHE, { recursive: true });
  }
  core.debug(`Setting RUNNER_TOOL_CACHE to ${process.env.RUNNER_TOOL_CACHE}`);
}

/**
 * Install Task with the given options
 * @param options - Options for the installation
 * @returns Path to the installed Task
 */
export async function installTask(options: TaskOptions): Promise<string> {
  core.info('Starting Task installation process...');

  try {
    const { version: requestedVersion } = options;

    const version: string = requestedVersion === 'latest'
      ? await (async (): Promise<string> => {
          core.info('Retrieving latest version of Task...');
          try {
            const latestVersion: string = await fetchLatestRelease(options.githubToken);
            core.info(`Retrieved the latest version: ${latestVersion}`);
            return latestVersion;
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // If the version cannot be retrieved, log the error and throw an error to stop the action.
            core.error(`Failed to retrieve the latest version: ${errorMessage}`);
            throw new Error(`Unable to retrieve the latest version. Please specify a specific version instead of 'latest'.`);
          }
        })()
      : requestedVersion;

    const downloadUrl: string = getDownloadUrl(version);
    core.info(`Preparing to download Task from URL: ${downloadUrl}`);

    const downloadedPath: string = await toolCache.downloadTool(downloadUrl);
    core.debug(`Task downloaded successfully to: ${downloadedPath}`);

    const extractedPath: string = await (async (): Promise<string> => {
      try {
        if (downloadUrl.endsWith('.zip')) {
          return await toolCache.extractZip(downloadedPath);
        }
        if (downloadUrl.endsWith('.tar.gz')) {
          return await toolCache.extractTar(downloadedPath);
        }
        throw new Error(`Unsupported archive format encountered: ${downloadUrl}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Extraction failed. Error: ${errorMessage}`);
      }
    })();

    core.debug(`Task archive extracted to: ${extractedPath}`);

    const taskPath: string = findExecutable(extractedPath);

    if (!taskPath) {
      throw new Error(`Executable not found in extracted directory: ${extractedPath}`);
    }

    if (process.platform !== 'win32') {
      fs.chmodSync(taskPath, '755');
      core.debug(`Set executable permissions for Task at: ${taskPath}`);
    }

    core.info(`Task successfully installed at default location: ${taskPath}`);
    return taskPath;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    core.error(`Task installation failed. Error: ${errorMessage}`);
    logAndFail(`Installation process terminated. Error: ${errorMessage}`);
    throw error;
  }
}

/**
 * Get the download URL for the current platform
 * @param version Version of Task to download
 * @returns Download URL
 */
function getDownloadUrl(version: string): string {
  const platform: string = getPlatform();
  const arch: string = getArchitecture();
  const extension: string = process.platform === 'win32' ? 'zip' : 'tar.gz';

  return `${RELEASES_URL}/v${version}/task_${platform}_${arch}.${extension}`;
}

/**
 * Map the current platform to Task platform identifier
 * @returns Platform identifier for Task
 */
function getPlatform(): string {
  const platform: string = process.platform;
  const mappedPlatform: string | undefined = OS_MAPPING[platform];

  if (!mappedPlatform) {
    logAndFail(`Unsupported platform: ${platform}`);
    throw new Error(); // Will never reach here, but TypeScript needs it
  }

  return mappedPlatform;
}

/**
 * Map the current architecture to Task architecture identifier
 * @returns Architecture identifier for Task
 */
function getArchitecture(): string {
  const arch: string = process.arch;
  const mappedArch: string | undefined = ARCH_MAPPING[arch];

  if (!mappedArch) {
    logAndFail(`Unsupported architecture: ${arch}`);
    throw new Error(); // Will never reach here, but TypeScript needs it
  }

  return mappedArch;
}

/**
 * Find the Task executable in the extracted directory
 * @param extractedPath Path to the extracted directory
 * @returns Path to the executable
 */
function findExecutable(extractedPath: string): string {
  const executableName: string = `task${EXE_EXTENSION}`;
  core.debug(`Searching for executable: ${executableName} in directory: ${extractedPath}`);

  const checkDirectory = (dirPath: string): string | null => {
    const execPath: string = path.join(dirPath, executableName);
    if (fs.existsSync(execPath)) {
      core.debug(`Executable located at: ${execPath}`);
      return execPath;
    }
    return null;
  };

  const directPath: string | null = checkDirectory(extractedPath);
  if (directPath) return directPath;

  try {
    const entries: string[] = fs.readdirSync(extractedPath);
    core.debug(`Directory entries found: ${entries.length} in ${extractedPath}`);

    for (const entry of entries) {
      const entryPath: string = path.join(extractedPath, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        const execPath: string | null = checkDirectory(entryPath);
        if (execPath) return execPath;
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(`Error encountered while searching for executable. Error: ${errorMessage}`);
  }

  core.warning(`Executable not found: ${executableName} in directory: ${extractedPath}`);
  return '';
}
