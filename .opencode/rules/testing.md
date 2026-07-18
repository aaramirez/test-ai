# Testing rules

## Framework
- Use Node.js built-in test runner: `node:test` + `node:assert/strict`
- Test files: `*.test.js` in `quiz/tests/` or project-level `tests/`
- Run: `node --test <file>` or `node --test **/*.test.js`

## Conventions
- One test file per module (scorer.js → scorer.test.js)
- Describe blocks group related tests
- Each it() tests one behavior
- Use assert/strict for all assertions
- No external test dependencies (jest, vitest, etc.)

## TDD
- Write failing test first (RED)
- Implement minimum code to pass (GREEN)
- Refactor while keeping tests green
- Use /plan command to create plan before coding

## CI Validation
- Run: node .opencode/scripts/ci-validate.js
- Must pass before commits
- Checks: required files, placeholder text, frontmatter validity
