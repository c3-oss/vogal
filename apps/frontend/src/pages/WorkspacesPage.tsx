import { FolderKanban, Plus } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.js'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../components/ui/sheet.js'
import { Skeleton } from '../components/ui/skeleton.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js'
import { trpc } from '../trpc.js'

export function WorkspacesPage() {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string } | null>(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState<{ id: string; name: string } | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [editName, setEditName] = useState('')

  const utils = trpc.useUtils()
  const { data, isLoading, error } = trpc.workspaces.getAll.useQuery({ limit: 10, page, orderBy: '-createdAt' })
  const { data: users } = trpc.users.getAll.useQuery({ limit: 100, page: 1, orderBy: 'name' })

  const createMutation = trpc.workspaces.create.useMutation({
    onSuccess: () => {
      utils.workspaces.getAll.invalidate()
      setCreateOpen(false)
      setWorkspaceName('')
      setOwnerId('')
    },
  })

  const updateMutation = trpc.workspaces.update.useMutation({
    onSuccess: () => {
      utils.workspaces.getAll.invalidate()
      setEditingWorkspace(null)
      setEditName('')
    },
  })

  const deleteMutation = trpc.workspaces.delete.useMutation({
    onSuccess: () => {
      utils.workspaces.getAll.invalidate()
      setDeletingWorkspace(null)
    },
  })

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ownerId) return
    createMutation.mutate({ name: workspaceName, userId: ownerId })
  }

  const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingWorkspace) return
    updateMutation.mutate({ params: { idExt: editingWorkspace.id }, body: { name: editName } })
  }

  const startEdit = (workspace: { id: string; name: string }) => {
    setEditingWorkspace(workspace)
    setEditName(workspace.name)
  }

  const totalResults = data?.meta.totalResults ?? 0
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Tenant containers for documents and users"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New workspace
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
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-3 py-2" />
                </TableRow>
              ))
            ) : data?.items.length ? (
              data.items.map((workspace) => (
                <TableRow key={workspace.id} className="h-10">
                  <TableCell className="px-3 py-2 font-medium">{workspace.name}</TableCell>
                  <TableCell className="kbd-font px-3 py-2 text-xs text-muted-foreground">{workspace.id}</TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <RowActions onEdit={() => startEdit(workspace)} onDelete={() => setDeletingWorkspace(workspace)} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="px-3 py-10 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                    <FolderKanban className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No workspaces yet — create one before uploading documents.
                  </p>
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
            <SheetTitle>New workspace</SheetTitle>
            <SheetDescription>Choose an owner and name the tenant container.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitCreate} className="flex flex-1 flex-col">
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Owner</Label>
                <Select value={ownerId} onValueChange={setOwnerId} required>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.items.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} · {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="workspace-name"
                  className="h-9"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  required
                  placeholder="Research team"
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending || !ownerId}>
                {createMutation.isPending ? 'Creating…' : 'Create workspace'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingWorkspace} onOpenChange={(open) => !open && setEditingWorkspace(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit workspace</SheetTitle>
            <SheetDescription>Rename {editingWorkspace?.name}.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitUpdate} className="flex flex-1 flex-col">
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-workspace-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="edit-workspace-name"
                  className="h-9"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingWorkspace(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingWorkspace} onOpenChange={(open) => !open && setDeletingWorkspace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {deletingWorkspace?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingWorkspace && deleteMutation.mutate({ idExt: deletingWorkspace.id })}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
