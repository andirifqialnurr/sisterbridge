import type { Metadata } from "next";
import { Suspense } from "react";

import { ThemeProvider } from "@/component/theme-provider";
import { TrpcProvider } from "@/lib/trpc";

import "./globals.css";

export const metadata: Metadata = {
  title: "SISTER Console",
  description: "Workspace integrasi SISTER Web Service PT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>
          <TrpcProvider><Suspense fallback={<p className="p-[30px] text-sm" role="status">Memuat aplikasi...</p>}>{children}</Suspense></TrpcProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
