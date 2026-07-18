# Quiz & Survey Management System

## Objective

Build a multi-bank quiz and survey platform with a complete agent/skill/script/command ecosystem covering the full lifecycle: bank creation → key management → quiz/survey execution → evaluation → result delivery to participants.

## Requirements

1. **Multiple banks** — each topic has its own bank file under `quiz/banks/` — priority: high
2. **Banks are answer-free** — bank files contain questions + options only; no `correct`, no `explanation` — priority: high
3. **Separate answer keys** — admin-only files under `quiz/keys/` mapping question IDs to correct answers — priority: high
4. **Single & multiple choice** — `type: "single"` and `type: "multiple"` — priority: high
5. **Survey mode** — `type: "survey"` questions; no key, distribution-only results — priority: high
6. **Practice mode** — users practice with immediate feedback (correct/incorrect + explanations), results saved as practice — priority: high
7. **Live mode** — the real quiz: no feedback during, results saved, evaluable, emailable — priority: high
8. **Participant identification** — mandatory name + ID for ALL modes (practice and live), used for deduplication and tracking — priority: high
9. **GitHub submission** — results committed to the GitHub repo as JSON files, with auto-commit via scripts — priority: high
10. **Result storage** — all results in `quiz/results/`, organized by bank subdirectory, encrypted at rest — priority: high
11. **Multiple attempts** — participants can take quizzes multiple times; all attempts stored, latest score highlighted — priority: medium
12. **Full lifecycle automation** — agents + skills + scripts + commands for every phase — priority: high
13. **Admin report** — per-question stats, response distributions, per-participant history, exportable CSV — priority: medium
14. **Result delivery** — evaluate sessions and send personalized results to participants via email — priority: medium
15. **Bank versioning** — banks have a `version` field; results reference bank version for historical accuracy — priority: medium
16. **Question randomization** — configurable: shuffle questions, shuffle options, or both — priority: low
17. **Backward compatibility** — existing `quiz/bank.json` migrated — priority: high
18. **Cross-platform** — Node.js only, zero npm dependencies — priority: high
19. **Participant registry** — central file storing participant profiles, reused across sessions — priority: high
20. **Participant management** — register, list, find, bulk-import participants — priority: high
21. **Result index** — fast lookup index mapping session IDs to participant IDs — priority: medium
22. **User manuals** — step-by-step guides for participants and admins — priority: high
23. **Bulk operations** — bulk register, bulk send results, bulk evaluate — priority: medium

---

## Lifecycle & Agent Architecture

### Phase Map

```
Phase 1              Phase 2              Phase 3a             Phase 3b             Phase 4              Phase 5
BANK CREATION        KEY MANAGEMENT       PRACTICE             LIVE QUIZ            EVALUATION           DELIVERY
─────────────       ──────────────       ──────────────       ──────────────       ──────────────       ──────────────
Create bank         Create answer key    Run quiz (no save)   Run quiz (save)      Score sessions       Send results
Add questions       Encrypt key          Immediate feedback   No feedback          Generate report      Email participants
Validate bank       Validate key         Learn from key       Collect answers      Aggregate stats      Archive
     │                    │                    │                    │                    │                    │
     ▼                    ▼                    ▼                    ▼                    ▼                    ▼
  quiz-bank            quiz-key              quiz                quiz              quiz-admin          quiz-results
   skill                skill               skill               skill                skill                skill
```

### Agents

| Agent | Mode | Purpose | Permissions |
|-------|------|---------|-------------|
| **build** | primary | Default. Creates bank files, implements modules | edit: ask, bash: ask |
| **quiz-admin** | primary | Manages banks, keys, reports, evaluation | edit: allow, bash: allow |
| **plan** | primary | Plans new features, architecture decisions | edit: deny |
| **reviewer** | subagent | Reviews bank quality, question clarity | edit: deny |
| **tester** | subagent | Runs test suites, validates schemas | bash: allow |
| **docs** | subagent | Updates AGENTS.md, documents workflows | edit: allow, bash: deny |

### New Agent: `quiz-admin`

```json
"quiz-admin": {
  "mode": "primary",
  "description": "Quiz lifecycle manager — create banks, manage keys, run evaluations, send results.",
  "permission": {
    "edit": "allow",
    "bash": {
      "node quiz/*": "allow",
      "*": "ask"
    }
  }
}
```

---

## Skills

### 1. `quiz-bank` — Bank Creation & Management

**Purpose:** Create, validate, and manage question banks.

**Location:** `.opencode/skills/quiz-bank/SKILL.md`

**Workflow:**
1. Create new bank file with `node quiz/cli/create-bank.js --name "Topic" --id topic`
2. Add questions with `node quiz/cli/add-question.js --bank banks/topic.json`
3. Validate with `node quiz/cli/validate-bank.js banks/topic.json`
4. Migrate legacy with `node quiz/cli/migrate-bank.js bank.json --output banks/`

**Scripts:**
| Script | Purpose |
|--------|---------|
| `quiz/cli/create-bank.js` | Scaffold new bank JSON with name, id, empty questions array |
| `quiz/cli/add-question.js` | Interactive or flag-based question addition to a bank |
| `quiz/cli/validate-bank.js` | Schema validation, duplicate ID detection, option count checks |
| `quiz/cli/migrate-bank.js` | Split old `bank.json` (with answers) into bank + key files |

---

