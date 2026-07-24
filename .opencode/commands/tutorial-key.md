---
description: Create and manage tutorial answer keys. Usage: /tutorial-key
---

Load the tutorial-key skill. CRITICAL: You MUST load it with the `skill` tool before starting the workflow.

The user wants to manage tutorial answer keys. Steps:

1. List available tutorials from `tutorials/banks/`
2. Let user select a tutorial or choose "Create new key"
3. If creating: `node tutorials/cli/create-key.js --bank banks/tutorial.json`
4. For adding answers: `node tutorials/cli/create-key.js --key keys/tutorial.json --add STEP_ID --correct N --explanation "..."`
5. List existing keys: `node tutorials/cli/create-key.js --list`

Scorable step types that need keys: question, checkpoint.
Scenario steps have correct answers embedded in the bank.

IMPORTANT: Every time you use the question tool with `options`, you MUST also set `custom: false` to prevent free text input.
