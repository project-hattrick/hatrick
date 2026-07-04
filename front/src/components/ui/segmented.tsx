"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Option = { label: string; value: string }

interface SegmentedProps {
  /** Either raw string values or `{ label, value }` pairs. */
  options: readonly string[] | readonly Option[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

const normalize = (o: string | Option): Option =>
  typeof o === "string" ? { label: o, value: o } : o

/**
 * Pill segmented control from the modal design system (the "Pricing & Access"
 * control). A single CSS-transformed indicator slides under the active option —
 * the framework-free equivalent of the reference's `layoutId` shared element.
 */
function Segmented({ options, value, onValueChange, className }: SegmentedProps) {
  const opts = React.useMemo(() => options.map(normalize), [options])
  const activeIndex = Math.max(0, opts.findIndex((o) => o.value === value))

  return (
    <div
      role="radiogroup"
      className={cn(
        "relative grid rounded-full border border-white/10 bg-white/[0.03] p-1",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-full border border-white/10 bg-surface-3 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${opts.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {opts.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(o.value)}
            className={cn(
              "relative z-10 rounded-full py-3 text-[11px] font-medium tracking-widest uppercase transition-colors sm:text-xs",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
