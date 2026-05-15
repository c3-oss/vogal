import { FileText, Loader2, UploadCloud } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { PageHeader } from '../components/PageHeader.js'
import { Toolbar } from '../components/Toolbar.js'
import { Button } from '../components/ui/button.js'
import { Input } from '../components/ui/input.js'
import { Label } from '../components/ui/label.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.js'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../components/ui/sheet.js'
import { Skeleton } from '../components/ui/skeleton.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.js'
import { cn } from '../lib/utils.js'
import { trpc } from '../trpc.js'

const ALL_WORKSPACES = 'all'

type DocStatus = 'pending' | 'processing' | 'failed' | 'ready' | 'queued' | 'completed' | string | undefined

const fileToBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

function StatusDot({ status }: { status: DocStatus }) {
  const tone =
    status === 'failed'
      ? 'bg-destructive'
      : status === 'ready' || status === 'completed'
        ? 'bg-success'
        : status === 'processing' || status === 'queued' || status === 'pending'
          ? 'bg-warning'
          : 'bg-muted-foreground'

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn('h-1.5 w-1.5 rounded-full', tone)} aria-hidden />
      <span className="capitalize">{status ?? 'unknown'}</span>
    </span>
  )
}

export function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [selectedWorkspace, setSelectedWorkspace] = useState(ALL_WORKSPACES)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadWorkspace, setUploadWorkspace] = useState('')
  const [viewingStatus, setViewingStatus] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: workspaces } = trpc.workspaces.getAll.useQuery({ limit: 100, page: 1, orderBy: 'name' })
  const workspaceId = selectedWorkspace === ALL_WORKSPACES ? '' : selectedWorkspace

  const { data, isLoading, error } = trpc.documents.list.useQuery(
    { limit: 10, page, orderBy: '-filename', workspaceId },
    { enabled: !!workspaceId },
  )

  const { data: statusData, isLoading: statusLoading } = trpc.documents.status.useQuery(
    { idExt: viewingStatus ?? '' },
    { enabled: !!viewingStatus },
  )

  const uploadMutation = trpc.upload.pdfB64.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate()
      setUploadOpen(false)
      setUploadWorkspace('')
    },
  })

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const file = formData.get('file') as File
    const targetWorkspace = uploadWorkspace || selectedWorkspace
    if (!file || !targetWorkspace || targetWorkspace === ALL_WORKSPACES) return

    uploadMutation.mutate({
      body: { workspaceId: targetWorkspace },
      filename: file.name,
      contentType: 'application/pdf',
      fileB64: await fileToBase64(file),
    })
  }

  const totalResults = data?.meta.totalResults ?? 0
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Indexed PDFs per workspace"
        actions={
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <UploadCloud className="h-3.5 w-3.5" /> Upload PDF
          </Button>
        }
      />

      <Toolbar
        left={
          <Select
            value={selectedWorkspace}
            onValueChange={(value) => {
              setSelectedWorkspace(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-64 text-sm">
              <SelectValue placeholder="Select workspace" />
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
        }
        right={
          totalResults > 0 ? (
            <span className="text-xs text-muted-foreground">
              {totalResults} document{totalResults === 1 ? '' : 's'}
            </span>
          ) : null
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
              <TableHead className="h-9 px-3 text-xs font-medium uppercase tracking-wide">Document</TableHead>
              <TableHead className="h-9 px-3 text-xs font-medium uppercase tracking-wide">Title</TableHead>
              <TableHead className="h-9 px-3 text-xs font-medium uppercase tracking-wide">Chunks</TableHead>
              <TableHead className="h-9 px-3 text-right text-xs font-medium uppercase tracking-wide">Pages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!workspaceId ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Pick a workspace to see its documents.</p>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              ['s1', 's2', 's3'].map((key) => (
                <TableRow key={key}>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.items.length ? (
              data.items.map((document) => (
                <TableRow key={document.documentId} className="h-10">
                  <TableCell className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setViewingStatus(document.documentId)}
                      className="flex items-center gap-2 text-left hover:text-primary"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{document.filename || 'Untitled document'}</div>
                        <div className="kbd-font truncate text-[0.7rem] text-muted-foreground">
                          {document.documentId}
                        </div>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground">{document.title || '—'}</TableCell>
                  <TableCell className="px-3 py-2 tabular-nums">{document.chunksCount}</TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">{document.totalPages ?? '—'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-3 py-10 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No documents indexed — upload a PDF to start.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!!workspaceId && data && totalResults > 0 && (
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

      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Upload PDF</SheetTitle>
            <SheetDescription>Send a PDF to storage and start ingestion for a workspace.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleUpload} className="flex flex-1 flex-col">
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Workspace</Label>
                <Select value={uploadWorkspace} onValueChange={setUploadWorkspace} required>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces?.items.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file" className="text-xs font-medium">
                  PDF file
                </Label>
                <Input id="file" name="file" type="file" accept=".pdf,application/pdf" required className="h-9" />
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={uploadMutation.isPending || !uploadWorkspace}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" /> Upload
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!viewingStatus} onOpenChange={(open) => !open && setViewingStatus(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Document status</SheetTitle>
            <SheetDescription>Ingestion progress and failure details.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-5">
            {statusLoading ? (
              <>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : statusData ? (
              <>
                <div className="flex items-center justify-between">
                  <StatusDot status={statusData.status as DocStatus} />
                  {statusData.retryCount !== undefined && statusData.retryCount > 0 && (
                    <span className="text-xs text-muted-foreground">{statusData.retryCount} retries</span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Current step</dt>
                  <dd className="text-right tabular-nums">{statusData.currentStep || '—'}</dd>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last completed</dt>
                  <dd className="text-right tabular-nums">{statusData.lastCompletedStep || '—'}</dd>
                </dl>
                {statusData.errorMessage && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {statusData.errorMessage}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No status data available.</p>
            )}
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setViewingStatus(null)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
