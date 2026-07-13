type StatCardProps = {
  label: string
  value: string
  hint: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <section className="bg-card rounded-[20px] p-5 border border-border shadow-soft transition-all duration-300 ease-out hover:border-primary/20 hover:shadow-md motion-safe:hover:-translate-y-1">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink-dark">{value}</p>
      <p className="mt-2 text-xs font-semibold text-ink-secondary">{hint}</p>
    </section>
  )
}
