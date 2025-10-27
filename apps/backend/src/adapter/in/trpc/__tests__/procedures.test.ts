// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import type { Logger } from '@c3-oss/logger'

// internal
import { documentsRouter } from '../procedures/documents.js'
import { healthRouter } from '../procedures/health.js'
import { searchRouter } from '../procedures/search.js'
import { uploadRouter } from '../procedures/upload.js'
import { usersRouter } from '../procedures/users.js'
import { workspacesRouter } from '../procedures/workspaces.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('tRPC Procedures', () => {
  describe('healthRouter', () => {
    it('should create a router with health endpoint', () => {
      const mockDeps: RouterDeps = {
        useCases: {
          getHealthStatus: {
            execute: vi.fn().mockResolvedValue({ status: 'ok' }),
          },
        } as any,
        repositories: {} as any,
        background: {} as any,
        log: {} as Logger,
      }

      const router = healthRouter(mockDeps)
      expect(router).toBeDefined()
      expect(router.get).toBeDefined()
    })
  })

  describe('searchRouter', () => {
    it('should create a router with search endpoint', () => {
      const mockDeps: RouterDeps = {
        useCases: {
          search: {
            execute: vi.fn().mockResolvedValue([]),
          },
        } as any,
        repositories: {} as any,
        background: {} as any,
        log: {} as Logger,
      }

      const router = searchRouter(mockDeps)
      expect(router).toBeDefined()
      expect(router.query).toBeDefined()
    })
  })

  describe('documentsRouter', () => {
    it('should create a router with documents endpoints', () => {
      const mockDeps: RouterDeps = {
        useCases: {
          updateDocument: {
            execute: vi.fn().mockResolvedValue({}),
          },
        } as any,
        repositories: {
          vectorRepository: {},
          uploadsRepository: {},
        } as any,
        background: {} as any,
        log: {} as Logger,
      }

      const router = documentsRouter(mockDeps)
      expect(router).toBeDefined()
      expect(router.list).toBeDefined()
      expect(router.update).toBeDefined()
      expect(router.status).toBeDefined()
    })
  })

  describe('uploadRouter', () => {
    it('should create a router with upload endpoints', () => {
      const mockDeps: RouterDeps = {
        useCases: {
          getWorkspace: {
            execute: vi.fn().mockResolvedValue({}),
          },
          writer: {
            createDocument: vi.fn().mockResolvedValue({}),
          },
        } as any,
        repositories: {} as any,
        background: {
          enqueuePdfIngestion: vi.fn(),
        } as any,
        log: {
          info: vi.fn(),
        } as any,
      }

      const router = uploadRouter(mockDeps)
      expect(router).toBeDefined()
      expect(router.pdfB64).toBeDefined()
    })
  })

  describe('usersRouter', () => {
    it('should create a router with user endpoints', () => {
      const mockDeps: RouterDeps = {
        useCases: {
          createUser: { execute: vi.fn() },
          getUser: { execute: vi.fn() },
          getUsers: { execute: vi.fn() },
          deleteUser: { execute: vi.fn() },
          updateUser: { execute: vi.fn() },
        } as any,
        repositories: {} as any,
        background: {} as any,
        log: {} as Logger,
      }

      const router = usersRouter(mockDeps)
      expect(router).toBeDefined()
      expect(router.create).toBeDefined()
      expect(router.getAll).toBeDefined()
      expect(router.getOne).toBeDefined()
      expect(router.update).toBeDefined()
      expect(router.delete).toBeDefined()
    })
  })

  describe('workspacesRouter', () => {
    it('should create a router with workspace endpoints', () => {
      const mockDeps: RouterDeps = {
        useCases: {
          createWorkspace: { execute: vi.fn() },
          getWorkspace: { execute: vi.fn() },
          getWorkspaces: { execute: vi.fn() },
          getWorkspacesByUser: { execute: vi.fn() },
          deleteWorkspace: { execute: vi.fn() },
          updateWorkspace: { execute: vi.fn() },
        } as any,
        repositories: {} as any,
        background: {} as any,
        log: {} as Logger,
      }

      const router = workspacesRouter(mockDeps)
      expect(router).toBeDefined()
      expect(router.create).toBeDefined()
      expect(router.getAll).toBeDefined()
      expect(router.getOne).toBeDefined()
      expect(router.getByUser).toBeDefined()
      expect(router.update).toBeDefined()
      expect(router.delete).toBeDefined()
    })
  })
})
