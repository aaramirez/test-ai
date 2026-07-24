# Plan: OpenCode Interactive Interface for Quiz/Tutorial/Survey System

## Objective

Create a complete OpenCode skill/command/agent layer that guides users through every system flow (quiz, tutorial, survey, key management, access control) via the TUI — eliminating the need to remember or type CLI commands, while enforcing role-based access (admin, group-read, group-write) and protecting sensitive information.

## Requirements

### High Priority
1. **Multi-person key management skill** (`quiz-key-mgmt`) — guide users through upload/approve/reject/grant/revoke/approvals workflow via TUI question tool — priority: high
2. **Survey admin skill** (`survey-admin`) — evaluate survey results, generate reports, manage visibility — priority: high
3. **Role-aware flows** — every skill must detect user role (admin vs member vs group) and show only relevant actions — priority: high
4. **Register missing commands** in opencode.json — `/survey-create`, `/quiz-evaluate`, `/quiz-key-mgmt`, `/survey-report` — priority: high
5. **Register missing agents** in opencode.json — `survey-admin` agent — priority: high

### Medium Priority
6. **Survey bank creation skill** (`survey-bank`) — dedicated workflow for creating survey-type banks — priority: medium
7. **Encrypted access control workflow** — guide admin through access.json.enc setup and management — priority: medium
8. **Tutorial key management** — automate tutorial key creation and validation — priority: medium
9. **Installation wizard skill** — interactive guided install/update with dry-run preview — priority: medium

### Low Priority
10. **Survey result delivery** — send survey confirmations to participants — priority: low
11. **Tutorial install/update commands** — independent tutorial system management — priority: low

## Architecture

### Design Principles

1. **Single entry point per domain**: One skill per domain (quiz, tutorial, survey, key-mgmt) that internally handles all variants
2. **Role detection**: Each skill detects the user's role via `team.json` groups and `team-public.json` status, then shows only permitted actions
3. **Question tool for all interactions**: Never ask users to type commands — use OpenCode's question tool for selections, confirmations, and input
4. **Progressive disclosure**: Show high-level menu first, drill into details on demand
5. **Protect by default**: Never display encrypted key contents, never show admin-only data to non-admins, never commit sensitive files

### Role Matrix

| Action | Admin | Group-Read | Group-Write | Member (pending) | Anonymous |
|--------|-------|------------|-------------|------------------|-----------|
| Take quiz (practice) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Take quiz (live) | ✅ | ✅ | ✅ | ❌ | ❌ |
| View own results | ✅ | ✅ | ✅ | ❌ | ❌ |
| View all results | ✅ | ❌ | ❌ | ❌ | ❌ |
| Evaluate sessions | ✅ | ❌ | ❌ | ❌ | ❌ |
| Send results | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create bank | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create key | ✅ | ❌ | ❌ | ❌ | ❌ |
| Encrypt key | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload public key | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve key | ✅ | ❌ | ❌ | ❌ | ❌ |
| Grant access | ✅ | ❌ | ❌ | ❌ | ❌ |
| Revoke access | ✅ | ❌ | ❌ | ❌ | ❌ |
| Take survey | ✅ | ✅* | ✅* | ❌ | ❌ |
| View survey results | ✅ | ✅** | ❌ | ❌ | ❌ |
| Create survey bank | ✅ | ❌ | ❌ | ❌ | ❌ |
| Run tutorial | ✅ | ✅ | ✅ | ❌ | ❌ |
| View tutorial reports | ✅ | ❌ | ❌ | ❌ | ❌ |
| Install/update system | ✅ | ❌ | ❌ | ❌ | ❌ |

*If survey visibility.json allows their group
**If in viewResultsGroups

### Flow Diagrams

#### Admin Flow
```
User asks about quiz/tutorial/survey/key management
  → Skill detects admin role (in quiz-admin group)
  → Shows full menu with all actions
  → Guides through selected flow step-by-step
  → Handles encryption/decryption transparently
```

#### Member Flow
```
User asks about quiz/tutorial/survey
  → Skill detects member role (active key in team-public.json)
  → Shows only available actions (take quiz, view own results)
  → Hides admin-only operations
  → Guides through participation flow
```

