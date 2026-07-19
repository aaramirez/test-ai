# Ensure All Skill Interactions Use Question Tool

## Objective
Update survey and quiz skills to always use the opencode question tool for ALL user interactions, ensuring consistent TUI experience with tabs and no free text options.

## Requirements
1. Survey skill identification flow must use question tool — priority: high
2. Quiz skill identification flow must use question tool — priority: high
3. Survey skill pending surveys selection must use question tool — priority: high
4. Quiz skill bank selection must use question tool — priority: high
5. Update skill documentation with explicit question tool instructions — priority: high
6. Add examples of question tool usage in skills — priority: medium
7. NEVER add free text option when questions have defined options — priority: high
8. Use tabs format for question tool (label as tab header) — priority: high

## Architecture

### Problem Analysis
The skills currently use plain text instructions like "Ask: ¿Cuál es tu cédula?" which results in the agent outputting text instead of using the opencode question tool. This breaks the TUI experience.

Additionally, when questions have defined options, the agent sometimes adds an "Other" or free text option which is not desired.

### Solution
Update all skill instructions to explicitly require the **question** tool for every user interaction point, and explicitly禁止 adding free text options when questions have defined options.

### Files to Modify

| File | Change |
|------|--------|
| `.opencode/skills/survey/SKILL.md` | Add question tool instructions for identification and selection |
| `.opencode/skills/quiz/SKILL.md` | Add question tool instructions for identification and bank selection |

### Interaction Points Requiring Question Tool

#### Survey Skill
1. **Cédula input** — `question` tool with header "Cédula"
2. **Name input** (if new) — `question` tool with header "Nombre"
3. **Email input** (if new) — `question` tool with header "Correo electrónico"
4. **Survey selection** — `question` tool with options from pending surveys
5. **Survey questions** — already uses question tool ✓

#### Quiz Skill
1. **Participant ID input** — `question` tool with header "Cédula"
2. **Name input** (if new) — `question` tool with header "Nombre"
3. **Email input** (if new) — `question` tool with header "Correo electrónico"
4. **Mode selection** — `question` tool with options "Práctica" / "En vivo"
5. **Bank selection** — `question` tool with options from available banks
6. **Quiz questions** — already uses question tool ✓

### Rules for Question Tool Usage

1. **Always use question tool** — Never output plain text questions
2. **Use tabs format** — Header becomes the tab label
3. **No free text options** — When questions have defined options (survey, quiz, practice), only show those options
4. **Free text only for identification** — Cédula, name, email can use free text input (no options array)

## TDD Flow

### 1. Write Tests → FAIL
Not applicable — this is a documentation/instruction change, not code logic.

### 2. Implement → PASS
Update skill files with explicit question tool instructions.

### 3. Verify
- Manual verification: run `/survey` and `/quiz-run` commands
- Confirm all interactions use TUI question prompts
- Confirm no free text options added to defined questions

## Verification
- [ ] Survey identification uses question tool
- [ ] Quiz identification uses question tool
- [ ] Survey selection uses question tool
- [ ] Bank selection uses question tool
- [ ] All survey questions use question tool (no free text)
- [ ] All quiz questions use question tool (no free text)
- [ ] All practice questions use question tool (no free text)
- [ ] All test questions use question tool (no free text)
