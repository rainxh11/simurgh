import { ICacheEntry, ICacheStore } from "./types";
import { openDB } from "idb";
import { Nullable } from "./utils";

export class IndexDbCacheStore implements ICacheStore {
  private _dbName: string;
  private _version: number;

  constructor(dbName: string, version: number) {
    this._dbName = dbName;
    this._version = version;
    if (!("indexedDB" in window))
      throw new Error("This browser doesn't support IndexedDB");
  }

  async get<T>(key: string): Promise<Nullable<T>> {
    const db = await this.getDb();
    const value = (await db.get("store", key)) as ICacheEntry<T>;
    if (
      value.value &&
      (!value.expireAt ||
        (value.expireAt && value.expireAt >= new Date().getTime()))
    )
      return value.value;
    return undefined;
  }

  async clearAll(): Promise<void> {
    const db = await this.getDb();
    await db.clear("store");
  }

  async clearExpired(): Promise<void> {
    const db = await this.getDb();
    const transaction = db.transaction("store", "readwrite");
    let cursor = await transaction.store.openCursor();
    while (cursor) {
      const value = cursor.value as ICacheEntry<any>;
      if (value.expireAt && value.expireAt < new Date().getTime()) {
        await transaction.db.delete("store", cursor.key);
      }
      cursor = await cursor.continue();
    }
  }

  async set<T>(
    key: string,
    value: T | undefined,
    ttl: number | undefined,
  ): Promise<void> {
    const db = await this.getDb();
    if (!value) await db.delete("store", key);
    else {
      const entry: ICacheEntry<T> = {
        key,
        value: value,
        expireAt: new Date().getTime() + (ttl || 0),
      };
      await db.put("store", entry, key);
    }
  }

  private getDb() {
    return openDB(this._dbName, this._version, {
      upgrade: (db) => {
        if (!db.objectStoreNames.contains("store")) {
          const store = db.createObjectStore<string>("store", {
            keyPath: "key",
          });
          store.createIndex("keyidx", "key");
        }
      },
    });
  }
}