### 2. `quiz-key` — Answer Key Management

**Purpose:** Create, manage, and encrypt answer key files.

**Location:** `.opencode/skills/quiz-key/SKILL.md`

**Workflow:**
1. Create key from existing bank with `node quiz/cli/create-key.js --bank banks/topic.json`
2. Add/edit answers with `node quiz/cli/create-key.js --key keys/topic.json --add js-001`
3. Validate key against bank with `node quiz/cli/validate-key.js --key keys/topic.json --bank banks/topic.json`
4. Encrypt with `node quiz/cli/encrypt-key.js keys/topic.json`

**Scripts:**
| Script | Purpose |
|--------|---------|
| `quiz/cli/create-key.js` | Create answer key file, add/edit individual answers |
| `quiz/cli/validate-key.js` | Cross-validate key against bank (all questions have answers, types match) |
| `quiz/cli/encrypt-key.js` | SOPS/age encryption of key files |

---

### 2b. `quiz-participant` — Participant Management

**Purpose:** Register, list, find, and manage quiz participants.

**Location:** `.opencode/skills/quiz-participant/SKILL.md`

**Workflow:**
1. Register single participant: `node quiz/cli/manage-participants.js --add --id STU-001 --name "Jane Doe" --email "jane@example.com"`
2. Bulk import from CSV: `node quiz/cli/manage-participants.js --import participants.csv`
3. List all: `node quiz/cli/manage-participants.js --list`
4. Find by ID: `node quiz/cli/manage-participants.js --find STU-001`
5. Find by name: `node quiz/cli/manage-participants.js --search "Jane"`
6. Update info: `node quiz/cli/manage-participants.js --update STU-001 --email "new@example.com"`
7. View history: `node quiz/cli/manage-participants.js --history STU-001`
8. Manage groups: `node quiz/cli/manage-participants.js --group-add cohorte-2026 STU-001,STU-002`

**Scripts:**
| Script | Purpose |
|--------|---------|
| `quiz/cli/manage-participants.js` | Full participant CRUD, bulk import, group management |

**CSV import format:**
```csv
id,name,email,group
STU-001,Jane Doe,jane@example.com,cohorte-2026
STU-002,John Smith,john@example.com,cohorte-2026
```

**Auto-registration:**
When `run-quiz.js` starts and the participant ID is not in the registry, it prompts for name/email and auto-registers. The participant is informed they've been registered for future sessions.

---

### 3. `quiz` — Quiz & Survey Execution

**Purpose:** Run quizzes and surveys interactively with participants, in practice or live mode.

**Location:** `.opencode/skills/quiz/SKILL.md` (enhanced)

#### Participant Collection (ALL modes)

Both practice and live require participant identification before starting:

1. Prompt for participant ID (student number, employee ID, GitHub username)
2. Prompt for participant name
3. Optionally prompt for email (required if results will be emailed)
4. Check for existing sessions with same ID + bank → show attempt count

#### Mode Selection

The skill asks the user which mode:

| Mode | Feedback | Saved | Evaluable | Email |
|------|----------|-------|-----------|-------|
| **Practice** | ✅ Immediate (per question) | ✅ Yes (mode=practice) | ❌ No | ❌ No |
| **Live** | ❌ None (only at end) | ✅ Yes (mode=live) | ✅ Yes | ✅ Optional |

#### Practice Workflow

1. Collect participant info (ID, name, email optional)
2. Select bank, difficulty, count
3. Present each question via `question` tool
4. **Immediately after each answer:** show correct/incorrect + explanation
5. At the end: show final score and summary
6. Save result to `quiz/results/<bank>/p-<session>.json` (mode=practice)
7. Show encouragement to try live when ready

**Practice feedback per question:**
```
Q1: ¿Cuál es la diferencia entre let y var?
Your answer: let es block-scoped, var es function-scoped ✅ Correct!

Q2: ¿Qué devuelve typeof null?
Your answer: undefined ❌ Incorrect.
Correct answer: object
Explanation: Es un error histórico de JavaScript, typeof null === 'object'
```

#### Live Workflow

1. Collect participant info (ID, name, email)
2. Select bank, difficulty, count
3. Present questions via `question` tool (no feedback during)
4. Save result to `quiz/results/<bank>/q-<session>.json` (mode=live)
5. Show taker their final score (quiz) or thank-you (survey)
6. Email available via `/quiz-send`

#### Scripts

| Script | Purpose |
|--------|---------|
| `quiz/cli/run-quiz.js` | Interactive runner — `--practice` or `--live` flag, bank selection, filtering |

**Taker receives (live):**
- Questions + options only
- Their score (quiz) or confirmation (survey)
- Never: correct answers, explanations, or other participants' data

**Taker receives (practice):**
- Questions + options
- Immediate feedback per question (correct/incorrect + explanation)
- Final score summary
- Encouragement to try live when ready

---

### 4. `quiz-admin` — Admin Reports & Evaluation

**Purpose:** Evaluate sessions against answer keys and generate aggregate reports.

**Location:** `.opencode/skills/quiz-admin/SKILL.md`

**Workflow:**
1. Evaluate a session: `node quiz/cli/evaluate.js --session results/session.json`
2. Generate report for a bank: `node quiz/cli/admin-report.js --bank javascript.json`
3. Export CSV: `node quiz/cli/admin-report.js --bank javascript.json --csv report.csv`

