import { create } from "zustand";
import { persist } from "zustand/middleware";
import { keepIds, toggleId } from "./id-list";

export const FAVORITES_MAX = 100;

type FavoritesState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  prune: (allowedIds: string[]) => void;
};

// Обране зберігає лише id товарів у localStorage.
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({ ids: toggleId(state.ids, id, FAVORITES_MAX) })),
      remove: (id) =>
        set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
      prune: (allowedIds) =>
        set((state) => ({ ids: keepIds(state.ids, new Set(allowedIds)) })),
    }),
    {
      name: "la-mia-fortuna-favorites",
      version: 1,
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);
