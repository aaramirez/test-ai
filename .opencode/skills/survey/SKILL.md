---
name: survey
description: Manage surveys — check pending surveys, submit answers, track completion via a taken registry.
license: MIT
---

# Survey Skill

Manages the complete survey lifecycle: identifying participants, checking which surveys are pending, presenting questions, saving results to `surveys/results/`, and marking them as taken in the registry.

Survey results are stored separately from quiz results (in `surveys/` at the project root, not `quiz/results/`).

## Question Tool Rules

**IMPORTANT — Always follow these rules:**

1. **Always use the question tool** — Never output plain text questions
2. **Use tabs format** — Header becomes the tab label
3. **No free text options** — When questions have defined options (surveys), only show those options
4. **Free text only for identification** — Cédula, name, email use free text input (no options array)

## Workflow

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
  // Skip directly to checking pending surveys (step 2)
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

If found in `id.json`, use the stored name/email and look up full profile in `team.json`:
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

Resolve the participant's groups from `team.json`:
- Check `participant.metadata.group` (string → array of 1)
- Check the `groups` map in `team.json` to find all groups containing this participant
- Merge into a single array of group names. Pass this array to `getPendingSurveys`.

### 2. Check Pending Surveys

Scan `surveys/banks/` to find survey banks. Then call:

```javascript
import { getPendingSurveys, loadSurveyVisibility } from './quiz/lib/survey-session.js';
import { listSurveyBanks } from './quiz/lib/schema.js';

const surveyBanks = listSurveyBanks();
const pending = getPendingSurveys(participantId, surveyBanks, null, participantGroups);
```

This automatically filters out:
- Banks the participant has already taken (from `surveys/registry.json`)
- Banks whose `allowedGroups` (from `surveys/visibility.json`) don't include any of the participant's groups

If no surveys are pending, show:
```
Has completado todas las encuestas disponibles. ¡Gracias por tu participación!
```

### 3. Select & Take a Survey

Use the **question** tool to let the user select which pending survey to take:
```javascript
// question tool with options = selection, custom:false to block free text
{
  header: "Seleccionar encuesta",
  question: "¿Qué encuesta deseas completar?",
  options: pending.map((bank, i) => ({ label: `[${i+1}] ${bank.name}`, description: bank.file })),
  custom: false
}
```

Load the selected bank from `surveys/banks/` using `loadSurveyBank()`.

Present questions using the **question** tool:
- `header`: "Pregunta 1", "Pregunta 2", etc.
- `question`: the question text
- `options`: array of `{ label, description }` — ONLY use options defined in the bank
- `custom: false` — never allow free text answers
- Do NOT set `multiple` (surveys use single-select by default)
- Do NOT add free text options — only the defined options

Do NOT show any feedback (correct/incorrect). Surveys are opinion-based.

### 4. Save Results

After all questions are answered, save using the survey session module:

```javascript
import { saveSurveyResult } from './quiz/lib/survey-session.js';
import { generateSessionId } from './quiz/lib/session.js';
import { createSession } from './quiz/lib/session.js';

const session = createSession({
  mode: 'survey',
  bank: 'feedback-survey.json',
  bankVersion: bank.version,
  participant: { id, name, email },
  questions: bank.questions,
  selections: userSelections,
});

saveSurveyResult(session);
```

This:
- Writes the session JSON to `surveys/results/<bank>/<session_id>.json`
- Updates `surveys/_index.json` for lookup
- Updates `surveys/registry.json` marking this bank as taken by this participant

### 5. Confirm & Upload

Show the user:
```
Tus respuestas han sido registradas. ¡Gracias por completar la encuesta!
```

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

If yes, use the git-results module to commit and push:

```javascript
import { commitAndPushResult } from './quiz/lib/git-results.js';
const sessionPath = `surveys/results/${bank}/${session.session_id}.json`;
const result = commitAndPushResult(sessionPath, 'survey');
```

Report the result:
- committed + pushed: "Resultados subidos exitosamente."
- committed but push failed: "Commiteado localmente, pero falló el push: <error>"
- not committed (already committed): "Los resultados ya fueron commiteados."
- error: "No se pudieron subir los resultados: <error>"

Use the **question** tool to ask about another survey:
```javascript
{
  header: "Otra encuesta",
  question: "¿Deseas responder otra encuesta pendiente?",
  options: [
    { label: "Sí", description: "Ver encuestas pendientes" },
    { label: "No", description: "Finalizar" }
  ],
  custom: false
}
```

If yes, loop back to step 2. If no, end.

### 6. View Survey Results (Admin / Participant)

Participants can view their own survey responses. Admin group members (defined in `viewResultsGroups` in `surveys/visibility.json`) can view all responses for a bank.

```javascript
import { getVisibleSurveyResults } from './quiz/lib/survey-session.js';

// Participant sees only their own results
const myResults = getVisibleSurveyResults('team-feedback.json', 'STU-001', [], null);

// Admin sees all results
const allResults = getVisibleSurveyResults('team-feedback.json', 'STU-001', ['admin'], null);
```

## Visibility Configuration

Control which groups can see/take surveys and view results in `surveys/visibility.json`:

```json
{
  "feedback-survey.json": {
    "allowedGroups": ["cohorte-A"],
    "viewResultsGroups": ["admin"]
  },
  "satisfaction.json": {
    "allowedGroups": ["cohorte-B"],
    "viewResultsGroups": ["admin", "hr"]
  }
}
```

- `allowedGroups`: who can see and take the survey. Omit for unrestricted access.
- `viewResultsGroups`: who can view ALL results. Omit to restrict participants to their own results only.
- Banks not listed in `visibility.json` are visible to everyone.

## Result Format

```json
{
  "session_id": "s-2026-07-18-a1b2c3",
  "date": "2026-07-18T10:00:00.000Z",
  "mode": "survey",
  "bank": "feedback-survey.json",
  "bank_version": "1.0.0",
  "participant": { "id": "STU-001", "name": "Jane Doe", "email": "jane@example.com" },
  "questions": [
    { "id": "srv-001", "type": "survey", "selected": [0] },
    { "id": "srv-002", "type": "survey", "selected": [2] }
  ],
  "score": null
}
```

Note: surveys have `score: null`, no `evaluated` or `sent` fields — they are not scored or evaluated.

## Registry Format

```json
{
  "STU-001": {
    "feedback-survey.json": {
      "taken": true,
      "session_id": "s-2026-07-18-a1b2c3",
      "date": "2026-07-18T10:00:00.000Z"
    }
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/survey` | Check pending surveys and submit answers |

## Related

- [[quiz-bank]] — create and manage banks
- [[quiz-participant]] — manage participants
