---
description: Create a new NodeJS TypeScript executable app in the `apps/` directory
argument-hint: [name]
---

Create a new NodeJS TypeScript executable app called "$ARGUMENTS" under `apps/`.

CRITICAL: Follow the exact creation order and naming to avoid dependency issues:
1. Copy the sample directory from `.claude/_sample/app` to `apps/$ARGUMENTS`.
2. Rename the copied directory to exactly match "$ARGUMENTS" if necessary after copying.
3. Update the `package.json` in `apps/$ARGUMENTS` by changing the "name" field to "$ARGUMENTS".
4. Execute `pnpm install` in the directory `apps/$ARGUMENTS`.

Naming conventions (MANDATORY): Use lowercase with dashes for "$ARGUMENTS", e.g., "my-new-app".

Guidelines:
- The sample includes essential configuration files like `package.json`, `tsconfig.json`, `biome.json`, and build scripts for a NodeJS executable app.
- This app is intended to be run directly via NodeJS after building (e.g., `pnpm start` or similar).
- After installation, run `pnpm lint:fix` and `pnpm build` if code changes are made.
- Ensure all artifacts are in English.
- Do not exceed the agreed scope unless commanded.

Reference directory structure:
```
apps/
  /$ARGUMENTS
    - package.json
    - tsconfig.json
    - biome.json
    - tsup.config.ts
    - vitest.config.ts
    - typedoc.json
    - src/
      [source files]
```
