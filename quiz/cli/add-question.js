#!/usr/bin/env node
/**
 * add-question.js — Add question to bank
 *
 * Usage:
 *   node add-question.js --bank banks/topic.json --id js-001 --type single --difficulty easy \
 *     --question "..." --options "opt1" "opt2" [--correct 0]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
  else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  else if (args[i] === '--type' && args[i + 1]) opts.type = args[++i];
  else if (args[i] === '--difficulty' && args[i + 1]) opts.difficulty = args[++i];
  else if (args[i] === '--question' && args[i + 1]) opts.question = args[++i];
  else if (args[i] === '--correct' && args[i + 1]) opts.correct = parseInt(args[++i]);
  else if (!args[i].startsWith('--')) {
    if (!opts.options) opts.options = [];
    opts.options.push(args[i]);
  }
}

if (!opts.bank || !opts.id || !opts.question) {
  console.error('Usage: node add-question.js --bank banks/topic.json --id ID --type single|multiple|survey --difficulty easy|medium|hard --question "..." --options "opt1" "opt2" [--correct 0]');
  process.exit(1);
}

const bank = JSON.parse(readFileSync(join(resolve(__dirname, '..'), opts.bank), 'utf-8'));
if (bank.questions.find(q => q.id === opts.id)) {
  console.error(`Question ${opts.id} already exists in bank`);
  process.exit(1);
}

const question = {
  id: opts.id,
  type: opts.type || 'single',
  question: opts.question,
  options: (opts.options || []).map(label => ({ label })),
};

if (question.type !== 'survey') {
  question.difficulty = opts.difficulty || 'easy';
}

bank.questions.push(question);
writeFileSync(join(resolve(__dirname, '..'), opts.bank), JSON.stringify(bank, null, 2));
console.log(`Added question ${opts.id} to ${opts.bank}`);
