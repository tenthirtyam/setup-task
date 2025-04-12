/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 */

import * as https from 'https';
import * as http from 'http';
import * as utils from '../src/utils';
import {
  MockRequest,
  MockResponse,
  MockHttpsModule,
  MockHttpModule,
  createMockHttpObjects,
  setupHttpMocks
} from './test-utils';
import { fetchLatestRelease } from '../src/utils';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.mock('https');
jest.mock('http');

jest.spyOn(global, 'fetch').mockRestore(); // Ensure no conflicts with fetchMock

describe('utils - Network Operations', () => {
  let mockResponse: MockResponse;
  let mockRequest: MockRequest;

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
    const mocks = createMockHttpObjects(200);
    mockRequest = mocks.mockRequest;
    mockResponse = mocks.mockResponse;
    setupHttpMocks(https as unknown as MockHttpsModule, http as unknown as MockHttpModule, mockRequest, mockResponse);
  });

  describe('fetchLatestRelease', () => {
    test('should parse and return the latest version', async () => {
      mockRequest.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'response') handler(mockResponse);
        return mockRequest;
      });

      const responseData = JSON.stringify([
        { tag_name: 'v3.43.1' },
        { tag_name: 'v3.26.0' },
        { tag_name: 'v3.25.0-alpha' }
      ]);

      process.nextTick(() => {
        mockResponse.emit('data', Buffer.from(responseData));
        mockResponse.emit('end');
      });

      jest.spyOn(global, 'fetch').mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({ tag_name: 'v3.43.1' }),
          ok: true,
          status: 200,
        } as Response);
      });

      const result = await utils.fetchLatestRelease();
      expect(result).toBe('3.43.1');
    });

    test('should handle HTTP error responses', async () => {
      fetchMock.mockResponseOnce('', { status: 404 });

      await expect(utils.fetchLatestRelease()).rejects.toThrow(
        'Failed to fetch release information from https://api.github.com/repos/go-task/task/releases: HTTP Error: 404 - '
      );
    });

    test('should handle network errors', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));

      await expect(utils.fetchLatestRelease()).rejects.toThrow(
        'Failed to fetch release information from https://api.github.com/repos/go-task/task/releases: Network error'
      );
    });

    test('should handle JSON parsing errors', async () => {
      fetchMock.mockResponseOnce('Invalid JSON');

      await expect(utils.fetchLatestRelease()).rejects.toThrow(
        'Failed to fetch release information from https://api.github.com/repos/go-task/task/releases: invalid json response body at  reason: Unexpected token \'I\', "Invalid JSON" is not valid JSON'
      );
    });

    test('should handle empty releases array', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));

      await expect(utils.fetchLatestRelease()).rejects.toThrow(
        'Failed to fetch release information from https://api.github.com/repos/go-task/task/releases: Invalid response format or no releases found'
      );
    });

    afterEach(() => {
      mockResponse.removeAllListeners();
      jest.clearAllMocks();
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});

describe('fetchLatestRelease', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return the latest release version', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: 'v3.43.1' })
    });

    const version = await fetchLatestRelease('test-token');
    expect(version).toBe('3.43.1');
  });

  it('should throw an error for HTTP failures', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found'
    });

    await expect(fetchLatestRelease('test-token')).rejects.toThrow('HTTP Error: 404 - Not Found');
  });

  it('should throw an error for invalid response format', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    await expect(fetchLatestRelease('test-token')).rejects.toThrow('Invalid response format or no releases found');
  });
});
