# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@arkjxu/agentskills`, a TypeScript library for discovering, validating, and loading Agent Skills following the specification at https://agentskills.io/specification.

Skills are local directories containing a `SKILL.md` file with YAML frontmatter and markdown instructions. The library provides primitives for:
- Discovering skills across multiple directories
- Validating frontmatter (name, description, license, compatibility, allowed-tools, metadata)
- Loading skill content, references, assets, and scripts with path-traversal protection

## Commands

### Development
```bash
bun install           # Install dependencies
bun test              # Run all tests
bun run build         # Build package to build/ directory
bun run example       # Run examples/basic.ts against built package
```

### Testing
- Tests live in `src/*.spec.ts` alongside implementation files
- Uses Bun's built-in test runner (`bun:test`)
- Run specific test: `bun test src/skill.spec.ts`

## Architecture

### Core Classes

**SkillRegistry** (`src/registry.ts`)
- Takes an array of discovery directories in constructor
- `discovery()` - scans directories for valid skills, returns `AvailableSkill[]` with status "loaded" or "error"
- `getSkill(location)` - loads a specific skill by path (with security validation)

**Skill** (`src/skill.ts`)
- Represents a single skill with validated frontmatter
- Static loaders: `Skill.load(filename)` and `Skill.loadFromDirectory(dir)`
- Resource methods: `loadContent()`, `loadReference(name)`, `loadAsset(name)`, `getScriptPath(name)`
- Frontmatter parsing uses streaming to locate `---` delimiters without loading entire file

**SkillValidator** (`src/validator.ts`)
- Validates frontmatter fields against spec constraints
- Name: 1-64 chars, lowercase alphanumeric + hyphens, must match directory name
- Description: 1-1024 chars
- Compatibility: 1-500 chars (optional)
- Allowed-tools: space/comma-delimited string or array (normalized to `string[] | null`)

**SkillSecurity** (`src/security.ts`)
- `ensureResourceIsWithinSkillContext(resourcePath, skillRootDir)` - prevents path traversal
- All resource loading goes through this check

### Build System

- Uses `tsdown` (configured in `tsdown.config.ts`)
- Entry point: `src/main.ts` (exports all public API)
- Output: `build/main.mjs` (ESM) and `build/main.d.mts` (types)
- Target platform: Node.js, format: ESM

### Skill Directory Structure

```
my-skill/
├── SKILL.md           # Frontmatter + instructions
├── references/        # Additional documentation
├── assets/            # Templates, images, data files
└── scripts/           # Executable code
```

### Security Model

All resource access is constrained to the skill root directory:
- References must be in `references/`
- Assets must be in `assets/`
- Scripts must be in `scripts/`
- `SkillSecurity.ensureResourceIsWithinSkillContext()` validates all paths before loading

## Bun Usage

Default to using Bun instead of Node.js:
- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx <package>` instead of `npx <package>`
- Bun automatically loads .env files

## When Making Changes

- Update corresponding `*.spec.ts` test files when changing validation or loading logic
- Keep the public API surface small - only export from `src/main.ts`
- Maintain path-traversal protection when adding new resource-loading features
- Ensure directory name matches frontmatter `name` field (enforced by `Skill.load()`)
- Run `bun run build` before running examples to test against built output
