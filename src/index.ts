type CacheEntry = [
  timeToLive: number | null,
  value: any,
];

type CacheMap = {
  [cacheKey: string]: CacheEntry;
};

type WriteOptions = {
  // Number of milliseconds until the cache entry expires
  expiresIn?: number; // in milliseconds

  // Expiration date as timestamp or Date object
  expiresAt?: number | Date;
};

type CacheOptions = {
  expiresAt: number | null;
};

const cacheMap: CacheMap = {};

const normalizeOptions = (options?: WriteOptions): CacheOptions => {
  let expiresAt: number | null = null;

  if (options) {
    // If `options.expiresAt` is a Date object, convert it to a timestamp
    if (options.expiresAt && typeof options.expiresAt === 'object') {
      options.expiresAt = options.expiresAt.getTime();
    }

    if (typeof options.expiresAt === 'number') {
      expiresAt = options.expiresAt;
    }

    // Parse `options.expiresIn` and calculate the expiration date
    if (typeof options.expiresIn === 'number') {
      if (expiresAt === null) {
        expiresAt = Date.now() + options.expiresIn;
      } else {
        expiresAt = Math.min(
          expiresAt,
          Date.now() + options.expiresIn,
        );
      }
    }
  }

  return {
    expiresAt,
  };
};

export const write = (
  cacheKey: number | string,
  value: any,
  options?: WriteOptions,
) => {
  if (value === undefined) {
    throw new Error(`Cache value for key "${cacheKey}" is undefined`);
  }

  const { expiresAt } = normalizeOptions(options);
  const entry: CacheEntry = [expiresAt, value];

  cacheMap[cacheKey] = entry;
};

export const read = (cacheKey: number | string) => {
  const entry = cacheMap[cacheKey];

  if (!entry) {
    return undefined;
  }

  const [expiresAt, value] = entry;

  if (expiresAt && expiresAt <= Date.now()) {
    delete cacheMap[cacheKey];
    return undefined;
  }

  return value;
};

export const has = (cacheKey: number | string) => {
  if (read(cacheKey) === undefined) {
    return false;
  }

  return true;
};

export const remove = (cacheKey: number | string) => {
  delete cacheMap[cacheKey];
};

export const clear = () => {
  Object.keys(cacheMap).forEach((cacheKey) => {
    delete cacheMap[cacheKey];
  });
};

export const fetch = async (
  cacheKey: number | string,
  fetcher?: () => Promise<any>,
  options?: WriteOptions,
) => {
  let value = read(cacheKey);

  if (value === undefined && fetcher) {
    value = await fetcher();

    write(cacheKey, value, options);
  }

  return value;
};
