---
description: Stage all changes and create a conventional commit.
---

Analyze the staged changes (or unstaged if none staged) and determine:
1. Change type: feat, fix, refactor, chore, docs, test, style, perf
2. Scope: the relevant module or component
3. Description: concise summary (imperative mood, no period)

Use `git add -A` to stage all changes, then create a conventional commit message:
`<type>(<scope>): <description>`

Provide a detailed body if the change is non-trivial.
