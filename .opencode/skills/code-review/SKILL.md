---
name: code-review
description: Use for reviewing pull requests, performing code audits, and enforcing quality standards.
license: MIT
---

# Code review

## Focus areas
1. **Correctness** — does the code do what it intends?
2. **Security** — are there injection risks, auth issues, or data leaks?
3. **Performance** — unnecessary work, n+1 queries, memory leaks
4. **Maintainability** — readable, testable, well-structured
5. **Consistency** — follows project patterns and conventions

## Review process
- Start with the big picture (architecture, approach)
- Then check individual changes
- Ask clarifying questions before marking blocking issues
- Approve or request changes with specific, actionable feedback
