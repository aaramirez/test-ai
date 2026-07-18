#!/usr/bin/env node
/**
 * migrate-bank.js — Split legacy bank.json into bank + key files
 *
 * Usage:
 *   node migrate-bank.js [--input bank.json] [--output banks/]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
let input = 'bank.json';
let outputDir = 'banks';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && args[i + 1]) input = args[++i];
  if (args[i] === '--output' && args[i + 1]) outputDir = args[++i];
}

const inputPath = join(ROOT, input);
if (!existsSync(inputPath)) {
  console.error(`File not found: ${input}`);
  process.exit(1);
}

const legacy = JSON.parse(readFileSync(inputPath, 'utf-8'));
const categories = {};

for (const q of legacy.questions) {
  const cat = q.category || 'general';
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push(q);
}

const banksDir = join(ROOT, outputDir);
const keysDir = join(ROOT, 'keys');

for (const [cat, questions] of Object.entries(categories)) {
  const bank = {
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    description: `Migrated from legacy bank.json`,
    version: '1.0.0',
    randomize: { questions: false, options: false },
    questions: questions.map(({ id, category, difficulty, type, question, options }) => ({
      id, difficulty: difficulty || 'easy', type: type || 'single', question, options,
    })),
  };

  const key = {
    bank: `${cat}.json`,
    bank_version: '1.0.0',
    answers: {},
  };

  for (const q of questions) {
    if (q.correct !== undefined) {
      key.answers[q.id] = {
        correct: q.correct,
        explanation: q.explanation || '',
      };
    }
  }

  writeFileSync(join(banksDir, `${cat}.json`), JSON.stringify(bank, null, 2));
  writeFileSync(join(keysDir, `${cat}.json`), JSON.stringify(key, null, 2));
  console.log(`Migrated: ${cat} (${questions.length} questions)`);
}

console.log('Done.');
