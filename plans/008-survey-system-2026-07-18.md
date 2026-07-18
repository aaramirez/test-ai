# Survey System — Pending Surveys, Taken Registry, Dedicated Storage

## Objective

Create a dedicated survey subsystem where participants check pending surveys via `/survey`, submit answers, track which surveys they have completed in a taken registry, and store survey results in a separate `/surveys` directory instead of intermingling with quiz results.

## Requirements

1. **Dedicated `/survey` command** — `.opencode/commands/survey.md` that lists pending surveys for the participant and lets them take any incomplete survey. Does NOT reuse `/quiz-run` — priority: high

2. **Survey tracking registry** — `surveys/registry.json` that maps `{ participant_id: { bank_name: { taken: true/false, session_id: "..." } } }`. This is committed to track who has completed which surveys — priority: high

3. **Dedicated `surveys/` directory at project root** — a new top-level `surveys/` directory (sibling to `quiz/` and `.opencode/`) stores all survey data. `quiz/` stays purely for quiz/system code. Survey results go to `surveys/results/<bank_name>/<session_id>.json`. Registry and index live at `surveys/registry.json` and `surveys/_index.json` — priority: high

4. **Survey skill** — `.opencode/skills/survey/SKILL.md` describing the survey workflow end-to-end — priority: high

5. **`/survey` command workflow**:
   - Participant ID → check registry → list which survey banks are NOT taken
   - If no pending surveys: "You have completed all available surveys. Thank you!"
   - If pending: let user select one → present questions → save answers → mark taken in registry
   - Show confirmation: "Your responses have been recorded. Thank you!"
   - Option to take another pending survey — priority: high

6. **Survey result format** — stored identically to current survey sessions (`s-` prefix, `mode: "survey"`, score `null`, no `evaluated`/`sent`), but in `surveys/results/` instead of `quiz/results/` — priority: high

7. **`install.js` must include `surveys/`** — add `surveys/` (top-level) to the installer's file list. Also ensure it's NOT excluded by the current exclusion filters — priority: medium

8. **Backward compatibility** — existing survey banks (`quiz/banks/feedback-survey.json`) must work with the new system. `install.js` must copy `surveys/` — priority: medium

9. **Tests** — registry operations, pending survey detection, result saving to surveys directory, session ID generation for surveys, CLI argument parsing — priority: high

10. **No npm dependencies** — same as all other quiz code — priority: high

## Architecture

### Key Design Decisions

1. **`/survey` is a standalone command** that loads the `survey` skill. It does NOT reuse `/quiz-run`. The skill handles: identify participant, check registry, list pending, present questions, save results, update registry.

2. **Registry vs. index** — The registry (`surveys/registry.json`) tracks *completion status per participant per survey bank*. The index (`surveys/_index.json`) tracks *session files by session ID / participant ID / bank name* for lookup. Both are needed:
   - Registry: quick "has user X taken bank Y?" check without loading all sessions
   - Index: standard session lookup (loadResult, listByParticipant)

3. **Results go to `surveys/results/`** — a new top-level directory alongside `quiz/` and `.opencode/`:
   ```
   surveys/
     registry.json        — { "STU-001": { "feedback-survey.json": { taken: true, session_id: "s-...", date: "..." } } }
     _index.json          — standard session index
     results/
       feedback-survey/
         s-2026-07-18-abc123.json
         s-2026-07-18-def456.json
   ```

4. **`surveys/` has its own session management** — a new `survey-session.js` module handles `saveSurveyResult()`, `loadSurveyResult()`, `loadSurveyIndex()`, `loadSurveyRegistry()`, `updateSurveyRegistry()`. These mirror `session.js` but point to `surveys/` paths (relative to project root, NOT inside `quiz/`).

5. **Existing `session.js` session ID generation works** — `generateSessionId('survey')` already produces `s-YYYY-MM-DD-xxxxxx`. We reuse this function.

6. **Existing `scorer.js` works** — surveys bypass scoring already.

7. **Existing bank validation works** — survey banks without `difficulty` pass validation.

8. **No key needed** — surveys have no correct answers, no key is created or validated.

9. **`install.js` gets `surveys/` added** to its file list and exclusion passes. The directory structure is created by `mkdirSync` in the survey session module on first save.

### File changes

#### New files

| File | Purpose |
|------|---------|
| `.opencode/commands/survey.md` | `/survey` command — loads survey skill, passes participant ID and target bank from `$ARGUMENTS` |
| `.opencode/skills/survey/SKILL.md` | Survey skill — end-to-end workflow: identify, check pending, present, save, register |
| `quiz/lib/survey-session.js` | Survey session management: save result, load result, load/update index, load/update registry |
| `quiz/tests/survey-session.test.js` | Tests for survey-session.js |

#### Modified files

| File | Changes |
|------|---------|
| `opencode.json` | Add `command.survey` entry |
| `AGENTS.md` | Add `survey` skill, `/survey` command, `survey/` directory to structure tree, `survey-session.js` to scripts |
| `quiz/cli/install.js` | Add `'surveys'` to the `subDirs` array in `getFileList()` alongside `'quiz'` and `'.opencode'` |
| `opencode.json` `command.survey` template | References the survey skill and uses `$ARGUMENTS` for optional participant or bank filter |

