/**
 * Global test environment setup for Hogwarts Audio E2E tests.
 * Initializes localStorage, IndexedDB, navigator.storage, and network shims.
 */
import { MockStorage } from './mocks/mockLocalStorage.js';
import { MockIDBFactory } from './mocks/mockIndexedDB.js';
import { createMockFetch } from './mocks/mockNetwork.js';

let mockStorageInstance = new MockStorage();
let mockIDBInstance = new MockIDBFactory();

// Ensure globalThis.localStorage exists
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorageInstance,
  writable: true,
  configurable: true
});

// Ensure globalThis.indexedDB exists
Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIDBInstance,
  writable: true,
  configurable: true
});

// Ensure navigator.storage.estimate exists
if (!globalThis.navigator) {
  globalThis.navigator = {};
}

let mockQuotaBytes = 1024 * 1024 * 1024 * 5; // 5 GB
let mockUsedBytes = 0;

globalThis.navigator.storage = {
  estimate: async () => {
    return {
      usage: mockUsedBytes,
      quota: mockQuotaBytes
    };
  }
};

// Default fetch handler
globalThis.fetch = createMockFetch();

/**
 * Resets storage and mock states between tests for full test isolation.
 */
export function resetTestEnvironment() {
  mockStorageInstance.clear();
  mockIDBInstance._clearAll();
  mockUsedBytes = 0;
  mockQuotaBytes = 1024 * 1024 * 1024 * 5;
  globalThis.fetch = createMockFetch();
}

/**
 * Set custom storage usage/quota for boundary testing.
 */
export function setMockStorageQuota(usage, quota) {
  mockUsedBytes = usage;
  mockQuotaBytes = quota;
}

export { mockStorageInstance, mockIDBInstance };
