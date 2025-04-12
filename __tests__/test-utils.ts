/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Ryan Johnson
 */

import { EventEmitter } from 'events';

// Define types for mocks to help fix ESLint warnings
export interface MockResponse extends EventEmitter {
  statusCode: number;
}

export interface MockRequest {
  on: jest.Mock;
  setTimeout: jest.Mock;
  end: jest.Mock;
  destroy: jest.Mock;
}

/**
 * Create mock http/https request options
 * @param statusCode HTTP status code for the response
 * @returns Mock request and response objects
 */
export function createMockHttpObjects(statusCode: number = 200): {
  mockRequest: MockRequest;
  mockResponse: MockResponse;
} {
  // Create mock response object
  const mockResponse = new EventEmitter() as MockResponse;
  mockResponse.statusCode = statusCode;

  // Create mock request object
  const mockRequest: MockRequest = {
    on: jest.fn().mockReturnThis(),
    setTimeout: jest.fn().mockReturnThis(),
    end: jest.fn(),
    destroy: jest.fn()
  };

  return { mockRequest, mockResponse };
}

/**
 * Interface for mocked HTTPS module
 */
export interface MockHttpsModule {
  get: jest.Mock;
  request: jest.Mock;
}

/**
 * Interface for mocked HTTP module
 */
export interface MockHttpModule {
  request: jest.Mock;
}

/**
 * Set up the http/https module mocks
 * @param https The mocked https module
 * @param http The mocked http module
 * @param mockRequest The mock request object
 * @param mockResponse The mock response object
 */
export function setupHttpMocks(
  https: MockHttpsModule,
  http: MockHttpModule,
  mockRequest: MockRequest,
  mockResponse: MockResponse
): void {
  // Setup https.get and https.request mocks
  https.get.mockImplementation((url: string | URL | object, options?: object, callback?: Function): MockRequest => {
    if (callback) callback(mockResponse);
    return mockRequest;
  });

  https.request.mockImplementation((url: string | URL | object, options?: object, callback?: Function): MockRequest => {
    if (callback) callback(mockResponse);
    return mockRequest;
  });

  // Also mock http module for proxy support
  http.request.mockImplementation((url: string | URL | object, options?: object, callback?: Function): MockRequest => {
    if (callback) callback(mockResponse);
    return mockRequest;
  });
}

/**
 * Ensure setupHttpMocks is used consistently in network-related tests
 */
export function setupNetworkMocks(): void {
  const mocks = createMockHttpObjects(200);
  setupHttpMocks(mocks.mockRequest, mocks.mockResponse, mocks.mockRequest, mocks.mockResponse);
}
