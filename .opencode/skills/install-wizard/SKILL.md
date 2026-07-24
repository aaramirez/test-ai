---
name: install-wizard
description: Interactive guide to install quiz, tutorial, and testing system to a target directory.
license: MIT
scripts:
  - ../../quiz/cli/install.js
---

# Install Wizard

Guided installation of the quiz and testing system to a target directory.

## Dry Run (Preview)

Always preview before installing:

```bash
node quiz/cli/install.js --dry-run --verbose
```

## Install to Target

```bash
node quiz/cli/install.js --dir /path/to/target
```

## Update Existing Installation

```bash
node quiz/cli/install-update.js --dir /path/to/target
```

## What Gets Installed

| Source | Destination | Files |
|--------|-------------|-------|
| `quiz/cli/` | `quiz/cli/` | All CLI scripts |
| `quiz/lib/` | `quiz/lib/` | Shared modules |
| `quiz/tests/` | `quiz/tests/` | Test suites |
| `tutorials/cli/` | `tutorials/cli/` | Tutorial CLI scripts |
| `tutorials/lib/` | `tutorials/lib/` | Tutorial shared modules |
| `.opencode/skills/` | `.opencode/skills/` | Skills |
| `.opencode/commands/` | `.opencode/commands/` | Commands |
| `.opencode/agents/` | `.opencode/agents/` | Agents |
| `.opencode/scripts/` | `.opencode/scripts/` | Helper scripts |

## What Does NOT Get Installed

- `quiz/banks/` — Question banks (project-specific)
- `quiz/keys/` — Answer keys (sensitive)
- `quiz/results/` — Session results (project-specific)
- `tutorials/banks/` — Tutorial content
- `tutorials/keys/` — Tutorial keys
- `tutorials/sessions/` — Tutorial sessions

## Workflow

1. Preview with `--dry-run`
2. Review file list
3. Install with `--dir TARGET`
4. Run `ci-validate` to verify
5. Copy your banks/keys manually

## Related Skills

- [[ci-validate]] — Validate installation
- [[quiz-key-mgmt]] — Multi-person key management
