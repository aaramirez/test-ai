---
name: git
description: Use for git operations, branching strategies, commit conventions, and repository management.
license: MIT
---

# Git workflow

## Commit convention
Use conventional commits: `<type>(<scope>): <description>`
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code change without fix or feature
- `chore`: maintenance, deps, config
- `docs`: documentation only
- `test`: adding/fixing tests
- `style`: formatting, linting

## Branch naming
- `feat/<description>` — new features
- `fix/<description>` — bug fixes
- `chore/<description>` — maintenance
- `docs/<description>` — documentation

## Workflow
1. Pull latest `main` before branching
2. Keep commits atomic and rebase before merge
3. Use `--ff-only` merge for linear history
4. Delete remote branch after merge
