import { create } from "zustand";
import { persist } from "zustand/middleware";
import { keepIds, pushRecentId } from "./id-list";

export const RECENT_MAX = 12;

type RecentlyViewedState = {
  ids: string[];
  add: (id: string) => void;
  prune: (allowedIds: string[]) => void;
};

// Нещодавно переглянуті: лише id товарів у localStorage, найновіші на початку.
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      ids: [],
      add: (id) =>
        set((state) => ({ ids: pushRecentId(state.ids, id, RECENT_MAX) })),
      prune: (allowedIds) =>
        set((state) => ({ ids: keepIds(state.ids, new Set(allowedIds)) })),
    }),
    {
      name: "la-mia-fortuna-recent",
      version: 1,
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);
