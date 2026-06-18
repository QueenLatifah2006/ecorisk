import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-900 text-white hover:bg-slate-800 shadow-md": variant === "default",
            "bg-red-500 text-slate-50 hover:bg-red-500/90 shadow-sm": variant === "destructive",
            "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-sm": variant === "outline",
            "bg-slate-100 text-slate-900 hover:bg-slate-100/80": variant === "secondary",
            "hover:bg-slate-100 hover:text-slate-900": variant === "ghost",
            "text-slate-900 underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2.5": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
