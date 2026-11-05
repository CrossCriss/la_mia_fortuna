"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
    >
      Вийти
    </button>
  );
}
