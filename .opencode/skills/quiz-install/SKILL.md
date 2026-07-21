---
name: quiz-install
description: Install the quiz and testing system to another directory. Shows a dry-run preview in a temp directory, then copies all files to the target.
license: MIT
scripts:
  - ../../quiz/cli/install.js
---

# Quiz Install Skill

Install the complete quiz and testing system to a target directory using the `install.js` script.

This skill copies: quiz CLI scripts and libraries, question banks, test suites, manuals, tutorial CLI scripts and libraries, the 7 quiz-related OpenCode skills (`quiz`, `quiz-admin`, `quiz-bank`, `quiz-key`, `quiz-participant`, `quiz-results`, `testing`), the 3 tutorial-related OpenCode skills (`tutorial`, `tutorial-create`, `tutorial-admin`), commands (`test`, `plan`, `quiz`, `tutorial`, `tutorial-create`, `tutorial-report`), the `tester` agent, `ci-validate.js` (patched for the target), `opencode.json`, `AGENTS.md`, `README.md`, `package.json`, and `.gitignore`.

## Workflow

### 1. Determine the target directory

- If the user provided a directory via `/quiz-install <dir>`, use that
- Otherwise, ask the user: "Which directory do you want to install the quiz/testing system to?"

### 2. Show a dry-run preview

Run the installer in dry-run mode to show what will be copied:

```
node quiz/cli/install.js --dry-run --verbose --dir <target>
```

This lists all files grouped by directory (quiz/, .opencode/, root files) and shows how many files total will be copied. Present this output to the user so they can see exactly what will be installed.

### 3. Confirm

Ask the user: "Ready to install <N> files to `<target>`?" with options to proceed or cancel.

### 4. Install

```
node quiz/cli/install.js --dir <target>
```

The installer:
- Creates the directory structure in `<target>`
- Copies all files from the source project to `<target>`
- Patches `ci-validate.js` to check `.opencode/` instead of `shared/`
- Reports the number of files copied

### 5. Report success

Tell the user:
- "Installed successfully to `<target>`"
- `<N>` files copied
- The system is ready to use — open opencode in that directory to access quiz commands
- Run `node quiz/cli/install.js --dry-run --verbose --dir <target>` again to verify

## Notes

- The installer preserves the exact directory structure: `quiz/`, `tutorials/`, and `.opencode/` are siblings
- All relative path references (`../../quiz/cli/` from skills to CLI scripts) continue to work
- Non-quiz skills (branding, youtube, email, etc.) are NOT copied
- Tutorial banks, keys, and sessions are user data and NOT copied from source
- The `install.js` script has zero npm dependencies — Node.js built-ins only

## Related

- [[testing]] — testing workflows
- [[quiz]] — run quizzes and surveys
