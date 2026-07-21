# Interactive Tutorials Module

## Objective

Create a full interactive tutorial system — engaging, branching, gamified learning experiences rendered through TUI plugins, custom tools, skills, and commands, with session tracking and completion registry.

---

## How Tutorials Feel (The Experience)

### Example: "Git Fundamentals" Tutorial

```
┌─────────────────────────────────────────────────────┐
│  TUTORIAL: Git Fundamentals          Step 3/12  ███░│
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  25%   ⏱ 3 min     │
└─────────────────────────────────────────────────────┘

  ┌─ STEP 3: The Staging Area ─────────────────────┐
  │                                                 │
  │  Before committing, you add files to the        │
  │  staging area. Think of it as a "dress rehearsal"│
  │  for your commit.                               │
  │                                                 │
  │  ┌─ TRY IT ──────────────────────────────────┐  │
  │  │ $ git add file.txt                        │  │
  │  │ $ git commit -m "Add file"                │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  └─────────────────────────────────────────────────┘

  What does `git add` do?
  ○ Sends code to GitHub
  ● Adds files to the staging area  ← CORRECT! +10 XP
  ○ Deletes the file
  ○ Creates a new branch

  ┌─────────────────────────────────────────────────┐
  │  Score: 2/2 (100%)  │  XP: 30  │  🔥 Streak: 2  │
  └─────────────────────────────────────────────────┘
```

### 5-15 Minute Flow

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **Intro** | 30s | Welcome, topic overview, estimated time |
| **Learn** | 3-8 min | Content steps with examples, code blocks |
| **Practice** | 2-5 min | Questions, challenges, exercises |
| **Branch** | 0-2 min | User chooses depth/path |
| **Summary** | 30s | Score, achievements, next tutorial suggestions |

---

## What Makes Them Engaging

### 7 Step Types

| Type | Purpose | TUI Resource |
|------|---------|--------------|
| `content` | Teach concept with text + visuals | Agent output (ASCII art, tables, code blocks) |
| `question` | Knowledge check | `question` tool (multiple choice) |
| `choice` | Branching path | `question` tool (user picks direction) |
| `code` | Show runnable example | `bash` tool (user runs it) |
| `challenge` | Hands-on exercise | `bash` + `read`/`write` tools |
| `scenario` | Story-driven decision | `question` tool + narrative |
| `checkpoint` | Mini-quiz gate | `question` tool (must pass to continue) |

### Gamification

| Element | How It Works |
|---------|--------------|
| **XP System** | +10 correct answer, +5 code run, +20 challenge complete |
| **Streak Counter** | Consecutive correct answers (bonus XP at 3, 5, 10) |
| **Progress Bar** | Real-time step/percentage in TUI plugin |
| **Achievements** | "First Tutorial", "Perfect Score", "Speed Learner" |
| **Adaptive Difficulty** | If streak > 3, offer harder questions; if wrong 2x, simplify |

### Branching Paths

```json
{
  "id": "step-005",
  "type": "choice",
  "question": "Want to go deeper?",
  "options": [
    { "label": "Advanced: Git rebase", "goto": "step-006a", "xp_bonus": 5 },
    { "label": "Standard: Git merge", "goto": "step-006b" },
    { "label": "Skip to quiz", "goto": "step-010" }
  ]
}
```

### Real-World Scenarios

```json
{
  "id": "step-008",
  "type": "scenario",
  "title": "The Merge Conflict",
  "narrative": "Your teammate edited the same file. Git is asking you to resolve a conflict. What do you do?",
  "options": [
    { "label": "Accept theirs", "correct": false, "feedback": "That loses your work!" },
    { "label": "Accept yours", "correct": false, "feedback": "That loses their work!" },
    { "label": "Edit the file manually", "correct": true, "feedback": "Smart! You keep both changes." },
    { "label": "Abort the merge", "correct": false, "feedback": "That just delays the problem." }
  ]
}
```

---

## TUI Resources Used

### 1. TUI Plugin (`tutorial-progress.tsx`)

Renders persistent visual elements in the terminal:

```typescript
// Progress bar at bottom of TUI
// Shows: tutorial name, step X/Y, percentage, timer, XP, streak
// Uses: @opentui/solid (box, text, useTerminalDimensions)
// Slots: tui.prompt.append (injects below input area)
```

