/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 */

import * as toolCache from '@actions/tool-cache';
import * as fs from 'fs';
import { TaskOptions } from '../src/types';
import { installTask } from '../src/installer';

jest.mock('@actions/core');
jest.mock('@actions/tool-cache');
jest.mock('fs');

describe('Task Installer', () => {
  let mockOptions: TaskOptions;

  beforeEach(() => {
    jest.resetAllMocks();
    
    mockOptions = {
      version: '3.43.1',
      skipCache: true,
    };
    
    Object.defineProperty(process, 'platform', { value: 'linux' });
    Object.defineProperty(process, 'arch', { value: 'x64' });
    
    (toolCache.downloadTool as jest.Mock).mockResolvedValue('/tmp/downloaded-task.tar.gz');
    (toolCache.extractTar as jest.Mock).mockResolvedValue('/tmp/extracted-task');
    (toolCache.extractZip as jest.Mock).mockResolvedValue('/tmp/extracted-task');

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
  });

  it('should download and extract Task', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath.includes('task');
    });

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ tag_name: 'v3.43.1' })
      })
    ) as jest.Mock;

    try {
      const result = await installTask(mockOptions);
      expect(toolCache.downloadTool).toHaveBeenCalledWith(expect.stringContaining('task_linux_amd64.tar.gz'));
      expect(toolCache.extractTar).toHaveBeenCalledWith('/tmp/downloaded-task.tar.gz');
      expect(result).toContain('task');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
