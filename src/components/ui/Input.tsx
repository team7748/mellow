import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "../../utils/cn"

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-ink outline-none transition duration-150 placeholder:text-ink-secondary hover:border-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-page disabled:text-ink-secondary",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
