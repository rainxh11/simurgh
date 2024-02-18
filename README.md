[![NPM](https://img.shields.io/npm/v/qwik-simurgh?color=blue)](https://www.npmjs.com/package/qwik-simurgh)
[![MIT License](https://img.shields.io/github/license/rainxh11/simurgh.svg?color=cyan)](https://github.com/rainxh11/simurgh/blob/next/LICENSE)

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

export const onGet: RequestHandler = async ({cacheControl}) => {
    /* ... */
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

### Other cool features made possible due to Qwik:

- 🚥 Execute queries, mutations on a separate worker thread freeing up the main thread using `worker$()`
    - **Example:** calculate a `SHA512` hash of some value on a separate worker thread

```tsx
import {component$, useSignal} from "@builder.io/qwik";
import {useQuery} from "qwik-simurgh";
import {worker$} from "@builder.io/qwik-worker";
import {computeHash} from "@/hasher"

export default component$(() => {
    const text = useSignal<string>(/* ... */)
    const {data} = useQuery<string, string, any>({
        queryKey: ["hash", text],
        queryFn$: worker$(async () => await computeHash(text.value, "SHA512")),
    })
    return <>{/* ... */}</>
})
```

- 🚥 Or in server using `server$()`
    - **Example:** call a database in the server directly

```tsx
import {component$} from "@builder.io/qwik";
import {server$} from "@builder.io/qwik-city";
import {useQuery} from "qwik-simurgh";
import {db} from "@/db"

export default component$(() => {
    const {data} = useQuery<string, string, any>({
        queryKey: ["products"],
        queryFn$: server$(async () => await db.findAll()),
    })
    return <>{/* ... */}</>
})
```

- 🚥 Use `routeLoader$()` with useQuery
    - **Example:** use route preloaded data based on URL query parameters and passing it to `initialData`

```tsx
import {$, component$, useSignal} from "@builder.io/qwik";
import {routeLoader$, useLocation} from "@builder.io/qwik-city";
import {useQuery} from "qwik-simurgh";

const useProduct = routeLoader$<Product>(async (req) => {
    const product = await fetch("https://fakestoreapid.com/products/" + req.query.get("productId"))
    return await product.json() as Product
});

export default component$(() => {
    const preloadedProduct = useProduct()
    const location = useLocation()
    const selectedProductId = useSignal<string>(location.url.searchParams.get("productId"))

    const {data} = useQuery<string, string, any>({
        queryKey: ["product", selectedProductId],
        initialQueryKey: ["product", location.url.searchParams.get("productId")],
        initialData: preloadedProduct.value,
        queryFn$: $(() => fetch("https://fakestoreapi.com/products/" + location.url.searchParams.get("productId"))
            .then(res => res.json())),
    })
    return <>{/* ... */}</>
})
```

*Make sure to set `initialQueryKey` to a value that matches `queryKey` initial
state, `useQuery` will skip calling the query function altogether & uses the preloaded route data directly.*

### *more documentations coming soon...*

#### This project is still under development with little to none proper testing, so expect many bugs🐞 while using it. 