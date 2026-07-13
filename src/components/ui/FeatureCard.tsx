import type { LucideIcon } from "lucide-react"

type FeatureCardProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <article className="surface-card p-5 transition duration-150 ease-out hover:border-primary/20">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-ink-DEFAULT">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">{description}</p>
    </article>
  )
}
