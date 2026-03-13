# Contributing

## Setup

This package is built with Bun and TypeScript.

```bash
bun install
```

## Common Commands

```bash
bun run build
bun test
bun run dev
```

`bun run dev` executes [examples/basic.ts](/Users/arkjxu/Projects/node/agentskills/examples/basic.ts) against the built package output.

## Project Structure

- [src/main.ts](/Users/arkjxu/Projects/node/agentskills/src/main.ts) exports the public API
- [src/registry.ts](/Users/arkjxu/Projects/node/agentskills/src/registry.ts) handles discovery and caching
- [src/skill.ts](/Users/arkjxu/Projects/node/agentskills/src/skill.ts) loads skill metadata and resources
- [src/security.ts](/Users/arkjxu/Projects/node/agentskills/src/security.ts) contains path-safety checks
- [src/validator.ts](/Users/arkjxu/Projects/node/agentskills/src/validator.ts) validates frontmatter and skill archive size
- `build/` contains the published output

## Development Notes

- Prefer Bun-native commands for install, build, and test workflows
- Keep the public API small and typed from [src/main.ts](/Users/arkjxu/Projects/node/agentskills/src/main.ts)
- When changing validation or loading behavior, update the related tests in `src/*.spec.ts`
- Keep path access constrained to the skill root when adding new resource-loading features

## Publishing Shape

The package currently publishes:

- `build/`
- `README.md`
- `LICENSE`

If you change the output layout or entrypoints, update [package.json](/Users/arkjxu/Projects/node/agentskills/package.json) and rebuild before release.
