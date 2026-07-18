#!/usr/bin/env node
/**
 * create-bank.js — Scaffold new bank JSON
 *
 * Usage:
 *   node create-bank.js --name "Topic" --id topic [--version 1.0.0] [--description "..."]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BANKS_DIR = join(resolve(__dirname, '..'), 'banks');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) opts.name = args[++i];
  else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  else if (args[i] === '--version' && args[i + 1]) opts.version = args[++i];
  else if (args[i] === '--description' && args[i + 1]) opts.description = args[++i];
}

if (!opts.name || !opts.id) {
  console.error('Usage: node create-bank.js --name "Topic" --id topic [--version 1.0.0] [--description "..."]');
  process.exit(1);
}

const bankPath = join(BANKS_DIR, `${opts.id}.json`);
if (existsSync(bankPath)) {
  console.error(`Bank already exists: ${opts.id}.json`);
  process.exit(1);
}

const bank = {
  name: opts.name,
  description: opts.description || '',
  version: opts.version || '1.0.0',
  randomize: { questions: false, options: false },
  questions: [],
};

writeFileSync(bankPath, JSON.stringify(bank, null, 2));
console.log(`Created: banks/${opts.id}.json`);
