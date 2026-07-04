import * as React from "react"

import { cn } from "@/lib/utils"

/** Muted field label matching the modal design system. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("ml-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Label }
