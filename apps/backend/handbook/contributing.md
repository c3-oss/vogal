## Contributing

### Adding New Features

Follow hexagonal architecture principles when adding new features:

1. Define the Use Case

Create a new use case in `src/core/application/usecase/`:

```typescript
import { VogalRepository } from '../port/vogal-repository'

export class DeleteDocumentUseCase {
  constructor(private readonly repository: VogalRepository) {}

  async execute(documentId: string): Promise<void> {
    await this.repository.delete(documentId)
  }
}
```

2. Define Ports (if needed)

Add new interfaces in `src/core/application/port/`:

```typescript
export interface NotificationPort {
  notify(message: string): Promise<void>
}
```

3. Implement Adapters

Create implementations in `src/adapter/out/`:

```typescript
import { NotificationPort } from '~core/application/port/notification'

export class ConsoleNotificationAdapter implements NotificationPort {
  async notify(message: string): Promise<void> {
    console.log(`[Notification]: ${message}`)
  }
}
```

4. Create Controllers

Add HTTP handlers in `src/adapter/in/http/controllers/`:

```typescript
export class DeleteDocumentController {
  constructor(private readonly deleteDocument: DeleteDocumentUseCase) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const { id } = req.params
    await this.deleteDocument.execute(id)
    return res.status(204).send()
  }
}
```

5. Wire Everything

Update `src/adapter/in/http/index.ts` to connect the components.

### Code Quality

- Linting: Run `pnpm lint:fix` before committing
- Testing: Ensure all tests pass with `pnpm test`
- Types: Full TypeScript coverage required
- Architecture: Maintain hexagonal architecture principles
