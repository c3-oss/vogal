import { useState } from 'react'
import { trpc } from '../trpc.js'

export function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [viewingStatus, setViewingStatus] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const { data: workspaces } = trpc.workspaces.getAll.useQuery({
    limit: 100,
    page: 1,
    orderBy: 'name',
  })

  const { data, isLoading, error } = trpc.documents.list.useQuery(
    {
      limit: 10,
      page,
      orderBy: '-filename',
      workspaceId: selectedWorkspace || '',
    },
    {
      enabled: !!selectedWorkspace,
    },
  )

  const { data: statusData, isLoading: statusLoading } = trpc.documents.status.useQuery(
    { idExt: viewingStatus || '' },
    { enabled: !!viewingStatus },
  )

  const uploadMutation = trpc.upload.pdfB64.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate()
      setShowUploadForm(false)
    },
  })

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspaceId') as string

    if (!file || !workspaceId) return

    const buffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))

    uploadMutation.mutate({
      body: { workspaceId },
      filename: file.name,
      contentType: 'application/pdf',
      fileB64: base64,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-800">Error loading documents: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <button
          type="button"
          onClick={() => setShowUploadForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Upload Document
        </button>
      </div>

      <div className="mb-6">
        <label htmlFor="workspace-filter" className="block text-sm font-medium text-gray-700">
          Filter by Workspace
        </label>
        <select
          id="workspace-filter"
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:max-w-xs"
        >
          <option value="">All Workspaces</option>
          {workspaces?.items.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      {showUploadForm && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Upload PDF Document</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700">
                Workspace
              </label>
              <select
                id="workspaceId"
                name="workspaceId"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select a workspace</option>
                {workspaces?.items.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                PDF File
              </label>
              <input
                type="file"
                id="file"
                name="file"
                accept=".pdf,application/pdf"
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingStatus && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Document Status</h2>
          {statusLoading ? (
            <div className="text-center">
              <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="text-sm text-gray-600">Loading status...</p>
            </div>
          ) : statusData ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span
                  className={`rounded px-2 py-1 text-sm ${
                    statusData.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : statusData.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {statusData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Current Step:</span>
                <span>{statusData.currentStep || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Completed Step:</span>
                <span>{statusData.lastCompletedStep}</span>
              </div>
              {statusData.errorMessage && (
                <div className="rounded bg-red-50 p-2">
                  <span className="font-medium text-red-800">Error:</span>
                  <p className="text-sm text-red-700">{statusData.errorMessage}</p>
                </div>
              )}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setViewingStatus(null)}
            className="mt-4 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      )}

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Chunks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pages
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.items.map((doc) => (
                <tr key={doc.documentId}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{doc.documentId}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {doc.filename || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{doc.title || 'N/A'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{doc.chunksCount}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {doc.totalPages ? `${doc.totalPages} pages` : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setViewingStatus(doc.documentId)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Status
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
