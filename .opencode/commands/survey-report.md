---
description: Generate survey admin reports — statistics, breakdowns, CSV export. Usage: /survey-report
---

Load the survey-admin skill. CRITICAL: You MUST load it with the `skill` tool before starting the workflow.

The user wants to view survey admin reports. Steps:

1. List available survey banks from `surveys/banks/`
2. Let user select a bank
3. Generate report with `survey-admin-report.js --bank BANK`
4. Show statistics: total responses, per-question breakdown
5. Offer CSV export if requested

Use the question tool to present options. Set `custom: false` for all questions.

For detailed stats, use the programmatic API:
```javascript
import { getSurveyStats } from './quiz/cli/survey-admin-report.js';
const stats = getSurveyStats('feedback-survey.json');
```
