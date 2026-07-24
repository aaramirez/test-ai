# Survey Admin Guide

## Initial Setup (One-Time)

### 1. Create a Survey Bank

```bash
node quiz/cli/create-bank.js --name "Survey Name" --id survey-id --type survey
```

### 2. Add Questions

```bash
node quiz/cli/add-question.js --bank surveys/banks/survey-id.json \
  --id srv-001 --text "How satisfied are you?" \
  --options "Very satisfied" "Satisfied" "Neutral" "Dissatisfied"

node quiz/cli/add-question.js --bank surveys/banks/survey-id.json \
  --id srv-002 --text "Would you recommend this course?" \
  --options "Yes" "Maybe" "No"
```

### 3. Validate

```bash
node quiz/cli/validate-bank.js surveys/banks/survey-id.json
```

### 4. Set Visibility (Optional)

Edit `surveys/visibility.json`:

```json
{
  "survey-id.json": {
    "allowedGroups": ["estudiantes", "instructores"],
    "viewResultsGroups": ["admin"]
  }
}
```

- `allowedGroups`: Who can take the survey
- `viewResultsGroups`: Who can view all results (admin only)

## Daily Operations

### Before a Survey Session
1. Verify survey bank is complete and validated
2. Check visibility settings in `surveys/visibility.json`
3. Verify `surveys/registry.json` exists

### During a Survey Session
1. Participant runs `/survey`
2. Agent presents questions, records responses
3. Results saved to `surveys/results/`

### After a Survey Session
1. Run `/survey-report` to view aggregate statistics
2. Export CSV if needed for further analysis
3. Review response distribution per question

## Generating Reports

### Via Command

```bash
/survey-report
```

The agent will:
1. List available survey banks
2. Let you select one
3. Show total responses and per-question breakdown
4. Offer CSV export

### Via CLI

```bash
# List available banks
node quiz/cli/survey-admin-report.js --list

# Generate report
node quiz/cli/survey-admin-report.js --bank feedback-survey.json

# Export CSV
node quiz/cli/survey-admin-report.js --bank feedback-survey.json --csv report.csv
```

### Via Programmatic API

```javascript
import { getSurveyStats, listSurveyBanks, generateSurveyReport } from './quiz/cli/survey-admin-report.js';

// List banks
const banks = listSurveyBanks();

// Get stats
const stats = getSurveyStats('feedback-survey.json');
console.log(`Total responses: ${stats.totalResponses}`);
console.log(stats.questionStats);

// Generate text report
const report = generateSurveyReport('feedback-survey.json');
```

## Survey Bank Format

Survey banks use `type: "survey"` and have no correct answers:

```json
{
  "id": "feedback",
  "type": "survey",
  "version": "1.0.0",
  "questions": [
    {
      "id": "srv-001",
      "type": "survey",
      "question": "How satisfied are you?",
      "options": ["Very satisfied", "Satisfied", "Neutral"]
    }
  ]
}
```

## File Locations

| Path | Purpose | Committed |
|------|---------|-----------|
| `surveys/banks/` | Survey question banks | Yes |
| `surveys/results/` | Survey session results | Yes |
| `surveys/registry.json` | Completion tracking | Yes |
| `surveys/visibility.json` | Group-based access control | Yes |
| `surveys/_index.json` | Session index | Yes |

## Session ID Format

Prefix: `s-` for survey sessions.

## Troubleshooting

### "Bank not found"
- Check that the survey bank exists in `surveys/banks/`
- Verify the filename matches exactly

### No responses showing
- Check that results exist in `surveys/results/survey-id/`
- Verify the registry is up to date

### Visibility not working
- Check `surveys/visibility.json` for correct group names
- Verify participant's groups in `team.json`

### CSV export empty
- Ensure there are responses before exporting
- Check the bank name matches exactly

## Related

- [Participant Guide](participant.md) — How to take surveys
- [Quick Reference](quick-reference.md) — All survey commands
