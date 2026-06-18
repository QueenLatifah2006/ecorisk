import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80": variant === "default",
          "border-transparent bg-green-600 text-white shadow hover:bg-green-600/80": variant === "success",
          "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80": variant === "warning",
          "border-transparent bg-red-600 text-white shadow hover:bg-red-600/80": variant === "destructive",
          "text-slate-950": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
