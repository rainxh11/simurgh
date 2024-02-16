import { QRL, ReadonlySignal, Signal } from "@builder.io/qwik";
import { MaybeSignal, Nullable } from "./utils";

export type QueryEventsOptions<TResponse, TError> = {
  onSuccess$?: QRL<(response: TResponse) => void>;
  onError$?: QRL<(error: TError) => void>;
};
export type QueryOptions = {
  staleTime?: MaybeSignal<number>;
  refetchOnWindowFocus?: MaybeSignal<boolean>;
  refetchOnReconnect?: MaybeSignal<boolean>;
  enabled?: Signal<boolean>;
};
export type QueryRetryOptions<TError> = {
  retry?: MaybeSignal<boolean>;
  retryDelay$?: QRL<(retryAttempt: number, error: TError) => number> | number;
  maxRetries?: number;
};
export type QueryRefetchIntervalOptions = {
  refetchInterval?: MaybeSignal<number>;
  refetchIntervalInBackground?: MaybeSignal<boolean>;
};
export type UseQueryProps<
  TData = unknown,
  TError = unknown,
  TSelect = TData,
> = {
  queryKey: MaybeSignal<string>[];
  queryFn$: QRL<() => Promise<TData>>;
  select$?: QRL<(response: TData) => TSelect>;
  initialData?: TSelect;
} & QueryEventsOptions<TData, TError> &
  QueryOptions &
  QueryRefetchIntervalOptions &
  QueryRetryOptions<TError>;

export type UseQueryReturn<TData, TError> = {
  data: ReadonlySignal<Nullable<TData>>;
  errors?: ReadonlySignal<Nullable<TError>>;
  isSuccess: ReadonlySignal<boolean>;
  isError: ReadonlySignal<boolean>;
  isLoading: ReadonlySignal<boolean>;
  refetch$: QRL<() => void>;
};

export interface InfiniteData<TData, TPageParam = unknown> {
  pages: Readonly<TData[]>;
  pageParams: Readonly<TPageParam[]>;
}

export type UseInfiniteQueryProps<
  TData,
  TError = Error,
  TSelect = TData,
  TPageParam = number,
> = {
  getNextPageParam$?: QRL<
    (lastPage: TData, allPages: TData[]) => TPageParam | undefined
  >;
  getPrevPageParam$?: QRL<
    (firstPage: TData, allPages: TData[]) => TPageParam | undefined
  >;
  queryFn$: QRL<(pageParam: TPageParam) => Promise<TData>>;
} & Omit<UseQueryProps<TData, TError, TSelect>, "queryFn$">;

export type UseInfiniteQueryReturn<TData, TError, TPageParam = unknown> = {
  hasNextPage: boolean;
  fetchNextPage$: QRL<() => void>;
  fetchPreviousPage$: QRL<() => void>;
  remove$: QRL<() => void>;
} & Omit<UseQueryReturn<TData, TError>, "data"> &
  InfiniteData<TData, TPageParam>;

export interface ICacheStore {
  get: <T>(key: string) => Promise<Nullable<T>>;
  set: <T>(key: string, value?: T, ttl?: number) => Promise<void>;
  clearAll: () => Promise<void>;
  clearExpired: () => Promise<void>;
}

export type ICacheEntry<T> = {
  key: string;
  value: T;
  expireAt?: number;
};
export type ISimurghProviderProps = { store$: QRL<() => ICacheStore> };

export type UseQueryCache = {
  invalidate$: QRL<(...cacheKeys: string[]) => void>;
};
