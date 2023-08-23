type CacheEntry = [
  timeToLive: number | null,
  value: any,
];

type CacheMap = {
  [cacheKey: string]: CacheEntry;
};

const cacheMap: CacheMap = {};

export const cache = (
  cacheKey: number | string,
  value: any,
  timeToLive?: number | null
) => {
  const expiresAt = timeToLive ? Date.now() + timeToLive : null;
  const entry: CacheEntry = [expiresAt, value];

  cacheMap[cacheKey] = entry;
};

export const retrieve = (cacheKey: number | string) => {
  const entry = cacheMap[cacheKey];

  if (!entry) {
    return undefined;
  }

  const [expiresAt, value] = entry;

  if (expiresAt && expiresAt < Date.now()) {
    delete cacheMap[cacheKey];
    return undefined;
  }

  return value;
};

export const invalidate = (cacheKey: number | string) => {
  delete cacheMap[cacheKey];
};
