"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Database,
  RefreshCw,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  X,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { useTRPC } from "@/lib/trpc";
import { ThemeToggle } from "./theme_toggle";

type NavigationItem = {
  label: string;
  href: "/" | "/pegawai" | "/referensi" | "/bkd" | "/penugasan" | "/pendidikan_formal" | "/riwayat_pekerjaan" | "/replika" | "/replika/status" | "/jelajah" | "/audit" | "#pengajuan" | "#dokumen";
  icon: LucideIcon;
  requiresAdmin?: boolean;
  requiresOperator?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: "Ikhtisar", href: "/", icon: LayoutDashboard },
  { label: "Pegawai", href: "/pegawai", icon: UsersRound },
  { label: "Referensi", href: "/referensi", icon: ClipboardCheck },
  { label: "BKD", href: "/bkd", icon: BarChart3 },
  { label: "Penugasan", href: "/penugasan", icon: ClipboardList },
  { label: "Pendidikan Formal", href: "/pendidikan_formal", icon: GraduationCap },
  { label: "Riwayat Pekerjaan", href: "/riwayat_pekerjaan", icon: BriefcaseBusiness },
  { label: "Data Replika", href: "/replika", icon: Database },
  { label: "Jelajah Data", href: "/jelajah", icon: Compass, requiresOperator: true },
  { label: "Status Sinkronisasi", href: "/replika/status", icon: RefreshCw, requiresOperator: true },
  { label: "Pengajuan", href: "#pengajuan", icon: FileText },
  { label: "Audit security", href: "/audit", icon: ShieldCheck, requiresAdmin: true },
];

export function Sidebar({ activeLabel = "Ikhtisar" }: { activeLabel?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.overview.session.queryOptions());
  const role = sessionQuery.data?.role;
  const isAdmin = role === "ADMIN";
  const isOperator = isAdmin || role === "OPERATOR";
  const items = navigationItems.filter(
    (item) => (!item.requiresAdmin || isAdmin) && (!item.requiresOperator || isOperator),
  );

  return (
    <>
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"}
        className="fixed left-4 top-3 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text))] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary))] lg:hidden"
        onClick={() => setMobileOpen((isOpen) => !isOpen)}
        title={mobileOpen ? "Tutup navigasi" : "Buka navigasi"}
        type="button"
      >
        {mobileOpen ? <X aria-hidden size={18} /> : <Menu aria-hidden size={18} />}
      </button>

      {mobileOpen && (
        <button
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <SidebarPanel activeLabel={activeLabel} items={items} mobile={false} />
      {mobileOpen && (
        <SidebarPanel
          activeLabel={activeLabel}
          items={items}
          mobile
          onNavigate={() => setMobileOpen(false)}
          open
        />
      )}
    </>
  );
}

function SidebarPanel({
  activeLabel,
  items,
  mobile,
  onNavigate,
  open = false,
}: {
  activeLabel: string;
  items: NavigationItem[];
  mobile: boolean;
  onNavigate?: () => void;
  open?: boolean;
}) {
  return (
    <aside
      aria-hidden={mobile && !open}
      className={cn(
        "flex flex-col border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]",
        mobile
          ? "fixed inset-y-0 left-0 z-50 w-72 -translate-x-full transition-transform lg:hidden"
          : "hidden w-56 shrink-0 lg:flex",
        mobile && open && "translate-x-0",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--color-border))] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--color-primary))] text-sm font-black text-white">
          S
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-[hsl(var(--color-text))]">
            SISTER Console
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--color-muted))]">
            PT integration
          </p>
        </div>
      </div>

      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 p-3">
        <p className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--color-muted))]">
          Workspace
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === activeLabel;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary-strong))]"
                  : "text-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-canvas))] hover:text-[hsl(var(--color-text))]",
              )}
              href={item.href}
              key={item.label}
              onClick={onNavigate}
              tabIndex={mobile && !open ? -1 : undefined}
            >
              <Icon aria-hidden size={17} strokeWidth={isActive ? 2.4 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-[hsl(var(--color-border))] p-3">
        <button className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[hsl(var(--color-muted))] transition-colors hover:bg-[hsl(var(--color-canvas))] hover:text-[hsl(var(--color-text))]">
          <Settings2 aria-hidden size={17} />
          <span className="truncate">Pengaturan</span>
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
