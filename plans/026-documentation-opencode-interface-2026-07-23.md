# Documentation for OpenCode Interactive Interface

## Objective
Generate comprehensive, bilingual (EN/ES) user-facing documentation for all new agents, skills, commands, and CLI scripts added in Plan 025 — covering tutorials, surveys, key management, and the install wizard.

## Requirements
1. Tutorial participant guide (EN/ES) — how to run tutorials via OpenCode TUI — priority: high
2. Tutorial admin guide (EN/ES) — creating tutorials, managing keys, viewing reports — priority: high
3. Survey participant guide (EN/ES) — how to take surveys via OpenCode TUI — priority: high
4. Survey admin guide (EN/ES) — creating banks, generating reports, CSV export — priority: high
5. Key management admin guide (EN/ES) — multi-person key lifecycle, access control, approvals — priority: high
6. Quick reference updated (EN/ES) — all commands including Plan 025 additions — priority: high
7. README.md updated — command table with all new commands — priority: medium
8. Spanish admin guide synced — add multi-person key management section — priority: medium
9. Cross-references between manuals — wikilinks where appropriate — priority: low

## Architecture

### Files to Create (12 new manuals)

| File | Purpose | Based On |
|------|---------|----------|
| `tutorials/manuals/participant.md` | EN tutorial participant guide | `quiz/manuals/participant.md` pattern |
| `tutorials/manuals/participante.md` | ES tutorial participant guide | Spanish version of above |
| `tutorials/manuals/admin.md` | EN tutorial admin guide | `quiz/manuals/admin.md` pattern |
| `tutorials/manuals/admin-guia.md` | ES tutorial admin guide | Spanish version of above |
| `tutorials/manuals/quick-reference.md` | EN tutorial quick reference | `quiz/manuals/quick-reference.md` pattern |
| `tutorials/manuals/referencia-rapida.md` | ES tutorial quick reference | Spanish version of above |
| `surveys/manuals/participant.md` | EN survey participant guide | `quiz/manuals/participant.md` pattern |
| `surveys/manuals/participante.md` | ES survey participant guide | Spanish version of above |
| `surveys/manuals/admin.md` | EN survey admin guide | `quiz/manuals/admin.md` pattern |
| `surveys/manuals/admin-guia.md` | ES survey admin guide | Spanish version of above |
| `surveys/manuals/quick-reference.md` | EN survey quick reference | `quiz/manuals/quick-reference.md` pattern |
| `surveys/manuals/referencia-rapida.md` | ES survey quick reference | Spanish version of above |

### Files to Modify (4 existing docs)

| File | Change |
|------|--------|
| `quiz/manuals/quick-reference.md` | Add `/key-mgmt`, `/survey-report`, `/survey-create`, `/tutorial-key`, `/tutorial`, `/tutorial-create`, `/tutorial-report` commands |
| `quiz/manuals/referencia-rapida.md` | Same additions in Spanish |
| `quiz/manuals/admin-guia.md` | Add "Multi-Person Key Management" section (sync with EN version) |
| `README.md` | Update command table with all Plan 025 commands |

### Decisions

- **Bilingual pairs**: Every manual exists in EN + ES, following the established `name.md` / `name-guia.md` or `participante.md` pattern
- **Manual location**: Tutorials manuals in `tutorials/manuals/`, surveys manuals in `surveys/manuals/` — matching the `quiz/manuals/` precedent
- **Depth**: Participant guides ~50 lines (task-oriented), admin guides ~150-200 lines (comprehensive), quick references ~80 lines (cheatsheet)
- **Language**: Spanish manuals use localized identifiers (`EJ-001` vs `STU-001`) and imperative Spanish
- **No YAML frontmatter**: Manuals are standalone docs, not agent-facing SKILL.md files
- **Cross-references**: Use `→ See [Manual Name](path)` format in manuals, `[[skill-name]]` wikilinks in skills

## Content Outline

### Tutorial Participant Guide
1. What are tutorials — interactive learning with XP, streaks, achievements
2. Running a tutorial — `/tutorial` command, select tutorial, answer questions
3. Step types explained — content, question, choice, code, challenge, scenario, checkpoint
4. Gamification — XP system, streaks, achievements, difficulty levels
5. Tips for success

### Tutorial Admin Guide
1. Creating a tutorial — `/tutorial-create`, name, ID, difficulty
2. Adding steps — 7 step types with examples
3. Creating answer keys — `/tutorial-key`, scorable steps
4. Running tutorials — participant flow
5. Viewing reports — `/tutorial-report`, completion tracking
6. File locations table
7. Troubleshooting

### Survey Participant Guide
1. What are surveys — feedback collection, no right/wrong answers
2. Taking a survey — `/survey` command, select survey, answer questions
3. Visibility — group-based access control
4. Tips

### Survey Admin Guide
1. Creating a survey bank — `/survey-create`, questions with options
2. Setting visibility — `surveys/visibility.json`, allowedGroups, viewResultsGroups
3. Running surveys — participant flow
4. Generating reports — `/survey-report`, statistics, CSV export
5. File locations table
6. Troubleshooting

### Key Management Admin Guide
1. Overview — multi-person key management, roles, access control
2. Member onboarding — upload key, approve, grant access
3. Member offboarding — revoke access, remove key
4. Access control — grant/revoke read/write, groups
5. Approval workflow — pending, approve, reject
6. Encrypted storage — access.json.enc, approvals.json.enc
7. CLI reference — all manage-keys.js actions
8. Troubleshooting

### Quick Reference (updated)
- All commands table (existing + 7 new)
- Key management CLI scripts
- Survey admin CLI scripts
- Tutorial key CLI scripts
- File locations (all three systems)

## TDD Flow

This is a documentation task — no code tests needed. Verification is structural:

1. Create all 12 new manual files
2. Modify 4 existing files
3. Verify all files exist and have correct structure
4. Verify bilingual consistency (section count, code examples)
5. Run ci-validate to check no structural issues

## Verification

- [ ] All 12 new manual files created with correct content
- [ ] EN/ES pairs have matching structure (same sections, same code examples)
- [ ] README.md command table includes all Plan 025 commands
- [ ] Quick references updated with new commands and CLI scripts
- [ ] Spanish admin guide synced with English version
- [ ] ci-validate passes
- [ ] Full test suite still passes (340/340)
- [ ] Reinstall to ../test-ai-test — 142+ files
