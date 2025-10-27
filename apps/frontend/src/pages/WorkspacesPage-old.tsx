import { useState } from 'react'
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
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-800">Error loading workspaces: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Create Workspace
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Create New Workspace</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="create-userId" className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <input
                type="text"
                id="create-userId"
                name="userId"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="create-name"
                name="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingWorkspace && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Edit Workspace</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingWorkspace(null)
                  setEditName('')
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.items.map((workspace) => (
                <tr key={workspace.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{workspace.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{workspace.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleEditClick(workspace)}
                      className="mr-2 text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(workspace.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 10, data.meta.totalResults)}</span> of{' '}
                  <span className="font-medium">{data.meta.totalResults}</span> results
                </p>
              </div>
              <div>
                <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                    Page {page} of {data.meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.meta.totalPages}
                    className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
