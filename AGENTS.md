# test-ia — AI Agent Instructions

test-ia — AI-enhanced project

This repository uses **arai** (open-code AI configuration manager) for multi-agent configuration.
Skills, scripts, and prompts are installed from the [aramirez-ai](https://github.com/aaramirez/aramirez-ai) repository.

## Repository structure

```
test-ia/
  ├── .opencode/  OpenCode configuration
  │   ├── skills/
  │   ├── agents/
  │   ├── commands/
  │   ├── scripts/
  │   ├── prompts/
  │   └── rules/
  ├── assets/  Brand logos, CSS templates, decks, images
  │   ├── images/
  │   └── templates/
  ├── quiz/  Quiz & survey system
  │   ├── banks/  Question banks (answer-free, shareable)
  │   ├── keys/  Answer keys (admin-only, gitignored, encrypted)
  │   ├── results/  Session results (committed)
  │   ├── cli/  CLI scripts
  │   ├── lib/  Shared modules
  │   ├── manuals/  User documentation
  │   ├── templates/  Email templates
  │   └── tests/  Test suites
  ├── opencode.json
  ├── package.json
  └── repos.json
```

## Key principles

- **OpenCode only**: All agent configuration is managed through opencode (opencode.json).
- **Skills live in `.opencode/skills/<name>/SKILL.md`** with YAML frontmatter.
- **Cross-Platform Compatibility**: All code, scripts, and tools must run on both macOS and Windows.
- **Per-project installs**: `arai install` copies files locally — projects are self-contained.
- **Zero npm dependencies**: All quiz system code uses Node.js built-in modules only.

## Available agents

| Agent | Mode | Permissions |
|-------|------|-------------|
| **build** (default) | primary | — |
| **plan** | primary | edit: deny |
| **plan-arai** | primary | — |
| **reviewer** | subagent | edit: deny |
| **tester** | subagent | bash: allow |
| **docs** | subagent | edit: allow, bash: deny |
| **quiz-admin** | subagent | bash: allow |

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
| vault-pdf-export | Exporta contenido del vault Obsidian curso-ia a PDF profesional usando el pipeline document-generation. |
| youtube | Use for fetching and processing YouTube video transcriptions to feed into AI models, generate summaries, create course notes, or analyze video content. |

## Available commands

| Command | Description |
|---------|-------------|
| `/quiz-create` | Create a new question bank |
| `/quiz-register` | Register quiz participants |
| `/quiz-practice` | Practice quiz with immediate feedback |
| `/quiz-run` | Live quiz — results saved and evaluable |
| `/quiz-report` | Admin report for quiz sessions |
| `/quiz-send` | Send quiz results via email |
| `/quiz-migrate` | Migrate legacy bank.json |

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

## Quiz system

The quiz system supports practice and live modes for knowledge assessment and surveys.

### Architecture

- **Banks** (`quiz/banks/`): Question-only files, safe to share. No correct answers.
- **Keys** (`quiz/keys/`): Answer keys mapped to question IDs. Admin-only, encrypted, gitignored.
- **Results** (`quiz/results/`): Session results committed to GitHub. Plain JSON.
- **Participants** (`quiz/participants.json`): Registry with ID, name, email, groups.

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
```

### Session ID Format

| Prefix | Mode |
|--------|------|
| `q-` | Live quiz |
| `p-` | Practice |
| `s-` | Survey |

## CLI quick reference

| Command | Description |
|---------|-------------|
| `arai init <dir>` | Scaffold new project (`--template minimal\|full`, `--description`) |
| `arai install` | Install opencode platform in project |
| `arai install <type> <name>` | Install component: skill, agent, script, prompt, rule |
| `arai uninstall` | Uninstall opencode platform from project |
| `arai uninstall <type> <name>` | Uninstall a specific component |
| `arai status` | Show installation status in current directory |
| `arai list skills\|agents\|scripts\|templates\|commands\|mcp` | List resources |

## When working

- Follow the existing code style (see `.opencode/rules/code-style.md`)
- Use conventional commits (`<type>(<scope>): <description>`)
- Keep skills in SKILL.md format with YAML frontmatter
- Add new skills as `.opencode/skills/<name>/SKILL.md`

Skills provide specialized instructions and workflows for specific tasks.
Use the skill tool to load a skill when a task matches its description.
