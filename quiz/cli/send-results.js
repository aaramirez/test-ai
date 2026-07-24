#!/usr/bin/env node
/**
 * send-results.js — Send results email to participants
 *
 * Usage:
 *   node send-results.js --session q-2026-07-15-abc123.json
 *   node send-results.js --bank javascript.json --all
 *   node send-results.js --bank javascript.json --list
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadResult } from '../lib/session.js';
import { buildEmailPayload } from '../lib/mailer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RESULTS_DIR = join(ROOT, 'results');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--session' && args[i + 1]) opts.session = args[++i];
  else if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
  else if (args[i] === '--all') opts.all = true;
  else if (args[i] === '--list') opts.list = true;
}

function listSessions(bankName) {
  const dirName = bankName.replace('.json', '');
  const dir = join(RESULTS_DIR, dirName);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => {
      const s = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      return { file: f, participant: s.participant, mode: s.mode, date: s.date, sent: s.sent };
    });
}

if (opts.list && opts.bank) {
  const sessions = listSessions(opts.bank);
  console.log(`Sessions for ${opts.bank}:`);
  for (const s of sessions) {
    const sent = s.sent ? '✅' : '⏳';
    console.log(`  ${sent} ${s.file} — ${s.participant?.name || 'unknown'} (${s.mode})`);
  }
} else if (opts.session) {
  for (const bankDir of readdirSync(RESULTS_DIR)) {
    const dir = join(RESULTS_DIR, bankDir);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    const filePath = join(dir, opts.session + '.json');
    if (existsSync(filePath)) {
      const session = JSON.parse(readFileSync(filePath, 'utf-8'));
      const payload = buildEmailPayload(session, session.bank);
      console.log(`To: ${session.participant?.email || 'no email'}`);
      console.log(`Subject: ${payload.subject}`);
      console.log(`Body:\n${payload.body}`);
      console.log('\n[Email would be sent via send-email.js]');
      process.exit(0);
    }
  }
  console.error(`Session not found: ${opts.session}`);
} else if (opts.bank && opts.all) {
  const sessions = listSessions(opts.bank);
  const unsent = sessions.filter(s => !s.sent && s.participant?.email);
  console.log(`Would send to ${unsent.length} participants`);
  for (const s of unsent) {
    console.log(`  ${s.participant.email} — ${s.file}`);
  }
  console.log('\n[Batch email would be sent via send-email.js]');
} else {
  console.error('Usage: node send-results.js --session ID | --bank BANK --list | --bank BANK --all');
  process.exit(1);
}
