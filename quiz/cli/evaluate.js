#!/usr/bin/env node
/**
 * evaluate.js — Score session against answer key
 *
 * Usage:
 *   node evaluate.js --session results/javascript/q-2026-07-15-abc123.json
 *   node evaluate.js --bank javascript.json --all
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadKey } from '../lib/schema.js';
import { scoreQuestion } from '../lib/scorer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RESULTS_DIR = join(ROOT, 'results');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--session' && args[i + 1]) opts.session = args[++i];
  else if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
  else if (args[i] === '--all') opts.all = true;
}

function evaluateSession(session, key) {
  if (!session.questions || session.mode === 'survey') return session;
  for (const q of session.questions) {
    if (q.correct !== undefined) continue;
    const result = scoreQuestion(
      { id: q.id, type: q.type },
      q.selected,
      key
    );
    q.correct = result.correct;
  }
  const totalScoreable = session.questions.filter(q => q.type !== 'survey');
  session.score = {
    correct: totalScoreable.filter(q => q.correct === true).length,
    total: totalScoreable.length,
    percentage: totalScoreable.length > 0
      ? Math.round((totalScoreable.filter(q => q.correct === true).length / totalScoreable.length) * 100)
      : 0,
  };
  session.evaluated = true;
  return session;
}

if (opts.session) {
  const sessionPath = join(ROOT, opts.session);
  if (!existsSync(sessionPath)) {
    console.error(`Session not found: ${opts.session}`);
    process.exit(1);
  }
  const session = JSON.parse(readFileSync(sessionPath, 'utf-8'));
  const key = loadKey(session.bank);
  const evaluated = evaluateSession(session, key);
  writeFileSync(sessionPath, JSON.stringify(evaluated, null, 2));
  console.log(`Evaluated: ${session.session_id} — ${evaluated.score.correct}/${evaluated.score.total} (${evaluated.score.percentage}%)`);
} else if (opts.bank && opts.all) {
  const dirName = opts.bank.replace('.json', '');
  const dir = join(RESULTS_DIR, dirName);
  if (!existsSync(dir)) {
    console.error(`No results for: ${opts.bank}`);
    process.exit(1);
  }
  const key = loadKey(opts.bank);
  let count = 0;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const session = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
    if (session.evaluated) continue;
    const evaluated = evaluateSession(session, key);
    writeFileSync(join(dir, f), JSON.stringify(evaluated, null, 2));
    console.log(`Evaluated: ${session.session_id}`);
    count++;
  }
  console.log(`Total evaluated: ${count}`);
} else {
  console.error('Usage: node evaluate.js --session PATH | --bank BANK --all');
  process.exit(1);
}