**What it renders:**
- Progress bar with percentage
- Step counter (Step 3/12)
- Timer (elapsed / estimated)
- XP counter and streak flame
- Achievement badges

### 2. Custom Tool (`tutorial`)

Agent-callable tool for tutorial engine:

```typescript
// Actions: start, get_step, answer, next, status, complete
// Returns: formatted content, step data, score, progress
// Uses: tutorial/lib/session.js, tutorial/lib/schema.js
```

**What it does:**
- Loads tutorial content and tracks state
- Formats step content for TUI display
- Validates answers against key
- Calculates XP and streaks
- Saves session progress

### 3. Question Tool

Used for all interactive checkpoints:
- `question` tool with `custom: false` (no free text)
- Options randomized for questions
- Labels for answer comparison
- Multi-select for some challenges

### 4. Bash Tool

Used for code exercises:
- User runs actual commands
- Agent validates output
- Real terminal experience

### 5. Read/Write Tools

Used for coding challenges:
- User creates/modifies files
- Agent checks correctness
- Real code editing experience

### 6. Toast Notifications

Via plugin `tui.toast.show`:
- "Achievement unlocked!" popups
- "Streak bonus!" celebrations
- "Tutorial complete!" confetti

### 7. Agent Output

The agent itself renders rich content:
- ASCII diagrams and flowcharts
- Code blocks with syntax highlighting (via markdown)
- Tables for comparisons
- Emoji and formatting for engagement

---

## Concrete Example: Taking a Tutorial

### Step 1: Start

```
User: /tutorial
Agent: [loads tutorial skill]

  ┌─────────────────────────────────────────┐
  │  Available Tutorials                    │
  │                                         │
  │  [1] Git Fundamentals      ⏱ 10 min    │
  │  [2] Python Basics          ⏱ 15 min    │
  │  [3] JavaScript Async       ⏱ 12 min    │
  └─────────────────────────────────────────┘

Agent: Which tutorial? (question tool)
User: Git Fundamentals
Agent: [loads tutorial, starts session]

  Welcome to Git Fundamentals!
  Duration: ~10 minutes
  Steps: 12 (8 learn, 3 quiz, 1 challenge)
  
  Ready? Type "next" or pick a step.
```

### Step 2: Content

```
Agent: [renders step content with ASCII art]

  ┌─ WHAT IS GIT? ─────────────────────────────────┐
  │                                                 │
  │    Working    ┌─────┐    Remote                 │
  │    Copy  ──►  │ Git │  ◄── Repository           │
  │              └─────┘                            │
  │                │                                │
  │           ┌────┴────┐                           │
  │           │  Local  │                           │
  │           │   Repo  │                           │
  │           └─────────┘                           │
  │                                                 │
  │  Git tracks changes in your code over time.     │
  │  Every developer has a full copy of history.    │
  └─────────────────────────────────────────────────┘

Agent: [question tool]
  What does Git track?
  ○ File sizes
  ● Changes in code
  ○ Internet speed
  ○ Database queries
```

### Step 3: Code Exercise

```
Agent: [renders code block]

  ┌─ TRY IT YOURSELF ──────────────────────────────┐
  │                                                 │
  │  Create a new Git repository:                   │
  │                                                 │
  │  $ mkdir my-project && cd my-project            │
  │  $ git init                                     │
  │                                                 │
  │  You should see: "Initialized empty Git repo"   │
  └─────────────────────────────────────────────────┘

Agent: Run these commands and tell me what you see.
       (question tool - free text for output)

User: [runs commands in terminal]
      Initialized empty Git repository in /path/.git/

Agent: [validates output]
  ✅ Perfect! You just created your first Git repo.
  +5 XP
```

### Step 4: Branching Choice

```
Agent: [question tool]
  Want to go deeper?
  ● Branching (advanced)  → 3 more steps
  ○ Merging (standard)    → 2 more steps  
  ○ Skip to quiz          → jump to final test

User: Branching

Agent: [follows goto to advanced path]
  Great! Let's dive into branches...
```

### Step 5: Scenario

