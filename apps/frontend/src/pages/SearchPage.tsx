import { FileSearch, Search } from 'lucide-react'
import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { PageHeader } from '../components/PageHeader.js'
import { Badge } from '../components/ui/badge.js'
import { Button } from '../components/ui/button.js'
import { Label } from '../components/ui/label.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.js'
import { Skeleton } from '../components/ui/skeleton.js'
import { Textarea } from '../components/ui/textarea.js'
import { trpc } from '../trpc.js'

const ALL_WORKSPACES = 'all'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [workspaceId, setWorkspaceId] = useState(ALL_WORKSPACES)
  const [limit, setLimit] = useState(5)
  const [hasSearched, setHasSearched] = useState(false)

  const { data: workspaces } = trpc.workspaces.getAll.useQuery({ limit: 100, page: 1, orderBy: 'name' })
  const { data, isLoading, error, refetch } = trpc.search.query.useQuery(
    { query, workspaceId: workspaceId === ALL_WORKSPACES ? '' : workspaceId, limit },
    { enabled: false },
  )

  const runSearch = () => {
    if (!query.trim()) return
    setHasSearched(true)
    refetch()
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    runSearch()
  }

  const handleQueryKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      runSearch()
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Search" description="Semantic retrieval across indexed documents" />

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="query" className="text-xs font-medium">
              Query
            </Label>
            <span className="text-[0.65rem] text-muted-foreground">
              <kbd className="kbd-font rounded border border-border bg-muted px-1 py-0.5 text-[0.6rem]">Enter</kbd> to
              search ·{' '}
              <kbd className="kbd-font rounded border border-border bg-muted px-1 py-0.5 text-[0.6rem]">
                Shift+Enter
              </kbd>{' '}
              for newline
            </span>
          </div>
          <Textarea
            id="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleQueryKeyDown}
            placeholder="Ask anything about the indexed knowledge base…"
            className="min-h-[80px] resize-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="h-9 w-56 text-sm">
              <SelectValue placeholder="All workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_WORKSPACES}>All workspaces</SelectItem>
              {workspaces?.items.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex h-9 items-stretch overflow-hidden rounded-lg border border-input bg-background/60 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <label
              htmlFor="limit"
              className="flex select-none items-center border-r border-border px-3 text-xs text-muted-foreground"
            >
              Limit
            </label>
            <input
              id="limit"
              type="number"
              min="1"
              max="20"
              value={limit}
              onChange={(event) => setLimit(Number.parseInt(event.target.value) || 1)}
              className="w-14 bg-transparent px-2 text-sm tabular-nums text-foreground outline-none"
            />
          </div>
          <Button type="submit" size="sm" disabled={isLoading || !query.trim()} className="ml-auto h-9">
            <Search className="h-3.5 w-3.5" /> {isLoading ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {isLoading && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {!isLoading && hasSearched && data && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {data.hits.results.length === 1 ? '1 result' : `${data.hits.results.length} results`}
            </span>
          </div>
          {data.hits.results.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                <FileSearch className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No matches — try a broader query.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.hits.results.map((hit, index) => (
                <li key={`${hit.documentId}-${index}`} className="border-l-2 border-primary/40 pl-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{hit.filename || 'Document chunk'}</span>
                    {hit.pageNumber !== undefined && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[0.65rem]">
                        p. {hit.pageNumber}
                      </Badge>
                    )}
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {(hit.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{hit.text}</p>
                  {hit.metadata && Object.keys(hit.metadata).length > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground/80">
                      {Object.entries(hit.metadata)
                        .filter(([, value]) => value !== null && value !== undefined && value !== '')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="mt-10 py-10 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Type a question and pick a workspace to start searching.</p>
        </div>
      )}
    </div>
  )
}
