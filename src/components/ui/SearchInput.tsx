import { Search, X } from "lucide-react"
import type { InputHTMLAttributes } from "react"

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> & {
  label: string
  value: string
  onClear?: () => void
}

export function SearchInput({ label, value, onClear, className = "", ...props }: SearchInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink-DEFAULT">{label}</span>
      <span className="relative block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-secondary"
        />
        <input
          className={`ui-control h-12 pl-10 pr-10 text-base [&::-webkit-search-cancel-button]:hidden ${className}`}
          type="search"
          value={value}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink-secondary focus:outline-none focus:ring-2 focus:ring-border"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </span>
    </label>
  )
}
