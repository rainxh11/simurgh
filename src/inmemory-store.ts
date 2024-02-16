import { ICacheEntry, ICacheStore } from "./types";
import { Nullable } from "./utils";

export class InMemoryCacheStore implements ICacheStore {
  private _db: Map<string, ICacheEntry<any>>;

  constructor() {
    this._db = new Map();
  }

  clearAll(): Promise<void> {
    this._db.clear();
    return Promise.resolve();
  }

  clearExpired(): Promise<void> {
    const values = this._db.entries();
    let next = values.next();
    while (next) {
      const [key, value] = next.value as [string, ICacheEntry<object>];
      if (value && value.expireAt && value.expireAt < new Date().getTime()) {
        this._db.delete(key);
      }
      next = values.next();
    }
    return Promise.resolve();
  }

  get<T>(key: string): Promise<Nullable<T>> {
    const value = this._db.get(key);
    if (
      value &&
      value.expireAt &&
      value.expireAt >= new Date().getTime() &&
      !!value.value
    ) {
      return Promise.resolve(value.value as T);
    }
    return Promise.resolve(undefined);
  }

  set<T>(
    key: string,
    value: T | undefined,
    ttl: number | undefined,
  ): Promise<void> {
    if (!value) {
      this._db.delete(key);
      return Promise.resolve();
    }
    const cacheEntry: ICacheEntry<T> = {
      key,
      value,
      expireAt: ttl ? new Date().getTime() + ttl : undefined,
    };
    this._db.set(key, cacheEntry);
    return Promise.resolve();
  }
}
