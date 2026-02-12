type ExpiresQuery = {
  ttl?: number | undefined; // Time to live in milliseconds
  expiresAt?: Date | undefined; // Absolute expiration date
};

const resolveExpiration = (options: ExpiresQuery): number | undefined => {
  const now = Date.now();
  let ttl: number

  if (options.ttl !== undefined) {
    ttl = options.ttl;
  }

  if (options.expiresAt !== undefined) {
    const expiresAtTime = options.expiresAt.getTime();

    if (expiresAtTime <= now) {
      return -1; // Already expired
    }

    const expiresAtTtl = expiresAtTime - now;

    if (ttl === undefined || expiresAtTtl < ttl) {
      ttl = expiresAtTtl;
    }
  }

  if (ttl !== undefined) {
    return now + ttl;
  }

  return undefined; // No expiration
};

type CacheEntry = {
  value: any;
  expiresAt: number | undefined;
};

const cache: Map<string, CacheEntry> = new Map();

const get = (key: string): any | undefined => {
  const entry = cache.get(key);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt !== undefined && Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
};

/**
 * Removes a key from the cache. This is useful for clearing expired entries or manually
 * invalidating cache entries.
 * @param key The key to remove from the cache.
 */
const remove = (key: string): void => {
  cache.delete(key);
};

const set = (key: string, value: any, options?: ExpiresQuery): void => {
  if (value === undefined) {
    throw new Error(
      'Cache value cannot be undefined. Use remove() to delete a key from the cache.'
    );
  }

  let expiresAt = options ? resolveExpiration(options) : undefined;

  if (expiresAt === -1) {
    remove(key);
    return;
  }

  cache.set(key, { value, expiresAt });
};

/**
 * Fetches a value using the provided fetcher function and caches it. If the value is already
 * cached and valid, it returns the cached value instead of calling the fetcher.
 * @param key The key to identify the cache entry.
 * @param fetcher A function that returns a promise which resolves to the value to be cached.
 * @param options Cache options, including TTL (time to live).
 * @returns A promise that resolves to the fetched or cached value.
 */
const fetch = async (
  key: string,
  fetcher: () => Promise<any>,
  options?: ExpiresQuery
): Promise<any> => {
  const cachedValue = get(key);

  if (cachedValue !== undefined) {
    return Promise.resolve(cachedValue);
  }

  try {
    const fetchedValue = await fetcher();
    set(key, fetchedValue, options);
    return fetchedValue;
  } catch (error) {
    return Promise.reject(error);
  }
};

export default { get, set, remove, fetch };