**Scripts:**
| Script | Purpose |
|--------|---------|
| `quiz/cli/evaluate.js` | Score a single session against its key, update result file with correct booleans |
| `quiz/cli/admin-report.js` | Aggregate all sessions for a bank → per-question stats, distributions, pass rates |

**Report output:**
```
Bank: javascript.json (3 questions, 12 sessions)
───────────────────────────────────────────────
Q1 (easy, single): 75% correct (9/12)
  ○ var es block-scoped...  25% (3)
  ● let es block-scoped...  75% (9) ✓

Q2 (easy, single): 42% correct (5/12)
  ○ null                   8%  (1)
  ○ undefined              42% (5)
  ● object                 42% (5) ✓
  ○ boolean                8%  (1)

Q3 (medium, single): 67% correct (8/12)
  ...
```

---

### 5. `quiz-results` — Result Delivery

**Purpose:** Send personalized results to participants via email.

**Location:** `.opencode/skills/quiz-results/SKILL.md`

**Workflow:**
1. List sessions: `node quiz/cli/send-results.js --bank javascript.json --list`
2. Send to one participant: `node quiz/cli/send-results.js --session q-2026-07-15-a1b2c3`
3. Send to all: `node quiz/cli/send-results.js --bank javascript.json --all`
4. Custom template: `node quiz/cli/send-results.js --session ... --template results-email.hbs`

**Scripts:**
| Script | Purpose |
|--------|---------|
| `quiz/cli/send-results.js` | Load session, format email (score + per-question feedback), send via email skill |

**Email content (quiz):**
```
Subject: Resultados del Quiz — JavaScript Basics

Hola [name],

Tu resultado: 2/3 (67%)

✅ Q1: let es block-scoped, var es function-scoped
❌ Q3: El event loop — El mecanismo que maneja la concurrencia asíncrona en JS
   Explicación: El event loop permite que JS sea single-threaded pero no bloqueante

Gracias por participar.
```

**Email content (survey):**
```
Subject: Gracias por tu participación — Course Feedback

Hola [name],

Gracias por completar la encuesta. Tus respuestas han sido registradas.
```

**Depends on:** [[email]] skill (for SMTP sending)

---

## Directory Structure

```
quiz/
  banks/                              # Question banks (shareable, no answers)
    javascript.json
    python.json
    git.json
    bash.json
    feedback-survey.json              # Survey bank (no key needed)
  keys/                               # Answer keys (admin-only, encrypted, gitignored)
    javascript.json
    python.json
    git.json
    bash.json
  results/                            # ALL session results (committed to GitHub)
    javascript/                       # Organized by bank
      q-2026-07-15-a1b2c3.json       # Live session
      p-2026-07-15-d4e5f6.json       # Practice session
    python/
      q-2026-07-16-g7h8i9.json
    survey/
      s-2026-07-17-j0k1l2.json
    _index.json                       # Fast lookup: session → participant + bank
  participants.json                   # Participant registry (committed to GitHub)
  templates/                          # Email templates
    quiz-results.html                 # Default quiz result email
    survey-thanks.html                # Default survey thank-you email
  manuals/                            # User documentation
    participant.md                    # Participant guide (how to take a quiz)
    admin.md                          # Admin guide (full system setup & management)
    quick-reference.md                # Quick reference card for both roles
  lib/                                # Shared modules
    schema.js                         # Bank + key loading and validation
    scorer.js                         # Scoring engine
    session.js                        # Session management, ID generation
    participant.js                    # Participant registry operations
    admin-report.js                   # Aggregate reporting
    mailer.js                         # Email formatting (wraps send-email.js)
  cli/                                # CLI entry points
    create-bank.js                    # Scaffold new bank
    add-question.js                   # Add question to bank
    validate-bank.js                  # Validate bank schema
    migrate-bank.js                   # Migrate legacy bank.json
    create-key.js                     # Create/edit answer key
    validate-key.js                   # Cross-validate key against bank
    encrypt-key.js                    # SOPS/age encrypt key files
    run-quiz.js                       # Interactive quiz/survey runner
    evaluate.js                       # Score session against key
    admin-report.js                   # Aggregate admin report
    send-results.js                   # Send results via email
    manage-participants.js            # Participant CRUD + bulk import
  tests/                              # Test suites
    schema.test.js
    scorer.test.js
    session.test.js
    participant.test.js
  bank.json                           # DEPRECATED — kept for migration
  results.js                          # Post-processing: encrypt + git commit
```

---

## Commands

| Command | Description | Template |
|---------|-------------|----------|
| `/quiz-create` | Create a new question bank interactively | Load `quiz-bank` skill, run `create-bank.js`, prompt for name/id/description |
| `/quiz-register` | Register a participant or bulk import from CSV | Load `quiz-participant` skill, run `manage-participants.js` |
| `/quiz-practice` | Practice a quiz with immediate feedback | Load `quiz` skill with `--practice` flag, identify participant, select bank, run session |
| `/quiz-run` | Run a live quiz/survey (results saved) | Load `quiz` skill with `--live` flag, identify participant, select bank, execute |
| `/quiz-report` | Generate admin report for a bank or participant | Load `quiz-admin` skill, run `admin-report.js` |
| `/quiz-send` | Send results to quiz participants | Load `quiz-results` skill, run `send-results.js`, confirm recipients |
| `/quiz-migrate` | Migrate legacy bank.json to new structure | Load `quiz-bank` skill, run `migrate-bank.js` |

