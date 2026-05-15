import { Plus, UsersRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { PageHeader } from '../components/PageHeader.js'
import { RowActions } from '../components/RowActions.js'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js'
import { Button } from '../components/ui/button.js'
import { Input } from '../components/ui/input.js'
import { Label } from '../components/ui/label.js'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../components/ui/sheet.js'
import { Skeleton } from '../components/ui/skeleton.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js'
import { trpc } from '../trpc.js'

interface UserFormState {
  name: string
  email: string
}

const emptyForm = { name: '', email: '' }

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null)
  const [createForm, setCreateForm] = useState<UserFormState>(emptyForm)
  const [editForm, setEditForm] = useState<UserFormState>(emptyForm)

  const utils = trpc.useUtils()
  const { data, isLoading, error } = trpc.users.getAll.useQuery({ limit: 10, page, orderBy: '-createdAt' })

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.getAll.invalidate()
      setCreateOpen(false)
      setCreateForm(emptyForm)
    },
  })

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.getAll.invalidate()
      setEditingUser(null)
      setEditForm(emptyForm)
    },
  })

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.getAll.invalidate()
      setDeletingUser(null)
    },
  })

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createMutation.mutate(createForm)
  }

  const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser) return
    updateMutation.mutate({ params: { idExt: editingUser.id }, body: editForm })
  }

  const startEdit = (user: { id: string; name: string; email: string }) => {
    setEditingUser(user)
    setEditForm({ name: user.name, email: user.email })
  }

  const totalResults = data?.meta.totalResults ?? 0
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <div>
      <PageHeader
        title="Users"
        description="Accounts that can own workspaces"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New user
          </Button>
        }
      />

      {error && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 px-3 text-xs font-medium uppercase tracking-wide">Name</TableHead>
              <TableHead className="h-9 px-3 text-xs font-medium uppercase tracking-wide">Email</TableHead>
              <TableHead className="h-9 px-3 text-xs font-medium uppercase tracking-wide">ID</TableHead>
              <TableHead className="h-9 w-12 px-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ['s1', 's2', 's3'].map((key) => (
                <TableRow key={key}>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-3 py-2" />
                </TableRow>
              ))
            ) : data?.items.length ? (
              data.items.map((user) => (
                <TableRow key={user.id} className="h-10">
                  <TableCell className="px-3 py-2 font-medium">{user.name}</TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="kbd-font px-3 py-2 text-xs text-muted-foreground">{user.id}</TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <RowActions
                      onEdit={() => startEdit(user)}
                      onDelete={() => setDeletingUser({ id: user.id, name: user.name })}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-3 py-10 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                    <UsersRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No users yet — create the first account.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && totalResults > 0 && (
        <div className="mt-3 flex h-10 items-center justify-between text-xs text-muted-foreground">
          <span>
            {(page - 1) * 10 + 1}–{Math.min(page * 10, totalResults)} of {totalResults}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-1">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPage((value) => value + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New user</SheetTitle>
            <SheetDescription>Add a user account that can own workspaces.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitCreate} className="flex flex-1 flex-col">
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="create-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="create-name"
                  className="h-9"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((form) => ({ ...form, name: event.target.value }))}
                  required
                  placeholder="Ada Lovelace"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  className="h-9"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((form) => ({ ...form, email: event.target.value }))}
                  required
                  placeholder="ada@example.com"
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
            <SheetDescription>Update identity details for {editingUser?.name}.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitUpdate} className="flex flex-1 flex-col">
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  className="h-9"
                  value={editForm.name}
                  onChange={(event) => setEditForm((form) => ({ ...form, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  className="h-9"
                  value={editForm.email}
                  onChange={(event) => setEditForm((form) => ({ ...form, email: event.target.value }))}
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {deletingUser?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingUser && deleteMutation.mutate({ idExt: deletingUser.id })}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
