import type { ButtonHTMLAttributes, PropsWithChildren } from "react"

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "outline-danger" | "outline-warning" | "outline-success" | "outline-info" | "custom"

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
  }
>

const variants: Record<ButtonVariant, string> = {
  danger: "border border-rose-200 bg-card text-rose-700 hover:border-rose-300 hover:bg-rose-50",
  primary: "border border-primary bg-primary text-white hover:border-primary hover:bg-primary-hover",
  secondary: "border border-border bg-card text-primary hover:border-primary/20 hover:bg-primary-soft",
  success: "border border-primary bg-primary text-white hover:border-primary hover:bg-primary",
  "outline-danger": "border border-border bg-card text-rose-600 hover:border-rose-200 hover:bg-rose-50",
  "outline-warning": "border border-border bg-card text-amber-700 hover:border-amber-200 hover:bg-amber-50",
  "outline-success": "border border-primary/20 bg-primary-soft text-primary hover:bg-primary-active shadow-sm",
  "outline-info": "border border-border bg-card text-sky-600 hover:border-sky-200 hover:bg-sky-50",
  "custom": "", // For passing all classes via className
}

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-base font-semibold transition duration-150 ease-out motion-safe:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-border disabled:bg-slate-100 disabled:text-ink-secondary disabled:opacity-70 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
