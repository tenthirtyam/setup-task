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
import { RELEASES_URL, OS_MAPPING, ARCH_MAPPING, EXE_EXTENSION } from './constants';
import { fetchLatestRelease, logAndFail } from './utils';
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
export async function installTask(options) {
    core.info('Starting Task installation process...');
    try {
        const { version: requestedVersion } = options;
        const version = requestedVersion === 'latest'
            ? await (async () => {
                core.info('Retrieving latest version of Task...');
                try {
                    const latestVersion = await fetchLatestRelease(options.githubToken);
                    core.info(`Retrieved the latest version: ${latestVersion}`);
                    return latestVersion;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    // If the version cannot be retrieved, log the error and throw an error to stop the action.
                    core.error(`Failed to retrieve the latest version: ${errorMessage}`);
                    throw new Error(`Unable to retrieve the latest version. Please specify a specific version instead of 'latest'.`, { cause: error });
                }
            })()
            : requestedVersion;
        const downloadUrl = getDownloadUrl(version);
        core.info(`Preparing to download Task from URL: ${downloadUrl}`);
        const downloadedPath = await toolCache.downloadTool(downloadUrl);
        core.debug(`Task downloaded successfully to: ${downloadedPath}`);
        const extractedPath = await (async () => {
            try {
                if (downloadUrl.endsWith('.zip')) {
                    return await toolCache.extractZip(downloadedPath);
                }
                if (downloadUrl.endsWith('.tar.gz')) {
                    return await toolCache.extractTar(downloadedPath);
                }
                throw new Error(`Unsupported archive format encountered: ${downloadUrl}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Extraction failed. Error: ${errorMessage}`, { cause: error });
            }
        })();
        core.debug(`Task archive extracted to: ${extractedPath}`);
        const taskPath = findExecutable(extractedPath);
        if (!taskPath) {
            throw new Error(`Executable not found in extracted directory: ${extractedPath}`);
        }
        if (process.platform !== 'win32') {
            fs.chmodSync(taskPath, '755');
            core.debug(`Set executable permissions for Task at: ${taskPath}`);
        }
        core.info(`Task successfully installed at default location: ${taskPath}`);
        return taskPath;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
function getDownloadUrl(version) {
    const platform = getPlatform();
    const arch = getArchitecture();
    const extension = process.platform === 'win32' ? 'zip' : 'tar.gz';
    return `${RELEASES_URL}/v${version}/task_${platform}_${arch}.${extension}`;
}
/**
 * Map the current platform to Task platform identifier
 * @returns Platform identifier for Task
 */
function getPlatform() {
    const platform = process.platform;
    const mappedPlatform = OS_MAPPING[platform];
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
function getArchitecture() {
    const arch = process.arch;
    const mappedArch = ARCH_MAPPING[arch];
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
function findExecutable(extractedPath) {
    const executableName = `task${EXE_EXTENSION}`;
    core.debug(`Searching for executable: ${executableName} in directory: ${extractedPath}`);
    const checkDirectory = (dirPath) => {
        const execPath = path.join(dirPath, executableName);
        if (fs.existsSync(execPath)) {
            core.debug(`Executable located at: ${execPath}`);
            return execPath;
        }
        return null;
    };
    const directPath = checkDirectory(extractedPath);
    if (directPath)
        return directPath;
    try {
        const entries = fs.readdirSync(extractedPath);
        core.debug(`Directory entries found: ${entries.length} in ${extractedPath}`);
        for (const entry of entries) {
            const entryPath = path.join(extractedPath, entry);
            if (fs.statSync(entryPath).isDirectory()) {
                const execPath = checkDirectory(entryPath);
                if (execPath)
                    return execPath;
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`Error encountered while searching for executable. Error: ${errorMessage}`);
    }
    core.warning(`Executable not found: ${executableName} in directory: ${extractedPath}`);
    return '';
}
