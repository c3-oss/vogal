import { trpc } from '../trpc.js'

export function HealthPage() {
  const { data, isLoading, error, refetch } = trpc.health.get.useQuery()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="text-gray-600">Loading health status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Error icon"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Connection Error</h1>
          </div>
          <p className="mb-6 text-gray-600">Failed to fetch health status from the server.</p>
          <div className="mb-6 rounded bg-gray-100 p-4">
            <p className="font-mono text-sm text-red-600">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Health Status</h1>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Success icon"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">System Operational</h2>
              <p className="text-gray-600">All services are running normally</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Response Data</h3>
            <pre className="overflow-auto rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Endpoint:</strong>{' '}
            <code className="rounded bg-blue-100 px-2 py-1">{import.meta.env.VITE_API_URL}</code>
          </p>
          <p className="mt-2 text-sm text-blue-800">
            <strong>Procedure:</strong> <code className="rounded bg-blue-100 px-2 py-1">health.get</code>
          </p>
        </div>
      </div>
    </div>
  )
}
