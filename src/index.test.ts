import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MicroCache from '.';

describe('MicroCache', () => {
  describe('set and get', () => {
    it('should set and get a value', () => {
      MicroCache.set('key1', 'value1');
      expect(MicroCache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(MicroCache.get('nonExistentKey')).toBeUndefined();
    });

    it('should throw an error when trying to set an undefined value', () => {
      expect(() => MicroCache.set('key2', undefined)).toThrow(
        'Cache value cannot be undefined. Use remove() to delete a key from the cache.'
      );
    });
  });

  describe('set with empty options', () => {
    it('should set a value with empty options', () => {
      MicroCache.set('key7', 'value7', {});
      expect(MicroCache.get('key7')).toBe('value7');
    });
  });

  describe('set with ttl', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire a value after ttl', () => {
      // Cache should expire after 1 second
      MicroCache.set('key3', 'value3', { ttl: 1000 });
      expect(MicroCache.get('key3')).toBe('value3');

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Cache should be expired
      expect(MicroCache.get('key3')).toBeUndefined();
    });
  });

  describe('set with expiresAt', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire a value at a specific time', () => {
      const date = new Date(2024, 0, 1, 10, 20); // January 1, 2024, 10:20 AM
      vi.setSystemTime(date);

      // Cache should expire at 10:30 AM
      const expiresAt = new Date(2024, 0, 1, 10, 30).getTime();
      MicroCache.set('key4', 'value4', { expiresAt: new Date(expiresAt) });
      expect(MicroCache.get('key4')).toBe('value4');

      // Advance time to 10:30 AM
      vi.setSystemTime(new Date(2024, 0, 1, 10, 30));

      // Now the cache should be expired
      expect(MicroCache.get('key4')).toBeUndefined();
    });
  });

  describe('set with already expired expiresAt', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not set a value that is already expired', () => {
      const date = new Date(2024, 0, 1, 10, 0); // January 1, 2024, 10:00 AM
      vi.setSystemTime(date);

      // Cache should expire at 9:00 AM (already expired)
      const expiresAt = new Date(2024, 0, 1, 9, 0).getTime();
      MicroCache.set('key6', 'value6', { expiresAt: new Date(expiresAt) });
      expect(MicroCache.get('key6')).toBeUndefined();
    });
  });

  describe('when both ttl and expiresAt are provided', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('when ttl expires before expiresAt', () => {
      it('should expire based on ttl', () => {
        const date = new Date(2024, 0, 1, 10, 0); // January 1, 2024, 10:00 AM
        vi.setSystemTime(date);

        // Cache should expire in 5 minutes (before expiresAt)
        MicroCache.set('key5', 'value5', { ttl: 5 * 60 * 1000, expiresAt: new Date(2024, 0, 1, 10, 10) });
        expect(MicroCache.get('key5')).toBe('value5');

        // Advance time by 5 minutes
        vi.advanceTimersByTime(5 * 60 * 1000);

        // Cache should be expired
        expect(MicroCache.get('key5')).toBeUndefined();
      });
    });

    describe('when expiresAt expires before ttl', () => {
      it('should expire based on expiresAt', () => {
        const date = new Date(2024, 0, 1, 10, 0); // January 1, 2024, 10:00 AM
        vi.setSystemTime(date);

        // Cache should expire at 10:05 AM (before ttl)
        MicroCache.set('key5', 'value5', { ttl: 10 * 60 * 1000, expiresAt: new Date(2024, 0, 1, 10, 5) });
        expect(MicroCache.get('key5')).toBe('value5');

        // Advance time to 10:05 AM
        vi.setSystemTime(new Date(2024, 0, 1, 10, 5));

        // Cache should be expired
        expect(MicroCache.get('key5')).toBeUndefined();
      });
    });
  });

  describe('remove', () => {
    it('should remove a key from the cache', () => {
      MicroCache.set('key8', 'value8');
      expect(MicroCache.get('key8')).toBe('value8');

      MicroCache.remove('key8');
      expect(MicroCache.get('key8')).toBeUndefined();
    });
  });

  describe('fetch', () => {
    it('should fetch and cache a value', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetchedValue');
      const value = await MicroCache.fetch('key9', fetcher);

      expect(value).toBe('fetchedValue');
      expect(MicroCache.get('key9')).toBe('fetchedValue');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should return cached value on subsequent fetches', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetchedValue');

      MicroCache.set('key10', 'cachedValue');

      const value = await MicroCache.fetch('key10', fetcher);
      expect(value).toBe('cachedValue');
      expect(fetcher).not.toHaveBeenCalled(); // Should not call fetcher since value is cached
    });

    it('should handle fetcher errors', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch error'));

      await expect(MicroCache.fetch('key11', fetcher)).rejects.toThrow('Fetch error');
      expect(MicroCache.get('key11')).toBeUndefined(); // Should not cache value on error
    });
  });
});
