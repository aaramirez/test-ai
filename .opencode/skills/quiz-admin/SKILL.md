---
name: quiz-admin
description: Admin reports, evaluation, and quiz lifecycle management.
license: MIT
scripts:
  - ../../quiz/cli/evaluate.js
  - ../../quiz/cli/admin-report.js
---

# Quiz Admin

Evaluate sessions against answer keys and generate aggregate reports.

## Evaluate a Session

```bash
node quiz/cli/evaluate.js --session results/javascript/q-2026-07-15-abc123.json
```

## Evaluate All Sessions for a Bank

```bash
node quiz/cli/evaluate.js --bank javascript.json --all
```

## Generate Report

```bash
node quiz/cli/admin-report.js --bank javascript.json
```

## Report with Participant History

```bash
node quiz/cli/admin-report.js --bank javascript.json --participants
```

## Participant-Specific Report

```bash
node quiz/cli/admin-report.js --participant STU-001
```

## Export CSV

```bash
node quiz/cli/admin-report.js --bank javascript.json --csv report.csv
```

## Report Output

```
Bank: javascript.json
Total sessions: 12 (8 live, 4 practice)

js-001 (single): 75% correct (6/8)
  [0] 25% (2)
  [1] 75% (6)

js-002 (single): 50% correct (4/8)
  ...
```

## Related

- [[quiz-key]] — keys are used for evaluation
- [[quiz-results]] — send results after evaluation
- [[quiz-participant]] — participant history
