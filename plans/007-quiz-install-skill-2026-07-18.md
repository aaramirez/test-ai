# Quiz Install Skill & Spanish Documentation

## Objective

Create a new `quiz-install` skill that uses `quiz/cli/install.js` to copy the quiz/testing system to a target directory (with dry-run/temp preview), add a `/quiz-install` command, register it in `opencode.json`, add Spanish user documentation (`quiz/manuals/`) explaining how to use the system, and update `AGENTS.md` accordingly.

## Requirements

1. **`quiz-install` skill** — `.opencode/skills/quiz-install/SKILL.md` that loads `install.js` script, explains dry-run preview in temp dir, and targets a user-specified directory — priority: high
2. **`/quiz-install` command** — `.opencode/commands/quiz-install.md` that loads the skill and delegates — priority: high
3. **Register in opencode.json** — add `command.quiz-install` entry — priority: high
4. **Spanish documentation** — create `quiz/manuals/` files in Spanish: `admin-guia.md`, `participante.md`, `referencia-rapida.md` — priority: high
5. **Update AGENTS.md** — add the new skill, command, and script to the available tables; add Spanish docs paths — priority: medium
6. **`/quiz-install-update` command** — `.opencode/commands/quiz-install-update.md` that re-runs `install.js --dir <path>` over an already-installed target to refresh all files. The source directory is this project root — priority: high
7. **No changes to install.js itself** — the skill only wraps the existing installer, uses its API — priority: medium
8. **Tests** — verify the skill file exists, has correct frontmatter, scripts paths resolve, command file exists, Spanish docs are well-formed, and update command/skill exist — priority: high
9. **No npm dependencies** — same principle as all other quiz code — priority: high
10. **`opencode.json` shell fix** — the hardcoded `/bin/zsh` issue is out of scope for this plan — priority: low

## Architecture

### Files to create

| File | Purpose |
|------|---------|
| `.opencode/skills/quiz-install/SKILL.md` | Skill that wraps install.js with workflow instructions (dry-run, temp preview, target selection) |
| `.opencode/commands/quiz-install.md` | Command that loads quiz-install skill and passes user directory argument |
| `.opencode/commands/quiz-install-update.md` | Command that re-runs install over an already-installed target to refresh all files |
| `quiz/manuals/admin-guia.md` | Spanish admin guide — bank creation, keys, participants, reports |
| `quiz/manuals/participante.md` | Spanish participant guide — how to take quizzes |
| `quiz/manuals/referencia-rapida.md` | Spanish quick reference — command table, file paths, CLI scripts |

### Files to modify

| File | Changes |
|------|---------|
| `opencode.json` | Add `command.quiz-install` and `command.quiz-install-update` entries in the `command` object |
| `AGENTS.md` | Add `quiz-install` to skills table; add `/quiz-install` and `/quiz-install-update` to commands table; add `install.js` to scripts table |

### Decisions

1. **Skill references install.js via `scripts:` frontmatter** — consistent with all other quiz skills. Path `../../quiz/cli/install.js` follows the same convention as `quiz/SKILL.md` uses `../../quiz/cli/run-quiz.js`.
2. **The `/quiz-install <directory>` command** uses `$ARGUMENTS` to pass the directory. The command only loads the skill — the skill handles the full workflow. If `$ARGUMENTS` is empty, the skill asks the user for the directory.
3. **The skill instructs the agent to**:
   - Run `node quiz/cli/install.js --dry-run --verbose` to show what would be copied to the target directory
   - Optionally run `node quiz/cli/install.js --dir <target>` to actually install
   - The dry-run output lists files grouped by directory, visible to the user
4. **`/quiz-install-update` is a separate command.** It does NOT load the skill — it goes directly to the agent. The agent identifies the installed target (ask user or pass via `$ARGUMENTS`), then runs `node quiz/cli/install.js --dir <installed-path>` to re-copy all files. The source is always `PROJECT_ROOT` (this repo). Both `/quiz-install` and `/quiz-install-update` share the same `install.js` script but serve different workflows: fresh install vs update.
5. **Spanish docs mirror English docs** — `admin-guia.md` mirrors `admin.md`, `participante.md` mirrors `participant.md`, `referencia-rapida.md` mirrors `quick-reference.md`. Content translated to Spanish with references adjusted.
6. **No new test for the skill itself beyond file existence checks** — the install functionality is already tested by `install.test.js`. The skill is configuration (Markdown + frontmatter), not executable code.
7. **The `install.js` script already provides `--dry-run`, `--dir`** — the skill just orchestrates their usage.

