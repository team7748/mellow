import type { PropsWithChildren } from "react"

type PageContainerProps = PropsWithChildren<{
  className?: string
}>

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

