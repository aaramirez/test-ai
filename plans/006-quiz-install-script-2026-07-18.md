# Install Script for Quiz & Testing System

## Objective

Create a portable script that copies the quiz/testing system plus minimal OpenCode configuration to a target directory, adjusting paths and configuration so all features work immediately.

## Requirements

1. **Copy quiz system** — copy `quiz/` directory with banks, keys, CLI scripts, lib modules, tests, manuals, results — priority: high
2. **Copy minimal OpenCode config** — copy `.opencode/skills/` (quiz, quiz-admin, quiz-bank, quiz-key, quiz-participant, quiz-results, testing), `.opencode/commands/` (test, plan, quiz.md), `.opencode/agents/tester.md`, `.opencode/rules/` (testing.md, code-style.md), `.opencode/scripts/ci-validate.js` — priority: high
3. **Copy root config files** — copy `opencode.json`, `AGENTS.md`, `README.md`, `package.json`, `.gitignore` — priority: high
4. **Auto-detect target** — default to current directory, accept `--dir` flag — priority: high
5. **Update opencode.json `instructions` path** — must reference `AGENTS.md` in the new location — priority: high
6. **Update `.opencode/skills/*/SKILL.md` script references** — the `scripts:` frontmatter uses `../../quiz/cli/` which breaks if `.opencode/` is copied independently — verify relative structure is preserved — priority: high
7. **Update `ci-validate.js`** — it currently checks for `shared/` instead of `.opencode/`; the installed version must check the correct paths — priority: high
8. **Update `AGENTS.md`** — paths in the document (like `quiz/tests/*.test.js`) are relative and work from the project root; no changes needed as long as root structure is preserved — priority: medium
9. **Skip non-essential files** — do not copy non-quiz skills (branding, youtube, email, kb-management, etc.), non-quiz agents, non-quiz scripts, asset files — priority: medium
10. **Dry-run mode** — `--dry-run` flag to list files that would be copied without copying — priority: medium
11. **Cross-platform** — zero npm dependencies, Node.js built-in modules only — priority: high
12. **Tests** — test the install script itself: verify correct file count, structure, path adjustments — priority: high

## Architecture

### What gets copied

```
target/
  ├── opencode.json              (copied, instructions path verified)
  ├── AGENTS.md                  (copied as-is)
  ├── README.md                  (copied as-is)
  ├── package.json               (copied as-is)
  ├── .gitignore                 (copied as-is)
  ├── quiz/                      (entire directory tree copied)
  │   ├── banks/
  │   ├── keys/
  │   ├── cli/
  │   ├── lib/
  │   ├── manuals/
  │   ├── results/
  │   └── tests/
  └── .opencode/
      ├── skills/
      │   ├── quiz/SKILL.md           (scripts: ../../quiz/cli/run-quiz.js — preserved)
      │   ├── quiz-admin/SKILL.md     (scripts: ../../quiz/cli/evaluate.js, admin-report.js)
      │   ├── quiz-bank/SKILL.md      (scripts: ../../quiz/cli/create-bank.js, etc.)
      │   ├── quiz-key/SKILL.md       (scripts: ../../quiz/cli/create-key.js, etc.)
      │   ├── quiz-participant/SKILL.md (scripts: ../../quiz/cli/manage-participants.js)
      │   ├── quiz-results/SKILL.md   (scripts: ../../quiz/cli/send-results.js)
      │   └── testing/SKILL.md
      ├── commands/
      │   ├── test.md
      │   ├── plan.md
      │   └── quiz.md
      ├── agents/
      │   └── tester.md
      ├── rules/
      │   ├── testing.md
      │   └── code-style.md
      ├── scripts/
      │   └── ci-validate.js
      └── prompts/
          └── commit-message.md
```

The key structural invariant: `quiz/` and `.opencode/` MUST remain sibling directories under the same parent. All relative path references (`../../quiz/cli/` from skills, `quiz/tests/` from commands/agents, `__dirname`-based resolution in CLI scripts) depend on this structure.

