---
name: ci-validate
description: Validate project integrity — required files, placeholders, frontmatter, and structural consistency.
license: MIT
---

# CI Validation

Validate project integrity using `ci-validate.js`. Checks for required files, placeholder detection, skill frontmatter validity, and structural consistency.

## Usage

```bash
node .opencode/scripts/ci-validate.js              # validate project
node .opencode/scripts/ci-validate.js --strict      # fail on warnings
node .opencode/scripts/ci-validate.js --verbose     # show all checks
```

## Exit codes

- `0` — all checks pass
- `1` — errors found
- `2` — warnings found (non-strict)

## What it checks

- Required files exist (opencode.json, AGENTS.md, etc.)
- No placeholder text (TODO, FIXME, placeholder)
- Skill frontmatter is valid YAML
- Agent frontmatter has required fields
- Script shebangs are present

## When to use

- Pre-commit hook
- CI/CD pipeline
- After large refactors
- Before publishing/distributing
