import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

// Корзина без обязательной регистрации (ТЗ §3) — состояние живёт в localStorage.
// isOpen (видимость дровера) сознательно не персистится — см. partialize ниже.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "la-mia-fortuna-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
