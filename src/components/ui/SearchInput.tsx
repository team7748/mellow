import { Search, X } from "lucide-react"
import type { InputHTMLAttributes } from "react"

import { cn } from "../../utils/cn"
import { Input } from "./Input"

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string
  onClear?: () => void
}

export function SearchInput({ label, value, onClear, className, ...props }: SearchInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink-DEFAULT">{label}</span>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-secondary">
          <Search className="h-5 w-5" />
        </div>
        <Input
          type="search"
          value={value}
          {...props}
          className={cn(
            "h-12 pl-10 pr-10 text-base [&::-webkit-search-cancel-button]:hidden",
            className
          )}
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
      </div>
    </label>
  )
}
