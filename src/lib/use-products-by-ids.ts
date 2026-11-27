"use client";

import { useEffect, useState } from "react";
import type { GridProduct } from "@/lib/product-card-data";

type State = {
  key: string;
  status: "idle" | "loading" | "ready" | "error";
  products: GridProduct[];
};

export function useProductsByIds(
  ids: string[],
  enabled: boolean,
): { status: "idle" | "loading" | "ready" | "error"; products: GridProduct[]; missingIds: string[] } {
  const key = ids.join(",");
  const [state, setState] = useState<State>({ key: "", status: "idle", products: [] });

  useEffect(() => {
    if (!enabled || key === "") return;
    const controller = new AbortController();
    setState({ key, status: "loading", products: [] });
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(key)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ products: GridProduct[] }>;
      })
      .then((data) => {
        setState({ key, status: "ready", products: data.products ?? [] });
      })
      .catch((error) => {
        if (controller.signal.aborted || (error as Error).name === "AbortError") return;
        setState({ key, status: "error", products: [] });
      });
    return () => controller.abort();
  }, [key, enabled]);

  if (!enabled || key === "" || state.key !== key) {
    return { status: enabled && key !== "" ? "loading" : "idle", products: [], missingIds: [] };
  }

  const missingIds =
    state.status === "ready"
      ? ids.filter((id) => !state.products.some((p) => p.id === id))
      : [];
  return { status: state.status, products: state.products, missingIds };
}
