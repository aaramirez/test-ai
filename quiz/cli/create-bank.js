#!/usr/bin/env node
/**
 * create-bank.js — Scaffold new bank JSON
 *
 * Usage:
 *   node create-bank.js --name "Topic" --id topic [--version 1.0.0] [--description "..."] [--type quiz|survey]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const QUIZ_BANKS_DIR = join(ROOT, 'banks');
const SURVEY_BANKS_DIR = join(resolve(ROOT, '..'), 'surveys', 'banks');

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) opts.name = args[++i];
    else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--version' && args[i + 1]) opts.version = args[++i];
    else if (args[i] === '--description' && args[i + 1]) opts.description = args[++i];
    else if (args[i] === '--type' && args[i + 1]) opts.type = args[++i];
  }
  return opts;
}

function createBank(opts) {
  const isSurvey = opts.type === 'survey';
  const banksDir = isSurvey ? SURVEY_BANKS_DIR : QUIZ_BANKS_DIR;
  const label = isSurvey ? 'surveys/banks' : 'banks';
  const bankType = isSurvey ? 'survey' : 'quiz';

  const bankPath = join(banksDir, `${opts.id}.json`);
  if (existsSync(bankPath)) {
    throw new Error(`Bank already exists: ${label}/${opts.id}.json`);
  }

  const bank = {
    name: opts.name,
    description: opts.description || '',
    version: opts.version || '1.0.0',
    type: bankType,
    randomize: { questions: false, options: false },
    questions: [],
  };

  writeFileSync(bankPath, JSON.stringify(bank, null, 2));
  console.log(`Created: ${label}/${opts.id}.json`);
  return bankPath;
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (!opts.name || !opts.id) {
    console.error('Usage: node create-bank.js --name "Topic" --id topic [--version 1.0.0] [--description "..."] [--type quiz|survey]');
    process.exit(1);
  }

  try {
    createBank(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

export { createBank, parseArgs };

if (process.argv[1] && (process.argv[1].endsWith('create-bank.js') || process.argv[1].endsWith('create-bank'))) {
  main();
}
