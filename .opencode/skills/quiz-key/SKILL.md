---
name: quiz-key
description: Create, manage, and encrypt answer keys for quiz banks.
license: MIT
scripts:
  - ../../quiz/cli/create-key.js
  - ../../quiz/cli/validate-key.js
  - ../../quiz/cli/encrypt-key.js
---

# Quiz Key Management

Create and manage answer keys. Keys map question IDs to correct answers and explanations. Keep encrypted and gitignored.

## Create Key from Bank

```bash
node quiz/cli/create-key.js --bank banks/javascript.json
```

## Add Answer

```bash
node quiz/cli/create-key.js --key keys/javascript.json \
  --add js-001 --correct 1 --explanation "let respects blocks, var does not"
```

## Validate Key Against Bank

```bash
node quiz/cli/validate-key.js --key keys/javascript.json --bank banks/javascript.json
```

## Encrypt Key

```bash
node quiz/cli/encrypt-key.js keys/javascript.json
```

## Workflow

1. Create bank with [[quiz-bank]]
2. Create key: `create-key.js --bank banks/topic.json`
3. Add answers for each question
4. Validate key against bank
5. Encrypt key
6. Never commit keys to git

## Security

- Keys are in `quiz/keys/` — gitignored
- Always encrypt with SOPS/age
- Never share keys with quiz takers

## Related

- [[quiz-bank]] — create the bank first
- [[quiz-admin]] — evaluate sessions using keys
