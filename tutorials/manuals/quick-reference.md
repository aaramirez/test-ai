# Tutorial Quick Reference

## Commands

| Command | Description |
|---------|-------------|
| `/tutorial` | Run an interactive tutorial |
| `/tutorial-create` | Create a new tutorial |
| `/tutorial-report` | View completion reports |
| `/tutorial-key` | Manage tutorial answer keys |

## CLI Scripts

### Create Tutorial
```bash
node tutorials/cli/create-tutorial.js --name "Name" --id id --difficulty easy
```

### Add Step
```bash
node tutorials/cli/add-step.js --tutorial banks/id.json \
  --id step-001 --type content --title "T" --body "B"
```

### Validate
```bash
node tutorials/cli/validate-tutorial.js banks/id.json
node tutorials/cli/validate-tutorial.js --key keys/id.json banks/id.json
```

### Create Key
```bash
node tutorials/cli/create-key.js --bank banks/id.json
node tutorials/cli/create-key.js --key keys/id.json --add q-001 --correct 1
node tutorials/cli/create-key.js --list
```

## Step Types

| Type | Key | Scorable | Branching |
|------|-----|----------|-----------|
| `content` | No | No | No |
| `question` | Yes | Yes | No |
| `choice` | No | No | Yes |
| `code` | No | No | No |
| `challenge` | No | No | No |
| `scenario` | Embedded | Yes | Yes |
| `checkpoint` | Yes | Yes | No |

## XP System

| Action | XP |
|--------|-----|
| Correct answer | +10 |
| Code run | +5 |
| Challenge | +20 |
| Streak 3 | +5 |
| Streak 5 | +10 |
| Streak 10 | +25 |

## File Locations

| Path | Purpose | Committed |
|------|---------|-----------|
| `tutorials/banks/` | Tutorial content | Yes |
| `tutorials/keys/` | Answer keys | No |
| `tutorials/sessions/` | Session results | Yes |
| `tutorials/registry.json` | Completion tracking | Yes |

## Session ID Format

Prefix: `t-` for tutorial sessions.

## Related

- [Participant Guide](participant.md) |
- [Admin Guide](admin.md)
