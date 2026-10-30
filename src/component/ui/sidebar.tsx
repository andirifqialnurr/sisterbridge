"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bell, BookOpen, BriefcaseBusiness, Building2, Compass, Database, FileText, FolderOpen, GraduationCap, HandHeart, HeartHandshake, LayoutDashboard, Menu, Microscope, RefreshCw, Search, Settings2, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { jelajahModules, type JelajahGroup } from "@/modules/jelajah/api/jelajah_catalog";
import { moduleNavigationContext, moduleNavigationHref } from "@/modules/jelajah/api/module_navigation";
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

function makeGroups(context: ReturnType<typeof moduleNavigationContext>): NavigationGroup[] {
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
      href: moduleNavigationHref(module, context),
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
  const search = useSearchParams().toString();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) closeMobile(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [closeMobile]);
  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.overview.session.queryOptions());
  const role = sessionQuery.data?.role;
  const groups = makeGroups(moduleNavigationContext(pathname, search)).map((group) => ({
    ...group,
    items: group.items.filter((item) => (!item.requiresAdmin || role === "ADMIN") && (!item.requiresOperator || role === "ADMIN" || role === "OPERATOR")),
  })).filter((group) => group.items.length > 0);
  const activeHref = groups.flatMap((group) => group.items).find((item) => {
    const path = item.href.split("?")[0];
    const profile = jelajahModules.find((entry) => entry.kind === "sdm_object" && entry.label === item.label);
    const profilePath = profile?.path.split("/{")[0];
    return item.label === activeLabel && (pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)) || Boolean(profilePath && pathname.startsWith(`${profilePath}/`)));
  })?.href;
  return <>
    <button title={mobileOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"} className={cn("fixed left-4 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text))] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary))] lg:hidden", mobileOpen ? "z-40" : "z-[60]")} onClick={() => setMobileOpen((open) => !open)} type="button">{mobileOpen ? <X aria-hidden size={18} /> : <Menu aria-hidden size={18} />}</button>
    {mobileOpen && <button aria-label="Tutup navigasi" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} type="button" />}
    <SidebarPanel activeHref={activeHref} groups={groups} mobile={false} />
    {mobileOpen && <SidebarPanel activeHref={activeHref} groups={groups} mobile onNavigate={closeMobile} open />}
  </>;
}

function SidebarPanel({ activeHref, groups, mobile, onNavigate, open = false }: { activeHref?: string; groups: NavigationGroup[]; mobile: boolean; onNavigate?: () => void; open?: boolean }) {
  const { resolvedTheme } = useTheme();
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mobile) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    function revealActive() {
      if (desktop.matches) panelRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
    }
    revealActive();
    desktop.addEventListener("change", revealActive);
    return () => desktop.removeEventListener("change", revealActive);
  }, [activeHref, mobile]);
  useEffect(() => {
    if (!mobile || !open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [...(panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), summary',
    ) ?? [])].filter((element) => element.getClientRects().length > 0);
    (panelRef.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? focusable()[0])?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onNavigate?.();
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [mobile, open, onNavigate]);
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
        <Link aria-current={active ? "page" : undefined} className={styles.item} data-active={active} href={item.href} onClick={onNavigate} title={item.label}>
          {!group.icon && Icon && <Icon aria-hidden size={18} />}
          <span>{item.label}</span>
        </Link>
      </li>;
    })}</ul>;
  }

  return <aside ref={panelRef} aria-hidden={mobile && !open} role={mobile ? "dialog" : undefined} aria-modal={mobile ? true : undefined} aria-label={mobile ? "Navigasi utama" : undefined} style={colorVariables} className={cn("flex h-dvh flex-col border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]", mobile ? "fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-32px)] lg:hidden" : "sticky top-0 hidden w-56 shrink-0 lg:flex")}>
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[hsl(var(--color-border))] px-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold" style={{ background: colors.selected, color: colors.selectedText }}>S</div>
      <div><p className="text-sm font-semibold">SisterBridge</p><p className="text-xs text-[hsl(var(--color-muted))]">Laporan dan peringatan</p></div>
      {mobile && <button aria-label="Tutup navigasi" className="ml-auto rounded-md p-1 focus-visible:outline-2 focus-visible:outline-[hsl(var(--color-primary))]" onClick={onNavigate} type="button"><X aria-hidden size={18} /></button>}
    </div>
    <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
      {groups.map((group) => {
        const Icon = group.icon;
        const active = group.items.some((item) => item.href === activeHref);
        if (!Icon) return <div className="mb-3" key={group.label}>
          <p className="px-3 py-2 text-xs font-medium text-[hsl(var(--color-muted))]">{group.label}</p>
          {links(group)}
        </div>;
        return <details key={`${group.label}:${active}`} name={mobile ? "sidebar-mobile" : "sidebar-desktop"} open={active}>
          <summary className={cn(styles.item, styles.summary)} data-active={active} title={group.label}>
            <Icon aria-hidden size={18} /><span>{group.label}</span>
          </summary>
          {links(group)}
        </details>;
      })}
    </nav>
    <div className="flex shrink-0 items-center justify-end border-t border-[hsl(var(--color-border))] p-3"><ThemeToggle /></div>
  </aside>;
}
