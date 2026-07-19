---
description: Check pending surveys and submit answers. Usage: /survey
---

Load the survey skill. CRITICAL: You MUST load it with the `skill` tool before starting the workflow.

The user wants to take pending surveys.
Identify the participant, check which surveys are pending from surveys/registry.json,
list them, let the user select one, present questions, save results, and confirm.

IMPORTANT: Every time you use the question tool with `options`, you MUST also set `custom: false` to prevent free text input. This applies to ALL questions: survey selection, question options, upload confirmation, "otra encuesta" prompt, etc.
