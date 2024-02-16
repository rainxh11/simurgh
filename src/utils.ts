import {
  $,
  noSerialize,
  NoSerialize,
  QRL,
  Signal,
  useComputed$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";

export type MaybeSignal<T> = Signal<Nullable<T>> | Nullable<T>;
export type Nullable<T> = T | undefined | null;

export const useReComputed$ = <T>(
  computeFn: QRL<() => T>,
): [computed: Readonly<Signal<T>>, recompute: QRL<() => void>] => {
  const random = useSignal(Math.random() * 1000);
  const computed = useSignal<T>();
  useTask$(async ({ track }) => {
    track(random);
    computed.value = await computeFn();
  });

  return [
    computed as Readonly<Signal<T>>,
    $(() => {
      random.value = Math.random() * 1000;
    }),
  ];
};
export const unMaybe = <T>(maybeSignal: MaybeSignal<T>): Nullable<T> => {
  if (!maybeSignal) return undefined;
  if (!!(maybeSignal as any).value) {
    return (maybeSignal as Signal<Nullable<T>>).value;
  }
  return maybeSignal as Nullable<T>;
};

export const useCancellation = (onAbort$?: QRL<() => void>) => {
  const abortControllerSignal = useSignal<NoSerialize<AbortController>>();
  const abortSignal = useComputed$(() => abortControllerSignal.value?.signal);
  const isCancelled = useComputed$(
    () => abortControllerSignal.value?.signal.aborted ?? false,
  );
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const controller = new AbortController();
    controller.signal.onabort = async () => {
      if (onAbort$) await onAbort$();
    };
    abortControllerSignal.value = noSerialize(controller);
    cleanup(() => {
      if (abortControllerSignal.value) {
        abortControllerSignal.value.signal.onabort = null;
      }
    });
  });
  return {
    isCancelled,
    abortSignal,
    cancel: () => abortControllerSignal.value?.abort(),
    reset: () => {
      const controller = new AbortController();
      controller.signal.onabort = async () => {
        if (onAbort$) await onAbort$();
      };
      abortControllerSignal.value = noSerialize(controller);
    },
  };
};

export const withRetry = async <T, TError>(
  fn$: QRL<() => Promise<T>>,
  maxRetries: number,
  retryDelayGetter$: QRL<
    (retryAttempt: number, error: TError) => Promise<number>
  >,
) => {
  let attempt = 0;
  let error = undefined;
  let response = undefined;
  while (attempt < maxRetries) {
    try {
      response = await fn$();
      attempt += 1;
    } catch (err) {
      const delay = await retryDelayGetter$(attempt, err as TError);
      if (attempt === maxRetries) {
        error = err;
        break;
      }
      if (delay > 0)
        await new Promise((resolve) => setTimeout(() => resolve, delay));
    }
  }
  return { data: response, error: error };
};
