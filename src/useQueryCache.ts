import { $, useContext } from "@builder.io/qwik";
import { UseQueryCache } from "./types";
import { CacheEventProps, SimurghContext } from "./context";

export function useQueryCache(): UseQueryCache {
  const context = useContext(SimurghContext);
  const invalidate$ = $((...cacheKeys: string[]) => {
    cacheKeys.forEach((key) => {
      window.dispatchEvent(
        new CustomEvent<CacheEventProps>("cache_invalidate", {
          detail: { key: key },
        }),
      );
    });
  });
  return {
    invalidate$: invalidate$,
  };
}
