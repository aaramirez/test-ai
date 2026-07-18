---
name: quiz-participant
description: Register, list, find, and manage quiz participants.
license: MIT
scripts:
  - ../../quiz/cli/manage-participants.js
---

# Participant Management

Register and manage quiz participants. Participants are identified once and their info is reused across all sessions.

## Register Single Participant

```bash
node quiz/cli/manage-participants.js --add --id STU-001 --name "Jane Doe" --email "jane@example.com"
```

## Bulk Import from CSV

```bash
node quiz/cli/manage-participants.js --import participants.csv
```

CSV format:
```csv
id,name,email,group
STU-001,Jane Doe,jane@example.com,cohorte-2026
```

## List All Participants

```bash
node quiz/cli/manage-participants.js --list
```

## Find by ID

```bash
node quiz/cli/manage-participants.js --find STU-001
```

## Search by Name

```bash
node quiz/cli/manage-participants.js --search "Jane"
```

## View Groups

```bash
node quiz/cli/manage-participants.js --groups
```

## Auto-Registration

When a participant starts a quiz and is not in the registry, they are auto-registered with the info they provide. Their info is reused in future sessions.

## Related

- [[quiz]] — participants are identified at quiz start
- [[quiz-admin]] — view participant history in reports
