# Fix AGENTS.md — Testing Focus with OpenCode TUI

## Objective

Rewrite AGENTS.md to serve as a comprehensive guide for creating skills, agents, and commands for testing using the OpenCode TUI, replacing the quiz-centric documentation with a testing workflow-focused reference.

## Requirements

1. **Testing workflow documentation** — AGENTS.md must document the full testing lifecycle using OpenCode TUI (write tests, run tests, debug, iterate) — priority: high
2. **Skill creation guide** — document how to create new testing skills with SKILL.md format, YAML frontmatter, and script references — priority: high
3. **Agent creation guide** — document how to create new testing agents with proper permissions, mode, and model configuration — priority: high
4. **Command creation guide** — document how to create custom commands for test workflows — priority: high
5. **OpenCode TUI usage** — document how to use opencode TUI for testing: running agents, loading skills, using commands — priority: high
6. **Test framework reference** — document the Node.js built-in test runner patterns used in this project — priority: high
7. **Existing component inventory** — accurately list all current agents, skills, commands, and scripts — priority: medium
8. **Repository structure** — update the directory tree to reflect current state — priority: medium
9. **Quiz system documentation retained** — keep quiz-specific content as a section, not the primary focus — priority: medium
10. **Cross-platform instructions** — all testing instructions must work on macOS and Windows — priority: high
11. **TDD workflow integration** — document how to use the `/plan` command and plan-driven development — priority: medium
12. **Example workflows** — provide concrete examples of testing with opencode TUI — priority: medium

## Architecture

### Files to Modify

| File | Change |
|------|--------|
| `AGENTS.md` | Rewrite to focus on testing workflows, skill/agent creation, and OpenCode TUI usage |

### Files to Create

| File | Purpose |
|------|---------|
| `.opencode/skills/testing/SKILL.md` | New skill: testing workflow guide for OpenCode TUI |
| `.opencode/agents/tester.md` | Update: expand testing agent instructions |
| `.opencode/commands/test.md` | Update: enhance test command with more context |
| `.opencode/rules/testing.md` | New rule: testing conventions and patterns |

### Decisions

1. **AGENTS.md becomes a testing-focused reference** — the primary purpose shifts from listing all components to guiding how to create and use testing workflows
2. **Quiz content moves to a subsection** — quiz system is documented but not the headline; testing is the headline
3. **Skill creation follows existing pattern** — SKILL.md with YAML frontmatter, scripts array, and detailed workflow docs
4. **Agent creation follows existing pattern** — mode/permissions/model in frontmatter, focused instructions in body
5. **Testing skill uses Node.js built-in test runner** — no new dependencies; matches existing `quiz/tests/*.test.js` patterns
6. **OpenCode TUI integration** — document how to use `opencode` CLI to launch agents, run commands, and load skills interactively

## TDD Flow

### Phase 1: Plan Document (this file)
1. ✅ Create `plans/fix-agents-md-testing-focus.md` — the plan itself

### Phase 2: Rules First (RED → GREEN → REFACTOR)
1. Write `.opencode/rules/testing.md` — testing conventions
   - FAIL: file doesn't exist
2. Create file with testing rules
   - PASS: file exists and is valid

### Phase 3: Testing Skill (RED → GREEN → REFACTOR)
1. Write tests for skill validation (check frontmatter, required fields)
   - FAIL: no skill exists
2. Create `.opencode/skills/testing/SKILL.md`
   - PASS: skill loads and validates
3. Refine workflow documentation

### Phase 4: Agent Update (RED → GREEN → REFACTOR)
1. Verify current tester agent can be improved
   - Current agent is minimal (18 lines)
2. Update `.opencode/agents/tester.md` with expanded instructions
   - PASS: agent has complete testing workflow

### Phase 5: Command Enhancement
1. Update `.opencode/commands/test.md` with better context detection
   - Current is 5 lines — too minimal

### Phase 6: AGENTS.md Rewrite
1. Write the new AGENTS.md content
   - Replace quiz-centric header with testing-focused header
   - Add "Testing with OpenCode TUI" section
   - Add "Creating Skills" guide
   - Add "Creating Agents" guide
   - Add "Creating Commands" guide
   - Add "Test Framework" reference
   - Retain quiz system as subsection
   - Update component inventory tables
2. Run `node .opencode/scripts/ci-validate.js` to verify
   - PASS: all checks pass

## Detailed Changes

### 1. New Rule: `.opencode/rules/testing.md`

