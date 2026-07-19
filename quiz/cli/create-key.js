#!/usr/bin/env node
/**
 * create-key.js — Create or edit answer key
 *
 * Usage:
 *   node create-key.js --bank banks/topic.json [--key keys/topic.json]
 *   node create-key.js --key keys/topic.json --add js-001 --correct 1 --explanation "..."
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(ROOT, '..');

function isSurveyBank(bankPath) {
  return bankPath.startsWith('surveys/') || bankPath.includes('/surveys/banks/');
}

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
    else if (args[i] === '--key' && args[i + 1]) opts.key = args[++i];
    else if (args[i] === '--add' && args[i + 1]) opts.add = args[++i];
    else if (args[i] === '--correct' && args[i + 1]) opts.correct = args[++i];
    else if (args[i] === '--explanation' && args[i + 1]) opts.explanation = args[++i];
  }
  return opts;
}

function validateBankForKey(bankArg) {
  if (isSurveyBank(bankArg)) {
    throw new Error('Cannot create key for survey banks (surveys have no answer keys)');
  }
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.add && opts.correct !== undefined) {
    if (!opts.key) {
      console.error('--key is required when adding an answer');
      process.exit(1);
    }
    const keyPath = join(ROOT, opts.key);
    if (!existsSync(keyPath)) {
      console.error(`Key file not found: ${opts.key}`);
      process.exit(1);
    }
    const key = JSON.parse(readFileSync(keyPath, 'utf-8'));
    const correct = opts.correct.includes('[') ? JSON.parse(opts.correct) : parseInt(opts.correct);
    key.answers[opts.add] = {
      correct,
      explanation: opts.explanation || '',
    };
    writeFileSync(keyPath, JSON.stringify(key, null, 2));
    console.log(`Added answer for ${opts.add}`);
  } else if (opts.bank) {
    try {
      validateBankForKey(opts.bank);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
    const bankName = opts.bank.split('/').pop();
    const keyPath = join(ROOT, 'keys', bankName);
    if (existsSync(keyPath)) {
      console.error(`Key already exists: keys/${bankName}`);
      process.exit(1);
    }
    const key = {
      bank: bankName,
      bank_version: '1.0.0',
      answers: {},
    };
    writeFileSync(keyPath, JSON.stringify(key, null, 2));
    console.log(`Created: keys/${bankName}`);
  } else {
    console.error('Usage: node create-key.js --bank banks/topic.json');
    console.error('       node create-key.js --key keys/topic.json --add ID --correct N --explanation "..."');
    process.exit(1);
  }
}

export { validateBankForKey, isSurveyBank, parseArgs };

if (process.argv[1] && (process.argv[1].endsWith('create-key.js') || process.argv[1].endsWith('create-key'))) {
  main();
}
