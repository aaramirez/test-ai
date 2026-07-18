# Testing & Quiz README

## Objective

Create a comprehensive README.md in the project root that documents all testing and quiz features with setup, usage, and examples.

## Requirements

1. README.md in project root — priority: high
2. Document all 12 CLI scripts with usage, flags, examples — priority: high
3. Document all 4 test files, how to run tests, and test structure — priority: high
4. Document bank, key, participant, and result file formats — priority: high
5. Document the 4 commands (/test, /plan, /quiz-create, /quiz-register, /quiz-practice, /quiz-run, /quiz-report, /quiz-send, /quiz-migrate) — priority: medium
6. Document TDD workflow and conventions — priority: medium
7. Cross-platform (macOS and Windows) Node.js only — priority: medium
8. Contain common workflows (setup, running a quiz, evaluation, emailing results) — priority: medium
9. Maintain clean separation from other files (README does not replace existing manuals, it references them) — priority: low

## Architecture

- New file: `README.md` at project root (no existing README to modify)
- Does NOT replace existing manuals: `quiz/manuals/admin.md`, `quiz/manuals/participant.md`, `quiz/manuals/quick-reference.md`
- Does NOT replace AGENTS.md (kept for AI agent configuration)
- Follows same concise style as existing documentation

### Files to create
- `README.md` (project root)

### Files to modify
- None

### Decisions
- README.md provides the "30,000-foot view" of the project
- Testing section at top (as primary feature for developers)
- Quiz section second (as main deliverable)
- All CLI scripts documented with `bash` code blocks showing both usage and examples
- File formats documented with JSON where appropriate
- Links to the `quiz/manuals/` directory for detailed guides
- No duplication of AGENTS.md content; README focuses on user-facing features
- Structure follows test-first TDD pattern as initial heading

## TDD Flow

No testable code is being written; this is a documentation-only change.

## Verification

- [ ] README.md renders correctly on GitHub (check all links and code blocks)
- [ ] All CLI scripts referenced exist and commands are correct
- [ ] All existing manuals are preserved and linked correctly
- [ ] AGENTS.md is not modified
- [ ] All 12 CLI scripts and 4 test files are covered
- [ ] The README located at project root is the only new file

## README Outline

```markdown
# test-ia

Multi-agent AI-enhanced project with a zero-dependency Node.js quiz system.

## Table of Contents

1. [Testing](#testing)
   - [Test Structure](#test-structure)
   - [Running Tests](#running-tests)
   - [TDD Workflow](#tdd-workflow)
   - [Writing Tests](#writing-tests)
2. [Quiz System](#quiz-system)
   - [Architecture](#architecture)
   - [Quick Start](#quick-start)
   - [Commands](#commands)
   - [CLI Scripts](#cli-scripts)
     - Bank Management
     - Key Management
     - Running Quizzes
     - Participant Management
     - Evaluation & Reports
     - Results & Email
   - [File Formats](#file-formats)
     - Question Bank
     - Answer Key
     - Participants
     - Session Results
   - [Manuals](#manuals)
```

Each section will include:

### Testing
- Brief intro
- Test file table (name, location, what they cover)
- How to run tests (single file, all, auto-discover)
- TDD workflow overview (red-green-refactor)
- Link to AGENTS.md for AI agent reference

### Quiz System
- High-level architecture diagram (ASCII) showing BANKS + KEYS → QUIZ SESSION → RESULTS → REPORTS/EMAIL
- Quick Start workflow (5-step sequence)
- File structure overview (banks, keys, results, cli, lib, tests)
- Table of Commands linked to their CLI scripts
- For each CLI script: name, purpose, code block with usage (all flags), code block with example
- For each file format: code block with JSON example
- Common workflows: run a practice quiz, evaluate session, get admin report, email results
- Links to manuals for detailed guides
