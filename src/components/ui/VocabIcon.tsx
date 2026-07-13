import { vocabIconMap, defaultFallbackIcon } from "../../data/vocabIconMap"

type VocabIconProps = {
  /** Primary icon name (must exist in vocabIconMap) */
  icon?: string
  /** Fallback icon name if primary not found */
  fallbackIcon?: string
  /** CSS class for styling */
  className?: string
  /** Icon size in pixels */
  size?: number
  /** Accessible label for screen readers */
  label?: string
}

/**
 * Central component for displaying vocabulary icons.
 *
 * Resolution order:
 * 1. Look up `icon` in vocabIconMap
 * 2. If not found, look up `fallbackIcon`
 * 3. If still not found, use CircleHelp as default
 */
export function VocabIcon({
  icon,
  fallbackIcon,
  className = "",
  size = 20,
  label,
}: VocabIconProps) {
  const ResolvedIcon =
    (icon ? vocabIconMap[icon] : undefined) ??
    (fallbackIcon ? vocabIconMap[fallbackIcon] : undefined) ??
    defaultFallbackIcon

  return (
    <ResolvedIcon
      aria-hidden={!label}
      aria-label={label}
      className={className}
      size={size}
    />
  )
}
