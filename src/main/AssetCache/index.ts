import { canPreloadCache, preloadCache } from "./preloadCache";
import { clearSizeResult, fileSizeStr, getCachePath } from "./cachePath";
import {
  requestAsset,
  relocate,
  clear,
  available,
  initAccess,
} from "./database";
import {
  isCacheEnabled,
  setCacheEnabled,
  toggleCacheEnabled,
} from "./enabled";
import { getStats as getCacheStats, type CacheStats } from "./stats";

export class AssetCache {
  static requestAsset = requestAsset;
  static clearCache = clear;
  static cacheDir = getCachePath;
  static fileSizeStr = fileSizeStr;
  static clearSizeResult = clearSizeResult;

  static preloadCache = preloadCache;
  static canPreloadCache = canPreloadCache;

  static relocate = relocate;
  static available = available;

  static init = initAccess;

  static isCacheEnabled = isCacheEnabled;
  static setCacheEnabled = setCacheEnabled;
  static toggleCacheEnabled = toggleCacheEnabled;

  static getStats = getCacheStats;
}

export type { CacheStats };
