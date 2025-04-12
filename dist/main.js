"use strict";
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Entry point for the GitHub Action.
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
exports.processEnvVars = processEnvVars;
exports.getTaskOptions = getTaskOptions;
exports.isTaskInstalled = isTaskInstalled;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const installer_1 = require("./installer");
const cache_1 = require("./cache");
const isVerbose = core.getInput('verbose') === 'true';
const logger = {
    debug: (message) => {
        if (isVerbose) {
            core.debug(message);
        }
    },
    info: (message) => {
        core.info(message);
    },
    warning: (message) => {
        core.warning(message);
    },
    error: (message) => {
        core.error(message);
    },
    setFailed: (message) => {
        core.setFailed(message);
    },
    setOutput: (name, value) => {
        core.setOutput(name, value);
    },
    addPath: (inputPath) => {
        core.addPath(inputPath);
    },
    exportVariable: (name, val) => {
        core.exportVariable(name, val);
    },
    getInput: (name, options) => {
        return core.getInput(name, options);
    }
};
/**
 * Extract inputs from GitHub Actions context.
 * @returns Parsed TaskOptions
 */
function getTaskOptions() {
    const versionFromFile = logger.getInput('version-from-file');
    const versionInput = logger.getInput('version');
    // Log all environment variables if in verbose mode to help debugging
    if (isVerbose) {
        logger.debug('Environment variables:');
        Object.keys(process.env)
            .filter(key => key.startsWith('INPUT_'))
            .forEach(key => {
            logger.debug(`${key}=${process.env[key]}`);
        });
    }
    logger.debug(`Raw inputs - version: '${versionInput}', version-from-file: '${versionFromFile}'`);
    // In GitHub Actions, when using with: syntax, the input will have an environment variable
    // If 'version' doesn't appear in the workflow YAML but has a default, we should allow 'version-from-file'
    const workflowContent = process.env.GITHUB_WORKFLOW_REF
        ? `Workflow: ${process.env.GITHUB_WORKFLOW_REF}`
        : 'Workflow reference not available';
    logger.debug(workflowContent);
    // Only throw an error if version-from-file is set AND version is explicitly set to something other than default
    if (versionFromFile && versionInput && versionInput !== 'latest') {
        throw new Error('Both version and version-from-file inputs cannot be used together. Please specify only one.');
    }
    let version = 'latest';
    if (versionFromFile) {
        try {
            const fileContent = fs.readFileSync(versionFromFile, 'utf8');
            if (fileContent) {
                version = fileContent.trim();
                logger.debug(`Using version '${version}' from file ${versionFromFile}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to read version from file ${versionFromFile}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    else if (versionInput) {
        version = versionInput;
        logger.debug(`Using version from input: ${version}`);
    }
    return {
        version,
        skipCache: logger.getInput('skip-cache') === 'true',
        githubToken: logger.getInput('github-token') || ''
    };
}
/**
 * Check if Task is already installed.
 */
async function isTaskInstalled() {
    logger.debug('Checking if Task is already installed...');
    try {
        await exec.exec('which', ['task']);
        logger.info('Task is already installed.');
        return true;
    }
    catch {
        logger.debug('Task is not installed yet. Proceeding with installation.');
        return false;
    }
}
/**
 * Main function to run the GitHub Action.
 */
async function run() {
    try {
        logger.info('Setting up Task...');
        // Get options from inputs.
        const options = getTaskOptions();
        // Process variables from input.
        const envVarsInput = logger.getInput('vars');
        if (envVarsInput) {
            processEnvVars(envVarsInput);
        }
        // Check if already installed.
        const taskAlreadyInstalled = await isTaskInstalled();
        // If already installed, skip the installation process.
        let taskPath;
        if (!taskAlreadyInstalled) {
            // Install if not already installed.
            taskPath = await (async () => {
                // Restore from cache, if not skipped.
                if (!options.skipCache) {
                    const cachedPath = await (0, cache_1.restoreCache)(options.version);
                    if (cachedPath) {
                        return cachedPath;
                    }
                }
                // Install if not found in cache.
                const installedPath = await (0, installer_1.installTask)(options);
                // Save to cache, if not skipped.
                if (!options.skipCache) {
                    await (0, cache_1.saveCache)(installedPath, options.version);
                }
                return installedPath;
            })();
        }
        else {
            // If already installed, retrieve the path.
            const { stdout } = await exec.getExecOutput('which', ['task'], { silent: true });
            taskPath = stdout.trim();
            logger.info(`Using existing Task installation at: ${taskPath}`);
        }
        // Add to PATH.
        const taskDir = path.dirname(taskPath);
        logger.addPath(taskDir);
        // Set output for the action.
        logger.setOutput('task-path', taskPath);
        // Verify the installation.
        await verifyInstallation();
        logger.info('Task setup completed successfully! 🎉');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.setFailed(`Task setup failed: ${errorMessage}`);
    }
}
/**
 * Verify that Task is correctly installed
 */
async function verifyInstallation() {
    logger.info('Verifying Task installation...');
    try {
        // Get the installation path.
        const { stdout: taskPath } = await exec.getExecOutput('which', ['task'], { silent: true });
        logger.info(`Task found at path: ${taskPath.trim()}`);
        let output = '';
        const options = {
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                }
            }
        };
        // Use the full path to the executable for verification.
        const execPath = taskPath.trim();
        logger.info(`Executing: ${execPath} --version`);
        await exec.exec(execPath, ['--version'], options);
        // Different versions may have different version output formats.
        // Some versions might output "Task version: X.Y.Z" while others might just output "X.Y.Z"
        // Check if the output contains a version number.
        if (output.trim().length === 0) {
            throw new Error('Task verification failed: No version returned from Task');
        }
        logger.info(`Task verification successful: ${output.trim()}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Task verification error: ${errorMessage}`);
        throw new Error(`Task verification failed: ${errorMessage}`);
    }
}
// Run the action and handle errors.
void run().catch(error => {
    logger.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
});
/**
 * Process environment variables from input.
 * @param inputValue The environment variables input value
 * @returns true if processing succeeded, false otherwise
 */
function processEnvVars(inputValue) {
    if (!inputValue || !inputValue.trim()) {
        return false;
    }
    try {
        // Try parsing as YAML first.
        try {
            const envVars = yaml.load(inputValue);
            if (typeof envVars === 'object' && envVars !== null) {
                for (const [key, value] of Object.entries(envVars)) {
                    if (key) {
                        const trimmedKey = key.trim();
                        const trimmedValue = (value === null || value === void 0 ? void 0 : value.trim()) || '';
                        process.env[trimmedKey] = trimmedValue;
                        // Export using GitHub Actions' exportVariable to ensure it's available to subsequent steps.
                        logger.exportVariable(trimmedKey, trimmedValue);
                        if (isVerbose) {
                            logger.debug(`Exported environment variable: ${trimmedKey}=${trimmedValue}`);
                        }
                    }
                    else {
                        logger.warning(`Invalid environment variable format: ${key}`);
                    }
                }
                return true;
            }
        }
        catch (yamlError) {
            // If YAML parsing fails, log the error but continue to try the key-value format.
            if (isVerbose) {
                logger.debug(`YAML parsing failed, trying key-value format: ${yamlError instanceof Error ? yamlError.message : String(yamlError)}`);
            }
        }
        // Parse as key-value pairs.
        const lines = inputValue.split('\n').map(line => line.trim()).filter(Boolean);
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const [, key, value] = match;
                if (key) {
                    const trimmedKey = key.trim();
                    const trimmedValue = (value === null || value === void 0 ? void 0 : value.trim()) || '';
                    process.env[trimmedKey] = trimmedValue;
                    // Export using GitHub Actions' exportVariable to ensure it's available to subsequent steps.
                    logger.exportVariable(trimmedKey, trimmedValue);
                    if (isVerbose) {
                        logger.debug(`Exported variable: ${trimmedKey}=${trimmedValue}`);
                    }
                }
            }
            else {
                logger.warning(`Invalid variable format: ${line}`);
            }
        }
        return true;
    }
    catch (error) {
        logger.warning(`Error processing variables: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
