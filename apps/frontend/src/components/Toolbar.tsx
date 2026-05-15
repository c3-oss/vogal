import type { ReactNode } from 'react'
import { cn } from '../lib/utils.js'

interface ToolbarProps {
  left?: ReactNode
  right?: ReactNode
  className?: string
}

export function Toolbar({ left, right, className }: ToolbarProps) {
  return (
    <div className={cn('mb-3 flex h-10 flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  )
}