```
Agent: [renders scenario]

  ┌─ SCENARIO: THE MERGE CONFLICT ─────────────────┐
  │                                                 │
  │  You and your teammate both edited README.md.   │
  │  Git shows:                                     │
  │                                                 │
  │  <<<<<<< HEAD                                   │
  │  Your version                                   │
  │  =======                                        │
  │  Their version                                  │
  │  >>>>>>> branch-name                            │
  │                                                 │
  │  What do you do?                                │
  └─────────────────────────────────────────────────┘

Agent: [question tool]
  ○ Accept theirs
  ○ Accept yours
  ● Edit the file manually
  ○ Abort the merge
```

### Step 6: Completion

```
Agent: [saves session, shows results]

  ╔═════════════════════════════════════════════════╗
  ║  TUTORIAL COMPLETE!                             ║
  ║                                                 ║
  ║  Git Fundamentals                               ║
  ║  Duration: 8 min 32 sec                         ║
  ║                                                 ║
  ║  Score: 10/12 (83%)                             ║
  ║  XP Earned: 120                                 ║
  ║  Best Streak: 5 🔥                              ║
  ║                                                 ║
  ║  Achievements:                                  ║
  ║  🏆 First Tutorial Complete                     ║
  ║  🔥 On Fire (3+ streak)                         ║
  ║  💻 Code Runner (ran all exercises)             ║
  ║                                                 ║
  ║  Next: Git Branching (intermediate)             ║
  └─────────────────────────────────────────────────┘
```

---

## Architecture

### Tutorial Content Format (tutorials/banks/*.json)

```json
{
  "name": "Git Fundamentals",
  "description": "Learn Git basics interactively",
  "version": "1.0.0",
  "type": "tutorial",
  "difficulty": "easy",
  "duration_estimate": 10,
  "xp_per_correct": 10,
  "xp_per_code_run": 5,
  "xp_per_challenge": 20,
  "steps": [
    {
      "id": "intro",
      "type": "content",
      "title": "Welcome!",
      "body": "In this tutorial you'll learn Git basics...",
      "visual": "git-branching-diagram"
    },
    {
      "id": "q-001",
      "type": "question",
      "question": "What does Git track?",
      "options": [
        { "label": "File sizes" },
        { "label": "Changes in code" },
        { "label": "Internet speed" }
      ],
      "difficulty": "easy",
      "hint": "Think about what developers care about"
    },
    {
      "id": "choice-001",
      "type": "choice",
      "question": "Choose your path:",
      "options": [
        { "label": "Branching (advanced)", "goto": "branch-001", "xp_bonus": 5 },
        { "label": "Merging (standard)", "goto": "merge-001" },
        { "label": "Skip to quiz", "goto": "quiz-001" }
      ]
    },
    {
      "id": "code-001",
      "type": "code",
      "title": "Create a Repository",
      "body": "Run these commands:",
      "code": "mkdir my-project && cd my-project\ngit init",
      "language": "bash",
      "expected_output": "Initialized empty Git repository"
    },
    {
      "id": "challenge-001",
      "type": "challenge",
      "title": "Your First Commit",
      "instructions": "Create a file called hello.txt with 'Hello Git' and commit it.",
      "validation": {
        "check_file_exists": "hello.txt",
        "check_content_contains": "Hello Git",
        "check_git_log": true
      },
      "xp_reward": 20
    },
    {
      "id": "scenario-001",
      "type": "scenario",
      "title": "The Merge Conflict",
      "narrative": "Your teammate edited the same file...",
      "options": [
        { "label": "Accept theirs", "correct": false, "feedback": "That loses your work!" },
        { "label": "Edit manually", "correct": true, "feedback": "Smart! Keep both changes." }
      ]
    },
    {
      "id": "checkpoint-001",
      "type": "checkpoint",
      "question": "Quick check: What command stages files?",
      "options": [
        { "label": "git stage" },
        { "label": "git add" },
        { "label": "git commit" }
      ],
      "min_score_to_pass": 1,
      "fail_message": "Review the staging section and try again."
    }
  ]
}
```

### Step Types Reference

