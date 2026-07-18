#!/usr/bin/env node
/**
 * run-quiz.js — Interactive quiz/survey runner
 *
 * Usage:
 *   node run-quiz.js --list
 *   node run-quiz.js --bank banks/javascript.json --mode practice [--difficulty easy] [--count 3]
 *   node run-quiz.js --bank banks/javascript.json --mode live --participant-id STU-001
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBank, loadKey, listBanks } from '../lib/schema.js';
import { findParticipant, registerParticipant } from '../lib/participant.js';
import { saveResult, generateSessionId } from '../lib/session.js';
import { calculateResults } from '../lib/scorer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--list') opts.list = true;
  else if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
  else if (args[i] === '--mode' && args[i + 1]) opts.mode = args[++i];
  else if (args[i] === '--difficulty' && args[i + 1]) opts.difficulty = args[++i];
  else if (args[i] === '--count' && args[i + 1]) opts.count = parseInt(args[++i]);
  else if (args[i] === '--participant-id' && args[i + 1]) opts.participantId = args[++i];
}

if (opts.list) {
  const banks = listBanks();
  console.log('Available banks:');
  for (const b of banks) {
    const bank = loadBank(b);
    console.log(`  ${b} — ${bank.name} (${bank.questions.length} questions)`);
  }
  process.exit(0);
}

if (!opts.bank || !opts.mode) {
  console.error('Usage: node run-quiz.js --bank banks/topic.json --mode practice|live [--difficulty easy] [--count 3] [--participant-id ID]');
  process.exit(1);
}

if (!existsSync(join(resolve(__dirname, '..'), opts.bank))) {
  console.error(`Bank not found: ${opts.bank}`);
  process.exit(1);
}

const bank = loadBank(opts.bank);
let questions = [...bank.questions];

if (opts.difficulty) {
  questions = questions.filter(q => q.difficulty === opts.difficulty);
}
if (bank.randomize && bank.randomize.questions) {
  questions = questions.sort(() => Math.random() - 0.5);
}
if (opts.count && opts.count < questions.length) {
  questions = questions.slice(0, opts.count);
}

console.log(`\nBank: ${bank.name} (${bank.version})`);
console.log(`Mode: ${opts.mode}`);
console.log(`Questions: ${questions.length}`);
if (opts.difficulty) console.log(`Difficulty: ${opts.difficulty}`);
console.log('');

const selections = [];
for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  console.log(`--- Question ${i + 1}/${questions.length} (${q.type || 'single'}) ---`);
  console.log(q.question);
  console.log('');
  for (let j = 0; j < q.options.length; j++) {
    console.log(`  [${j}] ${q.options[j].label}`);
  }
  console.log('');
  console.log(`Answer: (enter option number${q.type === 'multiple' ? ',comma-separated' : ''})`);
  selections.push(null);
}

console.log('\n[Interactive quiz — run via opencode agent for full question tool integration]');
console.log('This script provides the quiz structure. Use /quiz-practice or /quiz-run commands for interactive experience.');
