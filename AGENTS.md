# test-ia — AI Agent Instructions

test-ia — AI-enhanced project

Multi-agent configuration managed through opencode (opencode.json).

## Repository structure

```
test-ia/
  ├── .opencode/  OpenCode configuration
  │   ├── skills/
  │   ├── agents/
  │   ├── commands/
  │   ├── scripts/
  │   └── rules/
  ├── assets/  Brand logos, CSS templates, decks, images
  │   ├── images/
  │   └── templates/
  ├── quiz/  Quiz system
  │   ├── banks/  Quiz question banks (answer-free, shareable)
  │   ├── keys/  Answer keys (admin-only, gitignored, encrypted)
  │   ├── results/  Quiz session results (committed)
  │   ├── cli/  CLI scripts
  │   ├── lib/  Shared modules
  │   ├── manuals/  User documentation
  │   └── tests/  Test suites
  ├── surveys/  Survey system
  │   ├── banks/  Survey question banks (answer-free, shareable)
  │   ├── results/  Survey session results (committed)
  │   ├── registry.json  Survey completion tracking
  │   ├── visibility.json  Group-based access control
  │   └── _index.json  Survey session index
  ├── plans/  Implementation plans
  ├── opencode.json
  ├── package.json
  └── repos.json
```

## Key principles

- **OpenCode only**: All agent configuration is managed through opencode (opencode.json).
- **Skills live in `.opencode/skills/<name>/SKILL.md`** with YAML frontmatter.
- **Cross-Platform Compatibility**: All code, scripts, and tools must run on both macOS and Windows.
- **Self-contained**: All configuration lives in `.opencode/` — projects are portable.
- **Zero npm dependencies**: All quiz system code uses Node.js built-in modules only.

## Testing with OpenCode TUI

### Quick Start

1. Open opencode in the project directory
2. Type `/test` to run all tests
3. Or ask the tester agent: "Run all tests and report results"

### Writing Tests

This project uses Node.js built-in test runner (`node:test` + `node:assert/strict`).

**Test file location:** `quiz/tests/*.test.js`

**Basic test structure:**
```javascript
#!/usr/bin/env node
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

### Running Tests

```bash
# Single file
node --test quiz/tests/scorer.test.js

