import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout.js'
import { DocumentsPage } from './pages/DocumentsPage.js'
import { HealthPage } from './pages/HealthPage.js'
import { SearchPage } from './pages/SearchPage.js'
import { UsersPage } from './pages/UsersPage.js'
import { WorkspacesPage } from './pages/WorkspacesPage.js'
import { trpc } from './trpc.js'
import { createTRPCClient, queryClient } from './utils/trpc.js'

import './styles.css'

const trpcClient = createTRPCClient()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

createRoot(root).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HealthPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
