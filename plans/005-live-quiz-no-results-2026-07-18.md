# Live Quiz: No Results Displayed, Correct Directory Storage, Two Evaluation Modes

## Objective

Fix the quiz system so live quiz submissions are stored in the correct bank subdirectory, never show results to the participant, and support two admin evaluation modes (one revealing correct answers, one hiding them).

## Requirements

### Result isolation (no results shown to participant)
1. **Live mode stores raw selections only** — live quiz sessions must NOT contain `score` or per-question `correct` fields at creation time — priority: high
2. **Practice mode remains unchanged** — practice sessions still compute and store score data for immediate feedback — priority: high
3. **Skill instructions updated** — the quiz skill must state that live mode shows NO results at all (not even final score) — priority: high
4. **Participant manual updated** — participant.md must reflect that live mode shows no results — priority: medium

### Correct directory storage
5. **Result files stored in `quiz/results/<bank-name>/`** — saveResult must place files in the bank-specific subdirectory (e.g., `quiz/results/git/q-xxx.json`) — priority: high
6. **Index file records correct relative path** — `updateIndex` must use the subdirectory path — priority: high
7. **Clean up misplaced top-level files** — remove or relocate existing top-level result files to correct subdirectories — priority: medium
8. **Fix `send-results.js --session` path bug** — appends session ID without `.json` extension, will always fail — priority: high
9. **Fix `loadResultsForParticipant` crash on files** — `readdirSync` on non-directory entries will throw — priority: high
10. **Fix `loadResult` in session.js** — skips file check logic is incorrect (always returns null for subdirectory files) — priority: high
11. **Clean up unused imports in run-quiz.js** — 8 of 10 named imports are unused; the script is a display-only scaffold — priority: low

### Two evaluation modes
12. **Mode A — Full evaluation (current)** — computes per-question `correct` fields and aggregate `score`, stores them in the session file — priority: high
13. **Mode B — Score-only evaluation** — computes aggregate `score` (correct, total, percentage) but does NOT store per-question `correct` fields — priority: high
14. **Admin chooses mode at evaluation time** — evaluate.js gains a `--score-only` flag for Mode B — priority: high
15. **Admin report respects score-only mode** — when reporting on score-only sessions, per-question stats are hidden — priority: medium
16. **Tests for both evaluation modes** — verify Mode A populates all fields, Mode B populates score only — priority: high

## Architecture

### Current problems identified

1. **Result files at wrong location**: `quiz/results/` has loose files at top level instead of inside `quiz/results/git/`, `quiz/results/javascript/`, etc. The `saveResult()` code targets subdirectories correctly, but the two existing session files were placed at root level (manual or legacy code path).

2. **Index path mismatch**: `_index.json` stores `"2026-07-18_q-xxx.json"` (top-level path) instead of `"git/q-xxx.json"` (subdirectory path).

3. **send-results.js --session bug**: line 55 constructs path without `.json` extension, so `join(dir, "q-xxx")` becomes `quiz/results/git/q-xxx` instead of `quiz/results/git/q-xxx.json`.

4. **loadResultsForParticipant crash**: iterates all entries in `results/` and calls `readdirSync` on non-directory entries (files like `.DS_Store`, top-level `.json`), which throws `ENOTDIR`.

5. **loadResult doesn't work**: line 52 (`!join(dirPath, ...)`) evaluates to a string which is always truthy, so the `continue` never triggers, but then it tries to read a file at an incorrect path pattern.

6. **createSession pre-scores live sessions**: calls `calculateResults()` for ALL non-survey modes, so live sessions get `correct` fields they shouldn't have.

### New behavior

#### Result file storage

| Operation | Current (broken) | Fixed |
|-----------|-----------------|-------|
| `saveResult()` | `quiz/results/<session_id>.json` | `quiz/results/<bank-name>/<session_id>.json` |
| `updateIndex()` file path | `"<session_id>.json"` | `"<bank-name>/<session_id>.json"` |
| `loadResult()` | Broken (subdirectory files not found) | Iterates bank subdirectories correctly |
| `send-results --session` | Missing `.json` extension | Appends `.json` to session ID |

#### Session content by mode

| Mode | questions[].correct | questions[].selected | score | evaluated |
|------|--------------------|--------------------|-------|-----------|
| Practice | ✅ boolean | ✅ array | ✅ object | absent |
| Live (before eval) | absent | ✅ array | `null` | `false` |
| Live (after eval A) | ✅ boolean | ✅ array | ✅ object | `true` |
| Live (after eval B) | absent | ✅ array | ✅ object | `true` |
| Survey | absent | ✅ array | `null` | absent |

#### Evaluation modes

- **Mode A** (default, `--score-only` not set): Current behavior — evaluates each question, sets `q.correct = true/false`, recalculates `score`, sets `evaluated = true`
- **Mode B** (`--score-only`): Evaluates each question internally to count correct/total, stores only the aggregate `score` on the session, does NOT set `q.correct`, sets `evaluated = true`

### File changes

