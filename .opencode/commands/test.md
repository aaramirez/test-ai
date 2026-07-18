---
description: Run the test suite for the current project.
---

Run the test suite for this project.

## Steps

1. **Detect test framework** — check package.json, config files, and test directories
   - For this project: Node.js built-in test runner (`node:test`)

2. **Discover test files** — find all `*.test.js` files
   - `quiz/tests/*.test.js` — quiz system tests
   - `tests/*.test.js` — project-level tests

3. **Run tests** — execute with appropriate flags
   ```bash
   node --test quiz/tests/*.test.js
   ```

4. **Report results** — show:
   - Total tests run
   - Pass/fail counts
   - Failed test names and error messages
   - Coverage summary if available

5. **CI validation** — run structural validation
   ```bash
   node .opencode/scripts/ci-validate.js
   ```
