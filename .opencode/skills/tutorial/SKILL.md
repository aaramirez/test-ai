---
name: tutorial
description: Run interactive tutorials with branching paths, gamification, and progress tracking. Engaging learning experiences with XP, streaks, and achievements.
license: MIT
scripts:
  - ../../tutorials/lib/schema.js
  - ../../tutorials/lib/session.js
  - ../../tutorials/lib/registry.js
  - ../../tutorials/lib/xp.js
---

# Tutorial Skill

Run interactive tutorials with branching paths, gamification, and real-time progress tracking.

## Language Support

**IMPORTANT — All UI text must match the tutorial language.**

Detect language from the tutorial's `language` field (default: `es`). Use these translations:

### UI Translations

| Element | Español | English |
|---------|---------|---------|
| Step label | Paso X/N | Step X/N |
| Continue button | Continuar | Continue |
| Correct feedback | Correcto! | Correct! |
| Incorrect feedback | Incorrecto | Incorrect |
| XP label | XP | XP |
| Streak label | Racha | Streak |
| Achievements label | Logros | Achievements |
| Score label | Puntuacion | Score |
| Completed status | Completado | Completed |
| Failed status | No aprobado | Failed |
| Checkpoint warning | Debes aprobar para continuar | You must pass to continue |
| Summary title | Resumen | Summary |
| Tutorial complete | Tutorial Completado! | Tutorial Complete! |
| Session saved | Sesion guardada en | Session saved to |
| Git upload question | Deseas subir los resultados a git? | Do you want to upload results to git? |

### Achievement Translations

| Achievement (es) | Achievement (en) | Condition |
|------------------|------------------|-----------|
| Primeros Pasos | First Steps | Complete first tutorial |
| Puntuacion Perfecta | Perfect Score | Score 100% |
| En Llamas | On Fire | Streak of 5+ |
| Corredor de Codigo | Code Runner | Run all code exercises |
| Aprendiz Rapido | Speed Learner | Complete in < 5 min |
| Explorador | Explorer | Complete 3+ tutorials |

### Todo List Language

When creating todo items, use the tutorial language:
- **Español:** "Paso X/N: titulo (tipo)" 
- **English:** "Step X/N: title (type)"

## Question Tool Rules

**IMPORTANT — Always follow these rules:**

1. **Always use the question tool** — Never output plain text for interactive steps
2. **Use tabs format** — Header becomes the tab label
3. **No free text for quiz steps** — Questions, choices, checkpoints use defined options only
4. **Free text only for output** — Code exercises ask for command output
5. **`custom: false`** — Prevent free text input on interactive steps

## How It Works

### 1. Identify the Participant

Check if `id.json` already has a registered participant:

```javascript
import { findParticipant, hasRegisteredId } from './quiz/lib/participant.js';
const existing = hasRegisteredId();
```

If found, use existing participant. If not, follow quiz identification flow.

### 2. List Available Tutorials

List `tutorials/banks/*.json` and show available tutorials:

```javascript
import { listTutorials, loadTutorial } from './tutorials/lib/schema.js';
const tutorials = listTutorials();
```

Use **question** tool to select:
```javascript
{
  header: "Tutoriales",
  question: "¿Qué tutorial deseas completar?",
  options: tutorials.map(t => ({
    label: t.name,
    description: `~${t.duration_estimate} min | ${t.difficulty} | ${t.steps.length} pasos`
  })),
  custom: false
}
```

### 3. Show Tutorial Overview

Before starting, display:
- Tutorial name and description
- Estimated duration
- Step count and types
- XP rewards

### 4. Start Session

```javascript
import { createSession, saveSession } from './tutorials/lib/session.js';
const session = createSession({ tutorial, tutorialName, key, participant });
saveSession(session);
```

### 5. Present Steps

Process steps sequentially. For each step type:

#### Content Step
- Render title and body using markdown
- Use ASCII art or diagrams if `visual` is provided
- Auto-advance to next step

#### Question Step
- Use **question** tool with options from the step
- Compare answer against key using label matching
- Show feedback and XP earned
- Update streak (correct → +1, wrong → reset)

#### Choice Step
- Use **question** tool with options
- Follow `goto` to selected step
- Branch paths may have bonus XP

#### Code Step
- Display code block using markdown
- Ask user to run commands and report output
- Validate output against `expected_output`
- Award XP for running

#### Challenge Step
- Display instructions
- User creates/modifies files using read/write tools
- Validate against challenge validation rules
- Award XP on success

#### Scenario Step
- Render narrative using markdown
- Use **question** tool with scenario options
- Show feedback from selected option
- Award XP for correct choice

#### Checkpoint Step
- Mini-gate quiz
- Must score `min_score_to_pass` to continue
- If failed, show review message and re-present

### 6. Update Progress

After each step:
```javascript
import { updateSession } from './tutorials/lib/session.js';
updateSession(session.session_id, {
  step_completed: stepId,
  answer: { selected: label, correct: isCorrect },
  xp: xpEarned,
  next: nextStepId,
});
```

### 7. Complete Tutorial

When all steps done:
1. Calculate final score
2. Check achievements
3. Mark in registry
4. Show results summary

```javascript
import { markCompleted } from './tutorials/lib/registry.js';
markCompleted(participantId, tutorialName, {
  session_id, score_percentage, xp_earned, achievements
});
```

### 8. Git Upload (Optional)

Ask user if they want to save results via git.

## Achievement System

| Achievement | Condition | Icon |
|------------|-----------|------|
| First Steps | Complete first tutorial | 🏆 |
| Perfect Score | Score 100% | 💎 |
| On Fire | Streak of 5+ | 🔥 |
| Code Runner | Run all code exercises | 💀 |
| Speed Learner | Complete in < 5 min | ⚡ |
| Explorer | Complete 3+ tutorials | 🧭 |

## Session ID Format

`t-YYYY-MM-DD-xxxxxx` (prefix `t-` for tutorials)

## Related

- [[tutorial-create]] — create and manage tutorials
- [[tutorial-admin]] — reports and registry
