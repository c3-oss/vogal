set shell := ["/bin/bash", "-c"]
set fallback

start *args:
  @node --import @swc-node/register/esm-register src/index.ts {{ args }}

start-cmd cmd *args:
  @node --import @swc-node/register/esm-register "src/{{ cmd }}.ts" {{ args }}

build:
  @pnpm turbo build
