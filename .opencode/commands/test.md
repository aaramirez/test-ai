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
   node --test --test-concurrency=1 quiz/tests/*.test.js
   ```
   > `--test-concurrency=1` runs test files serially. Required because the
   > key-management tests (manage-keys, encrypt-key-multi, lifecycle) share
   > `quiz/keys/team-public.json` and `team.json`. Running them in parallel
   > causes a race: one file's `afterEach` can delete/overwrite the file while
   > another file is mid-encrypt (sops/age-keygen subprocess), producing
   > intermittent "No active members found" failures.

4. **Report results** — show:
   - Total tests run
   - Pass/fail counts
   - Failed test names and error messages
   - Coverage summary if available

5. **CI validation** — run structural validation
   ```bash
   node .opencode/scripts/ci-validate.js
   ```
