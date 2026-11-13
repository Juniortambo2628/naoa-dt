import { describe, it, expect } from 'vitest';
import { shouldReload, isChunkLoadError } from './chunkReload';

const memory = () => {
  const data = {};
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
};

describe('chunkReload', () => {
  it('reloads once, then not again within a minute', () => {
    const store = memory();
    expect(shouldReload(1_000_000, store)).toBe(true);
    expect(shouldReload(1_030_000, store)).toBe(false);
    expect(shouldReload(1_070_000, store)).toBe(true);
  });

  it('recognises failed lazy imports from each browser', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/AdminSettings-1.js'))).toBe(true);
    expect(isChunkLoadError('Importing a module script failed.')).toBe(true);
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});