| Type | Fields | TUI Resources | Scoring |
|------|--------|---------------|---------|
| `content` | `title`, `body`, `visual` | Agent output, ASCII art | None |
| `question` | `question`, `options`, `hint` | `question` tool | +10 XP |
| `choice` | `question`, `options` with `goto` | `question` tool | +5 XP |
| `code` | `title`, `body`, `code`, `expected_output` | Agent + `bash` tool | +5 XP |
| `challenge` | `instructions`, `validation` | `bash`, `read`, `write` | +20 XP |
| `scenario` | `narrative`, `options` with `feedback` | Agent output + `question` | +10 XP |
| `checkpoint` | `question`, `options`, `min_score_to_pass` | `question` tool | Gate |

### Answer Key (tutorials/keys/*.json)

```json
{
  "bank": "git-fundamentals.json",
  "bank_version": "1.0.0",
  "answers": {
    "q-001": { "correct": "Changes in code", "explanation": "Git tracks changes, not files." },
    "checkpoint-001": { "correct": "git add", "explanation": "git add stages files." }
  }
}
```

### Session (tutorials/sessions/*.json)

```json
{
  "session_id": "t-2026-07-20-a1b2c3",
  "date": "2026-07-20T10:00:00Z",
  "tutorial": "git-fundamentals.json",
  "tutorial_version": "1.0.0",
  "participant": { "id": "STU-001", "name": "Jane Doe" },
  "steps_completed": ["intro", "q-001", "code-001"],
  "current_step": "choice-001",
  "answers": {
    "q-001": { "selected": "Changes in code", "correct": true }
  },
  "xp_earned": 30,
  "streak_current": 2,
  "streak_best": 3,
  "achievements": ["first_question"],
  "score": { "correct": 1, "total": 1, "percentage": 100 },
  "started_at": "2026-07-20T10:00:00Z",
  "completed_at": null,
  "duration_seconds": 0,
  "completed": false
}
```

### Registry (tutorials/registry.json)

```json
{
  "STU-001": {
    "git-fundamentals.json": {
      "completed": true,
      "session_id": "t-2026-07-20-a1b2c3",
      "date": "2026-07-20T10:08:32Z",
      "score_percentage": 83,
      "xp_earned": 120,
      "achievements": ["first_tutorial", "on_fire", "code_runner"]
    }
  }
}
```

### Directory Structure

```
tutorials/
├── banks/              # Tutorial content (safe to share)
├── keys/               # Answer keys (admin-only, gitignored)
├── sessions/           # Session results (committed)
│   └── _index.json
├── lib/
│   ├── schema.js       # Load/validate tutorials
│   ├── session.js      # Session management
│   ├── registry.js     # Completion tracking
│   └── xp.js           # XP and achievements engine
├── cli/
│   ├── create-tutorial.js
│   ├── add-step.js
│   └── validate-tutorial.js
└── registry.json
```

### Files to Create

| File | Purpose |
|------|---------|
| `tutorials/banks/.gitkeep` | Directory placeholder |
| `tutorials/keys/.gitkeep` | Directory placeholder |
| `tutorials/sessions/_index.json` | Empty index `{"sessions":[],"by_participant":{},"by_tutorial":{}}` |
| `tutorials/registry.json` | Empty registry `{}` |
| `tutorials/lib/schema.js` | Load/validate tutorial banks and keys |
| `tutorials/lib/session.js` | Session creation, save, load, index |
| `tutorials/lib/registry.js` | Track who completed tutorials |
| `tutorials/lib/xp.js` | XP calculation, streaks, achievements |
| `tutorials/cli/create-tutorial.js` | Scaffold new tutorial JSON |
| `tutorials/cli/add-step.js` | Add step to tutorial |
| `tutorials/cli/validate-tutorial.js` | Validate tutorial + key |
| `.opencode/skills/tutorial/SKILL.md` | Run tutorials interactively |
| `.opencode/skills/tutorial-create/SKILL.md` | Create/manage tutorials |
| `.opencode/skills/tutorial-admin/SKILL.md` | Reports and registry |
| `.opencode/commands/tutorial.md` | /tutorial command |
| `.opencode/commands/tutorial-create.md` | /tutorial-create command |
| `.opencode/commands/tutorial-report.md` | /tutorial-report command |
| `.opencode/agents/tutorial-admin.md` | Admin agent instructions |
| `.opencode/plugins/tutorial-progress.tsx` | TUI progress bar plugin |
| `tutorials/tests/schema.test.js` | Schema validation tests |
| `tutorials/tests/session.test.js` | Session management tests |
| `tutorials/tests/registry.test.js` | Registry tracking tests |
| `tutorials/tests/xp.test.js` | XP/achievements tests |