---

## Schemas

### Bank Schema (answer-free, versioned)

```json
{
  "name": "JavaScript Basics",
  "description": "Fundamental JavaScript concepts",
  "version": "1.0.0",
  "randomize": {
    "questions": true,
    "options": false
  },
  "questions": [
    {
      "id": "js-001",
      "difficulty": "easy",
      "type": "single",
      "question": "¿Cuál es la diferencia entre let y var?",
      "options": [
        { "label": "var es block-scoped, let es function-scoped" },
        { "label": "let es block-scoped, var es function-scoped" }
      ]
    },
    {
      "id": "js-004",
      "difficulty": "medium",
      "type": "multiple",
      "question": "¿Cuáles son valores falsy en JavaScript?",
      "options": [
        { "label": "0" },
        { "label": "''" },
        { "label": "null" },
        { "label": "[]", "description": "Array vacío" },
        { "label": "{}", "description": "Objeto vacío" }
      ]
    }
  ]
}
```

### Answer Key Schema (admin-only)

```json
{
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "answers": {
    "js-001": {
      "correct": 1,
      "explanation": "let respeta bloques {}, var no"
    },
    "js-004": {
      "correct": [0, 1, 2],
      "explanation": "0, '' y null son falsy. Arrays y objetos vacíos son truthy."
    }
  }
}
```

### Participant Schema

Required for ALL modes (practice and live). Collected at session start.

```json
{
  "id": "STU-001",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "registered_at": "2026-07-15T09:00:00Z",
  "metadata": {
    "group": "cohorte-2026",
    "role": "student"
  }
}
```

- `id` — unique identifier (student number, employee ID, GitHub username, etc.)
- `name` — display name
- `email` — optional, used for result delivery
- `registered_at` — when the participant was first registered
- `metadata` — optional key-value pairs for grouping (cohort, department, role, etc.)

### Participant Registry (`quiz/participants.json`)

Central registry of all known participants. When a participant is identified once, their info is saved and reused in future sessions.

```json
{
  "participants": {
    "STU-001": {
      "id": "STU-001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "registered_at": "2026-07-15T09:00:00Z",
      "metadata": { "group": "cohorte-2026", "role": "student" }
    },
    "STU-002": {
      "id": "STU-002",
      "name": "John Smith",
      "email": "john@example.com",
      "registered_at": "2026-07-15T09:05:00Z",
      "metadata": { "group": "cohorte-2026", "role": "student" }
    }
  },
  "groups": {
    "cohorte-2026": ["STU-001", "STU-002"]
  }
}
```

**How it works:**
1. Admin pre-registers participants (or participants register on first use)
2. When a participant starts a quiz, their ID is looked up in the registry
3. If found, name/email are auto-filled (participant confirms or updates)
4. If not found, participant is prompted for info and auto-registered
5. All subsequent sessions reuse the registered info

### Result Schema — Live Quiz

```json
{
  "session_id": "q-2026-07-15-a1b2c3",
  "date": "2026-07-15T10:00:00Z",
  "mode": "live",
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "difficulty": "easy",
  "participant": {
    "id": "STU-001",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "questions": [
    { "id": "js-001", "type": "single", "selected": [1], "correct": true },
    { "id": "js-002", "type": "single", "selected": [1], "correct": false }
  ],
  "score": { "correct": 1, "total": 2, "percentage": 50 },
  "evaluated": true,
  "sent": false
}
```

### Result Schema — Practice

```json
{
  "session_id": "p-2026-07-15-d4e5f6",
  "date": "2026-07-15T10:00:00Z",
  "mode": "practice",
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "difficulty": "easy",
  "participant": {
    "id": "STU-001",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "questions": [
    { "id": "js-001", "type": "single", "selected": [1], "correct": true },
    { "id": "js-002", "type": "single", "selected": [1], "correct": false }
  ],
  "score": { "correct": 1, "total": 2, "percentage": 50 }
}
```

**Practice vs Live differences:**
- Practice: `mode: "practice"`, no `evaluated`/`sent` fields, saved to `results/<bank>/p-*.json`
- Live: `mode: "live"`, has `evaluated`/`sent` fields, saved to `results/<bank>/q-*.json`

### Result Schema — Survey

```json
{
  "session_id": "s-2026-07-15-j0k1l2",
  "date": "2026-07-15T10:00:00Z",
  "mode": "survey",
  "bank": "feedback-survey.json",
  "bank_version": "1.0.0",
  "participant": {
    "id": "STU-001",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "questions": [
    { "id": "srv-001", "type": "survey", "selected": [2] }
  ]
}
```

### Session ID Format

| Mode | Prefix | Example |
|------|--------|---------|
| Live quiz | `q-` | `q-2026-07-15-a1b2c3` |
| Practice | `p-` | `p-2026-07-15-d4e5f6` |
| Survey | `s-` | `s-2026-07-15-j0k1l2` |

Format: `<prefix>YYYY-MM-DD-xxxxxx` (random 6-char hex suffix)

### Result Index (`quiz/results/_index.json`)

Fast lookup file updated on every save. Avoids scanning all result files.

