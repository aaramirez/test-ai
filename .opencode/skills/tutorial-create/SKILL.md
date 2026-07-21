---
name: tutorial-create
description: Create, validate, and manage interactive tutorial content. Add steps of 7 different types with branching, scenarios, and challenges.
license: MIT
scripts:
  - ../../tutorials/cli/create-tutorial.js
  - ../../tutorials/cli/add-step.js
  - ../../tutorials/cli/validate-tutorial.js
---

# Tutorial Creation Skill

Create and manage interactive tutorial content with 7 step types.

## Workflow

### 1. Plan the Tutorial

Before creating, ask the user for:
- **Language** (Español or English)
- **Name** and description
- **ID** (lowercase, hyphens only)
- **Difficulty** (easy, medium, hard)
- **Duration** estimate in minutes

Then plan:
- **Steps** — what to teach, how to check understanding
- **Branching** — where users choose paths
- **Challenges** — hands-on exercises

All step content (titles, questions, options, feedback) must be written in the selected language.

### Spanish Accent Rules

**CRITICAL — When writing in Spanish, ALWAYS use proper accents:**

| Wrong | Correct | Rule |
|-------|---------|------|
| decision | decisión | Words ending in -cion |
| accion | acción | Words ending in -cion |
| informacion | información | Words ending in -cion |
| opcion | opción | Words ending in -cion |
| educacion | educación | Words ending in -cion |
| introduccion | introducción | Words ending in -cion |
| participacion | participación | Words ending in -cion |
| evaluacion | evaluación | Words ending in -cion |
|aplicacion | aplicación | Words ending in -cion |
| pregunta | pregunta | No accent needed |
| completado | completado | No accent needed |
| continuar | continuar | No accent needed |
| puntuacion | puntuación | Words ending in -cion |
| racha | racha | No accent needed |
| logros | logros | No accent needed |

**Always verify accents before saving any Spanish content.**

### 2. Create Tutorial Shell

The tutorial JSON must include a `language` field:

```json
{
  "name": "Tutorial Name",
  "language": "es",
  "description": "",
  "version": "1.0.0",
  "type": "tutorial",
  ...
}
```

```bash
node tutorials/cli/create-tutorial.js --name "Tutorial Name" --id tutorial-id --difficulty easy --duration 10
```

After creation, add `"language": "es"` or `"language": "en"` to the JSON file.

### 3. Add Steps

Use `add-step.js` for each step. Types available:

#### Content
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id intro --type content \
  --title "Welcome" --body "In this tutorial you will learn..."
```

#### Question
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id q-001 --type question \
  --question "What does X do?" \
  --options "Option A" "Option B" "Option C" \
  --difficulty easy --hint "Think about Y"
```

#### Choice (Branching)
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id choice-001 --type choice \
  --question "Choose your path:" \
  --options "Advanced" "Standard" "Skip" \
  --goto "step-002a"
```

#### Code Exercise
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id code-001 --type code \
  --title "Try It" --body "Run this command:" \
  --code "echo hello" --expected-output "hello" --language bash
```

#### Challenge
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id challenge-001 --type challenge \
  --title "Your Challenge" --instructions "Create a file called test.txt with content 'Hello'"
```

#### Scenario
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id scenario-001 --type scenario \
  --title "The Decision" --narrative "You are at a crossroads..." \
  --options "Go left" "Go right" \
  --correct "Go left" --feedback "Smart choice!"
```

#### Checkpoint (Gate)
```bash
node tutorials/cli/add-step.js --tutorial banks/tutorial.json \
  --id checkpoint-001 --type checkpoint \
  --question "Quick check" --options "A" "B" "C" \
  --min-score 1
```

### 4. Create Answer Key

Create `tutorials/keys/<tutorial-id>.json`:
```json
{
  "bank": "tutorial-id.json",
  "bank_version": "1.0.0",
  "answers": {
    "q-001": { "correct": "Option B", "explanation": "Because..." },
    "checkpoint-001": { "correct": "B" }
  }
}
```

### 5. Validate

```bash
node tutorials/cli/validate-tutorial.js tutorial-id.json
node tutorials/cli/validate-tutorial.js --key keys/tutorial-id.json tutorial-id.json
```

## Step Types Reference

| Type | Purpose | Required Fields |
|------|---------|----------------|
| `content` | Teach concept | `title`, `body` |
| `question` | Knowledge check | `question`, `options` (2+) |
| `choice` | Branching path | `question`, `options` (2+) with `goto` |
| `code` | Run exercise | `title`, `code` |
| `challenge` | Hands-on task | `title`, `instructions` |
| `scenario` | Story decision | `title`, `narrative`, `options` with `feedback` |
| `checkpoint` | Gate quiz | `question`, `options` (2+), `min_score_to_pass` |

## Tips

- Start with content steps to teach
- Follow with question steps to check understanding
- Use choice steps for branching paths
- Add code steps for hands-on practice
- Use checkpoints before advanced sections
- End with a summary or challenge
- Keep tutorials under 15 minutes
- Use `randomize.options: true` in the tutorial JSON

## Related

- [[tutorial]] — run tutorials
- [[tutorial-admin]] — reports
