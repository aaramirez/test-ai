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

## File Locations

| Path | Purpose |
|------|---------|
| `quiz/banks/` | Question banks (shareable) |
| `quiz/keys/` | Answer keys (admin-only, encrypted) |
| `quiz/results/` | Session results (committed) |
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

# Participant management
node quiz/cli/manage-participants.js --list
node quiz/cli/manage-participants.js --add --id ID --name "Name"
node quiz/cli/manage-participants.js --import file.csv

# Evaluation and reports
node quiz/cli/evaluate.js --bank javascript.json --all
node quiz/cli/admin-report.js --bank javascript.json
node quiz/cli/admin-report.js --participant STU-001

# Results
node quiz/cli/send-results.js --bank javascript.json --list
node quiz/cli/send-results.js --bank javascript.json --all
```
