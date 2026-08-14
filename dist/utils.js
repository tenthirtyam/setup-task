/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025-2026 Ryan Johnson
 *
 * Utility functions for the GitHub Action.
 */
import * as core from '@actions/core';
import * as os from 'os';
import * as path from 'path';
import { RELEASES_API_URL, CACHE_DIR } from './constants';
/**
 * Get the cache directory for Task
 * @returns Path to cache directory
 */
export function getCacheDirectory() {
    return path.join(os.tmpdir(), CACHE_DIR);
}
/**
 * Extracts version from tag name by removing 'v' prefix if present
 * @param tagName The tag name from GitHub release
 * @returns Clean version string
 */
function cleanVersionFromTag(tagName) {
    return tagName.startsWith('v') ? tagName.substring(1) : tagName;
}
/**
 * Fetch the latest release version from GitHub
 * @param githubToken Optional GitHub token for authentication
 * @returns Latest version string
 */
export async function fetchLatestRelease(githubToken) {
    try {
        const endpoint = `${RELEASES_API_URL}/latest`;
        const headers = {};
        if (githubToken) {
            headers['Authorization'] = `Bearer ${githubToken}`;
        }
        const response = await fetch(endpoint, { headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${errorBody}`);
        }
        const data = await response.json();
        if (!data || !data.tag_name) {
            throw new Error('Invalid response format or no releases found');
        }
        return cleanVersionFromTag(data.tag_name);
    }
    catch (error) {
        throw new Error(`Failed to fetch release information from ${RELEASES_API_URL}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
}
/**
 * Validates and logs errors for requirements
 * @param message Error message to display
 */
export function logAndFail(message) {
    core.setFailed(message);
    throw new Error(message);
}
