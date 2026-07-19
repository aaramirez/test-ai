# Survey Bank Directory Separation

## Objective
Make `create-bank.js` write survey-type banks to `surveys/banks/` instead of `quiz/banks/`, and update all scripts that assume banks live only in `quiz/banks/`.

## Requirements
1. `create-bank.js` accepts `--type survey` (or `--type quiz`) and writes the bank to the correct directory (`surveys/banks/` for survey, `quiz/banks/` for quiz/default) — priority: high
2. `add-question.js` detects the bank file location (quiz/banks/ vs surveys/banks/) and reads/writes accordingly — priority: high
3. `create-key.js` skips survey banks (surveys don't have answer keys, they are opinion-based) — priority: high
4. `validate-bank.js` checks both `quiz/banks/` and `surveys/banks/` when a relative bank name is given — priority: medium
5. `run-quiz.js` `--list` shows quiz banks and survey banks separately (or just quiz banks, since surveys are run through the survey skill) — priority: medium
6. `install.js` excludes `surveys/banks/` from source copy (already does — line 69) — priority: low (already correct)
7. `migrate-bank.js` separates quiz vs survey output based on question type metadata — priority: low
8. Documentation: update `quiz-bank` skill to reflect the new `--type` flag — priority: medium

## Architecture

### Files to modify:
- **`quiz/cli/create-bank.js`** — accept `--type` (quiz|survey), compute correct output directory (`quiz/banks/` or `surveys/banks/`), update bank JSON to include `"type": "quiz"` or `"type": "survey"`
- **`quiz/cli/add-question.js`** — probe both `quiz/banks/` and `surveys/banks/` to locate the bank file; write back to the same path
- **`quiz/cli/create-key.js`** — skip survey banks with a clear message
- **`quiz/cli/validate-bank.js`** — use `loadBank` or `loadSurveyBank` based on directory prefix or try both
- **`quiz/cli/run-quiz.js`** — `--list` filters out survey banks (surveys have their own runner)
- **`quiz/lib/schema.js`** — add helper `loadAnyBank(path)` that tries `quiz/banks/` then `surveys/banks/`
- **`.opencode/skills/quiz-bank/SKILL.md`** — add `--type survey` example

### Files to create:
- **`quiz/tests/create-bank.test.js`** — tests for the new `--type` behavior

### Key decisions:
- Bank JSON gets a `"type"` field: `"quiz"` or `"survey"`. This is backward-compatible (existing banks omit `type`, default to quiz behavior).
- `create-bank.js` computes path: if `--type survey` → `surveys/banks/<id>.json`, else → `quiz/banks/<id>.json`.
- Survey banks do NOT need keys, so `create-key.js` should warn and exit when given a survey bank path.
- `validate-bank.js` already tries `loadBank` then `loadSurveyBank` — good, no change needed there.
- `run-quiz.js --list` should call `listQuizBanks()` (already exists in schema.js) instead of `listBanks()`.

## TDD Flow
1. Write tests for `create-bank.js --type survey` → bank written to `surveys/banks/` — FAIL
2. Implement `create-bank.js --type` logic — PASS
3. Write tests for `add-question.js` with survey bank — FAIL
4. Implement `add-question.js` dual-path resolution — PASS
5. Write test for `create-key.js` rejecting survey bank — FAIL
6. Implement survey bank detection in `create-key.js` — PASS
7. Verify `run-quiz.js --list` excludes survey banks — PASS

## Verification
- [ ] `node quiz/cli/create-bank.js --name Test --id test-survey --type survey` writes to `surveys/banks/test-survey.json`
- [ ] `node quiz/cli/create-bank.js --name Test --id test-quiz` writes to `quiz/banks/test-quiz.json`
- [ ] `node quiz/cli/add-question.js --bank surveys/banks/test-survey.json ...` works
- [ ] `node quiz/cli/create-key.js --bank surveys/banks/test-survey.json` shows error message
- [ ] `node quiz/cli/run-quiz.js --list` does NOT show survey banks
- [ ] All existing tests pass: `node --test`
