import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import * as cache from '../src';

beforeEach(() => {
  cache.clear();
});

describe('cache.write()', () => {
  it('should write a value to the cache', () => {
    cache.write('key', 'value');

    expect(cache.read('key')).toBe('value');
  });

  it('should throw an error when value is undefined', () => {
    expect(() => cache.write('key', undefined))
      .toThrow(new Error('Cache value for key "key" is undefined'));
  });
});

describe('cache.remove()', () => {
  it('should remove a value from the cache', () => {
    cache.write('key', 'value');
    cache.remove('key');

    expect(cache.read('key')).toBe(undefined);
  });
});

describe('cache.clear()', () => {
  it('should clear the cache', () => {
    cache.write('key1', 'value1');
    cache.write('key2', 'value2');
    cache.write('key3', 'value3');
    cache.clear();

    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(false);
    expect(cache.has('key3')).toBe(false);
  });
});

describe('cache.read()', () => {
  describe('when cache is expired', () => {
    it('should return undefined', () => {
      cache.write('expired', 'value', { expiresIn: -1 });

      expect(cache.read('expired')).toBe(undefined);
    });
  });

  describe('when cache is not expired', () => {
    it('should return the value', () => {
      cache.write('key', 'value');

      expect(cache.read('key')).toBe('value');
    });
  });

  describe('when does not exist', () => {
    it('should return undefined', () => {
      expect(cache.read('unpresent')).toBe(undefined);
    });
  });
});

describe('cache.has()', () => {
  describe('when cache is expired', () => {
    it('should return false', () => {
      cache.write('expired', 'value', { expiresIn: -1 });

      expect(cache.has('expired')).toBe(false);
    });
  });

  describe('when cache is not expired', () => {
    it('should return true', () => {
      cache.write('key', 'value');

      expect(cache.has('key')).toBe(true);
    });
  });
});

describe('cache expiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when `expiresIn` is set', () => {
    it('should expire the cache after the specified time', () => {
      const date = new Date('2021-01-01T22:00:00Z');
      vi.setSystemTime(date);

      cache.write('key', 'value', { expiresIn: 1000 });

      expect(cache.read('key')).toBe('value');

      // Move time forward by 999 milliseconds
      vi.advanceTimersByTime(999);

      expect(cache.read('key')).toBe('value');

      // Move time forward by 1 millisecond
      vi.advanceTimersByTime(1);

      expect(cache.read('key')).toBe(undefined);
    });
  });

  describe('when `expiresAt` is set', () => {
    describe('when `expiresAt` is a number', () => {
      it('should expire the cache at the specified time', () => {
        const date = new Date('2021-01-01T22:00:00Z');
        vi.setSystemTime(date);

        const expiresAt = new Date('2021-01-01T23:00:00Z').getTime();
        cache.write('key', 'value', { expiresAt });

        expect(cache.read('key')).toBe('value');

        // Move time forward by 59 minutes, 59 seconds and 999 milliseconds
        vi.advanceTimersByTime(3599999);

        expect(cache.read('key')).toBe('value');

        // Move time forward by 1 millisecond
        vi.advanceTimersByTime(1);

        expect(cache.read('key')).toBe(undefined);
      });
    });

    describe('when `expiresAt` is a Date object', () => {
      it('should expire the cache at the specified time', () => {
        const date = new Date('2021-01-01T22:00:00Z');
        vi.setSystemTime(date);

        const expiresAt = new Date('2021-01-01T23:00:00Z');
        cache.write('key', 'value', { expiresAt });

        expect(cache.read('key')).toBe('value');

        // Move time forward by 59 minutes, 59 seconds and 999 milliseconds
        vi.advanceTimersByTime(3599999);

        expect(cache.read('key')).toBe('value');

        // Move time forward by 1 millisecond
        vi.advanceTimersByTime(1);

        expect(cache.read('key')).toBe(undefined);
      });
    });
  });

  describe('when `expiresIn` and `expiresAt` are set', () => {
    it('should expire the cache at the earliest time', () => {
      // 2 minutes before midnight
      vi.setSystemTime('2021-01-01T23:58:00Z');

      const expiresAt = new Date('2021-01-02T00:00:00Z'); // midnight
      const expiresIn = 5_000 * 60; // 5 minutes

      cache.write('key', 'value', { expiresAt, expiresIn });

      // Move time forward to one millisecond before midnight
      vi.advanceTimersByTime(119_999);

      expect(cache.has('key')).toBe(true);

      // Move time forward by 1 millisecond to midnight
      vi.advanceTimersByTime(1);

      expect(cache.has('key')).toBe(false);
    });
  });
});

describe('cache.fetch()', () => {
  it('should return the value if it exists in the cache', async () => {
    cache.write('key', 'value');

    await expect(cache.fetch('key')).resolves.toBe('value');
  });

  it('should return the value if it exists in the cache even if fetcher is provided', async () => {
    const fetcher = vi.fn(async () => 'fetched value');

    await expect(cache.fetch('key', fetcher)).resolves.toBe('fetched value');
    expect(fetcher).toHaveBeenCalled();
  });
});
