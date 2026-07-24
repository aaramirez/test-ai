# test-ia

Multi-agent AI-enhanced project with a zero-dependency Node.js testing and quiz system.

## Table of Contents

- [Testing](#testing)
- [Quiz System](#quiz-system)

---

## Testing

This project uses Node.js built-in test runner (`node:test` + `node:assert/strict`). No npm modules required.

### Test Files

| File | Coverage |
|------|----------|
| `quiz/tests/schema.test.js` | Validation of questions, banks, and keys (13 tests) |
| `quiz/tests/scorer.test.js` | Scoring engine for single, multiple, and survey questions (11 tests) |
| `quiz/tests/session.test.js` | Session ID generation and uniqueness (5 tests) |
| `quiz/tests/participant.test.js` | Registration, search, CSV import (11 tests) |
| `quiz/tests/survey-session.test.js` | Survey session management — registry, pending, save (17 tests) |

### Running Tests

```bash
# Run a specific test file
node --test quiz/tests/scorer.test.js

# Run all quiz tests
node --test quiz/tests/*.test.js

# Auto-discover and run all tests
node --test
```

### TDD Workflow

1. **RED** — Write a failing test first
2. **GREEN** — Implement minimum code to pass
3. **REFACTOR** — Clean up while keeping tests green

Run tests before committing: `node --test`

---

## Quiz System

An open-source, self-contained quiz and survey management system. All questions are stored in answer-free `banks/` (safe to share), with correct answers in `keys/` (admin-only, encrypted).

### Architecture

```
BANKS (shareable) + KEYS (secret)   --->   QUIZ SESSION   --->   RESULTS   --->   REPORTS + EMAIL
  quiz/banks/       quiz/keys/              quiz/cli/               quiz/results/       quiz/cli/
                                                                                        quiz/lib/
```

**Components:**

| Directory | Purpose | Committed |
|-----------|---------|-----------|
| `quiz/banks/` | Quiz question-only files (shareable) | Yes |
| `quiz/keys/` | Answer keys, encrypted with SOPS/age | No (gitignored) |
| `quiz/results/` | Quiz session results and index | Yes |
| `quiz/cli/` | Command-line scripts | Yes |
| `quiz/lib/` | Core logic modules | Yes |
| `quiz/tests/` | Test suites | Yes |
| `quiz/manuals/` | Documentation | Yes |
| `surveys/banks/` | Survey question-only files (shareable) | Yes |
| `surveys/results/` | Survey session results | Yes |
| `surveys/registry.json` | Survey completion tracking | Yes |
| `surveys/visibility.json` | Group-based survey access control | Yes |
| `surveys/_index.json` | Survey session index | Yes |

**Data flow:**

1. Admin creates quiz banks (`quiz/banks/`) and answer keys (`quiz/keys/`)
2. Participants run quizzes, results saved to `quiz/results/`
3. Admin evaluates results, generates reports, emails scores
4. Surveys use a separate flow: questions from `surveys/banks/`, answers saved to `surveys/results/`, completion tracked in `surveys/registry.json`

### Quick Start

```bash
# 1. Create a bank
node quiz/cli/create-bank.js --name "JavaScript Basics" --id javascript

# 2. Add questions
node quiz/cli/add-question.js --bank banks/javascript.json \
  --id js-001 --type single --difficulty easy \
  --question "What is let vs var?" \
  --options "var is block-scoped" "let is block-scoped"

# 3. Validate the bank
node quiz/cli/validate-bank.js javascript.json

# 4. Create and encrypt answer key
node quiz/cli/create-key.js --bank javascript.json
node quiz/cli/create-key.js --key javascript.json --add js-001 --correct 1 --explanation "let is block-scoped"
node quiz/cli/validate-key.js --key javascript.json --bank javascript.json
node quiz/cli/encrypt-key.js keys/javascript.json

# 5. Register participants
node quiz/cli/manage-participants.js --add --id STU-001 --name "Jane" --email jane@example.com
```

### Commands

| Command | Description | API Agent |
|---------|-------------|-----------|
| `/test` | Run all tests | [tester] |
| `/plan` | Create a requirements plan | [plan] |
| `/quiz-create` | Create a new question bank | [quiz-bank] |
| `/quiz-register` | Register or import participants | [quiz-participant] |
| `/quiz-practice` | Practice quiz with immediate feedback | [quiz] |
| `/quiz-run` | Live quiz session (results saved) | [quiz] |
| `/quiz-report` | Admin reports and participant stats | [quiz-admin] |
| `/quiz-send` | Email session results | [quiz-results] |
| `/quiz-migrate` | Migrate legacy bank to new format | [quiz-bank] |
| `/quiz-install` | Install quiz & testing system to a directory | [quiz-install] |
| `/quiz-install-update` | Update existing installation | [quiz-install] |
| `/key-mgmt` | Multi-person key management — access control, approvals | [key-mgmt-admin] |
| `/survey` | Check and take pending surveys | [survey] |
| `/survey-report` | Survey admin reports — statistics, CSV export | [survey-admin-agent] |
| `/survey-create` | Create survey question banks (no answer keys) | [survey-admin-agent] |
| `/tutorial` | Run interactive tutorial with gamification | [tutorial] |
| `/tutorial-create` | Create new interactive tutorial | [tutorial-create] |
| `/tutorial-report` | View tutorial completion reports | [tutorial-admin] |
| `/tutorial-key` | Manage tutorial answer keys | [tutorial-key] |

### CLI Scripts

#### Bank Management

```bash
# Create a new question bank
node quiz/cli/create-bank.js --name "Python" --id python --version 1.0.0

# Add a question to a bank
node quiz/cli/add-question.js --bank banks/python.json \
  --id py-001 --type single --difficulty easy \
  --question "What is a list?" \
  --options "Mutable array" "Immutable array"

# Validate the bank schema
node quiz/cli/validate-bank.js banks/python.json

# Migrate a legacy bank.json to the new format
node quiz/cli/migrate-bank.js --input bank.json --output banks/
```

#### Key Management

```bash
# Create a key file from an existing bank
node quiz/cli/create-key.js --bank banks/python.json

# Add individual answer to a key
node quiz/cli/create-key.js --key keys/python.json \
  --add py-001 --correct 0 --explanation "Lists are mutable"

# Validate key against its bank
node quiz/cli/validate-key.js --key keys/python.json --bank banks/python.json

# Encrypt key using SOPS/age
node quiz/cli/encrypt-key.js keys/python.json
```

#### Participant Management

```bash
# List all registered participants
node quiz/cli/manage-participants.js --list

# Find a participant by name or email
node quiz/cli/manage-participants.js --find "Jane"

# Search participants (partial match)
node quiz/cli/manage-participants.js --search "Doe"

# Register a single participant
node quiz/cli/manage-participants.js --add --id STU-001 --name "Jane Doe" --email jane@example.com

# Add participant to a group
node quiz/cli/manage-participants.js --group-add STU-001 cohorte-A

# View groups
node quiz/cli/manage-participants.js --groups

# View participant history
node quiz/cli/manage-participants.js --history STU-001

# Bulk import participants from CSV
# CSV format: id,name,email,group
node quiz/cli/manage-participants.js --import participants.csv

# Update participant name/email
node quiz/cli/manage-participants.js --update STU-001 --name "New Name" --email new@example.com
```

#### Running Quizzes

```bash
# List all available banks
node quiz/cli/run-quiz.js --list

# Run a practice quiz (with instant feedback)
node quiz/cli/run-quiz.js --bank banks/javascript.json --mode practice

# Run a practice quiz with difficulty and count filters
node quiz/cli/run-quiz.js --bank banks/javascript.json --mode practice --difficulty easy --count 2

# Run a live quiz for a specific participant
node quiz/cli/run-quiz.js --bank banks/javascript.json --mode live --participant-id STU-001

# Run a survey (just collects data, no evaluation)
node quiz/cli/run-quiz.js --bank banks/feedback-survey.json --mode survey
```

#### Evaluation & Reports

```bash
# Evaluate all sessions for a bank
node quiz/cli/evaluate.js --bank javascript.json --all

# Evaluate a specific session
node quiz/cli/evaluate.js --bank javascript.json --session q-1234567890

# Generate admin report for a bank
node quiz/cli/admin-report.js --bank javascript.json

# Generate report with participant details
node quiz/cli/admin-report.js --bank javascript.json --participants

# Export report to CSV
node quiz/cli/admin-report.js --bank javascript.json --csv report.csv

# Generate report for a single participant
node quiz/cli/admin-report.js --participant STU-001
```

#### Results & Email

```bash
# List sessions for a bank
node quiz/cli/send-results.js --bank javascript.json --list

# Send results to all participants for a bank
node quiz/cli/send-results.js --bank javascript.json --all

# Send results to a specific session
node quiz/cli/send-results.js --bank javascript.json --session q-1234567890
```

#### Surveys

```bash
# Using the /survey command via opencode (interactive)
/survey

# List pending surveys for a participant
/survey participant=STU-001

# Take a specific survey
/survey participant=STU-001 bank=feedback-survey

# Survey session management (programmatic)
node -e "import('./quiz/lib/survey-session.js').then(m => m.getPendingSurveys('STU-001', ['feedback-survey.json'], '.'))"
```

### Survey System

The survey subsystem stores all data separately from quiz data:

| Path | Purpose |
|------|---------|
| `surveys/registry.json` | Completion tracking: `{ participant_id: { bank_name: { taken, session_id, date } } }` |
| `surveys/_index.json` | Session index for lookup by session ID, participant, or bank |
| `surveys/results/<bank>/` | Per-bank survey result files (`s-YYYY-MM-DD-xxxxxx.json`) |
| `surveys/visibility.json` | Group-based access control: `{ bank: { allowedGroups, viewResultsGroups } }` |

Survey banks are regular banks in `quiz/banks/` with `type: "survey"` questions. They require no answer key.

Survey visibility is controlled via `surveys/visibility.json`:
- `allowedGroups`: which groups can see/take the survey (omit for unrestricted)
- `viewResultsGroups`: which groups can view all results for the survey (omit to restrict participants to their own results only)

### Session ID Format

| Prefix | Mode |
|--------|------|
| `q-` | Live quiz |
| `p-` | Practice |
| `s-` | Survey |

### File Formats

#### Question Bank (`banks/*.json`)

Stores questions only — no correct answers. Safe to share and commit.

```json
{
  "name": "JavaScript",
  "description": "Fundamental concepts",
  "version": "1.0.0",
  "randomize": { "questions": false, "options": false },
  "questions": [
    {
      "id": "js-001",
      "type": "single",
      "difficulty": "easy",
      "question": "What is let vs var?",
      "options": [
        { "label": "var is block-scoped" },
        { "label": "let is block-scoped" }
      ]
    }
  ]
}
```

#### Answer Key (`keys/*.json`)

Maps question IDs to correct answer indices. Encrypted and gitignored.

```json
{
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "answers": {
    "js-001": {
      "correct": 1,
      "explanation": "let respects block scoping"
    }
  }
}
```

#### Team (`team.json`)

Central registry for all participants. Can include groups for cohort management.

```json
{
  "participants": {
    "STU-001": {
      "id": "STU-001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "registered_at": "2026-07-16T03:24:04.780Z",
      "metadata": { "group": "cohorte-A" }
    }
  },
  "groups": {
    "cohorte-A": ["STU-001"]
  }
}
```

#### Session Results (`results/*.json`)

Generated automatically when a quiz is completed.

```json
{
  "session_id": "p-1234567890",
  "date": "2026-07-18T12:00:00.000Z",
  "mode": "practice",
  "bank": "javascript.json",
  "participant": "STU-001",
  "score": { "correct": 2, "total": 3, "percentage": 66.67 },
  "results": [
    { "id": "js-001", "type": "single", "selected": 1, "correct": true },
    { "id": "js-002", "type": "single", "selected": 0, "correct": false },
    { "id": "js-003", "type": "single", "selected": 1, "correct": true }
  ],
  "evaluated": false,
  "sent": false
}
```

#### Survey Result (`surveys/results/<bank>/*.json`)

No scoring — just question answers with `score: null`:

```json
{
  "session_id": "s-2026-07-18-abc123",
  "date": "2026-07-18T10:00:00.000Z",
  "mode": "survey",
  "bank": "feedback-survey.json",
  "bank_version": "1.0.0",
  "participant": { "id": "STU-001", "name": "Jane Doe", "email": "jane@example.com" },
  "questions": [
    { "id": "srv-001", "type": "survey", "selected": [0] },
    { "id": "srv-002", "type": "survey", "selected": [2] }
  ],
  "score": null
}
```

### Workflows

#### Admin Setup

1. Create bank: `node quiz/cli/create-bank.js --name "Topic" --id topic`
2. Add questions: `node quiz/cli/add-question.js ...`
3. Validate: `node quiz/cli/validate-bank.js banks/topic.json`
4. Create key: `node quiz/cli/create-key.js --bank banks/topic.json`
5. Add answers: `node quiz/cli/create-key.js --add topic-001 --correct 0`
6. Encrypt key: `node quiz/cli/encrypt-key.js keys/topic.json`
7. Register participants: `node quiz/cli/manage-participants.js --add ...` or CSV import
8. Push: `git push` to share with teams

#### Running a Quiz

1. Participants run: `node quiz/cli/run-quiz.js --bank topic.json --mode live --participant-id STU-001`
2. Results auto-save to `quiz/results/`
3. Admin pulls latest: `git pull`

#### Running a Survey

1. Open opencode and run `/survey` (interactive)
2. System identifies participant, checks `surveys/registry.json` for pending surveys
3. Select a pending survey → answer questions → results saved to `surveys/results/<bank>/`
4. Registry is updated to mark survey as completed

#### Daily Operations

1. `git pull` to get latest results
2. Evaluate: `node quiz/cli/evaluate.js --bank topic.json --all`
3. Report: `node quiz/cli/admin-report.js --bank topic.json`
4. Send results: `node quiz/cli/send-results.js --bank topic.json --all`
5. Check participant history: `node quiz/cli/manage-participants.js --history STU-001`

### Manuals

For detailed guides, refer to the manual docs:

| Manual | Description |
|--------|-------------|
| [Admin Guide](quiz/manuals/admin.md) | Complete admin setup and operations |
| [Quick Reference](quiz/manuals/quick-reference.md) | Command cheatsheet |
| [Participant Guide](quiz/manuals/participant.md) | Participant-facing instructions |
