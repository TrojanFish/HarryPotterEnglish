/**
 * Mock implementation of Web Storage API (localStorage)
 * Fully compliant with W3C Storage interface.
 */
export class MockStorage {
  constructor() {
    this._store = new Map();
  }

  get length() {
    return this._store.size;
  }

  getItem(key) {
    const strKey = String(key);
    return this._store.has(strKey) ? this._store.get(strKey) : null;
  }

  setItem(key, value) {
    const strKey = String(key);
    this._store.set(strKey, String(value));
  }

  removeItem(key) {
    const strKey = String(key);
    this._store.delete(strKey);
  }

  clear() {
    this._store.clear();
  }

  key(index) {
    const keys = Array.from(this._store.keys());
    return keys[index] !== undefined ? keys[index] : null;
  }

  // Helper for tests to inspect raw state
  _dump() {
    const obj = {};
    for (const [k, v] of this._store.entries()) {
      obj[k] = v;
    }
    return obj;
  }
}
