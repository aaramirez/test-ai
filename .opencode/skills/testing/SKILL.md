---
name: testing
description: Testing workflows for OpenCode TUI — write, run, and debug tests using Node.js built-in test runner.
license: MIT
---

# Testing Skill

Guide for writing and running tests in this project using OpenCode TUI.

## Quick Start

### Write a test
1. Identify the module to test (e.g., `quiz/lib/scorer.js`)
2. Create test file: `quiz/tests/scorer.test.js`
3. Import test runner: `import { describe, it } from 'node:test'`
4. Import assertions: `import assert from 'node:assert/strict'`
5. Write describe/it blocks
6. Run: `node --test quiz/tests/scorer.test.js`

### Run tests
```bash
node --test quiz/tests/scorer.test.js    # single file
node --test quiz/tests/*.test.js         # all quiz tests
node --test                              # all tests (auto-discover)
```

### Debug failing tests
1. Run with verbose output for details
2. Check assertion messages
3. Verify module imports resolve correctly
4. Ensure test data matches expected schema

## Test Patterns

### Single module test
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { myFunction } from '../lib/my-module.js';

describe('myFunction', () => {
  it('returns expected value', () => {
    assert.equal(myFunction(input), expected);
  });

  it('handles edge case', () => {
    assert.throws(() => myFunction(badInput), /error message/);
  });
});
```

### Async test
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('async operation', () => {
  it('resolves correctly', async () => {
    const result = await asyncFunction();
    assert.equal(result, expected);
  });
});
```

## Creating New Tests

When adding a new module:
1. Create the module file first (even with stub exports)
2. Create corresponding test file
3. Write tests that FAIL (module not implemented)
4. Implement module to make tests PASS
5. Refactor if needed

## Using OpenCode TUI

### Run tests via command
Type `/test` in the TUI to run the project test suite.

### Run tests via agent
The `tester` subagent can write and run tests. Spawn it:
- "Write tests for quiz/lib/scorer.js"
- "Run all tests and report results"
- "Debug the failing test in scorer.test.js"

### Load testing skill
When working on tests, load the testing skill:
- Use the skill tool to load `testing`

## File Conventions

| Location | Purpose |
|----------|---------|
| `quiz/tests/*.test.js` | Quiz system tests |
| `tests/*.test.js` | Project-level tests |
| `*.test.js` | Module-level tests (co-located) |
