---
name: survey-bank
description: Create and manage survey question banks — no answer keys needed for surveys.
license: MIT
scripts:
  - ../../quiz/cli/create-bank.js
  - ../../quiz/cli/add-question.js
  - ../../quiz/cli/validate-bank.js
---

# Survey Bank Management

Create survey banks for collecting feedback and opinions. Surveys have no correct answers — no key creation needed.

## Create Survey Bank

```bash
node quiz/cli/create-bank.js --name "Customer Feedback" --id feedback --type survey
```

## Add Survey Questions

```bash
node quiz/cli/add-question.js --bank surveys/banks/feedback.json \
  --id srv-001 --text "How satisfied are you?" \
  --options "Very satisfied" "Satisfied" "Neutral" "Dissatisfied"
```

## Validate Survey Bank

```bash
node quiz/cli/validate-bank.js surveys/banks/feedback.json
```

## Survey Bank Format

Survey banks use `type: "survey"` and have no `correct` field:

```json
{
  "id": "feedback",
  "type": "survey",
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

## Visibility Control

Set which groups can see a survey in `surveys/visibility.json`:

```json
{
  "feedback.json": {
    "allowedGroups": ["estudiantes"],
    "viewResultsGroups": ["admin", "instructores"]
  }
}
```

## Workflow

1. Create survey bank
2. Add questions with options (no correct answers)
3. Validate bank
4. Set visibility groups
5. Run survey via [[survey]] skill
6. View results via [[survey-admin]] skill

## Related Skills

- [[survey]] — Run surveys
- [[survey-admin]] — Admin reports
- [[quiz-bank]] — Quiz banks (with answers)
