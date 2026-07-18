---
name: quiz-results
description: Send personalized quiz results to participants via email.
license: MIT
scripts:
  - ../../quiz/cli/send-results.js
---

# Quiz Results Delivery

Send personalized results to participants via email. Depends on the [[email]] skill for SMTP sending.

## List Sessions

```bash
node quiz/cli/send-results.js --bank javascript.json --list
```

## Send to One Participant

```bash
node quiz/cli/send-results.js --session q-2026-07-15-abc123.json
```

## Send to All Participants

```bash
node quiz/cli/send-results.js --bank javascript.json --all
```

## Email Content (Quiz)

```
Subject: Resultados del Quiz — JavaScript Basics

Hola Jane,

Tu resultado: 2/3 (67%)

✅ js-001: Correct
❌ js-002: Incorrect

Gracias por participar.
```

## Email Content (Survey)

```
Subject: Gracias por tu participación — Course Feedback

Hola Jane,

Gracias por completar la encuesta. Tus respuestas han sido registradas.
```

## SMTP Configuration

Requires `.env` file with SMTP settings:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Related

- [[email]] — SMTP sending backend
- [[quiz-admin]] — evaluate before sending