# All quiz tests
node --test quiz/tests/*.test.js

# Auto-discover all tests
node --test
```

### TDD Workflow

1. **RED** — Write failing test first
2. **GREEN** — Implement minimum code to pass
3. **REFACTOR** — Clean up while keeping tests green

Use `/plan` command to create implementation plans before coding.

## Creating Skills

### Skill Format

Skills live in `.opencode/skills/<name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: skill-name
description: Short description of what this skill does.
license: MIT
scripts:
  - ../../path/to/script.js
---

# Skill Title

Detailed workflow instructions here.
```

### Creating a Testing Skill

1. Create directory: `.opencode/skills/testing/`
2. Create `SKILL.md` with YAML frontmatter
3. Add `name`, `description`, `license` fields
4. Reference relevant scripts in `scripts` array
5. Document the workflow in the body

### Example: testing skill

See `.opencode/skills/testing/SKILL.md` for a complete example.

## Creating Agents

### Agent Format

Agents are defined in `opencode.json` under the `agent` key, with optional detailed instructions in `.opencode/agents/<name>.md`:

```json
{
  "agent": {
    "agent-name": {
      "mode": "primary|subagent",
      "description": "Short description",
      "permission": {
        "bash": "allow|deny|ask",
        "edit": "allow|deny|ask"
      }
    }
  }
}
```

### Creating a Testing Agent

1. Define agent in `opencode.json` with permissions
2. Create `.opencode/agents/<name>.md` with detailed instructions
3. Include frontmatter: `description`, `mode`, `model`, `permission`
4. Document the workflow, commands, and patterns

### Example: tester agent

See `.opencode/agents/tester.md` for a complete example.

## Creating Commands

### Command Format

Commands are defined in `.opencode/commands/<name>.md`:

```markdown
---
description: Short description of what this command does.
---

Detailed instructions for the command.
Use $ARGUMENTS for user input.
```

### Creating a Test Command

1. Create `.opencode/commands/<name>.md`
2. Add YAML frontmatter with `description`
3. Write detailed template in the body
4. Reference skills, scripts, or agents as needed

### Example: test command

See `.opencode/commands/test.md` for a complete example.

## Available agents

| Agent | Mode | Permissions |
|-------|------|-------------|
| **build** (default) | primary | — |
| **plan** | primary | edit: deny |
| **reviewer** | subagent | edit: deny |
| **tester** | subagent | bash: allow, edit: allow |
| **docs** | subagent | edit: allow, bash: deny |
| **quiz-admin** | subagent | bash: allow |
| **tutorial-admin** | subagent | bash: allow, edit: allow |

## Available skills

| Skill | Description |
|-------|-------------|
| branding | Define and apply brand identity — colors, logos, and typography for all generated documents. Use when creating or customizing visual assets. |
| ci-validate | Validate project integrity — required files, placeholders, frontmatter, and structural consistency. |
| code-review | Use for reviewing pull requests, performing code audits, and enforcing quality standards. |
| content-ingestion | Take content from any source (PDF, DOCX, web, text, markdown) and structure it into a knowledge base with proper frontmatter, wikilinks, and formatting. |
| document-generation | Generate branded PDF presentations, HTML decks, reports, and images using Node.js content builders. |
| email | Send emails via SMTP (Gmail, Outlook/Office365) with CLI, MCP, and command support. |
| git | Use for git operations, branching strategies, commit conventions, and repository management. |
| google-workspace | Read and search files in Google Drive, Docs, and Sheets via Google's official MCP server. |
| kb-management | Maintain a knowledge base vault — update existing notes, fix wikilinks, reorganize structure, keep workspace and graph in sync. |
| m365 | Read and search files in OneDrive and SharePoint via Microsoft Graph API. |
| pdf-extraction | Extract literal text from PDF files — handle column breaks, paragraph reconstruction, table detection, and encoding issues. |
| quiz | Run knowledge quizzes and surveys with practice and live modes. Loads questions from quiz/banks/ and uses quiz/keys/ for evaluation. |
| quiz-admin | Admin reports, evaluation, and quiz lifecycle management. |
| quiz-bank | Create, validate, and manage question banks for quizzes and surveys. |
| quiz-key | Create, manage, and encrypt answer keys for quiz banks. |
| quiz-participant | Register, list, find, and manage quiz participants. |
| quiz-results | Send personalized quiz results to participants via email. |
| repos-sync | Synchronize reference repositories for knowledge sharing and dependency management. |
| **testing** | **Testing workflows for OpenCode TUI — write, run, and debug tests using Node.js built-in test runner.** |
| **quiz-install** | **Install the quiz and testing system to another directory. Shows dry-run preview, copies all files, patches ci-validate.** |
| **survey** | **Manage surveys — check pending surveys, submit answers, track completion via a taken registry.** |
| **tutorial** | **Run interactive tutorials with branching, gamification, and progress tracking. XP, streaks, achievements.** |
| **tutorial-create** | **Create, validate, and manage interactive tutorial content — 7 step types with branching and challenges.** |
| **tutorial-admin** | **Tutorial admin reports, completion tracking, and participant progress management.** |
| vault-pdf-export | Exporta contenido del vault Obsidian curso-ia a PDF profesional usando el pipeline document-generation. |
| youtube | Use for fetching and processing YouTube video transcriptions to feed into AI models, generate summaries, create course notes, or analyze video content. |

## Available commands

| Command | Description |
|---------|-------------|
| `/test` | Run the test suite for the current project |
| `/plan` | Generate a detailed requirements plan in plans/ with TDD philosophy |
| `/quiz-create` | Create a new question bank |
| `/quiz-register` | Register quiz participants |
| `/quiz-practice` | Practice quiz with immediate feedback |
| `/quiz-run` | Live quiz — results saved and evaluable |
| `/quiz-report` | Admin report for quiz sessions |
| `/quiz-send` | Send quiz results via email |
| `/quiz-migrate` | Migrate legacy bank.json |
| `/quiz-install` | Install the quiz and testing system to a directory |
| `/quiz-install-update` | Update an existing quiz/testing installation |
| `/tutorial` | Run an interactive tutorial with gamification |
| `/tutorial-create` | Create a new interactive tutorial |
| `/tutorial-report` | View tutorial completion reports |

## Available scripts

| Script | Type |
|--------|------|
| .opencode/scripts/ci-validate.js | file |
| .opencode/scripts/create-brand.js | file |
| .opencode/scripts/docgen | dir |
| .opencode/scripts/docgen-vault.js | file |
| .opencode/scripts/extract-pdf.js | file |
| .opencode/scripts/getrepo.js | file |
| .opencode/scripts/ingest-content.js | file |
| .opencode/scripts/kb-sync.js | file |
| .opencode/scripts/mcp-email.js | file |
| .opencode/scripts/repos-sync.js | file |
| .opencode/scripts/send-email.js | file |
| .opencode/scripts/updaterepos.js | file |
| .opencode/scripts/youtube-transcript.js | file |
| quiz/lib/survey-session.js | file |

## Quiz system

The quiz system supports practice and live modes for knowledge assessment and surveys.

### Architecture

- **Banks** (`quiz/banks/`): Question-only files, safe to share. No correct answers.
- **Keys** (`quiz/keys/`): Answer keys mapped to question IDs. Admin-only, encrypted, gitignored.
- **Results** (`quiz/results/`): Session results committed to GitHub. Plain JSON.
- **Team** (`team.json`): Participant registry with ID, name, email, groups.
- **ID Lookup** (`id.json`): Quick ID lookup for participant identification.
- **Surveys** (`surveys/`): Survey results, registry, and index stored separately from quiz results.

### Commands

| Command | Description |
|---------|-------------|
| `/quiz-create` | Create a new question bank |
| `/quiz-register` | Register participants (single or CSV bulk import) |
| `/quiz-practice` | Practice quiz with immediate feedback |
| `/quiz-run` | Live quiz — results saved for evaluation |
| `/quiz-report` | Admin report — per-question stats, participant scores |
| `/quiz-send` | Send personalized results via email |
| `/quiz-migrate` | Migrate legacy bank.json to new format |
| `/quiz-install` | Install the system to a directory |
| `/quiz-install-update` | Update existing installation |
| `/survey` | Check pending surveys and submit answers |

### CLI Scripts

```bash
# Bank management
node quiz/cli/create-bank.js --name "Topic" --id topic
node quiz/cli/add-question.js --bank banks/topic.json --id q-001 ...
node quiz/cli/validate-bank.js banks/topic.json
node quiz/cli/migrate-bank.js --input bank.json --output banks/

# Key management
node quiz/cli/create-key.js --bank banks/topic.json
node quiz/cli/validate-key.js --key keys/topic.json --bank banks/topic.json
node quiz/cli/encrypt-key.js keys/topic.json

# Participant management
node quiz/cli/manage-participants.js --list
node quiz/cli/manage-participants.js --add --id ID --name "Name"
node quiz/cli/manage-participants.js --import file.csv

# Evaluation and reports
node quiz/cli/evaluate.js --bank javascript.json --all
node quiz/cli/admin-report.js --bank javascript.json
node quiz/cli/admin-report.js --participant STU-001

# Results
node quiz/cli/send-results.js --bank javascript.json --all

# Install
node quiz/cli/install.js --dry-run --verbose  # preview only
node quiz/cli/install.js --dir /path/to/target # actual copy
```

### Session ID Format

| Prefix | Mode |
|--------|------|
| `q-` | Live quiz |
| `p-` | Practice |
| `s-` | Survey |
| `t-` | Tutorial |


## Tutorial system

The tutorial system provides interactive learning with branching paths, gamification, and progress tracking.

### Architecture

- **Banks** (`tutorials/banks/`): Tutorial content with steps. Safe to share.
- **Keys** (`tutorials/keys/`): Answer keys for scorable steps. Admin-only, gitignored.
- **Sessions** (`tutorials/sessions/`): Session results committed to GitHub.
- **Registry** (`tutorials/registry.json`): Completion tracking per participant.

### Step Types

| Type | Purpose |
|------|---------|
| `content` | Teach concept with text and visuals |
| `question` | Knowledge check with options |
| `choice` | Branching path selection |
| `code` | Run code exercise in terminal |
| `challenge` | Hands-on file creation/editing |
| `scenario` | Story-driven decision with feedback |
| `checkpoint` | Gate quiz — must pass to continue |

### CLI Scripts

```bash
# Create tutorial
node tutorials/cli/create-tutorial.js --name "Name" --id id --difficulty easy

# Add steps
node tutorials/cli/add-step.js --tutorial banks/id.json --id step-001 --type content --title "T" --body "B"
node tutorials/cli/add-step.js --tutorial banks/id.json --id q-001 --type question --question "Q?" --options "A" "B"
node tutorials/cli/add-step.js --tutorial banks/id.json --id code-001 --type code --title "Try" --code "echo hi"

# Validate
node tutorials/cli/validate-tutorial.js id.json
node tutorials/cli/validate-tutorial.js --key keys/id.json id.json
```

### Gamification

- **XP**: +10 correct, +5 code run, +20 challenge
- **Streaks**: Bonus XP at 3, 5, 10 consecutive correct
- **Achievements**: First Steps, Perfect Score, On Fire, Code Runner, Speed Learner, Explorer



## When working

- Follow the existing code style (see `.opencode/rules/code-style.md`)
- Follow testing conventions (see `.opencode/rules/testing.md`)
- Use conventional commits (`<type>(<scope>): <description>`)
- Keep skills in SKILL.md format with YAML frontmatter
- Add new skills as `.opencode/skills/<name>/SKILL.md`
- Write tests before implementation (TDD)
- Run `/test` before commits to verify

Skills provide specialized instructions and workflows for specific tasks.
Use the skill tool to load a skill when a task matches its description.
