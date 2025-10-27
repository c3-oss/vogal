import { useState } from 'react'
import { trpc } from '../trpc.js'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [limit, setLimit] = useState(5)
  const [hasSearched, setHasSearched] = useState(false)

  const { data: workspaces } = trpc.workspaces.getAll.useQuery({
    limit: 100,
    page: 1,
    orderBy: 'name',
  })

  const { data, isLoading, refetch } = trpc.search.query.useQuery(
    {
      query,
      workspaceId,
      limit,
    },
    {
      enabled: false,
    },
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setHasSearched(true)
    refetch()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Search Documents</h1>
        <p className="mt-2 text-sm text-gray-600">Search through your document knowledge base using semantic search</p>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700">
              Search Query
            </label>
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700">
                Workspace (Optional)
              </label>
              <select
                id="workspaceId"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">All Workspaces</option>
                {workspaces?.items.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
                Number of Results
              </label>
              <input
                type="number"
                id="limit"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => setLimit(Number.parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-gray-600">Searching documents...</p>
          </div>
        </div>
      )}

      {!isLoading && hasSearched && data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({data.hits.results.length} {data.hits.results.length === 1 ? 'result' : 'results'})
            </h2>
          </div>

          {data.hits.results.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search query or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.hits.results.map((hit, index) => (
                <div key={`${hit.documentId}-${index}`} className="rounded-lg bg-white p-6 shadow">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Document:</span>
                        <span className="font-mono text-sm text-gray-700">{hit.documentId}</span>
                      </div>
                      {hit.filename && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">Filename:</span>
                          <span className="text-sm text-gray-700">{hit.filename}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                        title="Similarity Score"
                      >
                        {(hit.score * 100).toFixed(1)}% match
                      </span>
                      {hit.pageNumber !== undefined && (
                        <span className="text-xs text-gray-500">Page {hit.pageNumber}</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded bg-gray-50 p-4">
                    <p className="text-sm leading-relaxed text-gray-800">{hit.text}</p>
                  </div>

                  {hit.metadata && Object.keys(hit.metadata).length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Metadata</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(hit.metadata).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700">{key}:</span>{' '}
                            <span className="text-gray-600">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
          <p className="mt-2 text-sm text-gray-500">
            Enter a query above to search through your document knowledge base
          </p>
        </div>
      )}
    </div>
  )
}
