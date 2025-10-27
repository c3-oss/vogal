// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { ListQuerySchema } from '../common.js'
import { DocumentsListQuerySchema, UpdateDocumentBodySchema } from '../documents.validators.js'
import { UpdateUserBodySchema } from '../users.validators.js'
import { UpdateWorkspaceBodySchema } from '../workspaces.validators.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('Validators transforms', () => {
  it('ListQuerySchema maps orderBy with leading dash and defaults', () => {
    const a = ListQuerySchema.parse({ orderBy: '-createdAt', limit: '10', page: '2' })
    expect(a).toEqual({ orderField: 'createdAt', orderDirection: 'desc', limit: 10, page: 2 })

    const b = ListQuerySchema.parse({})
    expect(b).toEqual({ orderField: 'createdAt', orderDirection: 'desc', limit: 20, page: 1 })
  })

  it('DocumentsListQuerySchema maps workspace and asc/desc', () => {
    const d1 = DocumentsListQuerySchema.parse({ workspaceId: 'w', orderBy: 'title' })
    expect(d1).toEqual({ workspaceId: 'w', orderField: 'title', orderDirection: 'asc', limit: 20, page: 1 })

    const d2 = DocumentsListQuerySchema.parse({ workspaceId: 'w', orderBy: '-author', limit: '5', page: '3' })
    expect(d2).toEqual({ workspaceId: 'w', orderField: 'author', orderDirection: 'desc', limit: 5, page: 3 })
  })

  it('UpdateUserBodySchema enforces at least one field', () => {
    expect(() => UpdateUserBodySchema.parse({})).toThrow()
    expect(UpdateUserBodySchema.parse({ name: 'John' })).toEqual({ name: 'John' })
    expect(UpdateUserBodySchema.parse({ email: 'john@example.com' })).toEqual({ email: 'john@example.com' })
  })

  it('UpdateWorkspaceBodySchema validates name', () => {
    expect(() => UpdateWorkspaceBodySchema.parse({ name: '' })).toThrow()
    expect(UpdateWorkspaceBodySchema.parse({ name: 'Workspace' })).toEqual({ name: 'Workspace' })
  })

  it('UpdateDocumentBodySchema validates filename', () => {
    expect(() => UpdateDocumentBodySchema.parse({ filename: '' })).toThrow()
    expect(UpdateDocumentBodySchema.parse({ filename: 'doc.pdf' })).toEqual({ filename: 'doc.pdf' })
  })
})
