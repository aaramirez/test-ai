---
name: email
description: Send emails via SMTP (Gmail, Outlook/Office365) with CLI, MCP, and command support.
license: MIT
scripts:
  - send-email.js
  - mcp-email.js
---

# Email Skill

Send emails programmatically or via CLI using SMTP. Supports attachments, CC/BCC, HTML content, and integration with the docgen pipeline for sending generated reports.

## Setup

Create a `.env` file in the project root (already in `.gitignore`):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=Tu Nombre <tu-email@gmail.com>
```

**Gmail** requiere un [App Password](https://support.google.com/accounts/answer/185833) (activa 2FA primero).
**Outlook/Office365** usa `smtp.office365.com:587` con tu contraseña normal o app password.

## Usage

### CLI

```bash
node .opencode/scripts/send-email.js \
  --to "user@example.com" \
  --cc "cc@example.com" \
  --subject "Asunto" \
  --body "<h1>HTML body</h1>" \
  --html \
  --attachment "assets/docs/reporte.pdf"
```

Flags: `--to`, `--subject`, `--body`, `--cc`, `--bcc`, `--html`, `--attachment` (repeatable), `--payload <file.json>`, `--help`

### Programmatic (Node.js)

```js
import { sendEmail } from './.opencode/scripts/send-email.js';

const result = await sendEmail({
  to: 'user@example.com',
  cc: 'cc@example.com',
  subject: 'Reporte semanal',
  body: '<h1>Reporte</h1><p>Adjunto el PDF.</p>',
  html: true,
  attachments: ['assets/docs/reporte.pdf'],
});
console.log(`Sent: ${result.messageId}`);
```

### MCP

Enable the email MCP server in `opencode.json`:

```json
"email": {
  "command": ["node", ".opencode/scripts/mcp-email.js"],
  "enabled": true,
  "type": "local"
}
```

Once enabled, the agent can call `send_email` tool directly:

```
Agent: send email to user@example.com with subject "Hello" and body "World"
```

Parameters: `to` (required), `subject` (required), `body` (required), `cc`, `bcc`, `html` (boolean), `attachments` (array of file paths).

### OpenCode Command

Use `/send-email` to send an email via the command template. The agent will build a JSON payload and execute the CLI script.

## Docgen Integration

Generate a report and send it in one workflow:

```bash
npm run docgen:report assets/templates/specs/weekly-status.json \
  && node .opencode/scripts/send-email.js \
    --to "equipo@example.com" \
    --subject "Weekly Status Report" \
    --body "Adjunto el reporte semanal." \
    --html \
    --attachment "assets/docs/weekly-status-report.pdf"
```

## Related

- [document-generation](document-generation) — generate reports to attach
- [branding](branding) — brand colors for email-ready reports
- [content-ingestion](content-ingestion) — structure content before sending
