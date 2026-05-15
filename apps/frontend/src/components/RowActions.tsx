import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './ui/button.js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js'

interface RowActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
  extras?: ReactNode
}

export function RowActions({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete', extras }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {extras}
        {onEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> {editLabel}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            {(extras || onEdit) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> {deleteLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
