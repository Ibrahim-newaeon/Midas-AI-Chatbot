import { AsyncLocalStorage } from "node:async_hooks";
import type { CatalogSource, ChatChannel } from "./stores";

type CatalogState = { catalog: CatalogSource; channel: ChatChannel };

const als = new AsyncLocalStorage<CatalogState>();

export function runWithCatalog<T>(catalog: CatalogSource, fn: () => T, channel: ChatChannel = "web"): T {
  return als.run({ catalog, channel }, fn);
}

export function currentCatalog(): CatalogSource {
  return als.getStore()?.catalog ?? "live";
}

export function currentChannel(): ChatChannel {
  return als.getStore()?.channel ?? "web";
}
