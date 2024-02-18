import { UseQueryProps, UseQueryReturn } from "./types";
import {
  $,
  useComputed$,
  useContext,
  useOnWindow,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Nullable, unMaybe, withRetry } from "./utils";
import { isServer } from "@builder.io/qwik/build";
import { CancellablePromise } from "real-cancellable-promise";
import { CacheEventProps, SimurghContext } from "./context";

export function useQuery<TResponse, TError, TSelect>(
  props: UseQueryProps<TResponse, TError, TSelect>,
): UseQueryReturn<TSelect, TError> {
  const context = useContext(SimurghContext);
  const initialCacheKey = props.initialQueryKey?.join("_");

  const cacheKey = useComputed$(() => {
    const key = props.queryKey.map((x) => unMaybe(x)).join("_");
    return initialCacheKey && initialCacheKey === key && props.initialData
      ? initialCacheKey
      : key;
  });

  const enabled = useComputed$(() => props.enabled?.value ?? true);
  const refetchOnFocusChanged = useComputed$(() =>
    unMaybe(props.refetchOnWindowFocus),
  );
  const refetchOnReconnect = useComputed$(() =>
    unMaybe(props.refetchOnReconnect),
  );
  const random = useSignal(Math.random() * 1000);

  const shouldRefetch = useSignal(false);
  const refetch$ = $(() => {
    shouldRefetch.value = true;
  });

  const resetExpirationTime$ = $((refetch?: boolean) => {
    random.value = Math.random() * 1000;
  });
  const staleTime = useComputed$(() => {
    const _time = unMaybe(props.staleTime);
    return Number.isNaN(_time) || !_time ? 30 * 1000 : _time;
  });
  const expirationTime = useComputed$(() => {
    if (random.value) {
      /* empty */
    }
    const stale = unMaybe(props.staleTime);
    if (stale === Infinity) return new Date(8.64e15).getTime();
    return (stale ?? 0) + new Date().getTime();
  });
  const isStale = useComputed$(
    () => shouldRefetch.value || expirationTime.value < new Date().getTime(),
  );
  const queryData = useSignal<Nullable<TSelect>>(props.initialData);
  const queryError = useSignal<Nullable<TError>>();
  const queryLoading = useSignal<boolean>();

  const scheduleRefetch$ = $((key: string, ttl: number) => {
    if (ttl <= 0 || ttl === Infinity || Number.isNaN(ttl)) return;
    setTimeout(async () => {
      await context.value?.cacheStore.set(key, undefined);
      await resetExpirationTime$();
    }, ttl);
  });

  useTask$(async ({ cleanup, track }) => {
    const options = track(() => ({
      key: cacheKey.value,
      staleTime: staleTime.value,
      enabled: enabled.value,
      isStale: isStale.value,
    }));
    if (isServer) return;
    if (options.key === initialCacheKey && props.initialData) {
      await context.value?.cacheStore.set(
        initialCacheKey,
        props.initialData,
        options.staleTime,
      );
    }

    queryLoading.value = true;
    if (!isStale.value && !shouldRefetch.value) {
      const cacheValue = await context.value?.cacheStore.get<TSelect>(
        options.key,
      );
      if (cacheValue) {
        queryData.value = cacheValue;
        queryLoading.value = false;
        return;
      }
    }
    shouldRefetch.value = false;
    await navigator.locks.request(options.key, async () => {
      const response = new CancellablePromise(
        withRetry<TResponse, TError>(
          props.queryFn$,
          props.maxRetries ?? 1,
          $(async (retryAttempt, error) => {
            if (typeof props.retryDelay$ === "number")
              return props.retryDelay$ as number;
            if (typeof props.retryDelay$ === "function")
              return await props.retryDelay$(retryAttempt, error);
            return 0;
          }),
        ),
        () => {},
      ).finally(() => (queryLoading.value = false));
      cleanup(() => {
        response.cancel();
        queryLoading.value = false;
        shouldRefetch.value = false;
      });
      const { error, data } = await response;
      if (error) {
        queryError.value = error as TError;
        if (props.onError$) await props.onError$(error as TError);
      } else if (data) {
        queryError.value = undefined;
        const temp = !!props.select$
          ? await props.select$(data)
          : (data as TSelect);
        if (props.onSuccess$) await props.onSuccess$(data);
        queryData.value = temp;
        queryLoading.value = true;
        await context.value?.cacheStore
          .set(options.key, temp, options.staleTime ?? undefined)
          .finally(() => (queryLoading.value = false));
        if (options.staleTime > 0) {
          await scheduleRefetch$(options.key, options.staleTime);
        }
      }
    });
  });

  useOnWindow(
    "focus",
    $(async () => {
      if (refetchOnFocusChanged.value) {
        await refetch$();
      }
    }),
  );
  useOnWindow(
    "online",
    $(async () => {
      if (refetchOnReconnect.value) {
        await refetch$();
      }
    }),
  );
  useOnWindow(
    "cache_invalidate",
    $(async (e: CustomEvent<CacheEventProps>) => {
      if (e.detail.key === cacheKey.value) {
        await context.value?.cacheStore.set(e.detail.key, undefined);
        shouldRefetch.value = true;
      }
    }),
  );
  useOnWindow(
    "cache_expire",
    $(async (e: CustomEvent<CacheEventProps>) => {
      if (e.detail.key === cacheKey.value) {
        await resetExpirationTime$();
      }
    }),
  );
  const isLoading = useComputed$(() => queryLoading.value ?? false);
  const isError = useComputed$(() => !!queryError.value);
  const isSuccess = useComputed$(() => !queryError.value);
  return {
    isLoading,
    isError,
    isSuccess,
    errors: queryError,
    data: queryData,
    refetch$: refetch$,
  };
}
