#!/usr/bin/env node
/**
 * add-step.js — Add step to tutorial
 *
 * Usage:
 *   node add-step.js --tutorial tutorials/banks/git.json --id step-001 --type content \
 *     --title "Welcome" --body "This is the intro"
 *
 * Step types: content, question, choice, code, challenge, scenario, checkpoint
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BANKS_DIR = join(ROOT, 'banks');

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tutorial' && args[i + 1]) opts.tutorial = args[++i];
    else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--type' && args[i + 1]) opts.type = args[++i];
    else if (args[i] === '--title' && args[i + 1]) opts.title = args[++i];
    else if (args[i] === '--body' && args[i + 1]) opts.body = args[++i];
    else if (args[i] === '--question' && args[i + 1]) opts.question = args[++i];
    else if (args[i] === '--code' && args[i + 1]) opts.code = args[++i];
    else if (args[i] === '--expected-output' && args[i + 1]) opts.expected_output = args[++i];
    else if (args[i] === '--language' && args[i + 1]) opts.language = args[++i];
    else if (args[i] === '--instructions' && args[i + 1]) opts.instructions = args[++i];
    else if (args[i] === '--narrative' && args[i + 1]) opts.narrative = args[++i];
    else if (args[i] === '--hint' && args[i + 1]) opts.hint = args[++i];
    else if (args[i] === '--difficulty' && args[i + 1]) opts.difficulty = args[++i];
    else if (args[i] === '--goto' && args[i + 1]) opts.goto = args[++i];
    else if (args[i] === '--min-score' && args[i + 1]) opts.min_score = parseInt(args[++i]);
    else if (args[i] === '--correct' && args[i + 1]) opts.correct = args[++i];
    else if (args[i] === '--feedback' && args[i + 1]) opts.feedback = args[++i];
    else if (!args[i].startsWith('--')) {
      if (!opts.options) opts.options = [];
      opts.options.push(args[i]);
    }
  }
  return opts;
}

function resolveTutorialPath(tutorialArg) {
  if (existsSync(tutorialArg)) return tutorialArg;
  const normalized = tutorialArg.replace(/^tutorials\/banks\//, '').replace(/^banks\//, '');
  const path = join(BANKS_DIR, normalized);
  if (existsSync(path)) return path;
  return join(BANKS_DIR, tutorialArg);
}

function buildStep(opts) {
  const step = {
    id: opts.id,
    type: opts.type,
  };

  switch (opts.type) {
    case 'content':
      step.title = opts.title || 'Untitled';
      step.body = opts.body || '';
      if (opts.visual) step.visual = opts.visual;
      break;

    case 'question':
      step.question = opts.question || '';
      step.options = (opts.options || []).map(label => ({ label }));
      step.difficulty = opts.difficulty || 'easy';
      if (opts.hint) step.hint = opts.hint;
      break;

    case 'choice':
      step.question = opts.question || '';
      step.options = (opts.options || []).map(label => ({ label, goto: opts.goto || 'end' }));
      break;

    case 'code':
      step.title = opts.title || 'Code Exercise';
      step.body = opts.body || '';
      step.code = opts.code || '';
      if (opts.expected_output) step.expected_output = opts.expected_output;
      if (opts.language) step.language = opts.language;
      break;

    case 'challenge':
      step.title = opts.title || 'Challenge';
      step.instructions = opts.instructions || '';
      if (opts.validation) step.validation = opts.validation;
      break;

    case 'scenario':
      step.title = opts.title || 'Scenario';
      step.narrative = opts.narrative || '';
      step.options = (opts.options || []).map(label => ({
        label,
        correct: label === opts.correct,
        feedback: opts.feedback || '',
      }));
      break;

    case 'checkpoint':
      step.question = opts.question || '';
      step.options = (opts.options || []).map(label => ({ label }));
      step.min_score_to_pass = opts.min_score || 1;
      break;

    default:
      throw new Error(`Invalid step type: ${opts.type}`);
  }

  return step;
}

function addStep(opts) {
  const tutorialPath = resolveTutorialPath(opts.tutorial);
  if (!existsSync(tutorialPath)) {
    throw new Error(`Tutorial not found: ${opts.tutorial}`);
  }

  const tutorial = JSON.parse(readFileSync(tutorialPath, 'utf-8'));
  if (tutorial.steps.find(s => s.id === opts.id)) {
    throw new Error(`Step ${opts.id} already exists in tutorial`);
  }

  const step = buildStep(opts);
  tutorial.steps.push(step);
  writeFileSync(tutorialPath, JSON.stringify(tutorial, null, 2));
  console.log(`Added step ${opts.id} (${opts.type}) to ${opts.tutorial}`);
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (!opts.tutorial || !opts.id || !opts.type) {
    console.error('Usage: node add-step.js --tutorial banks/tutorial.json --id step-001 --type content|question|choice|code|challenge|scenario|checkpoint [options]');
    process.exit(1);
  }

  try {
    addStep(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

export { addStep, buildStep, parseArgs };

if (process.argv[1] && (process.argv[1].endsWith('add-step.js') || process.argv[1].endsWith('add-step'))) {
  main();
}
