#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { createTransport } from 'nodemailer';

function resolveEnv(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{env:(\w+)\}/g, (_, name) => process.env[name] || '');
}

export async function sendEmail({
  to, subject, body, cc, bcc, html, attachments
}) {
  const host = resolveEnv(process.env.SMTP_HOST || '{env:SMTP_HOST}');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = resolveEnv(process.env.SMTP_USER || '{env:SMTP_USER}');
  const pass = resolveEnv(process.env.SMTP_PASS || '{env:SMTP_PASS}');
  const from = resolveEnv(process.env.SMTP_FROM || '{env:SMTP_FROM}') || user;

  const transporter = createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
  });

  const attachmentList = [];
  if (attachments) {
    const paths = Array.isArray(attachments) ? attachments : [attachments];
    for (const p of paths) {
      if (!existsSync(p)) {
        throw new Error(`Attachment not found: ${p}`);
      }
    }
    attachmentList.push(...paths.map(filename => ({ filename: filename.split('/').pop(), path: filename })));
  }

  const info = await transporter.sendMail({
    from,
    to: resolveEnv(to),
    subject: resolveEnv(subject),
    text: html ? undefined : resolveEnv(body),
    html: html ? resolveEnv(body) : undefined,
    cc: cc ? resolveEnv(cc) : undefined,
    bcc: bcc ? resolveEnv(bcc) : undefined,
    attachments: attachmentList.length > 0 ? attachmentList : undefined,
  });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

function printHelp() {
  console.log(`
send-email.js — Send email via SMTP

USAGE
  node shared/scripts/send-email.js --to <email> --subject <text> --body <text> [options]
  node shared/scripts/send-email.js --payload <file.json>

OPTIONS
  --to <email>      Recipient (required unless --payload)
  --subject <text>  Email subject (required unless --payload)
  --body <text>     Email body (required unless --payload)
  --cc <email>      CC recipient
  --bcc <email>     BCC recipient
  --html            Treat body as HTML
  --attachment <path>  File to attach (repeatable)
  --payload <file>  Read all options from a JSON file
  --help            Show this help

ENVIRONMENT
  SMTP_HOST    SMTP server hostname
  SMTP_PORT    SMTP server port (default: 587)
  SMTP_USER    SMTP username
  SMTP_PASS    SMTP password
  SMTP_FROM    From address (default: SMTP_USER)

Any argument containing {env:VAR} is resolved from the environment.
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  const getVal = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const hasFlag = (flag) => args.includes(flag);

  let payload = getVal('--payload');
  if (payload) {
    payload = JSON.parse(readFileSync(payload, 'utf-8'));
  }

  const opts = payload || {
    to: getVal('--to'),
    subject: getVal('--subject'),
    body: getVal('--body'),
    cc: getVal('--cc'),
    bcc: getVal('--bcc'),
    html: payload ? payload.html : hasFlag('--html'),
    attachments: payload ? payload.attachments : (() => {
      const idxs = [];
      args.forEach((a, i) => { if (a === '--attachment') idxs.push(i + 1); });
      return idxs.map(i => args[i]).filter(Boolean);
    })(),
  };

  if (!opts.to || !opts.subject || !opts.body) {
    console.error('Error: --to, --subject, and --body are required');
    printHelp();
    process.exit(2);
  }

  try {
    const result = await sendEmail(opts);
    console.log(`Email sent: ${result.messageId}`);
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('send-email.js')) {
  main();
}
