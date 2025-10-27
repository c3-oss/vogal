import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js'
import { Input } from '../components/ui/input.js'
import { Label } from '../components/ui/label.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js'
import { trpc } from '../trpc.js'

export function WorkspacesPage() {
  const [page, setPage] = useState(1)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = useState('')

  const utils = trpc.useUtils()

  const { data, isLoading, error } = trpc.workspaces.getAll.useQuery({
    limit: 10,
    page,
    orderBy: '-createdAt',
  })

  const createMutation = trpc.workspaces.create.useMutation({
    onSuccess: () => {
      utils.workspaces.getAll.invalidate()
      setShowCreateForm(false)
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
    },
  })

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const userId = formData.get('userId') as string
    createMutation.mutate({
      name: formData.get('name') as string,
      userId,
    })
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingWorkspace) return
    updateMutation.mutate({
      params: { idExt: editingWorkspace.id },
      body: {
        name: editName,
      },
    })
  }

  const handleEditClick = (workspace: { id: string; name: string }) => {
    setEditingWorkspace(workspace)
    setEditName(workspace.name)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workspace?')) {
      deleteMutation.mutate({ idExt: id })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>Failed to load workspaces</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">Manage your workspaces and their settings</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Workspace</CardTitle>
            <CardDescription>Add a new workspace to organize your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-userId">User ID</Label>
                <Input id="create-userId" name="userId" required placeholder="Enter user ID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-name">Name</Label>
                <Input id="create-name" name="name" required placeholder="Enter workspace name" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Workspace</CardTitle>
            <CardDescription>Update workspace information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingWorkspace(null)
                    setEditName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((workspace) => (
              <TableRow key={workspace.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">{workspace.id}</TableCell>
                <TableCell className="font-medium">{workspace.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(workspace)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(workspace.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data?.meta && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * 10, data.meta.totalResults)}</span> of{' '}
              <span className="font-medium">{data.meta.totalResults}</span> results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Page {page} of {data.meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
