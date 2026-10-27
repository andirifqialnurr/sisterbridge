import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

function getPageItems(page: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", pageCount] as const;
  }

  if (page >= pageCount - 3) {
    return [1, "ellipsis-left", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount] as const;
  }

  return [1, "ellipsis-left", page - 1, page, page + 1, "ellipsis-right", pageCount] as const;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  disabled = false,
  className,
  ariaLabel = "Pagination",
}: PaginationProps) {
  if (pageCount <= 1) {
    return page > 1 ? <button className="rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm text-[hsl(var(--color-primary))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--color-primary))]" disabled={disabled} onClick={() => onPageChange(1)} type="button">Kembali ke halaman pertama</button> : null;
  }

  const safePage = Math.min(Math.max(page, 1), pageCount);
  const pageItems = getPageItems(safePage, pageCount);
  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[hsl(var(--color-border))] px-2 text-xs font-semibold text-[hsl(var(--color-muted))] transition-colors hover:bg-[hsl(var(--color-primary-soft))] hover:text-[hsl(var(--color-primary-strong))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary))] disabled:pointer-events-none disabled:opacity-50";

  return (
    <nav aria-label={ariaLabel} className={cn("flex max-w-full flex-wrap items-center justify-end gap-1", className)}>
      <button
        aria-label="Halaman sebelumnya"
        className={buttonClass}
        disabled={disabled || safePage === 1}
        onClick={() => onPageChange(safePage - 1)}
        title="Halaman sebelumnya"
        type="button"
      >
        <ChevronLeft aria-hidden size={15} />
      </button>

      {pageItems.map((item) =>
        typeof item === "string" ? (
          <span aria-hidden className="px-1 text-xs text-[hsl(var(--color-muted))]" key={item}>
            …
          </span>
        ) : (
          <button
            aria-current={item === safePage ? "page" : undefined}
            className={cn(
              buttonClass,
              item === safePage &&
                "border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-primary-strong))] hover:text-white",
            )}
            disabled={disabled}
            key={item}
            onClick={() => onPageChange(item)}
            type="button"
          >
            {item}
          </button>
        ),
      )}

      <button
        aria-label="Halaman berikutnya"
        className={buttonClass}
        disabled={disabled || safePage === pageCount}
        onClick={() => onPageChange(safePage + 1)}
        title="Halaman berikutnya"
        type="button"
      >
        <ChevronRight aria-hidden size={15} />
      </button>
    </nav>
  );
}
