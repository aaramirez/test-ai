---
name: survey-admin
description: Admin reports for surveys — aggregate statistics, CSV export, and survey bank management.
license: MIT
scripts:
  - ../../quiz/cli/survey-admin-report.js
---

# Survey Admin

Generate aggregate reports from survey results. View per-question statistics, response counts, and export to CSV.

## List Survey Banks

```bash
node quiz/cli/survey-admin-report.js --list
```

## Generate Report

```bash
node quiz/cli/survey-admin-report.js --bank feedback-survey.json
```

## Export to CSV

```bash
node quiz/cli/survey-admin-report.js --bank feedback-survey.json --csv report.csv
```

## Survey Stats (Programmatic)

```javascript
import { getSurveyStats, listSurveyBanks } from './quiz/cli/survey-admin-report.js';

const stats = getSurveyStats('feedback-survey.json', '/path/to/project');
console.log(stats.totalResponses);
console.log(stats.questionStats);
```

## Workflow

1. Run surveys via [[survey]] skill
2. View aggregate reports: `survey-admin-report.js --bank BANK`
3. Export CSV for further analysis
4. Compare results across sessions

## Related Skills

- [[survey]] — Run surveys and check pending
- [[quiz-admin]] — Quiz admin reports
- [[quiz-results]] — Send personalized results
