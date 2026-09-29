import { Suspense } from "react";

import { LoginForm } from "../widget/login_form";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--color-surface))] px-4 py-10">
      <section className="w-full max-w-sm rounded-2xl border border-[hsl(var(--color-border))] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--color-primary-strong))]">
          SISTER Console
        </p>
        <h1 className="mt-2 text-xl font-bold text-[hsl(var(--color-text))]">Masuk</h1>
        <p className="mt-1 text-sm text-[hsl(var(--color-muted))]">
          Gunakan akun aplikasi yang dibuat oleh admin. Akun SISTER tidak dipakai di sini.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