```json
{
  "sessions": {
    "q-2026-07-15-a1b2c3": {
      "participant_id": "STU-001",
      "bank": "javascript.json",
      "mode": "live",
      "date": "2026-07-15T10:00:00Z",
      "file": "javascript/q-2026-07-15-a1b2c3.json"
    },
    "p-2026-07-15-d4e5f6": {
      "participant_id": "STU-001",
      "bank": "javascript.json",
      "mode": "practice",
      "date": "2026-07-15T09:30:00Z",
      "file": "javascript/p-2026-07-15-d4e5f6.json"
    }
  },
  "by_participant": {
    "STU-001": ["q-2026-07-15-a1b2c3", "p-2026-07-15-d4e5f6"]
  },
  "by_bank": {
    "javascript.json": ["q-2026-07-15-a1b2c3", "p-2026-07-15-d4e5f6"]
  }
}
```

---

## Security Model

| Role | Access | Sees |
|------|--------|------|
| **Taker (practice)** | `question` tool, key loaded ephemerally | Questions + options + immediate feedback (correct + explanation). Result saved as practice. |
| **Taker (live)** | `question` tool during session only | Questions + options. Their own score after. Never explanations during. Result saved as live. |
| **Admin** | `quiz-admin` agent, `quiz/banks/`, `quiz/keys/`, `quiz/results/` | Everything: banks, keys, results, reports, practice vs live distinction |

**Invariants:**
- Bank files contain zero answer data — safe to share with anyone
- Key files are encrypted at rest (SOPS/age), gitignored, never committed
- Practice sessions: key loaded into memory for scoring, discarded after session; result file saved (no explanations in file)
- Result files store `selected` + `correct` (boolean) — never the correct answer index
- All results committed to GitHub repo (plain JSON, encrypted keys are separate)
- Emails to participants contain only their own score — never other participants' data
- Participant ID is mandatory for all modes — enables deduplication and tracking

---

## GitHub Submission Workflow

All quiz results are committed to the GitHub repository. Here's how it works:

### Result File Lifecycle

```
1. Participant takes quiz (practice or live)
         │
2. run-quiz.js saves result to quiz/results/<bank>/<session>.json
         │
3. results.js runs (if exists):
   ├── Encrypts quiz/keys/ (not results)
   ├── git add quiz/results/
   ├── git commit -m "chore(quiz): add results <session>"
   └── git push (optional)
```

### Result File Naming

```
quiz/results/
  javascript/
    q-2026-07-15-a1b2c3.json    # Live quiz
    p-2026-07-15-d4e5f6.json    # Practice
  python/
    q-2026-07-16-g7h8i9.json
  survey/
    s-2026-07-17-j0k1l2.json
```

### Git Commit Convention

```
chore(quiz): add results q-2026-07-15-a1b2c3
chore(quiz): add results p-2026-07-15-d4e5f6
chore(quiz): add results s-2026-07-17-j0k1l2
```

### What's Committed vs What's Not

| Path | Committed | Reason |
|------|-----------|--------|
| `quiz/banks/*.json` | ✅ Yes | Shareable, no answers |
| `quiz/results/**/*.json` | ✅ Yes | Participant outcomes, plain JSON |
| `quiz/keys/*.json` | ❌ No | Answer keys, encrypted, gitignored |
| `quiz/templates/*.html` | ✅ Yes | Email templates |

### Admin Report After Git Pull

Admins can generate reports at any time:
```bash
git pull
node quiz/cli/admin-report.js --bank javascript.json
```

The report reads all result files from `quiz/results/<bank>/` and aggregates stats.

---

## User Manuals

### Participant Manual (`quiz/manuals/participant.md`)

Step-by-step guide for quiz takers:

```
# How to Take a Quiz

## First Time Setup
1. Open opencode in the project directory
2. The agent will ask for your participant ID (student number, employee ID, etc.)
3. Enter your ID when prompted
4. Enter your name when prompted
5. Enter your email (optional, needed for result delivery)
6. You are now registered — your info will be reused in future sessions

## Taking a Practice Quiz
1. Type /quiz-practice
2. Select the topic (bank) you want to practice
3. Select difficulty (easy, medium, hard) or leave blank for all
4. Select how many questions (or all)
5. Answer each question — you'll get immediate feedback
6. At the end, review your score and explanations
7. Practice as many times as you want

## Taking a Live Quiz
1. Type /quiz-run
2. Confirm your identity (ID + name will be auto-filled from registry)
3. Select the topic (bank)
4. Select difficulty and count
5. Answer all questions — no feedback during the quiz
6. At the end, see your final score
7. Results are saved and submitted to the admin

## Taking a Survey
1. Type /quiz-run
2. Confirm your identity
3. Select the survey bank
4. Answer all questions
5. Thank you — your responses have been recorded
```

### Admin Manual (`quiz/manuals/admin.md`)

Complete system setup and management guide:

