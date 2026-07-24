---
description: Create a new survey question bank — no answer keys needed. Usage: /survey-create
---

Load the survey-bank skill. CRITICAL: You MUST load it with the `skill` tool before starting the workflow.

The user wants to create a new survey. Steps:

1. Ask for survey name and ID
2. Create bank: `node quiz/cli/create-bank.js --name "NAME" --id ID --type survey`
3. Add questions interactively with the question tool
4. For each question, ask: text, options (minimum 2)
5. Validate bank: `node quiz/cli/validate-bank.js surveys/banks/ID.json`
6. Set visibility groups if needed in `surveys/visibility.json`

Survey questions use `type: "survey"` and have no correct answers.

IMPORTANT: Every time you use the question tool with `options`, you MUST also set `custom: false` to prevent free text input.
