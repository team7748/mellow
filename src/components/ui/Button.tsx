import { type ButtonHTMLAttributes, forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:border-border disabled:bg-slate-100 disabled:text-ink-secondary disabled:opacity-70 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        primary: "border border-primary bg-primary text-white hover:bg-primary-hover active:bg-primary-hover shadow-sm",
        secondary: "border border-border bg-card text-primary hover:border-primary/20 hover:bg-primary-soft active:bg-primary-active",
        success: "border border-success bg-success text-white hover:bg-success-hover active:bg-success-hover shadow-sm",
        danger: "border border-rose-200 bg-card text-rose-700 hover:border-rose-300 hover:bg-rose-50 active:bg-rose-100",
        "outline-danger": "border border-border bg-card text-rose-600 hover:border-rose-200 hover:bg-rose-50 active:bg-rose-100",
        "outline-warning": "border border-border bg-card text-amber-700 hover:border-amber-200 hover:bg-amber-50 active:bg-amber-100",
        "outline-success": "border border-primary/20 bg-primary-soft text-primary hover:bg-primary-active active:bg-primary-active shadow-sm",
        "outline-info": "border border-border bg-card text-sky-600 hover:border-sky-200 hover:bg-sky-50 active:bg-sky-100",
        ghost: "border border-transparent bg-transparent text-ink-secondary hover:text-ink-dark hover:bg-slate-100 active:bg-slate-200",
        custom: "",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "min-h-12 px-5 py-3 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10 justify-center p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, type = "button", children, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {!loading && children}
      </button>
    )
  }
)
Button.displayName = "Button"