### Files to Modify

| File | Change |
|------|--------|
| `opencode.json` | Add tutorial commands + tutorial-admin agent |
| `AGENTS.md` | Add tutorials documentation |
| `.gitignore` | Add `tutorials/keys/` |

---

## TUI Plugin Details

### `tutorial-progress.tsx`

```typescript
// Renders in TUI prompt area (tui.prompt.append slot)
// Shows persistent progress bar during active tutorial
// Updates via session state file (tutorials/sessions/current.json)
// Uses: @opentui/solid (box, text, useTerminalDimensions)
// Reads: tutorials/sessions/current.json for live state
```

**Visual output:**
```
─────────────────────────────────────────────────────
 Git Fundamentals        Step 3/12  ████░░░░░  25%
 XP: 30  │  🔥 Streak: 2  │  ⏱ 3:24 / ~10:00
─────────────────────────────────────────────────────
```

---

## Architecture Decisions

1. **7 step types** — content, question, choice, code, challenge, scenario, checkpoint — covers all tutorial patterns
2. **Branching via `goto`** — choice steps skip/repeat sections based on user preference
3. **XP + streaks + achievements** — gamification makes learning addictive
4. **Real code execution** — bash tool runs actual commands, not just theory
5. **Challenge validation** — checks file content, git history, command output
6. **Adaptive difficulty** — skill suggests harder/easier based on streak
7. **TUI plugin for progress** — persistent visual feedback, not just text
8. **Toast notifications** — achievement popups via `tui.toast.show`
9. **Scenario narratives** — story-driven decisions with feedback
10. **Checkpoint gates** — must pass to continue (prevents skipping)
11. **Label-based scoring** — answers stored as labels, not indices
12. **Session persistence** — can resume interrupted tutorials
13. **Same participant system** — reuses `team.json` + `id.json`
14. **Session prefix `t-`** — distinguishes from quiz (q-), survey (s-)
15. **Zero npm dependencies** — Node.js built-ins only
16. **Cross-platform** — macOS, Linux, Windows

---

## TDD Flow

### Phase 1: Core Library Tests (RED)

1. **`tutorials/tests/schema.test.js`** — FAIL
   - loadTutorial, loadKey, validateTutorial, validateKey, listTutorials

2. **`tutorials/tests/session.test.js`** — FAIL
   - generateSessionId (t- prefix), createSession, saveResult, loadResult

3. **`tutorials/tests/registry.test.js`** — FAIL
   - markCompleted, isCompleted, getCompletedTutorials, getParticipantsForTutorial

4. **`tutorials/tests/xp.test.js`** — FAIL
   - calculateXP, checkAchievement, getStreakBonus

### Phase 2: Implement (GREEN)

5-8. Implement lib modules → tests pass

### Phase 3: CLI Scripts

9-11. create-tutorial.js, add-step.js, validate-tutorial.js

### Phase 4: Skills + Commands

12-17. SKILL.md files and command .md files

### Phase 5: Integration

18-21. opencode.json, AGENTS.md, .gitignore, agent

### Phase 6: TUI Enhancement

22. tutorial-progress.tsx plugin

---

## Verification

- [ ] All tests pass: `node --test tutorials/tests/*.test.js`
- [ ] CI validation passes: `node .opencode/scripts/ci-validate.js`
- [ ] Create tutorial works
- [ ] Add step works (all 7 types)
- [ ] Validate tutorial works
- [ ] `/tutorial` runs a tutorial interactively
- [ ] Progress bar shows in TUI
- [ ] XP and achievements work
- [ ] Branching paths work
- [ ] Code exercises execute
- [ ] Challenges validate correctly
- [ ] Session saves and loads
- [ ] Registry tracks completions
- [ ] Participant identification works
- [ ] Git upload works
