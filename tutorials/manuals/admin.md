# Tutorial Admin Guide

## Initial Setup (One-Time)

### 1. Create a Tutorial

```bash
node tutorials/cli/create-tutorial.js --name "Tutorial Name" --id tutorial-id --difficulty easy
```

Difficulty options: `easy`, `medium`, `hard`

### 2. Add Steps

```bash
# Content step
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id intro --type content --title "Welcome" --body "Introduction text"

# Question step
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id q-001 --type question --question "What is X?" \
  --options "Option A" "Option B" "Option C" --correct 1

# Checkpoint (gate quiz)
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id cp-001 --type checkpoint --question "Checkpoint?" \
  --options "A" "B" --correct 0 --min-score 1

# Scenario
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id sc-001 --type scenario --title "Decision" --narrative "Story text" \
  --options "Option A" "Option B"

# Code exercise
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id code-001 --type code --title "Try It" --code "echo hello" \
  --expected-output "hello"

# Challenge
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id ch-001 --type challenge --title "Create File" \
  --instructions "Create a file called test.txt"
```

### 3. Create Answer Key

```bash
node tutorials/cli/create-key.js --bank banks/tutorial-id.json
```

### 4. Add Answers

```bash
node tutorials/cli/create-key.js --key keys/tutorial-id.json \
  --add q-001 --correct 1 --explanation "Correct because..."

node tutorials/cli/create-key.js --key keys/tutorial-id.json \
  --add cp-001 --correct 0 --explanation "Checkpoint answer"
```

### 5. Validate

```bash
node tutorials/cli/validate-tutorial.js banks/tutorial-id.json
node tutorials/cli/validate-tutorial.js --key keys/tutorial-id.json banks/tutorial-id.json
```

## Daily Operations

### Before a Tutorial Session
1. Verify tutorial bank is complete and validated
2. Verify answer key exists and is correct
3. Check that tutorials/keys/ is in .gitignore

### During a Tutorial Session
1. Participant runs `/tutorial`
2. Agent presents questions, tracks XP and streaks
3. Sessions are saved to tutorials/sessions/

### After a Tutorial Session
1. Run `/tutorial-report` to view completion stats
2. Check participant progress and achievements
3. Review any failed checkpoints

## Viewing Reports

```bash
# Via command
/tutorial-report

# View specific participant
/tutorial-report --participant 100

# View specific tutorial
/tutorial-report --tutorial tutorial-id
```

## Gamification System

### XP Values
| Action | XP |
|--------|-----|
| Correct answer | +10 |
| Code exercise run | +5 |
| Challenge completed | +20 |
| Streak 3 | +5 bonus |
| Streak 5 | +10 bonus |
| Streak 10 | +25 bonus |

### Achievements
| Achievement | Condition |
|-------------|-----------|
| Primeros Pasos | Complete first tutorial |
| Puntuacion Perfecta | Score 100% |
| En Llamas | Streak of 5+ |
| Corredor de Codigo | Run all code exercises |
| Aprendiz Rapido | Complete in < 5 min |
| Explorador | Complete 3+ tutorials |

## Step Types Reference

| Type | Needs Key | Scorable | Branching |
|------|-----------|----------|-----------|
| `content` | No | No | No |
| `question` | Yes | Yes | No |
| `choice` | No | No | Yes |
| `code` | No | No | No |
| `challenge` | No | No | No |
| `scenario` | Embedded | Yes | Yes |
| `checkpoint` | Yes | Yes | No |

## File Locations

| Path | Purpose | Committed |
|------|---------|-----------|
| `tutorials/banks/` | Tutorial content | Yes |
| `tutorials/keys/` | Answer keys | No (gitignored) |
| `tutorials/sessions/` | Session results | Yes |
| `tutorials/registry.json` | Completion tracking | Yes |

## Troubleshooting

### "Bank not found"
- Check that the tutorial bank file exists in `tutorials/banks/`
- Verify the filename matches exactly (case-sensitive)

### "Key already exists"
- Delete the existing key or use a different name
- Keys are in `tutorials/keys/`

### Checkpoint not passing
- Participant must score at least `min_score` to proceed
- Check the checkpoint step configuration in the bank

### XP not tracking
- Check that `tutorials/registry.json` exists and is writable
- Verify participant ID is consistent across sessions

## Related

- [Participant Guide](participant.md) — How to take tutorials
- [Quick Reference](quick-reference.md) — All tutorial commands
