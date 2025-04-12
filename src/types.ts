/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 *
 * Options for the Task installation.
 */

export interface TaskOptions {
  /**
   * Version of Task to install (e.g., 'latest' or 'x.y.z'.)
   */
  version: string;

  /**
   * Whether to skip using the cache.
   */
  skipCache: boolean;

  /**
   * GitHub token for authenticating API requests.
   */
  githubToken?: string;
}
