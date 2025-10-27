---
description: Create a new TypeScript library package in the `packages/` directory
argument-hint: [name]
---

Create a new TypeScript library package called "$ARGUMENTS" under `packages/`. This package can be installed via pnpm in this monorepo and other projects.

CRITICAL: Follow the exact creation order and naming to avoid dependency issues:
1. Copy the sample directory from `.claude/_sample/package` to `packages/$ARGUMENTS`.
2. Rename the copied directory to exactly match "$ARGUMENTS" if necessary after copying.
3. Update the `package.json` in `packages/$ARGUMENTS` by changing the "name" field to "$ARGUMENTS".
4. Execute `pnpm install` in the directory `packages/$ARGUMENTS`.

Naming conventions (MANDATORY): Use lowercase with dashes for "$ARGUMENTS", e.g., "my-new-package". Prefix with scope if needed, e.g., "@myorg/my-new-package".

Guidelines:
- The sample includes essential configuration files like `package.json`, `tsconfig.json`, `biome.json`, and build scripts for a library package.
- This package is intended for use as a dependency in other apps or packages via pnpm.
- After installation, run `pnpm lint:fix` and `pnpm build` if code changes are made.
- Ensure all artifacts are in English.
- Do not exceed the agreed scope unless commanded.

Reference directory structure:
```
packages/
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
