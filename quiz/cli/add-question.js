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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(ROOT, '..');

function isSurveyBank(bankArg) {
  return bankArg.startsWith('surveys/') || bankArg.includes('/surveys/banks/');
}

function resolveKeyPath(bankArg) {
  const bankName = bankArg.split('/').pop();
  if (bankArg.startsWith('surveys/') || bankArg.includes('/surveys/banks/')) {
    return join(PROJECT_ROOT, 'surveys', 'keys', bankName);
  }
  return join(ROOT, 'keys', bankName);
}

function resolveBankPath(bankArg) {
  // If the path already includes a directory prefix, resolve relative to project root
  if (bankArg.startsWith('surveys/') || bankArg.startsWith('quiz/')) {
    return join(PROJECT_ROOT, bankArg);
  }
  // Otherwise try quiz/banks/ first, then surveys/banks/
  const quizPath = join(ROOT, 'banks', bankArg.replace(/^banks\//, ''));
  if (existsSync(quizPath)) return quizPath;
  const surveyPath = join(PROJECT_ROOT, 'surveys', 'banks', bankArg.replace(/^banks\//, ''));
  if (existsSync(surveyPath)) return surveyPath;
  // Default to quiz/banks/
  return quizPath;
}

function parseArgs(args) {
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
  return opts;
}

function addQuestion(opts) {
  const bankPath = resolveBankPath(opts.bank);
  if (!existsSync(bankPath)) {
    throw new Error(`Bank not found: ${opts.bank}`);
  }

  const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));
  if (bank.questions.find(q => q.id === opts.id)) {
    throw new Error(`Question ${opts.id} already exists in bank`);
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
  writeFileSync(bankPath, JSON.stringify(bank, null, 2));
  console.log(`Added question ${opts.id} to ${opts.bank}`);

  // Auto-update key if --correct is provided
  if (opts.correct !== undefined && !isSurveyBank(opts.bank)) {
    const keyPath = resolveKeyPath(opts.bank);
    let key;

    if (existsSync(keyPath)) {
      key = JSON.parse(readFileSync(keyPath, 'utf-8'));
    } else {
      const bankName = opts.bank.split('/').pop();
      key = {
        bank: bankName,
        bank_version: '1.0.0',
        answers: {},
      };
      const keyDir = dirname(keyPath);
      if (!existsSync(keyDir)) {
        mkdirSync(keyDir, { recursive: true });
      }
    }

    const correct = typeof opts.correct === 'string' && opts.correct.includes('[')
      ? JSON.parse(opts.correct)
      : parseInt(opts.correct);

    key.answers[opts.id] = {
      correct,
      explanation: opts.explanation || '',
    };

    writeFileSync(keyPath, JSON.stringify(key, null, 2));
    console.log(`Updated key: ${keyPath.split('/').slice(-2).join('/')}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (!opts.bank || !opts.id || !opts.question) {
    console.error('Usage: node add-question.js --bank banks/topic.json --id ID --type single|multiple|survey --difficulty easy|medium|hard --question "..." --options "opt1" "opt2" [--correct 0]');
    process.exit(1);
  }

  try {
    addQuestion(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

export { addQuestion, resolveBankPath, parseArgs };

if (process.argv[1] && (process.argv[1].endsWith('add-question.js') || process.argv[1].endsWith('add-question'))) {
  main();
}
