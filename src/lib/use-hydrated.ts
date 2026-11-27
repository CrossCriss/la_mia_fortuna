"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false на сервері і при першому рендері клієнта, true після монтирування. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
