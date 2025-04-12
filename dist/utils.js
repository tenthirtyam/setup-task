"use strict";
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Utility functions for the GitHub Action.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheDirectory = getCacheDirectory;
exports.getExecutableDirectoryPath = getExecutableDirectoryPath;
exports.copyDirRecursive = copyDirRecursive;
exports.fetchLatestRelease = fetchLatestRelease;
exports.parseMultilineInput = parseMultilineInput;
exports.logAndFail = logAndFail;
const core = __importStar(require("@actions/core"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const constants_1 = require("./constants");
/**
 * Get the cache directory for Task
 * @returns Path to cache directory
 */
function getCacheDirectory() {
    return path.join(os.tmpdir(), constants_1.CACHE_DIR);
}
/**
 * Get the directory path containing the Task executable.
 * @param taskPath Path to Task installation
 * @returns Directory containing the Task executable
 */
function getExecutableDirectoryPath(taskPath) {
    return path.dirname(taskPath);
}
/**
 * Copy a directory recursively with improved handling of deep directories.
 * @param src Source directory
 * @param dest Destination directory
 * @throws Error if source directory does not exist
 */
async function copyDirRecursive(src, dest) {
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
    const queue = [{ src, dest }];
    // Process entries in breadth-first order.
    while (queue.length > 0) {
        const { src: currentSrc, dest: currentDest } = queue.shift();
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
            }
            else {
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
function cleanVersionFromTag(tagName) {
    return tagName.startsWith('v') ? tagName.substring(1) : tagName;
}
/**
 * Fetch the latest release version from GitHub
 * @param githubToken Optional GitHub token for authentication
 * @returns Latest version string
 */
async function fetchLatestRelease(githubToken) {
    try {
        const endpoint = `${constants_1.RELEASES_API_URL}/latest`;
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
        throw new Error(`Failed to fetch release information from ${constants_1.RELEASES_API_URL}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Parses a multiline input string into an array of strings
 * @param input The multiline input string
 * @returns Array of trimmed non-empty lines
 */
function parseMultilineInput(input) {
    if (!input) {
        return [];
    }
    return input
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s !== '');
}
/**
 * Validates and logs errors for requirements
 * @param message Error message to display
 */
function logAndFail(message) {
    core.setFailed(message);
    throw new Error(message);
}
