"use client";

import { useState } from "react";

export function ProductFeaturedToggle({
  productId,
  initialValue,
}: {
  productId: string;
  initialValue: boolean;
}) {
  const [checked, setChecked] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);

  async function handleChange(nextChecked: boolean) {
    const previous = checked;
    setChecked(nextChecked);
    setShowError(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHomepage: nextChecked }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setChecked(previous);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        disabled={isSaving}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 disabled:opacity-50"
        aria-label="Показувати товар на головній"
      />
      {showError && (
        <span className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-600 px-2 py-1 text-xs text-white shadow-lg">
          Не вдалося зберегти
        </span>
      )}
    </div>
  );
}
