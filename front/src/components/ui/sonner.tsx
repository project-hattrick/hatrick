"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle, Info, Warning, WarningOctagon, CircleNotch } from "@/components/common/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CheckCircle className="size-4" />
        ),
        info: (
          <Info className="size-4" />
        ),
        warning: (
          <Warning className="size-4" />
        ),
        error: (
          <WarningOctagon className="size-4" />
        ),
        loading: (
          <CircleNotch className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          // Mirror the modal chrome: glassy surface-1 fill + a soft surface-2 frame.
          "--normal-bg": "color-mix(in oklch, var(--color-surface-1) 88%, transparent)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "color-mix(in oklch, var(--color-surface-2) 92%, transparent)",
          "--border-radius": "20px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
