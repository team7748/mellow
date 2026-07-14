import { forwardRef, type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

export const cardVariants = cva(
  "rounded-2xl border border-border shadow-soft",
  {
    variants: {
      variant: {
        default: "bg-card",
        muted: "bg-primary-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5 sm:p-6 pb-4 sm:pb-5", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-xl font-bold leading-tight text-ink-dark sm:text-2xl", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-ink-secondary", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 sm:p-6 pt-0 sm:pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-5 sm:p-6 pt-0 sm:pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