### Survey Session Module (`quiz/lib/survey-session.js`)

Mirrors `quiz/lib/session.js` but uses `PROJECT_ROOT/surveys/` as the base path:

```js
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const SURVEYS_DIR = join(PROJECT_ROOT, 'surveys');
const RESULTS_DIR = join(SURVEYS_DIR, 'results');
const INDEX_PATH = join(SURVEYS_DIR, '_index.json');
const REGISTRY_PATH = join(SURVEYS_DIR, 'registry.json');
```

Exported functions:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `ensureSurveyDirs` | `() => void` | Create `surveys/`, `surveys/results/` if missing |
| `saveSurveyResult` | `(session) => string` | Write session to `surveys/results/<bank>/` + update index + update registry |
| `loadSurveyResult` | `(sessionId) => object` | Load session from index lookup |
| `loadSurveyIndex` | `() => object` | Load `surveys/_index.json` |
| `loadSurveyRegistry` | `() => object` | Load `surveys/registry.json` |
| `updateSurveyRegistry` | `(participantId, bankName, sessionId, date) => void` | Mark survey as taken |
| `getPendingSurveys` | `(participantId, allBanks) => string[]` | Return list of bank names NOT yet taken by participant |
| `listBanks` | `() => string[]` | List survey banks (those with `type: "survey"` questions or in a survey-specific directory) |

**Simplification:** For `listBanks()`, we scan `quiz/banks/` and filter banks where at least one question has `type: "survey"`. This avoids requiring a separate survey banks directory.

### `getPendingSurveys` logic

```
1. Load registry
2. Get participant entry: registry[participantId] or {}
3. Get all survey banks from listBanks()
4. Filter: return banks where registry[participantId][bankName]?.taken !== true
```

### Survey Session ID

Reuses `generateSessionId('survey')` from `session.js` → `s-YYYY-MM-DD-xxxxxx`.

### Survey Result Format (unchanged from current)

```json
{
  "session_id": "s-2026-07-18-abc123",
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

### Skill Workflow

The survey skill instructs the agent:

1. **Identify participant** — ask for participant ID, look up in `quiz/participants.json`
2. **Check pending** — call a helper: scan `quiz/banks/` for survey-type banks, compare against `surveys/registry.json`
3. **List pending** — show the user which surveys are pending (not yet taken)
4. **If none pending** — "You have completed all available surveys. Thank you!"
5. **If pending** — let user select one, present questions using the `question` tool (no feedback, no correct/incorrect)
6. **Save** — save result via `saveSurveyResult()`, update registry
7. **Confirmation** — "Your responses have been recorded. Thank you!"
8. **Offer more** — ask if they'd like to take another pending survey

### Install.js changes

The installer must include the new `surveys/` directory. Currently `getFileList()` walks `['quiz', '.opencode']`. Change the `subDirs` array to `['quiz', '.opencode', 'surveys']`. Also ensure `surveys/` is NOT caught by the exclusion filters (it won't be — the `EXCLUDE_PREFIXES` targets `plans`, `assets`, `node_modules`, and `.opencode/` sub-paths, none of which match `surveys/`).

## TDD Flow

### Red (write failing tests)

1. Create `quiz/tests/survey-session.test.js`:
   - `ensureSurveyDirs()` creates directories
   - `saveSurveyResult()` writes file to correct path and updates index
   - `loadSurveyIndex()` returns correct structure
   - `loadSurveyRegistry()` returns correct structure
   - `updateSurveyRegistry()` marks survey as taken for participant
   - `getPendingSurveys()` returns banks NOT yet taken
   - `getPendingSurveys()` returns empty array when all taken
   - Survey result file has correct format (`s-` prefix, `mode: "survey"`, score `null`)

2. Add tests to `quiz/tests/install.test.js`:
   - `getFileList` includes `surveys/` directory
   - Installing copies `surveys/registry.json`

3. Run tests → all new tests fail

### Green (implement)

1. Create `surveys/` directory structure:
   - `surveys/results/` — empty directory
   - `surveys/registry.json` — empty object `{}`
   - `surveys/_index.json` — empty index `{ sessions: {}, by_participant: {}, by_bank: {} }`

2. Create `quiz/lib/survey-session.js` with all exported functions

3. Create `.opencode/skills/survey/SKILL.md` with survey workflow

4. Create `.opencode/commands/survey.md` with command template

5. Add `command.survey` to `opencode.json`

6. Update `AGENTS.md` — add survey skill, `/survey` command, `survey/` in tree, `survey-session.js` in scripts

### Refactor

- Ensure all tests pass and edge cases are covered (empty registry, participant with no entries, no survey banks exist)

## Verification

- [ ] `node --test` — all tests pass (original + install + survey-session)
- [ ] `node .opencode/scripts/ci-validate.js` — CI validation passes
- [ ] Survey session module correctly saves to `surveys/results/<bank>/` not `quiz/results/<bank>/`
- [ ] Registry correctly tracks taken status per participant per bank
- [ ] `getPendingSurveys` correctly filters out taken banks
- [ ] `install.js` dry-run includes `surveys/` files
- [ ] `opencode.json` is valid JSON
- [ ] AGENTS.md tables are consistent
- [ ] Installer copies `surveys/` structure
