"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption = { label: string; value: string };
type SelectProps = {
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
};

export function Select({ ariaLabel, disabled, id, onValueChange, options, placeholder = "Pilih", value }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef({ text: "", time: 0 });
  const listId = `${useId().replaceAll(":", "")}-options`;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const isOpen = open && !disabled;
  const activeIndex = Math.min(active, Math.max(0, options.length - 1));

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  function show(index = Math.max(0, selectedIndex)) {
    setActive(index);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }
  function choose(index: number) {
    const option = options[index];
    if (option) onValueChange(option.value);
    close();
  }
  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    const last = options.length - 1;
    if (event.key === "Escape" && isOpen) {
      event.preventDefault(); event.stopPropagation(); close();
    } else if (event.key === "Tab" && isOpen) {
      close();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? last
        : !isOpen ? Math.max(0, selectedIndex)
        : event.key === "ArrowDown" ? (activeIndex + 1) % options.length
        : (activeIndex - 1 + options.length) % options.length;
      if (options.length) show(next);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) choose(activeIndex); else show();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      typeahead.current = { text: (now - typeahead.current.time < 700 ? typeahead.current.text : "") + event.key.toLocaleLowerCase(), time: now };
      const match = options.findIndex((option) => option.label.toLocaleLowerCase().startsWith(typeahead.current.text));
      if (match >= 0) { event.preventDefault(); show(match); }
    }
  }

  return <div className="relative min-w-0" onKeyDown={onKeyDown} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} ref={rootRef}>
    <button
      aria-controls={isOpen ? listId : undefined} aria-expanded={isOpen} aria-haspopup="listbox" aria-label={ariaLabel}
      className={cn("inline-flex h-10 w-full min-w-[160px] items-center justify-between gap-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-left text-sm text-[hsl(var(--color-text))] outline-none transition-colors focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]", disabled && "cursor-not-allowed opacity-70")}
      disabled={disabled} id={id} onClick={() => isOpen ? close() : show()} ref={triggerRef} type="button"
    >
      <span className={cn("truncate", selectedIndex < 0 && "text-[hsl(var(--color-muted))]")}>{options[selectedIndex]?.label ?? placeholder}</span>
      <ChevronDown aria-hidden className={cn("shrink-0 transition-transform", isOpen && "rotate-180")} size={16} />
    </button>
    {isOpen && <div aria-label={ariaLabel ?? placeholder} className="absolute right-0 z-30 mt-2 max-h-72 w-full min-w-[180px] max-w-[calc(100vw-60px)] overflow-auto rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-1 shadow-lg" id={listId} role="listbox">
      {options.length === 0 && <p className="px-3 py-2 text-sm text-[hsl(var(--color-muted))]">Tidak ada pilihan.</p>}
      {options.map((option, index) => <button
        aria-selected={option.value === value}
        className={cn("flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-[hsl(var(--color-text))] outline-none hover:bg-[hsl(var(--color-primary-soft))] focus:bg-[hsl(var(--color-primary-soft))]", option.value === value && "font-semibold text-[hsl(var(--color-primary-strong))]")}
        key={option.value} onClick={() => choose(index)} onFocus={() => setActive(index)}
        ref={(element) => { optionRefs.current[index] = element; }} role="option" tabIndex={index === activeIndex ? 0 : -1} type="button"
      ><span className="min-w-0 break-words">{option.label}</span>{option.value === value && <Check aria-hidden className="shrink-0" size={15} />}</button>)}
    </div>}
  </div>;
}
