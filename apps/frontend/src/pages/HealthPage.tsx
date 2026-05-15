import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.js'
import { Button } from '../components/ui/button.js'
import { Skeleton } from '../components/ui/skeleton.js'
import { cn } from '../lib/utils.js'
import { trpc } from '../trpc.js'

function StatusDot({ status }: { status: string | undefined }) {
  const tone =
    status === 'ok'
      ? 'bg-success'
      : status === 'degraded'
        ? 'bg-warning'
        : status === 'error'
          ? 'bg-destructive'
          : 'bg-muted-foreground'

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={cn('h-1.5 w-1.5 rounded-full', tone)} aria-hidden />
      <span className="capitalize">{status ?? 'unknown'}</span>
    </span>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <div className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

export function HealthPage() {
  const { data, isLoading, error, refetch, isFetching } = trpc.health.get.useQuery()

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Health" description="Runtime status and dependencies" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Health"
          description="Runtime status and dependencies"
          actions={
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Retry
            </Button>
          }
        />
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden />
            <span className="font-medium text-destructive">Connection error</span>
          </div>
          <pre className="overflow-auto rounded-sm bg-background/60 p-2 text-xs leading-5 text-destructive">
            {error.message}
          </pre>
        </div>
      </div>
    )
  }

  const memoryMb = data ? Math.round(data.metrics.memory.rss / 1024 / 1024) : 0
  const heapMb = data ? Math.round(data.metrics.memory.heapUsed / 1024 / 1024) : 0
  const uptime = data?.uptimeSeconds ?? 0
  const uptimeLabel =
    uptime < 60
      ? `${Math.round(uptime)}s`
      : uptime < 3600
        ? `${Math.round(uptime / 60)}m`
        : `${(uptime / 3600).toFixed(1)}h`

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Health"
        description={data ? `${data.environment} · v${data.version}` : 'Runtime status and dependencies'}
        actions={
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Status" value={data?.status ?? 'unknown'} hint={data?.environment} />
        <Stat label="Uptime" value={uptimeLabel} hint="since boot" />
        <Stat label="Memory RSS" value={`${memoryMb} MB`} hint={`${heapMb} MB heap`} />
        <Stat
          label="DB latency"
          value={data?.dependencies.database.latencyMs ? `${data.dependencies.database.latencyMs.toFixed(1)} ms` : '—'}
          hint={data?.dependencies.database.status}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Response</span>
            <span className="text-[0.65rem] text-muted-foreground">{data?.timestamp}</span>
          </div>
          <pre className="kbd-font max-h-72 overflow-auto rounded-md border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        <div>
          <div className="mb-2 flex items-center border-b border-border pb-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dependencies</span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">database</dt>
              <dd>
                <StatusDot status={data?.dependencies.database.status} />
              </dd>
            </div>
            {data?.dependencies.database.latencyMs !== undefined && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">latency</dt>
                <dd className="tabular-nums text-foreground">{data.dependencies.database.latencyMs.toFixed(2)} ms</dd>
              </div>
            )}
            {data?.dependencies.database.error && (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
                {data.dependencies.database.error}
              </p>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
