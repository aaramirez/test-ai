---
name: tutorial-admin
description: Admin reports, completion tracking, and tutorial lifecycle management. View who completed what, scores, and achievements.
license: MIT
scripts:
  - ../../tutorials/lib/registry.js
  - ../../tutorials/lib/session.js
  - ../../tutorials/lib/schema.js
---

# Tutorial Admin Skill

Manage tutorial lifecycle: view completions, generate reports, and track participant progress.

## Reports

### Participant Report

Show all tutorials completed by a participant:

```javascript
import { getCompletedTutorials, getScore, getAll } from './tutorials/lib/registry.js';
const completed = getCompletedTutorials(participantId);
```

Display:
- Tutorial name
- Score percentage
- XP earned
- Achievements unlocked
- Date completed

### Tutorial Report

Show all participants who completed a specific tutorial:

```javascript
import { getParticipantsForTutorial } from './tutorials/lib/registry.js';
const participants = getParticipantsForTutorial(tutorialName);
```

Display:
- Participant name and ID
- Score
- Completion date

### Global Stats

```javascript
import { getAll } from './tutorials/lib/registry.js';
const registry = getAll();
```

Calculate:
- Total completions
- Average score
- Most popular tutorials
- Top achievements

## Registry Format

`tutorials/registry.json`:
```json
{
  "STU-001": {
    "git-fundamentals.json": {
      "completed": true,
      "date": "2026-07-20T10:08:32Z",
      "session_id": "t-2026-07-20-a1b2c3",
      "score_percentage": 83,
      "xp_earned": 120,
      "achievements": ["first_tutorial", "on_fire"]
    }
  }
}
```

## Session Files

`tutorials/sessions/<tutorial>/<session>.json` contains full session data:
- All answers with correctness
- Step completion order
- XP and streak history
- Duration and achievements

## Admin Commands

| Command | Description |
|---------|-------------|
| `/tutorial-report` | View completion reports |
| `/tutorial-admin` | Admin management |

## Related

- [[tutorial]] — run tutorials
- [[tutorial-create]] — create content