```
# Quiz System Admin Guide

## Initial Setup (one-time)
1. Create banks: /quiz-create → add questions
2. Create keys: node quiz/cli/create-key.js --bank banks/topic.json
3. Encrypt keys: node quiz/cli/encrypt-key.js keys/topic.json
4. Register participants: /quiz-register (single or CSV bulk import)
5. Push to GitHub: git add . && git commit -m "feat(quiz): initial setup"

## Daily Operations
### Before a Quiz Session
1. git pull (get latest banks and participant list)
2. Verify bank is ready: node quiz/cli/validate-bank.js banks/topic.json
3. Verify key exists: ls quiz/keys/topic.json

### During a Quiz Session
1. Participants take the quiz via /quiz-run
2. Results are auto-saved to quiz/results/<bank>/
3. Results are auto-committed to GitHub

### After a Quiz Session
1. git pull (get all new results)
2. Generate report: /quiz-report → select bank
3. Review per-question stats and participant scores
4. Send results: /quiz-send → select bank → confirm recipients
5. Export CSV if needed: node quiz/cli/admin-report.js --bank topic.json --csv report.csv

## Participant Management
### Pre-register from CSV
1. Create CSV with columns: id, name, email, group
2. Run: /quiz-register → import from CSV
3. Verify: node quiz/cli/manage-participants.js --list

### View Participant History
1. node quiz/cli/manage-participants.js --history STU-001
2. Shows all attempts, scores, and progress

### Filter Results by Participant
1. node quiz/cli/admin-report.js --participant STU-001
2. Shows all sessions for that participant across all banks

## Bulk Operations
### Bulk Send Results
1. /quiz-send → select bank → --all flag
2. Sends email to all participants with results for that bank

### Bulk Evaluate
1. node quiz/cli/evaluate.js --bank javascript.json --all
2. Evaluates all unevaluated sessions for that bank
```

### Quick Reference (`quiz/manuals/quick-reference.md`)

```
# Quiz System — Quick Reference

## Commands
/quiz-create      Create a new bank
/quiz-register    Register participants
/quiz-practice    Practice quiz (with feedback)
/quiz-run         Live quiz (results saved)
/quiz-report      Admin report
/quiz-send        Send results email
/quiz-migrate     Migrate legacy bank

## File Locations
quiz/banks/       Question banks (shareable)
quiz/keys/        Answer keys (admin-only, encrypted)
quiz/results/     Session results (committed)
quiz/participants.json  Participant registry
quiz/manuals/     Documentation

## Participant Flow
1. /quiz-register (admin) or auto-register on first /quiz-run
2. /quiz-practice (optional)
3. /quiz-run (submit)
4. /quiz-send (admin sends results)

## Admin Flow
1. /quiz-create → add questions
2. create-key → encrypt-key
3. /quiz-register → import participants
4. git push
5. Wait for participants
6. git pull → /quiz-report → /quiz-send
```

### Bank & Key Data (migrated from `bank.json`)

| File | Source |
|------|--------|
| `quiz/banks/javascript.json` | Migrated from bank.json (js-001, js-002, js-003) |
| `quiz/banks/python.json` | Migrated from bank.json (py-001, py-002) |
| `quiz/banks/git.json` | Migrated from bank.json (git-001, git-002) |
| `quiz/banks/bash.json` | Migrated from bank.json (bash-001, bash-002) |
| `quiz/banks/feedback-survey.json` | New example survey |
| `quiz/keys/javascript.json` | Extracted answers (js-001, js-002, js-003) |
| `quiz/keys/python.json` | Extracted answers (py-001, py-002) |
| `quiz/keys/git.json` | Extracted answers (git-001, git-002) |
| `quiz/keys/bash.json` | Extracted answers (bash-001, bash-002) |
| `quiz/participants.json` | Empty initial participant registry |
| `quiz/results/_index.json` | Empty initial session index |

### Modules

| File | Purpose |
|------|---------|
| `quiz/lib/schema.js` | loadBank, loadKey, validateBank, validateKey, listBanks, listKeys |
| `quiz/lib/scorer.js` | scoreSingle, scoreMultiple, scoreSurvey, calculateResults |
| `quiz/lib/session.js` | createSession, saveResult, loadResult, generateId, listByParticipant, listByBank |
| `quiz/lib/participant.js` | registerParticipant, findParticipant, listParticipants, importCSV, updateParticipant, getHistory |
| `quiz/lib/admin-report.js` | aggregateResults, perQuestionStats, distribution, participantHistory, formatReport |
| `quiz/lib/mailer.js` | formatQuizEmail, formatSurveyEmail, buildEmailPayload |

### CLI Scripts

| File | Purpose |
|------|---------|
| `quiz/cli/create-bank.js` | Scaffold new bank JSON |
| `quiz/cli/add-question.js` | Add question to bank interactively or via flags |
| `quiz/cli/validate-bank.js` | Validate bank schema and structure |
| `quiz/cli/migrate-bank.js` | Split legacy bank.json → bank + key |
| `quiz/cli/create-key.js` | Create or edit answer key |
| `quiz/cli/validate-key.js` | Cross-validate key against bank |
| `quiz/cli/encrypt-key.js` | SOPS/age encrypt key file |
| `quiz/cli/run-quiz.js` | Interactive runner — `--practice` or `--live` flag, bank selection, filtering |
| `quiz/cli/evaluate.js` | Score session against key |
| `quiz/cli/admin-report.js` | Generate aggregate admin report |
| `quiz/cli/send-results.js` | Send results email to participants |
| `quiz/cli/manage-participants.js` | Participant CRUD, bulk CSV import, group management |

### Skills

| File | Purpose |
|------|---------|
| `.opencode/skills/quiz-bank/SKILL.md` | Bank creation and management workflow |
| `.opencode/skills/quiz-key/SKILL.md` | Answer key management workflow |
| `.opencode/skills/quiz-participant/SKILL.md` | Participant registration and management workflow |
| `.opencode/skills/quiz-admin/SKILL.md` | Admin reports and evaluation workflow |
| `.opencode/skills/quiz-results/SKILL.md` | Result delivery workflow |

