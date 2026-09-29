"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/component/ui/button";
import { authClient } from "@/lib/auth_client";

const inputClassName =
  "h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-white px-3 text-sm text-[hsl(var(--color-text))] outline-none transition-colors placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]";

// Only same-site relative paths are accepted as the post-login target.
export function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const result = await authClient.signIn.email({ email: email.trim(), password });
        setIsSubmitting(false);

        if (result.error) {
          setError(
            result.error.status === 429
              ? "Terlalu banyak percobaan. Coba lagi dalam satu menit."
              : "Email atau password salah, atau akun tidak aktif.",
          );
          return;
        }

        router.replace(safeNextPath(searchParams.get("next")));
        router.refresh();
      }}
    >
      <label className="block space-y-1.5" htmlFor="login-email">
        <span className="text-xs font-semibold text-[hsl(var(--color-text))]">Email</span>
        <input
          autoComplete="username"
          className={inputClassName}
          id="login-email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className="block space-y-1.5" htmlFor="login-password">
        <span className="text-xs font-semibold text-[hsl(var(--color-text))]">Password</span>
        <input
          autoComplete="current-password"
          className={inputClassName}
          id="login-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error && (
        <p
          className="rounded-lg bg-[hsl(var(--color-danger-soft))] px-3 py-2 text-xs text-[hsl(var(--color-danger-strong))]"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
