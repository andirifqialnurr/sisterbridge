import type { ReactNode } from "react";

import { AppHeader } from "@/component/ui/app_header";
import { PageBreadcrumb, type PageBreadcrumbItem } from "@/component/ui/page_breadcrumb";
import { Sidebar } from "@/component/ui/sidebar";

type PageShellProps = {
  activeLabel?: string;
  actions?: ReactNode;
  breadcrumb: PageBreadcrumbItem[];
  children: ReactNode;
  detailLabel?: string;
  maxWidth?: string;
};

export function PageShell({
  activeLabel = "Ikhtisar",
  actions,
  breadcrumb,
  children,
  detailLabel,
  maxWidth = "none",
}: PageShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activeLabel={activeLabel} />
      <div className="min-w-0 flex-1 bg-[hsl(var(--color-canvas))]">
        <AppHeader maxWidth={maxWidth} />
        <main
          className="min-w-0 space-y-6 px-[30px] py-6"
          style={{ maxWidth }}
        >
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <PageBreadcrumb detailLabel={detailLabel} items={breadcrumb} />
            {actions && <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