### What specifically needs path adjustment

| File | Issue | Fix |
|------|-------|-----|
| `ci-validate.js` | Checks for `shared/` directory (doesn't exist in this project) | Rewrite checks to target `.opencode/` instead of `shared/`, and `quiz/` instead of `tutorials/` etc. |

All other references are self-consistent within the sibling structure and need NO adjustment.

### File changes

**New files:**
- `quiz/cli/install.js` — the installer script

**Modified files (in source, not in target):**
- `.opencode/scripts/ci-validate.js` — also fix the source version so it validates this project correctly (it currently checks `shared/` which doesn't exist)

**No modifications needed in source for the install itself** — the install script copies files verbatim and only adjusts `ci-validate.js` as a post-copy step.

### Key decisions

1. **Single self-contained script** — one Node.js file (`quiz/cli/install.js`) that does everything. No npm dependencies, no shell scripts.
2. **`--dir` flag** — defaults to current directory if not specified
3. **`--dry-run` flag** — preview mode, lists files without copying
4. **`--no-ci-fix` flag** — skip the ci-validate.js rewrite (for advanced users)
5. **`--verbose` flag** — show each file as it's copied
6. **Overwrite protection** — warn if target already has files at conflicting paths, but proceed (user can abort)
7. **Directory structure preserved exactly** — the `../../quiz/cli/` pattern from skills to CLI scripts relies on sibling structure; we must NOT flatten or reorganize
8. **The `ci-validate.js` rewrite** replaces `shared/` checks with `.opencode/` checks in the installed copy only (not the source unless explicitly requested)
9. **Exclusion list** — exclude: `node_modules/`, `.DS_Store`, test temp files (`test-*.json`), `plans/`, `assets/`, non-quiz `.opencode/` skills/agents/scripts

## TDD Flow

### Red (write failing tests)

1. Write `install.test.js` in `quiz/tests/`:
   - Test `--dry-run` returns correct file list (count of expected files)
   - Test `--dir` creates correct target directory structure
   - Test `--dry-run` does NOT create any files
   - Test installed `ci-validate.js` checks `.opencode/` not `shared/`
   - Test all expected quiz CLI scripts are listed
   - Test all expected quiz skills are listed
2. Run tests → all fail because `quiz/cli/install.js` doesn't exist yet

### Green (implement)

1. Create `quiz/cli/install.js` with:
   - Argument parsing (`--dir`, `--dry-run`, `--verbose`, `--no-ci-fix`)
   - File enumeration with exclusions
   - Copy logic (recursive directory copy using `fs` built-ins)
   - `ci-validate.js` fix step
   - Summary output
2. Fix source `.opencode/scripts/ci-validate.js` to check `.opencode/` instead of `shared/`
3. Run tests → all pass

### Refactor
- Ensure edge cases: non-existent target dir (create it), existing files (overwrite), relative vs absolute paths

## Verification

- [ ] `node --test quiz/tests/install.test.js` — all install tests pass
- [ ] `node --test` — all tests pass
- [ ] `node quiz/cli/install.js --dry-run --verbose` — lists expected files without copying
- [ ] `node quiz/cli/install.js --dir /tmp/test-quiz-install` — copies correctly
- [ ] Installed `node quiz/cli/run-quiz.js --list` works from target dir
- [ ] Installed `node .opencode/scripts/ci-validate.js` passes (no `shared/` errors)
- [ ] Installed `opencode.json` references `AGENTS.md` correctly
- [ ] Installed skill `../../quiz/cli/` references resolve correctly
- [ ] Cross-platform: test on macOS (this covers Unix); path handling uses `path.join` for Windows compat
- [ ] Source `ci-validate.js` also fixed (validates this project correctly)
- [ ] AGENTS.md/README.md updated if new scripts/commands are added
