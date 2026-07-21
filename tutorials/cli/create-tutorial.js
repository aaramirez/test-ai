#!/usr/bin/env node
/**
 * create-tutorial.js — Scaffold new tutorial JSON
 *
 * Usage:
 *   node create-tutorial.js --name "Tutorial Name" --id tutorial-id [--version 1.0.0] [--difficulty easy]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BANKS_DIR = join(ROOT, 'banks');

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) opts.name = args[++i];
    else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--version' && args[i + 1]) opts.version = args[++i];
    else if (args[i] === '--difficulty' && args[i + 1]) opts.difficulty = args[++i];
    else if (args[i] === '--description' && args[i + 1]) opts.description = args[++i];
    else if (args[i] === '--duration' && args[i + 1]) opts.duration = parseInt(args[++i]);
  }
  return opts;
}

function createTutorial(opts) {
  const tutorialPath = join(BANKS_DIR, `${opts.id}.json`);
  if (existsSync(tutorialPath)) {
    throw new Error(`Tutorial already exists: banks/${opts.id}.json`);
  }

  const tutorial = {
    name: opts.name,
    description: opts.description || '',
    version: opts.version || '1.0.0',
    type: 'tutorial',
    difficulty: opts.difficulty || 'easy',
    duration_estimate: opts.duration || 10,
    xp_per_correct: 10,
    xp_per_code_run: 5,
    xp_per_challenge: 20,
    randomize: { options: true },
    steps: [],
  };

  writeFileSync(tutorialPath, JSON.stringify(tutorial, null, 2));
  console.log(`Created: tutorials/banks/${opts.id}.json`);
  return tutorialPath;
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (!opts.name || !opts.id) {
    console.error('Usage: node create-tutorial.js --name "Tutorial Name" --id tutorial-id [--version 1.0.0] [--difficulty easy|medium|hard] [--description "..."] [--duration 10]');
    process.exit(1);
  }

  try {
    createTutorial(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

export { createTutorial, parseArgs };

if (process.argv[1] && (process.argv[1].endsWith('create-tutorial.js') || process.argv[1].endsWith('create-tutorial'))) {
  main();
}
