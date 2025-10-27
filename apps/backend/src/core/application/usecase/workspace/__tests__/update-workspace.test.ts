// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'
import { UpdateWorkspaceUseCase } from '../update-workspace.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  workspaceRepository: {
    create: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    getByUser: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('UpdateWorkspaceUseCase', () => {
  describe('execute', () => {
    it('should update workspace name', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingWorkspace = {
        id: 1,
        idExt: 'workspace-1',
        name: 'Workspace One',
        userId: 10,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedWorkspace = { ...existingWorkspace, name: 'Workspace Updated' }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(existingWorkspace)) as any)
      mockDeps.workspaceRepository.update.mockResolvedValue(ok(some(updatedWorkspace)) as any)

      const useCase = new UpdateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-1', name: 'Workspace Updated' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual(updatedWorkspace)
      expect(mockDeps.workspaceRepository.update).toHaveBeenCalledWith('workspace-1', { name: 'Workspace Updated' })
    })

    it('should return error when name is missing', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const useCase = new UpdateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-1', name: '' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Workspace name is required')
      }
      expect(mockDeps.workspaceRepository.get).not.toHaveBeenCalled()
    })

    it('should return not found when workspace does not exist', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      mockDeps.workspaceRepository.get.mockResolvedValue(ok(none) as any)

      const useCase = new UpdateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-1', name: 'Workspace Updated' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Workspace not found')
      }
      expect(mockDeps.workspaceRepository.update).not.toHaveBeenCalled()
    })

    it('should skip update when name is unchanged', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingWorkspace = {
        id: 1,
        idExt: 'workspace-1',
        name: 'Workspace One',
        userId: 10,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(existingWorkspace)) as any)

      const useCase = new UpdateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-1', name: 'Workspace One' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual(existingWorkspace)
      expect(mockDeps.workspaceRepository.update).not.toHaveBeenCalled()
    })

    it('should propagate repository errors', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingWorkspace = {
        id: 1,
        idExt: 'workspace-1',
        name: 'Workspace One',
        userId: 10,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(existingWorkspace)) as any)
      mockDeps.workspaceRepository.update.mockResolvedValue(err(new Error('db error')) as any)

      const useCase = new UpdateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-1', name: 'Workspace Updated' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('db error')
      }
    })

    it('should return not found when repository update yields none', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingWorkspace = {
        id: 1,
        idExt: 'workspace-1',
        name: 'Workspace One',
        userId: 10,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(existingWorkspace)) as any)
      mockDeps.workspaceRepository.update.mockResolvedValue(ok(none) as any)

      const useCase = new UpdateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-1', name: 'Workspace Updated' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Workspace not found')
      }
    })
  })
})
