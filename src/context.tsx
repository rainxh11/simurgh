import {
  useContextProvider,
  createContextId,
  component$,
  Slot,
  NoSerialize,
  useSignal,
  useVisibleTask$,
  noSerialize,
  Signal,
} from "@builder.io/qwik";
import { ICacheStore, ISimurghProviderProps } from "./types";
import { Nullable } from "./utils";

export type CacheEventProps = {
  key: string;
};
export type Simurgh = {
  cacheStore: ICacheStore;
};
export const SimurghContext =
  createContextId<Readonly<Signal<Nullable<NoSerialize<Simurgh>>>>>(
    "SimurghContext",
  );

export const SimurghProvider = component$<ISimurghProviderProps>((props) => {
  const simurgh = useSignal<Nullable<NoSerialize<Simurgh>>>();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    simurgh.value = noSerialize({
      cacheStore: await props.store$(),
    });
  });
  useContextProvider(SimurghContext, simurgh);

  return <Slot />;
});
