# Add Tutorials to Install and Update Process

## Objective
Ensure the install and update scripts also install/update tutorials (CLI scripts, libraries, tests, and skills).

## Requirements
1. Add `tutorials` to the install script's subdirectories list — priority: high
2. Add tutorial-related skills to the install script's inclusion list — priority: high
3. Protect tutorial banks, keys, and sessions as user data — priority: high
4. Update the quiz-install skill documentation — priority: medium
5. Add tests for tutorial installation — priority: high

## Architecture

### Files to Modify
- `quiz/cli/install.js` — add tutorials directory and tutorial skills
- `.opencode/skills/quiz-install/SKILL.md` — update documentation
- `quiz/tests/install.test.js` — add tutorial tests

### Files to Create
- None

### Decisions
- Tutorial CLI scripts, lib, and tests should be installed
- Tutorial banks, keys, and sessions are user data (protected)
- Tutorial-related skills (tutorial, tutorial-create, tutorial-admin) should be installed
- Tutorial commands (tutorial, tutorial-create, tutorial-report) should be installed

## Changes to install.js

### 1. Add tutorials to subDirs
```javascript
const subDirs = ['quiz', '.opencode', 'surveys', 'tutorials'];
```

### 2. Add tutorial skills to EXCLUDE_PREFIXES (to include them)
Add these to the inclusion logic:
- `.opencode/skills/tutorial/`
- `.opencode/skills/tutorial-create/`
- `.opencode/skills/tutorial-admin/`

### 3. Add tutorial user data to EXCLUDE_PREFIXES
```javascript
'tutorials/banks/',      // Never copy tutorial banks from source
'tutorials/keys/',       // Never copy tutorial keys from source
'tutorials/sessions/',   // Never copy session results from source
```

### 4. Add tutorial user data to PROTECTED_PREFIXES
```javascript
'tutorials/banks/',
'tutorials/keys/',
'tutorials/sessions/',
```

### 5. Add tutorial commands to EXCLUDE_PREFIXES
- `.opencode/commands/tutorial.md`
- `.opencode/commands/tutorial-create.md`
- `.opencode/commands/tutorial-report.md`

## Changes to quiz-install/SKILL.md

Update the description to mention tutorials:
- Add tutorial CLI scripts and libraries
- Add tutorial skills (tutorial, tutorial-create, tutorial-admin)
- Add tutorial commands (tutorial, tutorial-create, tutorial-report)

## TDD Flow
1. Write failing tests for tutorial installation
2. Implement changes to install.js
3. Run tests → PASS
4. Refactor → still PASS

## Test Cases
1. `getFileList` includes tutorial CLI scripts
2. `getFileList` includes tutorial lib modules
3. `getFileList` includes tutorial tests
4. `getFileList` excludes tutorial banks (user data)
5. `getFileList` excludes tutorial keys (user data)
6. `getFileList` excludes tutorial sessions (user data)
7. `getFileList` includes tutorial skills
8. `getFileList` includes tutorial commands
9. `install` copies tutorial files to target
10. `install` does not overwrite protected tutorial files

## Verification
- [ ] Tests pass
- [ ] CI validation passes
- [ ] Documentation updated
- [ ] Dry-run shows tutorial files
