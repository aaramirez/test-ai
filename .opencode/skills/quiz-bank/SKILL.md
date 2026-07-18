---
name: quiz-bank
description: Create, validate, and manage question banks for quizzes and surveys.
license: MIT
scripts:
  - ../../quiz/cli/create-bank.js
  - ../../quiz/cli/add-question.js
  - ../../quiz/cli/validate-bank.js
  - ../../quiz/cli/migrate-bank.js
---

# Quiz Bank Management

Create and manage question banks. Banks contain questions and options only — no correct answers. Safe to share with anyone.

## Create a Bank

```bash
node quiz/cli/create-bank.js --name "JavaScript Basics" --id javascript --version 1.0.0
```

## Add Questions

```bash
node quiz/cli/add-question.js --bank banks/javascript.json \
  --id js-001 --type single --difficulty easy \
  --question "What is let vs var?" \
  --options "var is block-scoped" "let is block-scoped"
```

## Validate

```bash
node quiz/cli/validate-bank.js banks/javascript.json
```

## Migrate Legacy Bank

```bash
node quiz/cli/migrate-bank.js --input bank.json --output banks/
```

## Workflow

1. `/quiz-create` to scaffold a new bank
2. Add questions one by one or via script
3. Validate with `validate-bank.js`
4. Create answer key with [[quiz-key]]
5. Push to GitHub

## Related

- [[quiz-key]] — create answer keys
- [[quiz]] — run quizzes from banks