### Skill workflow design

The skill instructs the agent to:

1. Determine target directory: use `$ARGUMENTS` from the command if provided, otherwise ask the user
2. Run `node quiz/cli/install.js --dry-run --verbose --dir <target>` and show output to the user
3. Explain what will be copied (104 files, structure preserved, ci-validate patched)
4. Ask for confirmation before proceeding
5. Run `node quiz/cli/install.js --dir <target>` to perform the installation
6. Report success and next steps (how to use the installed system)

### Commands

**`/quiz-install <target-dir>`** — fresh install
- Loads `quiz-install` skill
- Uses `$ARGUMENTS` for the directory (asks user if empty)
- Shows dry-run preview, confirms, then copies all files

**`/quiz-install-update <target-dir>`** — update existing installation
- Does NOT load a skill — direct agent instruction
- Uses `$ARGUMENTS` for the installed path (asks user if empty)
- Runs `node quiz/cli/install.js --dir <target>` to re-copy all files from source
- Overwrites existing files with current versions
- Does NOT show a dry-run preview (user already installed)
- Reports which files were updated

### Command file formats

```markdown
# .opencode/commands/quiz-install.md
---
description: Install the quiz/testing system. Usage: /quiz-install <target-dir>
---

Load the quiz-install skill. The user provided the target directory: $ARGUMENTS.
If no directory was provided, ask the user which directory to install to.
Follow the skill workflow to show a preview via dry-run, confirm, and install.
```

```markdown
# .opencode/commands/quiz-install-update.md
---
description: Update an existing quiz/testing installation. Usage: /quiz-install-update <target-dir>
---

The installed path is: $ARGUMENTS. If not provided, ask the user for the path.
Run `node quiz/cli/install.js --dir <path>` to re-copy all files from the source
project (this repository) to the target, overwriting any existing files.
Report the number of files updated. No dry-run needed — the user already has
an installation and just wants the latest versions.
```

## TDD Flow

### Red (write failing tests)

1. Add tests to `quiz/tests/install.test.js`:
   - Test `.opencode/skills/quiz-install/SKILL.md` exists with valid frontmatter
   - Test the skill's `scripts` array includes `../../quiz/cli/install.js`
   - Test `.opencode/commands/quiz-install.md` exists and its description mentions directory
   - Test `quiz/manuals/admin-guia.md` exists and is non-empty
   - Test `quiz/manuals/participante.md` exists and is non-empty
   - Test `quiz/manuals/referencia-rapida.md` exists and is non-empty
   - Test `opencode.json` has `command.quiz-install` entry with description/template
   - Test `opencode.json` has `command.quiz-install-update` entry with description/template
   - Test `opencode.json` commands reference `$ARGUMENTS`
   - Test `.opencode/commands/quiz-install-update.md` exists
   - Test `AGENTS.md` tables include `quiz-install` skill, `/quiz-install`, and `/quiz-install-update`
2. Run tests → all 12 new tests fail

### Green (implement)

1. Create `.opencode/skills/quiz-install/SKILL.md` with YAML frontmatter and workflow
2. Create `.opencode/commands/quiz-install.md` with command template
3. Create `.opencode/commands/quiz-install-update.md` with update command template
4. Create `quiz/manuals/admin-guia.md` (Spanish admin guide)
4. Create `quiz/manuals/participante.md` (Spanish participant guide)
5. Create `quiz/manuals/referencia-rapida.md` (Spanish quick reference)
6. Add `command.quiz-install` and `command.quiz-install-update` to `opencode.json`
7. Update `AGENTS.md` tables

### Refactor

- Read all files once for correctness and formatting consistency
- Ensure Spanish docs follow the same structure as English docs

## Verification

- [ ] `node --test` — all tests pass (54 original + 12 install + 12 new = 78)
- [ ] `node .opencode/scripts/ci-validate.js` — CI validation passes
- [ ] `node quiz/cli/install.js --dry-run --verbose` — lists files as expected
- [ ] All new files have correct YAML frontmatter (skills, commands)
- [ ] Spanish docs are syntactically valid Markdown
- [ ] `opencode.json` is valid JSON
- [ ] AGENTS.md tables are consistent with actual files