### Manuals

| File | Purpose |
|------|---------|
| `quiz/manuals/participant.md` | Step-by-step guide for quiz takers |
| `quiz/manuals/admin.md` | Complete admin setup and management guide |
| `quiz/manuals/quick-reference.md` | Quick reference card for both roles |

### Templates

| File | Purpose |
|------|---------|
| `quiz/templates/quiz-results.html` | Default quiz result email (HTML) |
| `quiz/templates/survey-thanks.html` | Default survey thank-you email (HTML) |

### Tests

| File | Purpose |
|------|---------|
| `quiz/tests/schema.test.js` | Bank + key loading and validation |
| `quiz/tests/scorer.test.js` | Single, multiple, survey scoring |
| `quiz/tests/session.test.js` | Session creation, ID gen, persistence, practice vs live |
| `quiz/tests/participant.test.js` | Participant registry CRUD, bulk import, lookup |

## Files to Modify

| File | Change |
|------|--------|
| `quiz/bank.json` | Keep as-is; deprecated comment at top |
| `quiz/results.js` | Support v2 schema, bank-based lookups, practice mode, auto-commit results to GitHub |
| `.opencode/skills/quiz/SKILL.md` | Rewrite: multi-bank, survey, practice + live, participant collection |
| `.gitignore` | Add `quiz/keys/` |
| `opencode.json` | Add `quiz-admin` agent, add 7 new commands |
| `AGENTS.md` | Add quiz-admin agent, new skills, new scripts, new commands |

---

## Decisions

1. **Banks are shareable by design** — zero answer data in bank files. Core security invariant.

2. **Keys are separate files** — `quiz/keys/<topic>.json` maps IDs → correct + explanation. Encrypted, gitignored.

3. **No `secure.js` needed** — banks never have answers, so nothing to strip before presenting.

4. **Multiple banks, not one** — each topic is independent. Surveys get their own bank files without keys.

5. **Result files don't leak answers** — `selected` + `correct` boolean only. Never the correct index.

6. **Practice results ARE saved** — both practice and live sessions produce result files, distinguished by `mode` field. Practice results are tracked for participant history but are not evaluable or emailable.

7. **Participant ID mandatory for ALL modes** — practice and live both require name + ID. Enables deduplication, attempt tracking, and per-participant history.

8. **Results committed to GitHub** — all `quiz/results/` files are committed to the repo. The `results.js` script handles SOPS encryption of key files (not result files) and auto-commit. Result files are plain JSON.

9. **Results organized by bank** — `quiz/results/<bank>/` subdirectories prevent flat-file chaos. Naming: `<prefix>YYYY-MM-DD-xxxxxx.json`.

10. **Email via existing `send-email.js`** — `quiz-results` skill wraps the email skill. No new SMTP code. Falls back gracefully if SMTP not configured.

11. **New `quiz-admin` agent** — dedicated primary agent with full edit/bash permissions for quiz lifecycle. Separates concerns from `build`.

12. **6 new commands** — `/quiz-create`, `/quiz-practice`, `/quiz-run`, `/quiz-report`, `/quiz-send`, `/quiz-migrate`.

13. **Practice → Live workflow** — users are encouraged to practice first, then go live when ready. Both commands require participant identification.

14. **Bank versioning** — banks have a `version` field. Results reference the bank version they were taken against, ensuring historical accuracy when banks are updated.

15. **Multiple attempts allowed** — participants can take the same quiz multiple times. All attempts stored. Admin reports can show attempt history per participant.

16. **Question/option randomization** — configurable per bank via `randomize: { questions: true, options: false }`. Defaults to no randomization.

17. **Backward migration** — existing `bank.json` split into 4 banks + 4 keys. Original kept as reference.

18. **No new npm dependencies** — Node.js built-ins only. Email via existing `send-email.js` script.

19. **Session IDs** — `q-` (live quiz), `p-` (practice), `s-` (survey) + `YYYY-MM-DD-xxxxxx`.

20. **Participant registry is the source of truth** — `quiz/participants.json` stores all participant profiles. When a participant is identified once, their info is saved and reused. Auto-registration on first use.

21. **Result index for fast lookups** — `quiz/results/_index.json` maps session IDs to participant IDs and banks. Updated on every save. Avoids scanning hundreds of result files.

22. **User manuals are part of the deliverable** — participant guide, admin guide, and quick reference card. Not optional documentation.

23. **Bulk operations for scale** — CSV import for participants, bulk send for results, bulk evaluate for sessions. Designed for many participants.

---

## TDD Flow

### Phase 1: Schema & Scoring (RED → GREEN → REFACTOR)

1. Write `quiz/tests/schema.test.js` — bank loading, key loading, validation, missing key, type checks
   - FAIL: no `lib/schema.js`
2. Implement `quiz/lib/schema.js` — loadBank, loadKey, validateBank, validateKey, listBanks
   - PASS
3. Refactor: extract constants for question types and required fields

4. Write `quiz/tests/scorer.test.js` — single, multiple, survey scoring, edge cases
   - FAIL: no `lib/scorer.js`
5. Implement `quiz/lib/scorer.js` — scoreSingle, scoreMultiple, scoreSurvey, calculateResults
   - PASS

### Phase 2: Session, Participants & Reports (RED → GREEN → REFACTOR)

