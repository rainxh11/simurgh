[![NPM](https://img.shields.io/npm/v/qwik-simurgh?color=blue)](https://www.npmjs.com/package/qwik-simurgh)
[![MIT License](https://img.shields.io/github/license/rainxh11/simurgh.svg?color=cyan)](https://github.com/rainxh11/simurgh/blob/master/LICENSE)

# qwik-simurgh for [Qwik](https://qwik.builder.io/)

An asynchronous state manager for [Qwik](https://qwik.builder.io/) - similar to the excellent
libraries of [Tanstack Query](https://tanstack.com/query/latest).

## Features

- 🐦️ Simple & familiar API to *Tanstack Query*, why re-invent the wheel.
- 🕙 Built-in [caching](#caching), [resiliency strategy (retries...etc)](#failure-resiliency), automatic refetching and
  much more.
- ️🧩 Support of [custom cache stores](#custom-cache-store), with 2 built-in stores ([InMemory & Browser
  LocalStorage](#included-stores)).
- 📃 _**in progress:**_ Support for  [paginated & infinite queries with`useInfiniteQuery()`](#infinite-query)
- ⚡️ _**in progress:**_ Support for [mutation with `useMutation()`](#mutation)

### Other cool features made possible due to Qwik:

- 🚥 Execute queries, mutations on a separate worker thread freeing up the main thread using `worker$()`
- 🚥 Or in server using `server$()`

## Installation

```shell
pnpm add qwik-simurgh
```

```shell
yarn add qwik-simurgh
```

```shell
npm install qwik-simurgh
```

# Integration:

- To use *qwik-simurgh* you need to use the `SimurghProvider` context provider + the store that will hold the cached
  queries:

```tsx
// src/routes/layout.tsx
import {component$, Slot} from "@builder.io/qwik";
import type {RequestHandler} from "@builder.io/qwik-city";
import {InMemoryCacheStore, SimurghProvider} from "qwik-simurgh";

export const onGet: RequestHandler = async ({cacheControl}) => {...
};

export default component$(() => {
    return (
        <SimurghProvider store$={() => new InMemoryCacheStore()}>
            <Slot/>
        </SimurghProvider>
    );
});
```

# Example Usage:

## Simple query with 30 seconds cache:

```tsx
import {$, component$, useSignal} from "@builder.io/qwik";
import {useQuery} from "qwik-simurgh";

export default component$(() => {
    const search = useSignal<string | undefined>("");
    const {data, isLoading, isSuccess, isError, errors} = useQuery<string, string, any>({
        queryKey: [search],
        queryFn$: $(() =>
            fetch("https://fakestoreapi.com/products/" + search.value)
                .then((res) => res.text())),
        select$: $((res: any) => res),
        refetchOnWindowFocus: false,
        staleTime: 30 * 1000
    });
    return <div class="m-12 flex flex-col gap-1">
        <h1 class="text-3xl">🐦 Simurgh </h1>
        <input class="rounded-md border-2 border-blue-400 px-2 py-1 hover:border-blue-700"
               value={search.value}
               onInput$={(e) => (search.value = e.target?.value)}
        />
        {isLoading.value && <div>Loading data...</div>}
        {isSuccess.value && <div> Data :{data.value}</div>}
    </div>
});
```

![Example](https://raw.githubusercontent.com/rainxh11/simurgh/main/assets/usequery-demo-1.gif)

*Automatic refetching when search value changes; fetches from cache after the initial request until for the duration of
the cache window*

### *more documentations coming soon...*

#### This project is still under development with little to none proper testing, so expect many bugs🐞 while using it. 
