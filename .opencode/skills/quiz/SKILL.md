---
name: quiz
description: Run knowledge quizzes and surveys with practice and live modes. Loads questions from quiz/banks/ and uses quiz/keys/ for evaluation.
license: MIT
scripts:
  - ../../quiz/cli/run-quiz.js
---

# Quiz & Survey Skill

Run quizzes and surveys interactively. Supports practice mode (with immediate feedback) and live mode (results saved for evaluation).

## How It Works

### 1. Identify the Participant

Before starting, collect:
- **Participant ID** (required) — student number, employee ID, GitHub username
- **Name** (required) — display name
- **Email** (optional) — for result delivery

If the participant is already registered, their info is auto-filled from `quiz/participants.json`.

### 2. Choose Mode

| Mode | Feedback | Saved | Use Case |
|------|----------|-------|----------|
| **Practice** | ✅ Immediate per question | ✅ As practice | Learn and prepare |
| **Live** | ❌ Never shown | ✅ As live | Submit real results for admin evaluation |

### 3. Select Bank

List available banks from `quiz/banks/` using `listQuizBanks()` (excludes survey banks). Filter by difficulty and count if needed.

### 4. Present Questions

Use the **question** tool to present each question:
- `header`: "Q1", "Q2", etc.
- `question`: the question text
- `options`: array of `{ label, description }`
- `multiple`: true for `type: "multiple"` questions

### 5. Practice Mode Flow

After each answer, immediately show:
- ✅ Correct or ❌ Incorrect
- The correct answer
- The explanation from the key

At the end, show final score and encourage trying live.

### 6. Live Mode Flow

No feedback during quiz. After all questions:
- Show **"Thank you, your responses have been recorded"** — do NOT show any score or results
- Save result to `quiz/results/<bank>/q-<session>.json`
- Update `quiz/results/_index.json`
- Results are evaluated later by an admin

### 7. Upload Results (Optional)

After confirming the quiz is saved, ask the user:
> ¿Deseas subir tus resultados por git?

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
