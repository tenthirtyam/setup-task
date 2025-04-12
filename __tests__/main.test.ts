import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import { getTaskOptions, isTaskInstalled } from '../src/main';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('fs');

describe('getTaskOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws error if both version and version-from-file are provided', () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'version') {
        return '3.43.1';
      }
      if (name === 'version-from-file') {
        return 'version.txt';
      }
      return '';
    });
    expect(() => getTaskOptions()).toThrow(
      'Both version and version-from-file inputs cannot be used together. Please specify only one.'
    );
  });

  test('reads version from file when version-from-file is provided', () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'version-from-file') {
        return '.task-version';
      }
      return '';
    });
    
    (fs.readFileSync as jest.Mock).mockReturnValue('3.42.0\n');
    
    const options = getTaskOptions();
    expect(options.version).toBe('3.42.0');
    expect(fs.readFileSync).toHaveBeenCalledWith('.task-version', 'utf8');
  });
  
  test('uses default version when neither version nor version-from-file is provided', () => {
    (core.getInput as jest.Mock).mockReturnValue('');
    
    const options = getTaskOptions();
    expect(options.version).toBe('latest');
  });
});

describe('isTaskInstalled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('returns true when Task is installed', async () => {
    (exec.exec as jest.Mock).mockResolvedValue(0);
    await expect(isTaskInstalled()).resolves.toBe(true);
    expect(exec.exec).toHaveBeenCalledWith('which', ['task']);
  });
  
  test('returns false when Task is not installed', async () => {
    (exec.exec as jest.Mock).mockRejectedValue(new Error('not found'));
    await expect(isTaskInstalled()).resolves.toBe(false);
    expect(exec.exec).toHaveBeenCalledWith('which', ['task']);
  });
});
