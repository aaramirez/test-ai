---
name: survey
description: Manage surveys — check pending surveys, submit answers, track completion via a taken registry.
license: MIT
---

# Survey Skill

Manages the complete survey lifecycle: identifying participants, checking which surveys are pending, presenting questions, saving results to `surveys/results/`, and marking them as taken in the registry.

Survey results are stored separately from quiz results (in `surveys/` at the project root, not `quiz/results/`).

## Workflow

### 1. Identify the Participant

Ask for the participant ID. Look them up in `quiz/participants.json` using `findParticipant`. If not registered, ask for name and email and register them.

Resolve the participant's groups from `participants.json`:
- Check `participant.metadata.group` (string → array of 1)
- Check the `groups` map in `participants.json` to find all groups containing this participant
- Merge into a single array of group names. Pass this array to `getPendingSurveys`.

### 2. Check Pending Surveys

Scan `quiz/banks/` to find survey-type banks (questions with `type: "survey"`). Then call:

```javascript
import { getPendingSurveys, loadSurveyVisibility } from './quiz/lib/survey-session.js';

const visibility = loadSurveyVisibility();
const pending = getPendingSurveys(participantId, surveyBanks, null, participantGroups);
```

This automatically filters out:
- Banks the participant has already taken (from `surveys/registry.json`)
- Banks whose `allowedGroups` (from `surveys/visibility.json`) don't include any of the participant's groups

Present the pending surveys to the user:

```
You have <N> pending survey(s):
  [1] Course Feedback (feedback-survey.json)
  [2] Customer Satisfaction (satisfaction.json)
```

If no surveys are pending:
```
You have completed all available surveys. Thank you for your participation!
```

### 3. Select & Take a Survey

Let the user select which pending survey to take. Load the bank from `quiz/banks/`.

Present questions using the **question** tool:
- `header`: "Pregunta 1", "Pregunta 2", etc.
- `question`: the question text
- `options`: array of `{ label, description }`
- Do NOT set `multiple` (surveys use single-select by default)

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

### 5. Confirm

Show the user:
```
Your responses have been recorded. Thank you for completing the survey!
```

Ask if they'd like to take another pending survey. If yes, loop back to step 2. If no, end.

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
