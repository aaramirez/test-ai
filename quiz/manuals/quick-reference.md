# Quiz System — Quick Reference

## Commands

| Command | Description |
|---------|-------------|
| `/quiz-create` | Create a new bank |
| `/quiz-register` | Register participants |
| `/quiz-practice` | Practice quiz (with feedback) |
| `/quiz-run` | Live quiz (results saved) |
| `/quiz-report` | Admin report |
| `/quiz-send` | Send results email |
| `/quiz-migrate` | Migrate legacy bank |
| `/quiz-install` | Install system to directory |
| `/quiz-install-update` | Update existing installation |
| `/key-mgmt` | Multi-person key management |
| `/survey` | Take pending surveys |
| `/survey-report` | Survey admin reports |
| `/survey-create` | Create survey banks |
| `/tutorial` | Run interactive tutorial |
| `/tutorial-create` | Create new tutorial |
| `/tutorial-report` | Tutorial completion reports |
| `/tutorial-key` | Tutorial answer key management |

## File Locations

| Path | Purpose |
|------|---------|
| `quiz/banks/` | Question banks (shareable) |
| `quiz/keys/` | Answer keys (admin-only, encrypted) |
| `quiz/results/` | Session results (committed) |
| `tutorials/banks/` | Tutorial content |
| `tutorials/keys/` | Tutorial answer keys (gitignored) |
| `tutorials/sessions/` | Tutorial session results |
| `surveys/banks/` | Survey question banks |
| `surveys/results/` | Survey session results |
| `team.json` | Participant registry |
| `id.json` | Quick ID lookup |
| `quiz/results/_index.json` | Session index |
| `quiz/manuals/` | Documentation |

## Participant Flow

1. `/quiz-register` (admin) or auto-register on first `/quiz-run`
2. `/quiz-practice` (optional)
3. `/quiz-run` (submit)
4. `/quiz-send` (admin sends results)

## Admin Flow

1. `/quiz-create` → add questions
2. create-key → encrypt-key
3. `/quiz-register` → import participants
4. git push
5. Wait for participants
6. git pull → `/quiz-report` → `/quiz-send`

## Session ID Format

| Prefix | Mode |
|--------|------|
| `q-` | Live quiz |
| `p-` | Practice |
| `s-` | Survey |
| `t-` | Tutorial |

## Key Scripts

```bash
# Bank management
node quiz/cli/create-bank.js --name "Topic" --id topic
node quiz/cli/add-question.js --bank banks/topic.json --id q-001 ...
node quiz/cli/validate-bank.js banks/topic.json

# Key management
node quiz/cli/create-key.js --bank banks/topic.json
node quiz/cli/validate-key.js --key keys/topic.json --bank banks/topic.json
node quiz/cli/encrypt-key.js keys/topic.json

# Multi-person key management
node quiz/cli/manage-keys.js --upload-key --id ID --public-key KEY
node quiz/cli/manage-keys.js --approve --id ID
node quiz/cli/manage-keys.js --reject --id ID --reason "..."
node quiz/cli/manage-keys.js --grant --key KEY --read ID,GROUP
node quiz/cli/manage-keys.js --revoke --key KEY --read ID
node quiz/cli/manage-keys.js --list-keys
node quiz/cli/manage-keys.js --list-access
node quiz/cli/manage-keys.js --who-access-for --id ID

# Participant management
node quiz/cli/manage-participants.js --list
node quiz/cli/manage-participants.js --add --id ID --name "Name"
node quiz/cli/manage-participants.js --import file.csv

# Evaluation and reports
node quiz/cli/evaluate.js --bank javascript.json --all
node quiz/cli/admin-report.js --bank javascript.json
node quiz/cli/admin-report.js --participant STU-001

# Survey admin
node quiz/cli/survey-admin-report.js --list
node quiz/cli/survey-admin-report.js --bank feedback.json
node quiz/cli/survey-admin-report.js --bank feedback.json --csv report.csv

# Results
node quiz/cli/send-results.js --bank javascript.json --list
node quiz/cli/send-results.js --bank javascript.json --all

# Tutorial key management
node tutorials/cli/create-key.js --bank banks/tutorial.json
node tutorials/cli/create-key.js --key keys/tutorial.json --add step-001 --correct 1
node tutorials/cli/create-key.js --list
```
