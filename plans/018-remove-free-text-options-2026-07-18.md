# Remove Free Text Options from Survey and Quiz Skills

## Objective
Add `custom: false` to every question tool usage in survey and quiz skills that uses predefined options, preventing the TUI from showing an unwanted "Type your own answer" free-text option.

## Requirements
1. Survey skill "Seleccionar encuesta" selection: add `custom: false` to block free text — priority: high
2. Survey skill "Subir resultados" (Sí/No): add `custom: false` — priority: high
3. Survey skill "Otra encuesta" (Sí/No): add `custom: false` — priority: high
4. Survey skill question presentation: add `custom: false` — priority: high
5. Quiz skill "Modo" selection (Práctica/En vivo): add `custom: false` — priority: high
6. Quiz skill "Seleccionar banco": add `custom: false` — priority: high
7. Quiz skill question presentation: add `custom: false` — priority: high
8. Quiz skill "Subir resultados" (Sí/No): add `custom: false` — priority: high
9. Add a general instruction in both skills: "Always set `custom: false` when using `options` with predefined choices" — priority: medium

## Architecture

### Problem
In opencode's TUI, calling the `question` tool with `options` array adds a "Type your own answer" option by default (`custom: true`). This allows users to enter free text even when only predefined options should be allowed. The user reports that after listing available surveys, the TUI lets them type a custom answer instead of selecting from the list.

### Solution
Add `custom: false` to every `options` array usage in both skills. This also means adding the skill files that the user may copy on install.

### Files to Modify
| File | Change |
|------|--------|
| `.opencode/skills/survey/SKILL.md` | Add `custom: false` to all `question` tool uses with `options` |
| `.opencode/skills/quiz/SKILL.md` | Add `custom: false` to all `question` tool uses with `options` |

### No Code Changes
This is a documentation/instruction fix only — no JavaScript modules need changing. The question tool behavior is controlled by the agent, which follows the skill instructions.

### Changes per skill

#### survey/SKILL.md — 4 locations
1. Line 87-91 (Seleccionar encuesta) → add `custom: false`
2. Line 97-101 (survey questions) → add `custom: false` to the instruction
3. Line 140-145 (Subir resultados) → add `custom: false`
4. Line 165-170 (Otra encuesta) → add `custom: false`

#### quiz/SKILL.md — 4 locations
1. Line 59-67 (Modo) → add `custom: false`
2. Line 79-84 (Seleccionar banco) → add `custom: false`
3. Lines 90-95 (quiz questions) → add `custom: false` to the instruction
4. Line 117-124 (Subir resultados) → add `custom: false`

## TDD Flow
Not applicable — this is a documentation/instruction change, not code logic. Verification is manual.

## Verification
- [ ] `/survey` workflow: survey selection shows only bank options (no free text)
- [ ] `/survey` workflow: upload dialog shows only Sí/No (no free text)
- [ ] `/survey` workflow: "otra encuesta" shows only Sí/No (no free text)
- [ ] `/quiz-run` workflow: mode selection shows only Práctica/En vivo (no free text)
- [ ] `/quiz-run` workflow: bank selection shows only bank options (no free text)
- [ ] `/quiz-run` workflow: upload dialog shows only Sí/No (no free text)
- [ ] All quiz/survey questions show only defined options (no free text)
