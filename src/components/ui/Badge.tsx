import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

export const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold leading-5 ring-1",
  {
    variants: {
      variant: {
        neutral: "bg-page text-ink-secondary ring-border",
        accent: "bg-primary-active text-primary ring-primary/20",
        info: "bg-mission-blue-bg text-mission-blue ring-mission-blue/20",
        warning: "bg-mission-orange-bg text-mission-orange ring-mission-orange/20",
        danger: "bg-rose-50 text-rose-700 ring-rose-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"
