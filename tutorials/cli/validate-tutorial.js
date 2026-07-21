#!/usr/bin/env node
/**
 * validate-tutorial.js — Validate tutorial and key
 *
 * Usage:
 *   node validate-tutorial.js git-fundamentals.json
 *   node validate-tutorial.js --key keys/git-fundamentals.json git-fundamentals.json
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadTutorial, loadKey, validateTutorial, validateKey } from '../lib/schema.js';

const args = process.argv.slice(2);

let keyPath = null;
const tutorialArgs = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--key' && args[i + 1]) {
    keyPath = args[++i];
  } else {
    tutorialArgs.push(args[i]);
  }
}

if (tutorialArgs.length === 0) {
  console.error('Usage: node validate-tutorial.js [--key keys/key.json] tutorial.json [tutorial2.json ...]');
  process.exit(1);
}

let allValid = true;

for (const tutorialArg of tutorialArgs) {
  try {
    const tutorial = loadTutorial(tutorialArg);
    const errors = validateTutorial(tutorial);

    if (errors.length > 0) {
      console.error(`❌ ${tutorialArg}:`);
      errors.forEach(e => console.error(`  - ${e}`));
      allValid = false;
    } else {
      const questionSteps = tutorial.steps.filter(s => s.type === 'question' || s.type === 'checkpoint').length;
      console.log(`✅ ${tutorialArg}: valid (${tutorial.steps.length} steps, ${questionSteps} scorable)`);
    }

    // Validate key if provided
    if (keyPath) {
      try {
        const key = loadKey(keyPath);
        const keyErrors = validateKey(key, tutorial);
        if (keyErrors.length > 0) {
          console.error(`❌ Key ${keyPath}:`);
          keyErrors.forEach(e => console.error(`  - ${e}`));
          allValid = false;
        } else {
          console.log(`✅ Key ${keyPath}: valid (${Object.keys(key.answers).length} answers)`);
        }
      } catch (err) {
        console.error(`❌ Key ${keyPath}: ${err.message}`);
        allValid = false;
      }
    }
  } catch (err) {
    console.error(`❌ ${tutorialArg}: ${err.message}`);
    allValid = false;
  }
}

process.exit(allValid ? 0 : 1);
