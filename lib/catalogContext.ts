import { AsyncLocalStorage } from "node:async_hooks";
import type { CatalogSource } from "./stores";

const als = new AsyncLocalStorage<CatalogSource>();

export function runWithCatalog<T>(catalog: CatalogSource, fn: () => T): T {
  return als.run(catalog, fn);
}

export function currentCatalog(): CatalogSource {
  return als.getStore() ?? "live";
}
