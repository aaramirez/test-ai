#!/usr/bin/env node
/**
 * validate-bank.js — Validate bank schema and structure
 *
 * Usage:
 *   node validate-bank.js javascript.json [python.json ...]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBank, loadSurveyBank, validateBank } from '../lib/schema.js';

const banks = process.argv.slice(2);

if (banks.length === 0) {
  console.error('Usage: node validate-bank.js javascript.json [python.json ...]');
  process.exit(1);
}

let allValid = true;
for (const bankPath of banks) {
  try {
    let bank;
    try {
      bank = loadBank(bankPath);
    } catch {
      bank = loadSurveyBank(bankPath);
    }
    const errors = validateBank(bank);
    if (errors.length > 0) {
      console.error(`❌ ${bankPath}:`);
      errors.forEach(e => console.error(`  - ${e}`));
      allValid = false;
    } else {
      console.log(`✅ ${bankPath}: valid (${bank.questions.length} questions)`);
    }
  } catch (err) {
    console.error(`❌ ${bankPath}: ${err.message}`);
    allValid = false;
  }
}

process.exit(allValid ? 0 : 1);
