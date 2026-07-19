---
name: quiz
description: Run knowledge quizzes and surveys with practice and live modes. Loads questions from quiz/banks/ and uses quiz/keys/ for evaluation.
license: MIT
scripts:
  - ../../quiz/cli/run-quiz.js
---

# Quiz & Survey Skill

Run quizzes and surveys interactively. Supports practice mode (with immediate feedback) and live mode (results saved for evaluation).

## Question Tool Rules

**IMPORTANT — Always follow these rules:**

1. **Always use the question tool** — Never output plain text questions
2. **Use tabs format** — Header becomes the tab label
3. **No free text options** — When questions have defined options (quizzes, tests, practice), only show those options
4. **Free text only for identification** — Cédula, name, email use free text input (no options array)

## How It Works

### 1. Identify the Participant

First check if `id.json` already has a registered participant:

```javascript
import { hasRegisteredId, findParticipant, findById, registerParticipant } from './quiz/lib/participant.js';

const existing = hasRegisteredId();
```

**If `existing` is not null**, auto-use that participant:
```javascript
if (existing) {
  const participant = findParticipant(existing.id);
  // Inform the user: "Bienvenido {name}! Usando tu registro existente."
  // Skip directly to step 2 (Choose Mode)
}
```

**If `existing` is null** (no `id.json` or empty), use the current flow:

Use the **question** tool to ask for cédula:
```javascript
// question tool with no options = free text input
{ header: "Cédula", question: "¿Cuál es tu cédula?" }
```

Look them up in `id.json` using `findById`:
```javascript
const idData = findById(cedula);
```

If found, use the stored name/email and look up full profile in `team.json`:
```javascript
const participant = findParticipant(cedula);
```

If NOT found, use the **question** tool to ask for name and email:
```javascript
// question tool with no options = free text input
{ header: "Nombre", question: "¿Cuál es tu nombre?" }
{ header: "Correo electrónico", question: "¿Cuál es tu correo electrónico?" }
```

Then register them:
```javascript
registerParticipant({ id: cedula, name, email });
```

### 2. Choose Mode

Use the **question** tool to select mode:
```javascript
{
  header: "Modo",
  question: "¿Qué modo deseas usar?",
  options: [
    { label: "Práctica", description: "Feedback inmediato, sin guardar para evaluación" },
    { label: "En vivo", description: "Sin feedback, resultados guardados para evaluación" }
  ],
  custom: false
}
```

| Mode | Feedback | Saved | Use Case |
|------|----------|-------|----------|
| **Practice** | ✅ Immediate per question | ✅ As practice | Learn and prepare |
| **Live** | ❌ Never shown | ✅ As live | Submit real results for admin evaluation |

### 3. Select Bank

Use the **question** tool to select bank:
```javascript
{
  header: "Seleccionar banco",
  question: "¿Qué banco de preguntas deseas usar?",
  options: banks.map((bank, i) => ({ label: `[${i+1}] ${bank.name}`, description: bank.file })),
  custom: false
}
```

List available banks from `quiz/banks/` using `listQuizBanks()` (excludes survey banks). Filter by difficulty and count if needed.

### 4. Present Questions

Use the **question** tool to present each question:
- `header`: "Pregunta 1", "Pregunta 2", etc.
- `question`: the question text
- `options`: array of `{ label, description }` — ONLY use options defined in the bank
- `custom: false` — never allow free text answers
- `multiple`: true for `type: "multiple"` questions
- Do NOT add free text options — only the defined options

### 5. Practice Mode Flow

After each answer, immediately show:
- ✅ Correct or ❌ Incorrect
- The correct answer
- The explanation from the key

At the end, show final score and encourage trying live.

### 6. Live Mode Flow

No feedback during quiz. After all questions:
- Show **"Tus respuestas han sido registradas"** — do NOT show any score or results
- Save result to `quiz/results/<bank>/q-<session>.json`
- Update `quiz/results/_index.json`
- Results are evaluated later by an admin

### 7. Upload Results (Optional)

Use the **question** tool to ask about git upload:
```javascript
{
  header: "Subir resultados",
  question: "¿Deseas subir tus resultados por git?",
  options: [
    { label: "Sí", description: "Commitear y push a GitHub" },
    { label: "No", description: "Guardar localmente" }
  ],
  custom: false
}
```

If yes, use the git-results module:

```javascript
import { commitAndPushResult } from './quiz/lib/git-results.js';
const sessionPath = `quiz/results/${bank}/${session.session_id}.json`;
const result = commitAndPushResult(sessionPath, 'quiz');
```

Report the result:
- committed + pushed: "Resultados subidos exitosamente."
- committed but push failed: "Commiteado localmente, pero falló el push: <error>"
- not committed (already committed): "Los resultados ya fueron commiteados."
- error: "No se pudieron subir los resultados: <error>"

## Result Formats

### Live Quiz Result (before admin evaluation)
```json
{
  "session_id": "q-2026-07-15-a1b2c3",
  "date": "2026-07-15T10:00:00Z",
  "mode": "live",
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "participant": { "id": "STU-001", "name": "Jane Doe", "email": "jane@example.com" },
  "questions": [
    { "id": "js-001", "type": "single", "selected": [1] }
  ],
  "score": null,
  "evaluated": false,
  "sent": false
}
```

### Live Quiz Result (after admin evaluation — Mode A)
```json
{
  "session_id": "q-2026-07-15-a1b2c3",
  "date": "2026-07-15T10:00:00Z",
  "mode": "live",
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "participant": { "id": "STU-001", "name": "Jane Doe", "email": "jane@example.com" },
  "questions": [
    { "id": "js-001", "type": "single", "selected": [1], "correct": true }
  ],
  "score": { "correct": 1, "total": 3, "percentage": 33 },
  "evaluated": true,
  "sent": false
}
```

### Live Quiz Result (after admin evaluation — Mode B, score-only)
```json
{
  "session_id": "q-2026-07-15-a1b2c3",
  "date": "2026-07-15T10:00:00Z",
  "mode": "live",
  "bank": "javascript.json",
  "bank_version": "1.0.0",
  "participant": { "id": "STU-001", "name": "Jane Doe", "email": "jane@example.com" },
  "questions": [
    { "id": "js-001", "type": "single", "selected": [1] }
  ],
  "score": { "correct": 1, "total": 3, "percentage": 33 },
  "evaluated": true,
  "sent": false
}
```

### Practice Result
Same structure but `mode: "practice"` and no `evaluated`/`sent` fields.

## Commands

| Command | Description |
|---------|-------------|
| `/quiz-practice` | Practice quiz with immediate feedback |
| `/quiz-run` | Live quiz — results saved and evaluable |

## Related

- [[quiz-bank]] — create and manage banks
- [[quiz-key]] — create answer keys
- [[quiz-participant]] — manage participants
- [[quiz-admin]] — evaluate and report
- [[quiz-results]] — send results via email