```markdown
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
```

### 2. New Skill: `.opencode/skills/testing/SKILL.md`

```markdown
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
1. Run with --test-reporter for details
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
```

### 3. Updated Agent: `.opencode/agents/tester.md`

```markdown
---
description: Testing specialist. Use for writing, running, and debugging tests.
mode: subagent
model: opencode/big-pickle
permission:
  bash: allow
  edit: allow
---

You are a testing specialist. Your workflow:

## 1. Detect Framework
Always check what test framework the project uses before writing tests.
For this project: Node.js built-in test runner (`node:test` + `node:assert/strict`).

## 2. Write Tests (TDD)
- Write failing tests FIRST (RED phase)
- Use describe/it blocks for organization
- One test file per module
- Test file naming: `<module>.test.js` in `tests/` directory

## 3. Run Tests
```bash
# Single file
node --test quiz/tests/scorer.test.js

# All tests in directory
node --test quiz/tests/*.test.js

# Auto-discover all tests
node --test
```

## 4. Debug Failures
- Read error messages carefully
- Check import paths resolve
- Verify test data matches expected schemas
- Use assert/strict for all comparisons

## 5. Coverage
- Aim for meaningful coverage, not 100% for its own sake
- Focus on: edge cases, error paths, happy paths
- Skip: trivial getters/setters, simple pass-throughs

## 6. Maintainability
- Tests are code too — keep them clean and readable
- Use descriptive test names
- Avoid test interdependencies
- Clean up test data after each test

## Test File Template
```javascript
#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { functionToTest } from '../lib/module.js';

describe('functionToTest', () => {
  it('does expected thing', () => {
    assert.equal(functionToTest(input), expected);
  });

  it('handles edge case', () => {
    assert.throws(() => functionToTest(badInput), /Error/);
  });
});
```

## CI Validation
After writing tests, run: `node .opencode/scripts/ci-validate.js`
This ensures project structure remains valid.
```

### 4. Updated Command: `.opencode/commands/test.md`

```markdown
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
```

### 5. Rewritten AGENTS.md

The new AGENTS.md will have this structure:

```markdown
# test-ia — AI Agent Instructions

test-ia — AI-enhanced project

This repository uses **arai** (open-code AI configuration manager) for multi-agent configuration.
Skills, scripts, and prompts are installed from the [aramirez-ai](https://github.com/aaramirez/aramirez-ai) repository.

## Repository structure

[test-ia directory tree]

## Key principles

[existing principles]

## Testing with OpenCode TUI

### Quick Start

1. Open opencode in the project directory
2. Type `/test` to run all tests
3. Or ask the tester agent: "Run all tests and report results"

### Writing Tests

[guide on writing tests with node:test]

### Running Tests

[commands for running tests]

### Debugging Tests

[workflow for debugging failures]

## Creating Skills

### Skill Format

[SKILL.md format with YAML frontmatter]

### Creating a Testing Skill

[step-by-step guide]

### Example: testing skill

[reference to .opencode/skills/testing/SKILL.md]

## Creating Agents

### Agent Format

[frontmatter format for agents]

### Creating a Testing Agent

[step-by-step guide]

### Example: tester agent

[reference to .opencode/agents/tester.md]

## Creating Commands

### Command Format

[.opencode/commands/<name>.md format]

### Creating a Test Command

[step-by-step guide]

### Example: test command

[reference to .opencode/commands/test.md]

## Available agents

[updated table]

## Available skills

[updated table with testing skill]

## Available commands

[updated table with test command]

## Available scripts

[existing table]

## Quiz system

[existing quiz documentation — kept as subsection]

## CLI quick reference

[existing CLI reference]

## When working

[existing guidelines plus testing-specific ones]
```

## Verification

- [ ] `.opencode/rules/testing.md` created and valid
- [ ] `.opencode/skills/testing/SKILL.md` created with proper frontmatter
- [ ] `.opencode/agents/tester.md` expanded with complete workflow
- [ ] `.opencode/commands/test.md` enhanced with context
- [ ] `AGENTS.md` rewritten with testing focus
- [ ] `node .opencode/scripts/ci-validate.js` passes
- [ ] All existing tests still pass: `node --test quiz/tests/*.test.js`
- [ ] New testing skill follows SKILL.md format (YAML frontmatter valid)
- [ ] New agent follows frontmatter format (description, mode, permissions)
- [ ] Cross-platform: all commands work on macOS and Windows
