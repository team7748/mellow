import { forwardRef, type SelectHTMLAttributes } from "react"
import { cn } from "../../utils/cn"

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          "min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-ink outline-none transition duration-150 hover:border-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-page disabled:text-ink-secondary",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Select.displayName = "Select"
