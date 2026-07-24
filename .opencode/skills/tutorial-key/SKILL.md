---
name: tutorial-key
description: Create and manage answer keys for interactive tutorials — question, checkpoint, and scenario steps.
license: MIT
scripts:
  - ../../tutorials/cli/create-key.js
  - ../../tutorials/cli/validate-tutorial.js
---

# Tutorial Key Management

Create answer keys for tutorials. Tutorials have scorable steps (question, checkpoint, scenario) that need correct answers.

## Create Key from Tutorial

```bash
node tutorials/cli/create-key.js --bank banks/tutorial.json
```

## Add Answer to Key

```bash
node tutorials/cli/create-key.js --key keys/tutorial.json \
  --add q-001 --correct 1 --explanation "La respuesta correcta es B"
```

## List Tutorial Keys

```bash
node tutorials/cli/create-key.js --list
```

## Validate Tutorial Key

```bash
node tutorials/cli/validate-tutorial.js --key keys/tutorial.json banks/tutorial.json
```

## Scorable Step Types

| Type | Needs Key | Notes |
|------|-----------|-------|
| `content` | No | Teaching material |
| `question` | Yes | Knowledge check |
| `choice` | No | Branching path |
| `code` | No | Run exercise |
| `challenge` | No | File creation |
| `scenario` | Embedded | `correct` in bank options |
| `checkpoint` | Yes | Gate quiz |

## Workflow

1. Create tutorial with [[tutorial-create]]
2. Add steps of various types
3. Create key: `create-key.js --bank banks/tutorial.json`
4. Add answers for question/checkpoint steps
5. Validate key against tutorial
6. Tutorial is ready to run

## Security

- Keys are stored in `tutorials/keys/` — gitignored
- Never commit answer keys to git
- Use encryption for team sharing

## Related Skills

- [[tutorial-create]] — Create tutorials
- [[tutorial]] — Run tutorials
- [[quiz-key]] — Quiz key management