#### New Member Onboarding Flow
```
New user asks to join
  → Skill detects no key or pending key
  → Guides through key upload
  → Informs about admin approval needed
  → Shows what they'll be able to do once approved
```

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `.opencode/skills/quiz-key-mgmt/SKILL.md` | Multi-person key management workflow |
| `.opencode/skills/survey-admin/SKILL.md` | Survey admin reports and management |
| `.opencode/skills/survey-bank/SKILL.md` | Survey bank creation and management |
| `.opencode/skills/install-wizard/SKILL.md` | Guided installation wizard |
| `.opencode/skills/tutorial-key/SKILL.md` | Tutorial key management |
| `.opencode/commands/quiz-key-mgmt.md` | Command for key management |
| `.opencode/commands/survey-report.md` | Command for survey reports |
| `.opencode/commands/survey-create.md` | Command for survey bank creation |
| `.opencode/commands/quiz-evaluate.md` | Command for quiz evaluation |
| `.opencode/agents/survey-admin.md` | Survey admin agent |
| `.opencode/agents/quiz-key-mgmt.md` | Key management agent |

### Modified Files

| File | Changes |
|------|---------|
| `opencode.json` | Register new commands and agents |
| `AGENTS.md` | Document new skills, commands, agents |
| `.opencode/skills/quiz/SKILL.md` | Add role detection section |
| `.opencode/skills/quiz-admin/SKILL.md` | Add role detection, link to key-mgmt |
| `.opencode/skills/tutorial/SKILL.md` | Add role detection section |
| `.opencode/skills/survey/SKILL.md` | Add role detection, link to survey-admin |

### Scripts to Create/Modify

| Script | Changes |
|--------|---------|
| `quiz/cli/manage-keys.js` | Add `--who-access-for ID` action (list keys accessible to a member) |
| `quiz/cli/survey-admin-report.js` | NEW: aggregate survey results with response distributions |
| `tutorials/cli/create-key.js` | NEW: create tutorial answer keys programmatically |

## TDD Flow

### Phase 1: Key Management Skill (Tests First)

1. **RED**: Write test for `manage-keys.js --who-access-for` → fails (action doesn't exist)
2. **GREEN**: Implement `whoAccessFor()` function in manage-keys.js
3. **REFACTOR**: Clean up, still passes

### Phase 2: Survey Admin Script (Tests First)

1. **RED**: Write test for `survey-admin-report.js --bank survey.json` → fails (script doesn't exist)
2. **GREEN**: Implement survey-admin-report.js with response counting, distribution stats
3. **REFACTOR**: Clean up, still passes

### Phase 3: Tutorial Key Script (Tests First)

1. **RED**: Write test for `create-key.js --tutorial banks/tutorial.json` → fails
2. **GREEN**: Implement tutorial key creation in tutorials/cli/create-key.js
3. **REFACTOR**: Clean up, still passes

### Phase 4: Skills (No tests — markdown files)

1. Write SKILL.md files with workflows
2. Register in opencode.json
3. Update AGENTS.md

## Verification

- [ ] All existing tests pass (315+)
- [ ] New tests pass for manage-keys.js who-access-for
- [ ] New tests pass for survey-admin-report.js
- [ ] New tests pass for tutorials/cli/create-key.js
- [ ] ci-validate passes
- [ ] Skills load correctly in opencode TUI
- [ ] Commands are accessible via `/command-name`
- [ ] Role detection works (admin sees all, member sees limited)
- [ ] Install to ../test-ai-test works
- [ ] Documentation updated

## Implementation Order

1. Create plan document (this file) ✅
2. Write tests for manage-keys.js --who-access-for
3. Implement manage-keys.js --who-access-for
4. Write tests for survey-admin-report.js
5. Implement survey-admin-report.js
6. Write tests for tutorials/cli/create-key.js
7. Implement tutorials/cli/create-key.js
8. Create quiz-key-mgmt skill
9. Create survey-admin skill
10. Create survey-bank skill
11. Create install-wizard skill
12. Create tutorial-key skill
13. Create new commands
14. Create new agents
15. Register in opencode.json
16. Update existing skills with role detection
17. Update AGENTS.md
18. Run full test suite
19. Install to ../test-ai-test
20. Commit
