"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося увійти");
      }

      const from = searchParams.get("from");
      router.push(from && from.startsWith("/admin") ? from : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-neutral-900">Вхід до адмінки</h1>

        <label className="mt-5 block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {isSubmitting ? "Вхід…" : "Увійти"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
