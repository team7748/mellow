import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

export const chipVariants = cva(
  "inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-ink hover:border-primary hover:text-primary disabled:border-border disabled:bg-card disabled:text-ink-secondary",
        selected: "border-primary/20 bg-primary-active text-primary ring-1 ring-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(chipVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
Chip.displayName = "Chip"
