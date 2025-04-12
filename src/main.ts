/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Entry point for the GitHub Action.
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { installTask } from './installer';
import { restoreCache, saveCache } from './cache';
import { TaskOptions } from './types';

const isVerbose = core.getInput('verbose') === 'true';

const logger = {
  debug: (message: string): void => {
    if (isVerbose) {
      core.debug(message);
    }
  },
  info: (message: string): void => {
    core.info(message);
  },
  warning: (message: string): void => {
    core.warning(message);
  },
  error: (message: string): void => {
    core.error(message);
  },
  setFailed: (message: string): void => {
    core.setFailed(message);
  },
  setOutput: (name: string, value: string): void => {
    core.setOutput(name, value);
  },
  addPath: (inputPath: string): void => {
    core.addPath(inputPath);
  },
  exportVariable: (name: string, val: string): void => {
    core.exportVariable(name, val);
  },
  getInput: (name: string, options?: core.InputOptions): string => {
    return core.getInput(name, options);
  }
};

/**
 * Extract inputs from GitHub Actions context.
 * @returns Parsed TaskOptions
 */
function getTaskOptions(): TaskOptions {
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
    } catch (error) {
      throw new Error(`Failed to read version from file ${versionFromFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (versionInput) {
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
async function isTaskInstalled(): Promise<boolean> {
  logger.debug('Checking if Task is already installed...');

  try {
    await exec.exec('which', ['task']);
    logger.info('Task is already installed.');
    return true;
  } catch {
    logger.debug('Task is not installed yet. Proceeding with installation.');
    return false;
  }
}

/**
 * Main function to run the GitHub Action.
 */
async function run(): Promise<void> {
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
    let taskPath: string;

    if (!taskAlreadyInstalled) {
      // Install if not already installed.
      taskPath = await (async (): Promise<string> => {
        // Restore from cache, if not skipped.
        if (!options.skipCache) {
          const cachedPath = await restoreCache(options.version);
          if (cachedPath) {
            return cachedPath;
          }
        }

        // Install if not found in cache.
        const installedPath = await installTask(options);

        // Save to cache, if not skipped.
        if (!options.skipCache) {
          await saveCache(installedPath, options.version);
        }

        return installedPath;
      })();
    } else {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.setFailed(`Task setup failed: ${errorMessage}`);
  }
}

/**
 * Verify that Task is correctly installed
 */
async function verifyInstallation(): Promise<void> {
  logger.info('Verifying Task installation...');

  try {
    // Get the installation path.
    const { stdout: taskPath } = await exec.getExecOutput('which', ['task'], { silent: true });
    logger.info(`Task found at path: ${taskPath.trim()}`);

    let output = '';

    const options = {
      listeners: {
        stdout: (data: Buffer): void => {
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
  } catch (error) {
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
export function processEnvVars(inputValue: string): boolean {
  if (!inputValue || !inputValue.trim()) {
    return false;
  }

  try {
    // Try parsing as YAML first.
    try {
      const envVars = yaml.load(inputValue) as Record<string, string>;
      if (typeof envVars === 'object' && envVars !== null) {
        for (const [key, value] of Object.entries(envVars)) {
          if (key) {
            const trimmedKey = key.trim();
            const trimmedValue = value?.trim() || '';
            process.env[trimmedKey] = trimmedValue;
            // Export using GitHub Actions' exportVariable to ensure it's available to subsequent steps.
            logger.exportVariable(trimmedKey, trimmedValue);
            if (isVerbose) {
              logger.debug(`Exported environment variable: ${trimmedKey}=${trimmedValue}`);
            }
          } else {
            logger.warning(`Invalid environment variable format: ${key}`);
          }
        }
        return true;
      }
    } catch (yamlError) {
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
          const trimmedValue = value?.trim() || '';
          process.env[trimmedKey] = trimmedValue;
          // Export using GitHub Actions' exportVariable to ensure it's available to subsequent steps.
          logger.exportVariable(trimmedKey, trimmedValue);
          if (isVerbose) {
            logger.debug(`Exported variable: ${trimmedKey}=${trimmedValue}`);
          }
        }
      } else {
        logger.warning(`Invalid variable format: ${line}`);
      }
    }

    return true;
  } catch (error) {
    logger.warning(`Error processing variables: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

export { getTaskOptions, isTaskInstalled };
