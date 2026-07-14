import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  subtitle?: string
  description?: ReactNode
  rightContent?: ReactNode
  icon?: ReactNode
}

export function PageHeader({ title, subtitle, description, rightContent, icon }: PageHeaderProps) {
  return (
    <section className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-primary/20 pb-6">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary mt-1">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {subtitle && (
            <p className="text-sm font-bold tracking-wide text-primary uppercase mb-2">
              {subtitle}
            </p>
          )}
          <h1 className="text-3xl font-black text-ink-dark sm:text-4xl tracking-tight">
            {title}
          </h1>
          {description && (
            <div className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dark font-medium">
              {description}
            </div>
          )}
        </div>
      </div>
      
      {rightContent && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 sm:mt-0 shrink-0">
          {rightContent}
        </div>
      )}
    </section>
  )
}
