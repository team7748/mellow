import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

export const optionCardVariants = cva(
  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border bg-card hover:border-primary/30 hover:bg-primary-soft",
        selected: "border-primary/30 bg-primary-active text-primary ring-1 ring-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface OptionCardProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof optionCardVariants> {
  selected?: boolean
}

export const OptionCard = forwardRef<HTMLButtonElement, OptionCardProps>(
  ({ className, variant, selected, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(optionCardVariants({ variant: selected ? "selected" : variant, className }))}
        {...props}
      />
    )
  }
)
OptionCard.displayName = "OptionCard"
