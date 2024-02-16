import { ICacheEntry, ICacheStore } from "./types";
import { Nullable } from "./utils";

type ILocalStorageEntry = ICacheEntry<unknown>;

export class LocalStorageCacheStore implements ICacheStore {
  private readonly _cacheKeyPrefix: string;

  constructor(cacheKeyPrefix: string) {
    this._cacheKeyPrefix = cacheKeyPrefix;
  }

  clearAll(): Promise<void> {
    Array.from(Array(localStorage.length).keys())
      .map((index) => localStorage.key(index))
      .filter((x) => !!x && x.startsWith(this._cacheKeyPrefix))
      .forEach((key) => localStorage.removeItem(key!));
    return Promise.resolve();
  }

  clearExpired(): Promise<void> {
    Array.from(Array(localStorage.length).keys())
      .map((index) => localStorage.key(index))
      .filter((x) => !!x && x.startsWith(this._cacheKeyPrefix))
      .forEach((key) => {
        if (!key) return;
        const value = localStorage.getItem(key);
        if (!value) return;
        const json = JSON.parse(value) as ILocalStorageEntry;
        if (json.expireAt && json.expireAt < new Date().getTime()) {
          localStorage.removeItem(key);
        }
      });
    return Promise.resolve();
  }

  get<T>(key: string): Promise<Nullable<T>> {
    const value = localStorage.getItem(this._cacheKeyPrefix + key);
    if (!value || value?.length <= 0) return Promise.resolve(undefined);
    const json = JSON.parse(value) as ICacheEntry<T>;
    if (json && json.expireAt && json.expireAt >= new Date().getTime()) {
      return Promise.resolve(json.value);
    }
    return Promise.resolve(undefined);
  }

  set<T>(
    key: string,
    value: T | undefined,
    ttl: number | undefined,
  ): Promise<void> {
    const prefixedKey = this._cacheKeyPrefix + key;
    if (!value) {
      localStorage.removeItem(prefixedKey);
      return Promise.resolve();
    }
    const cacheEntry: ICacheEntry<T> = {
      key: prefixedKey,
      value,
      expireAt: ttl ? new Date().getTime() + ttl : undefined,
    };
    localStorage.setItem(prefixedKey, JSON.stringify(cacheEntry));
    return Promise.resolve();
  }
}
