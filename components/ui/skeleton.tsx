import React, { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn("bg-muted animate-pulse rounded-md", className)}>
      {children}
    </div>
  )
}
