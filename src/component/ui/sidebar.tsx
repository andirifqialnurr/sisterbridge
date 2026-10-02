"use client";

import { useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bell, BookOpen, BriefcaseBusiness, Building2, Compass, Database, FileText, FolderOpen, GraduationCap, HandHeart, HeartHandshake, LayoutDashboard, Menu, Microscope, RefreshCw, Search, Settings2, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { jelajahModules, type JelajahGroup } from "@/modules/jelajah/api/jelajah_catalog";
import { cn } from "@/lib/cn";
import { useTRPC } from "@/lib/trpc";
import { theme } from "@/const/theme";
import { useTheme } from "@/hook/use-theme";
import styles from "./sidebar.module.css";
import { ThemeToggle } from "./theme_toggle";

type NavigationItem = { label: string; href: string; icon?: LucideIcon; requiresAdmin?: boolean; requiresOperator?: boolean };
type NavigationGroup = { label: string; icon?: LucideIcon; items: NavigationItem[] };

const groupIcons: Record<JelajahGroup, LucideIcon> = {
  "Data pribadi": UserRound,
  Kepegawaian: BriefcaseBusiness,
  "Pendidikan dan kompetensi": GraduationCap,
  "Pengajaran dan bimbingan": BookOpen,
  "Penelitian dan publikasi": Microscope,
  "Pengabdian dan penunjang": HandHeart,
  Kesejahteraan: HeartHandshake,
  "Dokumen dan BKD": FolderOpen,
  Pencarian: Search,
  Referensi: Building2,
};

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
    { label: "Peringatan", href: "/peringatan", icon: Bell, requiresAdmin: true },
    { label: "Akses", href: "/akses", icon: ShieldCheck, requiresAdmin: true },
  ];
  const moduleGroups = [...new Set(jelajahModules.map((module) => module.group))].map((label) => ({
    label,
    icon: groupIcons[label],
    items: jelajahModules.filter((module) => module.group === label).map((module) => ({
      label: module.label,
      href: moduleHref(module),
      requiresAdmin: true,
    })),
  }));
  return [
    { label: "Workspace", items: workspace },
    ...moduleGroups,
    { label: "Operasi", icon: Settings2, items: [
      { label: "Data Replika", href: "/replika", icon: Database, requiresOperator: true },
      { label: "Jelajah Data", href: "/jelajah", icon: Compass, requiresOperator: true },
      { label: "Status Sinkronisasi", href: "/replika/status", icon: RefreshCw, requiresOperator: true },
      { label: "Audit security", href: "/audit", icon: ShieldCheck, requiresAdmin: true },
    ] },
  ];
}

export function Sidebar({ activeLabel = "Ikhtisar" }: { activeLabel?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.overview.session.queryOptions());
  const role = sessionQuery.data?.role;
  const groups = makeGroups().map((group) => ({
    ...group,
    items: group.items.filter((item) => (!item.requiresAdmin || role === "ADMIN") && (!item.requiresOperator || role === "ADMIN" || role === "OPERATOR")),
  })).filter((group) => group.items.length > 0);
  const activeHref = groups.flatMap((group) => group.items).find((item) => {
    const path = item.href.split("?")[0];
    return item.label === activeLabel && (pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
  })?.href;
  return <>
    <button title={mobileOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"} className="fixed left-4 top-3 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text))] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary))] lg:hidden" onClick={() => setMobileOpen((open) => !open)} type="button">{mobileOpen ? <X aria-hidden size={18} /> : <Menu aria-hidden size={18} />}</button>
    {mobileOpen && <button aria-label="Tutup navigasi" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} type="button" />}
    <SidebarPanel activeHref={activeHref} groups={groups} mobile={false} />
    {mobileOpen && <SidebarPanel activeHref={activeHref} groups={groups} mobile onNavigate={() => setMobileOpen(false)} open />}
  </>;
}

function SidebarPanel({ activeHref, groups, mobile, onNavigate, open = false }: { activeHref?: string; groups: NavigationGroup[]; mobile: boolean; onNavigate?: () => void; open?: boolean }) {
  const { resolvedTheme } = useTheme();
  const colors = theme.sidebar[resolvedTheme];
  const colorVariables = {
    "--sidebar-hover": colors.hover,
    "--sidebar-hover-text": colors.hoverText,
    "--sidebar-selected": colors.selected,
    "--sidebar-selected-text": colors.selectedText,
  } as CSSProperties;

  function links(group: NavigationGroup) {
    return <ul className={group.icon ? styles.children : "space-y-1"}>{group.items.map((item) => {
      const Icon = item.icon;
      const active = item.href === activeHref;
      return <li key={`${item.label}:${item.href}`}>
        <Link aria-current={active ? "page" : undefined} className={styles.item} data-active={active} href={item.href} onClick={onNavigate}>
          {!group.icon && Icon && <Icon aria-hidden size={18} />}
          <span>{item.label}</span>
        </Link>
      </li>;
    })}</ul>;
  }

  return <aside aria-hidden={mobile && !open} style={colorVariables} className={cn("flex h-dvh flex-col border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]", mobile ? "fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-32px)] lg:hidden" : "sticky top-0 hidden w-56 shrink-0 lg:flex")}>
    <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-[hsl(var(--color-border))] px-5", mobile && "pl-16")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold" style={{ background: colors.selected, color: colors.selectedText }}>S</div>
      <div><p className="text-sm font-semibold">SISTER Console</p><p className="text-xs text-[hsl(var(--color-muted))]">PT integration</p></div>
    </div>
    <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
      {groups.map((group) => {
        const Icon = group.icon;
        const active = group.items.some((item) => item.href === activeHref);
        if (!Icon) return <div className="mb-3" key={group.label}>
          <p className="px-3 py-2 text-xs font-medium text-[hsl(var(--color-muted))]">{group.label}</p>
          {links(group)}
        </div>;
        return <details key={`${group.label}:${active}`} open={active}>
          <summary className={cn(styles.item, styles.summary)} data-active={active}>
            <Icon aria-hidden size={18} /><span>{group.label}</span>
          </summary>
          {links(group)}
        </details>;
      })}
    </nav>
    <div className="flex shrink-0 items-center justify-end border-t border-[hsl(var(--color-border))] p-3"><ThemeToggle /></div>
  </aside>;
}
