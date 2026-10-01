"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpen, BriefcaseBusiness, Building2, Compass, Database, FileText, GraduationCap, LayoutDashboard, Menu, RefreshCw, Search, ShieldCheck, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";
import { cn } from "@/lib/cn";
import { useTRPC } from "@/lib/trpc";
import { ThemeToggle } from "./theme_toggle";

type NavigationItem = { label: string; href: string; icon: LucideIcon; requiresAdmin?: boolean; requiresOperator?: boolean };
type NavigationGroup = { label: string; items: NavigationItem[] };

function moduleHref(module: (typeof jelajahModules)[number]) {
  if (module.kind === "sdm_object") return `/pegawai?tab=${encodeURIComponent(module.key)}`;
  if (module.key.startsWith("bkd_") || module.key === "laporan_akhir_bkd") return `/bkd?tab=${encodeURIComponent(module.key)}`;
  const query = new URLSearchParams(module.query ?? {}).toString();
  return `${module.path}${query ? `?${query}` : ""}`;
}

function makeGroups(): NavigationGroup[] {
  const workspace: NavigationItem[] = [
    { label: "Ikhtisar", href: "/", icon: LayoutDashboard, requiresAdmin: true },
    { label: "Pegawai", href: "/pegawai", icon: UsersRound, requiresAdmin: true },
    { label: "BKD", href: "/bkd", icon: BarChart3, requiresAdmin: true },
    { label: "Direktori referensi", href: "/referensi", icon: Building2, requiresAdmin: true },
    { label: "Laporan", href: "/laporan", icon: FileText, requiresAdmin: true },
    { label: "Peringatan", href: "/peringatan", icon: RefreshCw, requiresAdmin: true },
    { label: "Akses", href: "/akses", icon: ShieldCheck, requiresAdmin: true },
  ];
  const moduleGroups = [...new Set(jelajahModules.map((module) => module.group))].map((label) => ({
    label,
    items: jelajahModules.filter((module) => module.group === label).map((module) => ({
      label: module.label,
      href: moduleHref(module),
      icon: module.kind === "search" ? Search : module.group.includes("Pendidikan") ? GraduationCap : module.group.includes("Pengajaran") ? BookOpen : module.group.includes("Kepegawaian") ? BriefcaseBusiness : module.group === "Referensi" ? Building2 : FileText,
      requiresAdmin: true,
    })),
  }));
  return [
    { label: "Workspace", items: workspace },
    ...moduleGroups,
    { label: "Operasi", items: [
      { label: "Data Replika", href: "/replika", icon: Database, requiresOperator: true },
      { label: "Jelajah Data", href: "/jelajah", icon: Compass, requiresOperator: true },
      { label: "Status Sinkronisasi", href: "/replika/status", icon: RefreshCw, requiresOperator: true },
      { label: "Audit security", href: "/audit", icon: ShieldCheck, requiresAdmin: true },
    ] },
  ];
}

export function Sidebar({ activeLabel = "Ikhtisar" }: { activeLabel?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.overview.session.queryOptions());
  const role = sessionQuery.data?.role;
  const groups = makeGroups().map((group) => ({
    ...group,
    items: group.items.filter((item) => (!item.requiresAdmin || role === "ADMIN") && (!item.requiresOperator || role === "ADMIN" || role === "OPERATOR")),
  })).filter((group) => group.items.length > 0);
  return <>
    <button aria-expanded={mobileOpen} aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"} className="fixed left-4 top-3 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text))] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary))] lg:hidden" onClick={() => setMobileOpen((open) => !open)} type="button">{mobileOpen ? <X aria-hidden size={18} /> : <Menu aria-hidden size={18} />}</button>
    {mobileOpen && <button aria-label="Tutup navigasi" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} type="button" />}
    <SidebarPanel activeLabel={activeLabel} groups={groups} mobile={false} />
    {mobileOpen && <SidebarPanel activeLabel={activeLabel} groups={groups} mobile onNavigate={() => setMobileOpen(false)} open />}
  </>;
}

function SidebarPanel({ activeLabel, groups, mobile, onNavigate, open = false }: { activeLabel: string; groups: NavigationGroup[]; mobile: boolean; onNavigate?: () => void; open?: boolean }) {
  return <aside aria-hidden={mobile && !open} className={cn("flex flex-col border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]", mobile ? "fixed inset-y-0 left-0 z-50 w-72 -translate-x-full transition-transform lg:hidden" : "hidden w-60 shrink-0 lg:flex", mobile && open && "translate-x-0")}>
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[hsl(var(--color-border))] px-5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--color-primary))] text-sm font-black text-white">S</div><div><p className="text-sm font-bold tracking-tight">SISTER Console</p><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--color-muted))]">PT integration</p></div></div>
    <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">{groups.map((group) => <details className="group" key={group.label} open={group.label === "Workspace" || group.items.some((item) => item.label === activeLabel)}><summary className="cursor-pointer rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--color-muted))]">{group.label}</summary><ul className="space-y-0.5">{group.items.map((item) => { const Icon = item.icon; const active = item.label === activeLabel; return <li key={`${item.label}:${item.href}`}><Link aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary-strong))]" : "text-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-canvas))] hover:text-[hsl(var(--color-text))]")} href={item.href} onClick={onNavigate} tabIndex={mobile && !open ? -1 : undefined}><Icon aria-hidden size={16} strokeWidth={active ? 2.4 : 2} /><span>{item.label}</span></Link></li>; })}</ul></details>)}</nav>
    <div className="flex shrink-0 items-center justify-end border-t border-[hsl(var(--color-border))] p-3"><ThemeToggle /></div>
  </aside>;
}
