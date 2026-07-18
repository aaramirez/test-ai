#!/usr/bin/env node
/**
 * validate-bank.js — Validate bank schema and structure
 *
 * Usage:
 *   node validate-bank.js banks/topic.json [banks/topic2.json ...]
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBank, validateBank } from '../lib/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const banks = process.argv.slice(2);

if (banks.length === 0) {
  console.error('Usage: node validate-bank.js banks/topic.json [banks/topic2.json ...]');
  process.exit(1);
}

let allValid = true;
for (const bankPath of banks) {
  try {
    const bank = loadBank(bankPath);
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