6. Write `quiz/tests/session.test.js` — session creation, ID generation, save/load, practice vs live modes
   - FAIL: no `lib/session.js`
7. Implement `quiz/lib/session.js` — createSession, saveResult, loadResult, generateId, listByParticipant, listByBank
   - PASS

8. Write `quiz/tests/participant.test.js` — registry CRUD, bulk import, auto-register, lookup
   - FAIL: no `lib/participant.js`
9. Implement `quiz/lib/participant.js` — registerParticipant, findParticipant, listParticipants, importCSV
   - PASS

10. Implement `quiz/lib/admin-report.js` — aggregateResults, perQuestionStats, distribution
    - Manual verification

### Phase 3: CLI Scripts

11. Implement `quiz/cli/create-bank.js`
12. Implement `quiz/cli/add-question.js`
13. Implement `quiz/cli/validate-bank.js`
14. Implement `quiz/cli/migrate-bank.js` — split legacy bank.json
15. Implement `quiz/cli/create-key.js`
16. Implement `quiz/cli/validate-key.js`
17. Implement `quiz/cli/encrypt-key.js`
18. Implement `quiz/cli/manage-participants.js`
19. Implement `quiz/cli/run-quiz.js`
20. Implement `quiz/cli/evaluate.js`
21. Implement `quiz/cli/admin-report.js`
22. Implement `quiz/cli/send-results.js`
23. Implement `quiz/lib/mailer.js`

### Phase 4: Migration & Data

21. Migrate `quiz/bank.json` → 4 bank files + 4 key files
22. Create `quiz/banks/feedback-survey.json`
23. Create `quiz/templates/quiz-results.html`
24. Create `quiz/templates/survey-thanks.html`
25. Update `quiz/results.js` — v2 schema
26. Update `.gitignore` — add `quiz/keys/`

### Phase 5: Skills, Agents, Commands & Manuals

28. Create `.opencode/skills/quiz-bank/SKILL.md`
29. Create `.opencode/skills/quiz-key/SKILL.md`
30. Create `.opencode/skills/quiz-participant/SKILL.md`
31. Create `.opencode/skills/quiz-admin/SKILL.md`
32. Create `.opencode/skills/quiz-results/SKILL.md`
33. Update `.opencode/skills/quiz/SKILL.md` — practice + live + survey workflows
34. Add `quiz-admin` agent to `opencode.json`
35. Add 7 new commands to `opencode.json`
36. Create `quiz/manuals/participant.md`
37. Create `quiz/manuals/admin.md`
38. Create `quiz/manuals/quick-reference.md`
39. Update `AGENTS.md`

### Phase 6: Integration & Polish

40. Manual end-to-end: `/quiz-create` → add questions → create key → encrypt
41. Manual end-to-end: `/quiz-register` → register participants (single + CSV)
42. Manual end-to-end: `/quiz-practice` → identify participant → answer → feedback → result saved
43. Manual end-to-end: `/quiz-run` → identify participant → answer → result saved
44. Manual end-to-end: `/quiz-report` → aggregate stats (practice + live separated)
45. Manual end-to-end: `/quiz-send` → email delivered
46. Verify: participant auto-register on first use, reused on subsequent sessions
47. Verify: same participant takes quiz twice → both attempts in history
48. Verify: results committed to GitHub → `git log` shows result files
49. Verify: `_index.json` updated on every save
50. Verify: manuals are accurate and complete
51. Run all tests: `node --test quiz/tests/*.test.js`
52. Validate all banks: `node quiz/cli/validate-bank.js quiz/banks/*.json`

---

## Verification

- [ ] `node --test quiz/tests/schema.test.js` — all pass
- [ ] `node --test quiz/tests/scorer.test.js` — all pass
- [ ] `node --test quiz/tests/session.test.js` — all pass
- [ ] `node --test quiz/tests/participant.test.js` — all pass
- [ ] Bank files contain NO `correct` or `explanation` fields
- [ ] Key files exist only in `quiz/keys/`, encrypted, gitignored
- [ ] `quiz/keys/` in `.gitignore` — never committed
- [ ] `/quiz-create` scaffolds valid bank with version field
- [ ] `/quiz-register` registers single participant and bulk CSV import
- [ ] Participant auto-registers on first `/quiz-run` if not in registry
- [ ] Participant info reused on subsequent sessions
- [ ] `/quiz-practice` collects participant ID, runs with feedback, saves to `results/<bank>/p-*.json`
- [ ] `/quiz-run` identifies participant, saves to `results/<bank>/q-*.json`
- [ ] Both modes require participant identification before starting
- [ ] Same participant can take quiz multiple times — all attempts in history
- [ ] `_index.json` updated on every save — fast lookup works
- [ ] `/quiz-report` shows practice vs live sessions separately, per-participant history
- [ ] `/quiz-send` sends email via SMTP (graceful fallback if not configured)
- [ ] `/quiz-migrate` splits legacy bank.json correctly
- [ ] Results committed to GitHub repo via `results.js` auto-commit
- [ ] `opencode.json` has `quiz-admin` agent and 7 new commands
- [ ] `AGENTS.md` updated with all new components
- [ ] `quiz/manuals/participant.md` — accurate and complete
- [ ] `quiz/manuals/admin.md` — accurate and complete
- [ ] `quiz/manuals/quick-reference.md` — accurate and complete
- [ ] Cross-platform: macOS + Windows (Node.js only)
