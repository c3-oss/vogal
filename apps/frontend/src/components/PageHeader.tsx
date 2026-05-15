import type { ReactNode } from 'react'
import { cn } from '../lib/utils.js'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex h-12 items-center justify-between gap-4', className)}>
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {description && (
          <>
            <span className="hidden h-3 w-px shrink-0 bg-border sm:inline-block" aria-hidden />
            <p className="hidden truncate text-sm text-muted-foreground sm:block">{description}</p>
          </>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
