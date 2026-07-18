---
name: repos-sync
description: Synchronize reference repositories for knowledge sharing and dependency management.
license: MIT
---

# Repos Sync

Synchronize reference repositories listed in `repos.json`. Clones or updates repos under `repos/<name>/` for knowledge sharing and dependency management.

## Usage

```bash
node .opencode/scripts/repos-sync.js                  # sync all repos
node .opencode/scripts/repos-sync.js --list           # list configured repos
node .opencode/scripts/repos-sync.js <org/repo>       # sync specific repo
node .opencode/scripts/repos-sync.js --help           # show help
```

## Configuration

Create `repos.json` in project root:

```json
{
  "repos": [
    { "name": "skills", "url": "https://github.com/anthropics/skills" },
    { "name": "mcp-servers", "url": "https://github.com/modelcontextprotocol/servers" }
  ]
}
```

## When to use

- Update reference dependencies
- Share knowledge across projects
- Keep reference code up to date
- Onboard new team members with curated repos
