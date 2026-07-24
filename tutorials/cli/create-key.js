#!/usr/bin/env node
/**
 * create-key.js — Create and manage tutorial answer keys
 *
 * Usage:
 *   node create-key.js --bank banks/tutorial.json
 *   node create-key.js --key keys/tutorial.json --add step-001 --correct 2 --explanation "..."
 *   node create-key.js --list
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getTutorialsDir(root) {
  if (root) return root;
  if (process.env.TUTORIALS_DIR) return process.env.TUTORIALS_DIR;
  return resolve(__dirname, '..');
}

function getBanksDir(root) {
  return join(getTutorialsDir(root), 'banks');
}

function getKeysDir(root) {
  return join(getTutorialsDir(root), 'keys');
}

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
    else if (args[i] === '--key' && args[i + 1]) opts.key = args[++i];
    else if (args[i] === '--add' && args[i + 1]) opts.add = args[++i];
    else if (args[i] === '--correct' && args[i + 1]) opts.correct = args[++i];
    else if (args[i] === '--explanation' && args[i + 1]) opts.explanation = args[++i];
    else if (args[i] === '--list') opts.list = true;
  }
  return opts;
}

function loadBank(bankName, root) {
  const path = join(getBanksDir(root), bankName);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function loadKey(keyName, root) {
  const path = join(getKeysDir(root), keyName);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveKey(keyName, key, root) {
  const keysDir = getKeysDir(root);
  if (!existsSync(keysDir)) {
    mkdirSync(keysDir, { recursive: true });
  }
  writeFileSync(join(keysDir, keyName), JSON.stringify(key, null, 2));
}

function getScorableSteps(bank) {
  return (bank.steps || []).filter(s => s.type === 'question' || s.type === 'checkpoint' || s.type === 'scenario');
}

export function createTutorialKey({ bankName, root } = {}) {
  if (!bankName) throw new Error('bankName is required');

  const bank = loadBank(bankName, root);
  if (!bank) throw new Error(`Bank not found: ${bankName}`);

  const keysDir = getKeysDir(root);
  const keyPath = join(keysDir, bankName);
  if (existsSync(keyPath)) throw new Error(`Key already exists: keys/${bankName}`);

  const scorableSteps = getScorableSteps(bank);
  const answers = {};
  for (const step of scorableSteps) {
    answers[step.id] = { correct: -1, explanation: '' };
  }

  const key = {
    bank: bankName,
    bank_version: bank.version || '1.0.0',
    answers,
  };

  if (!existsSync(keysDir)) {
    mkdirSync(keysDir, { recursive: true });
  }
  writeFileSync(keyPath, JSON.stringify(key, null, 2));
  return key;
}

export function addTutorialAnswer({ keyName, stepId, correct, explanation, root } = {}) {
  if (!keyName) throw new Error('keyName is required');
  if (!stepId) throw new Error('stepId is required');
  if (correct === undefined) throw new Error('correct is required');

  const key = loadKey(keyName, root);
  if (!key) throw new Error(`Key not found: keys/${keyName}`);

  if (!key.answers) key.answers = {};
  key.answers[stepId] = {
    correct: parseInt(correct),
    explanation: explanation || '',
  };

  saveKey(keyName, key, root);
  return key.answers[stepId];
}

export function listTutorialKeys(root) {
  const keysDir = getKeysDir(root);
  if (!existsSync(keysDir)) return [];
  return readdirSync(keysDir).filter(f => f.endsWith('.json'));
}

if (process.argv[1] && process.argv[1].endsWith('create-key.js')) {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  try {
    if (opts.list) {
      const keys = listTutorialKeys();
      if (keys.length === 0) {
        console.log('No tutorial keys found');
      } else {
        console.log('Tutorial keys:');
        for (const k of keys) console.log(`  ${k}`);
      }
    } else if (opts.add && opts.correct !== undefined) {
      if (!opts.key) {
        console.error('--key is required when adding an answer');
        process.exit(1);
      }
      addTutorialAnswer({ keyName: opts.key, stepId: opts.add, correct: opts.correct, explanation: opts.explanation });
      console.log(`Added answer for ${opts.add}`);
    } else if (opts.bank) {
      const key = createTutorialKey({ bankName: opts.bank });
      console.log(`Created: keys/${opts.bank}`);
    } else {
      console.error('Usage: node create-key.js --bank banks/tutorial.json');
      console.error('       node create-key.js --key keys/tutorial.json --add STEP_ID --correct N');
      console.error('       node create-key.js --list');
      process.exit(1);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