**Modified files:**
- `quiz/lib/session.js` — `createSession()`: skip scoring for live mode; `saveResult()`: fix directory logic (verify it's already correct); `loadResult()`: fix subdirectory iteration logic; `updateIndex()`: verify path format
- `quiz/cli/evaluate.js` — add `--score-only` flag; evaluateSession() supports hiding per-question correctness; handle sessions with `score: null`
- `quiz/lib/scorer.js` — no changes needed (all scoring functions remain the same)
- `quiz/cli/send-results.js` — fix `--session` path resolution to append `.json`; fix directory iteration to skip non-directories
- `quiz/lib/admin-report.js` — fix `loadResultsForParticipant` to skip non-directory entries; respect sessions without per-question `correct` data
- `quiz/cli/run-quiz.js` — clean up unused imports (low priority)
- `.opencode/skills/quiz/SKILL.md` — live mode shows NO results at all; update result format examples
- `quiz/manuals/participant.md` — live quiz instructions: no results shown at any point
- `quiz/tests/session.test.js` — add `createSession` tests for all three modes
- `quiz/tests/evaluate.test.js` — **new file**: tests for both evaluation modes

**New files:**
- `quiz/tests/evaluate.test.js` — tests for evaluateSession with Mode A (full) and Mode B (score-only)
- `quiz/tests/admin-report.test.js` — tests for admin-report path resolution fixes (if time allows)

### Key decisions

1. **Live mode stores `score: null`** instead of omitting it — evaluate.js can detect this to know evaluation is needed
2. **`evaluated: false`** for live sessions at creation (currently `true`) — admin must explicitly run evaluation
3. **Mode B stores only `score` on session** — per-question `correct` fields are never written to disk, so they cannot be leaked
4. **`saveResult()` directory logic is already correct** — the fix is to ensure the code path is actually used (it was bypassed by the agent creating files manually)
5. **Index migration** — existing top-level entries in `_index.json` will be updated to correct subdirectory paths; existing top-level files will be moved to their bank subdirectories
6. **`loadResultsForParticipant`** — add `statSync` check to ensure entry is a directory before calling `readdirSync`
7. **`send-results.js --session`** — change from `join(dir, opts.session)` to `join(dir, opts.session + '.json')`
8. **`loadResult`** — rewrite to use the index file for resolution instead of scanning directories

## TDD Flow

### Red (write failing tests)

1. Write `createSession` tests:
   - Live mode: `score` is `null`, questions have `selected` but no `correct`, `evaluated` is `false`
   - Practice mode: `score` is populated, questions have `correct` (unchanged)
   - Survey mode: `score` is `null`, questions have `selected` but no `correct`

2. Write `evaluateSession` tests:
   - Mode A (no `--score-only`): populates `q.correct` and `score` on an unscored live session
   - Mode B (`--score-only`): populates `score` but does NOT set `q.correct` on any question
   - Mode A on already-evaluated session: no-op (idempotent)
   - Mode B on already-scored session: leaves `q.correct` intact if present, or absent if absent

3. Run tests → createSession live/survey tests fail because current code pre-scores them

### Green (implement)

1. Modify `createSession()` in `session.js`:
   - Live/survey: store raw selections, `score: null`
   - Live: `evaluated: false`
   - Practice: call `calculateResults()` as before

2. Modify `evaluate.js`:
   - Parse `--score-only` flag
   - In `evaluateSession()`: if `--score-only`, compute score internally but only write aggregate to session, skip per-question `correct`
   - Handle sessions where `session.score` is `null`

3. Fix path resolution issues:
   - `send-results.js`: add `.json` to session ID paths
   - `admin-report.js`: add `statSync` dir check in `loadResultsForParticipant`
   - `session.js`: fix `loadResult` logic
   - Move existing top-level result files to correct subdirectories
   - Update `_index.json` paths

4. Run tests → all pass

### Refactor
- Clean up unused imports in `run-quiz.js`
- Ensure no dead code paths remain

## Verification

- [ ] `node --test quiz/tests/session.test.js` — new createSession tests pass
- [ ] `node --test quiz/tests/evaluate.test.js` — both evaluation mode tests pass
- [ ] `node --test quiz/tests/scorer.test.js` — existing scorer tests still pass
- [ ] `node --test` — all tests pass
- [ ] Manual: `node quiz/cli/run-quiz.js --list` works after import cleanup
- [ ] Manual: create a live session, verify saved to `quiz/results/git/q-xxx.json` (not root)
- [ ] Manual: `node quiz/cli/evaluate.js --bank git.json --all` — Mode A, verify `q.correct` populated
- [ ] Manual: `node quiz/cli/evaluate.js --bank git.json --all --score-only` — Mode B, verify score only, no `q.correct`
- [ ] Manual: `node quiz/cli/admin-report.js --bank git.json` — shows results for evaluated sessions
- [ ] Manual: `node quiz/cli/send-results.js --bank git.json --list` — lists sessions correctly
- [ ] Manual: `node quiz/cli/send-results.js --bank git.json --session q-xxx` — works with correct path
- [ ] Skill SKILL.md updated: live mode shows no results at all
- [ ] Participant manual updated: no results shown for live quizzes
