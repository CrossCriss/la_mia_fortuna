"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { PhoneMaskField } from "@/components/ui/PhoneMaskField";
import { Button } from "@/components/ui/Button";

type Mode = "login" | "register";

function inputClass(hasError?: boolean) {
  return cn(
    "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink transition-colors duration-150 ease-out focus:border-accent focus:outline-none",
    hasError ? "border-sale" : "border-border"
  );
}

// NextAuth при помилці OAuth-флоу (Google тощо) редіректить назад сюди з
// ?error=<код> в URL — без цього мапінгу форма просто мовчки перерендерювалась
// пустою і виглядало, ніби "нічого не відбулось" (справжня причина бага з
// AccountNotLinkedError: цей код НЕ пишеться в консоль сервера — NextAuth
// обробляє його як штатний редірект, не як помилку для логування).
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "Цей email вже зареєстрований. Спробуйте увійти через Google ще раз.",
  OAuthSignin: "Не вдалося почати вхід через Google. Спробуйте ще раз.",
  OAuthCallback: "Не вдалося завершити вхід через Google. Спробуйте ще раз.",
  OAuthCreateAccount: "Не вдалося створити акаунт через Google. Спробуйте ще раз.",
  Callback: "Не вдалося завершити вхід. Спробуйте ще раз.",
  CredentialsSignin: "Невірний телефон/email або пароль",
};

function mapAuthError(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Не вдалося увійти. Спробуйте ще раз.";
}

function AccountLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/account";

  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(() => mapAuthError(searchParams.get("error")));

  async function handleLogin() {
    const result = await signIn("credentials", { identifier, password, redirect: false });
    if (result?.error) {
      throw new Error("Невірний телефон/email або пароль");
    }
    router.push(from);
    router.refresh();
  }

  async function handleRegister() {
    if (password.length < 6) {
      throw new Error("Пароль має містити щонайменше 6 символів");
    }
    if (password !== confirmPassword) {
      throw new Error("Паролі не збігаються");
    }

    const response = await fetch("/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, confirmPassword }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Не вдалося зареєструватися");
    }

    await handleLogin();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") await handleLogin();
      else await handleRegister();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-ink">Особистий кабінет</h1>

      <div className="mt-6 flex rounded-full bg-secondary/40 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={cn(
            "flex-1 rounded-full py-2 transition",
            mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
          )}
        >
          Вхід
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={cn(
            "flex-1 rounded-full py-2 transition",
            mode === "register" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
          )}
        >
          Реєстрація
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Телефон або email</span>
          <PhoneMaskField
            type="text"
            value={identifier}
            onValueChange={setIdentifier}
            allowFreeText
            placeholder="+38 (0__) ___-__-__ або mail@example.com"
            className={inputClass()}
            autoComplete="username"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass()}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {mode === "register" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Підтвердіть пароль</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClass()}
              autoComplete="new-password"
            />
          </label>
        )}

        {error && <p className="text-sm text-sale">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Зачекайте…" : mode === "login" ? "Увійти" : "Зареєструватися"}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-border" />
        або
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: from })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-white"
      >
        Увійти через Google
      </button>

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/" className="underline">
          Продовжити без реєстрації
        </Link>
      </p>
    </div>
  );
}

export default function AccountLoginPage() {
  return (
    <Suspense>
      <AccountLoginForm />
    </Suspense>
  );
}
