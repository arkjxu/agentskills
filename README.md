# `@arkjxu/agentskills`

[![CI](https://github.com/arkjxu/agentskills/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/arkjxu/agentskills/actions/workflows/ci.yml)

Minimal TypeScript primitives for working with local agent skills.

Implements the Agent Skills format described at https://agentskills.io/specification.

`@arkjxu/agentskills` helps you discover skill directories, validate `SKILL.md` frontmatter, and load skill content and resources from local skill roots.

## Install

```bash
bun add @arkjxu/agentskills
```

## Example

```ts
import { resolve } from "node:path";
import { SkillRegistry } from "@arkjxu/agentskills";

const registry = new SkillRegistry([
  resolve(process.cwd(), "skills"),
]);

const availableSkills = await registry.discovery();

for (const entry of availableSkills) {
  if (entry.status !== "loaded") {
    console.error(`Failed to load ${entry.name}: ${entry.error?.message}`);
    continue;
  }

  const skill = await registry.getSkill(entry.location);
  const content = await skill.loadContent();

  console.log(skill.name);
  console.log(content.toString("utf8"));
}
```

## Skill Layout

```text
my-skill/
├── SKILL.md
├── references/
├── assets/
└── scripts/
```

`SKILL.md` starts with a frontmatter block delimited by an opening `---` line and a closing `---` line:

```md
---
name: my-skill
description: Short explanation of what the skill does and when to use it
license: MIT
compatibility: Bun >= 1.2
allowed-tools: Read Write
metadata:
  owner: team-ai
---

Skill instructions go here.
```

`allowed-tools` may be written in any of these forms:

```yaml
allowed-tools: Read Write
```

```yaml
allowed-tools: Read, Write
```

```yaml
allowed-tools:
  - Read
  - Write
```

Required fields:
- `name`
- `description`

Optional fields:
- `license`
- `compatibility`
- `allowed-tools`
- `metadata`

The skill directory name must match the `name` field.


## What It Provides

- Skill discovery across one or more local directories
- Frontmatter validation for `SKILL.md`
- Safe loading of skill content, references, assets, and script paths
- A small public API with no framework dependency

## API

### `SkillRegistry`

Use `SkillRegistry` to find and load skills from local directories.

```ts
const registry = new SkillRegistry(["/absolute/path/to/skills"]);
```

Methods:
- `discovery()` returns all discovered entries with either `loaded` or `error` status
- `getSkill(location)` loads and validates a skill directory path within the configured discovery roots

### `Skill`

Use `Skill` directly when you already know the path.

Methods:
- `Skill.load(filename)`
- `Skill.loadFromDirectory(dir)`
- `skill.loadContent()`
- `skill.loadReference(name)`
- `skill.loadAsset(name)`
- `skill.getScriptPath(name)`

## Notes

- Resource access is constrained to the skill root to prevent path traversal
- `allowed-tools` can be written as a YAML array or as a space/comma-delimited string
- `Skill.load()` normalizes `allowed-tools` to `string[] | null` on the loaded `Skill`
- The parser expects exactly one opening `---` line and one closing `---` line around the frontmatter block

## Contributing

Contributor-facing setup and development notes live in [docs/CONTRIBUTE.md](/Users/arkjxu/Projects/node/agentskills/docs/CONTRIBUTE.md).
