# Survey Quick Reference

## Commands

| Command | Description |
|---------|-------------|
| `/survey` | Check pending surveys and submit answers |
| `/survey-report` | Generate admin reports — statistics, CSV export |
| `/survey-create` | Create a new survey question bank |

## CLI Scripts

### Create Survey Bank
```bash
node quiz/cli/create-bank.js --name "Name" --id id --type survey
```

### Add Question
```bash
node quiz/cli/add-question.js --bank surveys/banks/id.json \
  --id srv-001 --text "Question?" --options "A" "B" "C"
```

### Validate
```bash
node quiz/cli/validate-bank.js surveys/banks/id.json
```

### Generate Report
```bash
node quiz/cli/survey-admin-report.js --list
node quiz/cli/survey-admin-report.js --bank survey.json
node quiz/cli/survey-admin-report.js --bank survey.json --csv report.csv
```

## Programmatic API

```javascript
import { getSurveyStats, listSurveyBanks, generateSurveyReport, generateSurveyReportCSV } from './quiz/cli/survey-admin-report.js';
```

## Visibility Control

Edit `surveys/visibility.json`:

```json
{
  "survey.json": {
    "allowedGroups": ["estudiantes"],
    "viewResultsGroups": ["admin"]
  }
}
```

## File Locations

| Path | Purpose | Committed |
|------|---------|-----------|
| `surveys/banks/` | Survey banks | Yes |
| `surveys/results/` | Session results | Yes |
| `surveys/registry.json` | Completion tracking | Yes |
| `surveys/visibility.json` | Access control | Yes |

## Session ID Format

Prefix: `s-` for survey sessions.

## Related

- [Participant Guide](participant.md) |
- [Admin Guide](admin.md)
