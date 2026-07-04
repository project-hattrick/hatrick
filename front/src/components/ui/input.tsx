import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/** Soft, pill-radius field matching the modal design system (see docs/modals). */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-muted-foreground focus-visible:border-foreground/40",
        "disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
