# Quiz System — Admin Guide

## Initial Setup (one-time)

### 1. Create Banks

```bash
# Create a new bank
node quiz/cli/create-bank.js --name "JavaScript Basics" --id javascript --version 1.0.0

# Add questions
node quiz/cli/add-question.js --bank banks/javascript.json \
  --id js-001 --type single --difficulty easy \
  --question "What is let vs var?" \
  --options "var is block-scoped" "let is block-scoped"

# Validate
node quiz/cli/validate-bank.js banks/javascript.json
```

### 2. Create Answer Keys

```bash
# Create key from bank
node quiz/cli/create-key.js --bank banks/javascript.json

# Add answers
node quiz/cli/create-key.js --key keys/javascript.json \
  --add js-001 --correct 1 --explanation "let respects blocks"

# Validate key against bank
node quiz/cli/validate-key.js --key keys/javascript.json --bank banks/javascript.json

# Encrypt key
node quiz/cli/encrypt-key.js keys/javascript.json
```

### 3. Register Participants

```bash
# Single participant
node quiz/cli/manage-participants.js --add --id STU-001 --name "Jane Doe" --email "jane@example.com"

# Bulk import from CSV
node quiz/cli/manage-participants.js --import participants.csv

# List all
node quiz/cli/manage-participants.js --list
```

### 4. Push to GitHub

```bash
git add .
git commit -m "feat(quiz): initial setup"
git push
```

## Daily Operations

### Before a Quiz Session

1. `git pull` — get latest banks and participant list
2. Verify bank: `node quiz/cli/validate-bank.js banks/topic.json`
3. Verify key: `ls quiz/keys/topic.json`

### During a Quiz Session

1. Participants take the quiz via `/quiz-run`
2. Results are auto-saved to `quiz/results/<bank>/`
3. Results are auto-committed to GitHub

### After a Quiz Session

1. `git pull` — get all new results
2. Generate report: `/quiz-report` → select bank
3. Review per-question stats and participant scores
4. Send results: `/quiz-send` → select bank → confirm recipients
5. Export CSV if needed: `node quiz/cli/admin-report.js --bank topic.json --csv report.csv`

## Participant Management

### Pre-register from CSV

1. Create CSV with columns: id, name, email, group
2. Run: `/quiz-register` → import from CSV
3. Verify: `node quiz/cli/manage-participants.js --list`

### View Participant History

```bash
node quiz/cli/manage-participants.js --history STU-001
```

### Filter Results by Participant

```bash
node quiz/cli/admin-report.js --participant STU-001
```

## Bulk Operations

### Bulk Send Results

```bash
node quiz/cli/send-results.js --bank javascript.json --all
```

### Bulk Evaluate

```bash
node quiz/cli/evaluate.js --bank javascript.json --all
```

## File Locations

| Path | Purpose | Committed |
|------|---------|-----------|
| `quiz/banks/` | Question banks | ✅ Yes |
| `quiz/keys/` | Answer keys | ❌ No (gitignored) |
| `quiz/results/` | Session results | ✅ Yes |
| `team.json` | Participant registry | ✅ Yes |
| `id.json` | Quick ID lookup | ✅ Yes |
| `quiz/results/_index.json` | Session index | ✅ Yes |

## Troubleshooting

### "Bank not found"
Check that the bank file exists in `quiz/banks/` and the name matches.

### "Key not found"
Create the key first: `node quiz/cli/create-key.js --bank banks/topic.json`

### "SMTP not configured"
Email sending requires `.env` with SMTP settings. Results are still saved without email.

### "sops/age not installed"
Key encryption is optional. Keys work without encryption but should be gitignored.
