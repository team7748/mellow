import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  subtitle?: string
  description?: ReactNode
  rightContent?: ReactNode
}

export function PageHeader({ title, subtitle, description, rightContent }: PageHeaderProps) {
  return (
    <section className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-primary/20 pb-6">
      <div className="flex-1">
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
      
      {rightContent && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 sm:mt-0">
          {rightContent}
        </div>
      )}
    </section>
  )
}
