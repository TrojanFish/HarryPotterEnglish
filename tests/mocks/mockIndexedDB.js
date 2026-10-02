/**
 * Mock implementation of IndexedDB API for Node.js E2E test environment.
 * Simulates standard IDBFactory, IDBDatabase, IDBTransaction, IDBObjectStore, and IDBRequest.
 */

class MockIDBRequest {
  constructor() {
    this.result = undefined;
    this.error = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;
  }

  _resolve(val) {
    this.result = val;
    this.readyState = 'done';
    queueMicrotask(() => {
      if (typeof this.onsuccess === 'function') {
        const event = { target: this, type: 'success' };
        this.onsuccess(event);
      }
    });
  }

  _reject(err) {
    this.error = err instanceof Error ? err : new Error(String(err));
    this.readyState = 'done';
    queueMicrotask(() => {
      if (typeof this.onerror === 'function') {
        const event = { target: this, type: 'error' };
        this.onerror(event);
      }
    });
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  constructor() {
    super();
    this.onupgradeneeded = null;
    this.onblocked = null;
  }

  _triggerUpgrade(db, oldVersion, newVersion) {
    queueMicrotask(() => {
      if (typeof this.onupgradeneeded === 'function') {
        const event = {
          target: this,
          oldVersion,
          newVersion,
          type: 'upgradeneeded'
        };
        this.result = db;
        this.onupgradeneeded(event);
      }
      this._resolve(db);
    });
  }
}

class MockIDBObjectStore {
  constructor(name, options = {}, db) {
    this.name = name;
    this.keyPath = options.keyPath || null;
    this.autoIncrement = !!options.autoIncrement;
    this._data = new Map();
    this._db = db;
    this._autoId = 1;
  }

  put(value, key) {
    const req = new MockIDBRequest();
    let actualKey = key;
    if (this.keyPath && typeof value === 'object' && value !== null) {
      actualKey = value[this.keyPath];
    }
    if (actualKey === undefined) {
      if (this.autoIncrement) {
        actualKey = this._autoId++;
      } else {
        req._reject(new Error(`Missing key for objectStore "${this.name}"`));
        return req;
      }
    }
    this._data.set(actualKey, structuredClone(value));
    req._resolve(actualKey);
    return req;
  }

  add(value, key) {
    let actualKey = key;
    if (this.keyPath && typeof value === 'object' && value !== null) {
      actualKey = value[this.keyPath];
    }
    const req = new MockIDBRequest();
    if (this._data.has(actualKey)) {
      req._reject(new Error(`Key "${actualKey}" already exists in "${this.name}"`));
      return req;
    }
    return this.put(value, key);
  }

  get(key) {
    const req = new MockIDBRequest();
    const val = this._data.get(key);
    req._resolve(val !== undefined ? structuredClone(val) : undefined);
    return req;
  }

  delete(key) {
    const req = new MockIDBRequest();
    this._data.delete(key);
    req._resolve(undefined);
    return req;
  }

  getAll() {
    const req = new MockIDBRequest();
    const values = Array.from(this._data.values()).map(v => structuredClone(v));
    req._resolve(values);
    return req;
  }

  count() {
    const req = new MockIDBRequest();
    req._resolve(this._data.size);
    return req;
  }

  clear() {
    const req = new MockIDBRequest();
    this._data.clear();
    req._resolve(undefined);
    return req;
  }
}

class MockIDBTransaction {
  constructor(db, storeNames, mode = 'readonly') {
    this.db = db;
    this.mode = mode;
    this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
    this.error = null;

    queueMicrotask(() => {
      if (typeof this.oncomplete === 'function') {
        const event = { target: this, type: 'complete' };
        this.oncomplete(event);
      }
    });
  }

  objectStore(name) {
    if (!this.storeNames.includes(name)) {
      throw new Error(`Store "${name}" not part of transaction scope`);
    }
    const store = this.db._stores.get(name);
    if (!store) {
      throw new Error(`ObjectStore "${name}" not found`);
    }
    return store;
  }

  abort() {
    if (typeof this.onabort === 'function') {
      const event = { target: this, type: 'abort' };
      this.onabort(event);
    }
  }
}

class MockIDBDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this._stores = new Map();
  }

  get objectStoreNames() {
    const names = Array.from(this._stores.keys());
    names.contains = (n) => names.includes(n);
    return names;
  }

  createObjectStore(name, options = {}) {
    if (this._stores.has(name)) {
      throw new Error(`ObjectStore "${name}" already exists`);
    }
    const store = new MockIDBObjectStore(name, options, this);
    this._stores.set(name, store);
    return store;
  }

  transaction(storeNames, mode = 'readonly') {
    return new MockIDBTransaction(this, storeNames, mode);
  }

  close() {
    // No-op for mock
  }
}

export class MockIDBFactory {
  constructor() {
    this._dbs = new Map();
  }

  open(name, version = 1) {
    const req = new MockIDBOpenDBRequest();
    const existing = this._dbs.get(name);

    if (!existing) {
      const db = new MockIDBDatabase(name, version);
      this._dbs.set(name, db);
      req._triggerUpgrade(db, 0, version);
    } else if (existing.version < version) {
      const oldVer = existing.version;
      existing.version = version;
      req._triggerUpgrade(existing, oldVer, version);
    } else {
      req._resolve(existing);
    }
    return req;
  }

  deleteDatabase(name) {
    const req = new MockIDBRequest();
    this._dbs.delete(name);
    req._resolve(undefined);
    return req;
  }

  _clearAll() {
    this._dbs.clear();
  }
}
