# Survey Visibility — Group-Based Access Control

## Objective

Restrict which surveys a participant can see/take and who can view survey results, based on group membership defined in `surveys/visibility.json`.

## Requirements

1. **`surveys/visibility.json`** — separate config file mapping `bank_name → allowedGroups` (who can see/take it) and `viewResultsGroups` (who can view all results). Banks without entry are visible to all. — priority: high

2. **`getPendingSurveys` filters by participant group** — accepts an optional `participantGroups` parameter; banks whose `allowedGroups` don't include any of the participant's groups are excluded. — priority: high

3. **`loadSurveyVisibility()`** — new export from `survey-session.js` that reads `surveys/visibility.json` and returns the map. — priority: high

4. **`getVisibleSurveyResults(bankName, participant, groups)`** — new export that returns survey results for a bank filtered by visibility: the participant can see their own results; members of `viewResultsGroups` can see all. — priority: high

5. **Skill updated** — the survey skill calls `getPendingSurveys` with the participant's groups, and uses `getVisibleSurveyResults` when showing results. — priority: medium

6. **Backward compatible** — existing `getPendingSurveys(banks, root)` works unchanged (no groups param = no filtering). Existing banks without visibility entry are unrestricted. — priority: high

7. **Tests** — visibility filtering by group, unrestricted banks, "all taken" edge case, participant sees own results, admin group sees all results, participant outside admin group only sees own. — priority: high

## Architecture

### Key Decisions

1. **visibility.json format:**
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
   - `allowedGroups`: list of groups that can see/take this survey. Omit for unrestricted.
   - `viewResultsGroups`: list of groups that can view ALL results for this survey. Omit to restrict to participants only.

2. **Participant groups:** resolved from `quiz/participants.json` via `participant.metadata.group` (single) or by checking `groups` section. Currently participants store `group` as a string in `metadata.group`. We resolve it to an array: `[metadata.group]` if set, plus check the `groups` map.

3. **`getPendingSurveys` signature change:** `(participantId, surveyBanks, root, participantGroups?)` — 4th param optional. When provided, filters out banks whose `allowedGroups` don't intersect with `participantGroups`.

4. **`getVisibleSurveyResults`:** accepts `(bankName, participantId, participantGroups, root)`. Returns filtered results:
   - If the participant is in `viewResultsGroups` for that bank → return all results
   - Otherwise → return only the participant's own results
   - If no `viewResultsGroups` defined → participant sees only their own results

### File Changes

#### New files
| File | Purpose |
|------|---------|
| `surveys/visibility.json` | Visibility rules map (initially empty `{}`) |

#### Modified files
| File | Changes |
|------|---------|
| `quiz/lib/survey-session.js` | Add `loadSurveyVisibility()`, `getVisibleSurveyResults()`, update `getPendingSurveys()` to accept groups param |
| `quiz/tests/survey-session.test.js` | Add tests for visibility filtering, `loadSurveyVisibility`, `getVisibleSurveyResults` |
| `.opencode/skills/survey/SKILL.md` | Update workflow to resolve participant groups and pass to `getPendingSurveys`, add results viewing section |
| `quiz/cli/install.js` | Ensure `surveys/visibility.json` is included (it's already under `surveys/` so it should be — verify) |
| `AGENTS.md` | Add `surveys/visibility.json` mention |
| `README.md` | Add `surveys/visibility.json` to survey system table |

## TDD Flow

### Red (write failing tests)

Add to `quiz/tests/survey-session.test.js`:

1. `loadSurveyVisibility()` returns empty object when file missing
2. `loadSurveyVisibility()` reads valid JSON from file
3. `getPendingSurveys` with groups param excludes banks not in participant's groups
4. `getPendingSurveys` without groups param returns all banks (backward compat)
5. `getPendingSurveys` with groups param but bank has no visibility entry → bank is visible (unrestricted default)
6. `getVisibleSurveyResults` — participant sees own results
7. `getVisibleSurveyResults` — admin group sees all results
8. `getVisibleSurveyResults` — non-admin participant only sees own results
9. `getVisibleSurveyResults` — no results returns empty array

### Green (implement)

1. Create `surveys/visibility.json` with `{}`
2. Add `loadSurveyVisibility(root)` to `survey-session.js`
3. Update `getPendingSurveys(participantId, surveyBanks, root, participantGroups?)` with group filtering
4. Add `getVisibleSurveyResults(bankName, participantId, participantGroups, root)`
5. Update survey skill to resolve participant groups and pass them

### Refactor

- Verify edge cases: empty visibility.json, participant with no group, no visibility entry for a bank
- Ensure backward compat: all existing tests pass without changes

## Verification

- [ ] `node --test` — all tests pass
- [ ] `node .opencode/scripts/ci-validate.js` — CI validation passes
- [ ] `getPendingSurveys` with no groups param returns same results as before (backward compat)
- [ ] `getPendingSurveys` with groups excludes banks with non-matching `allowedGroups`
- [ ] `getVisibleSurveyResults` correctly filters by `viewResultsGroups`
- [ ] `surveys/visibility.json` is included in installer's file list
