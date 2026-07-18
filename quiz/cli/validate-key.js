#!/usr/bin/env node
/**
 * validate-key.js — Cross-validate key against bank
 *
 * Usage:
 *   node validate-key.js --key keys/topic.json --bank banks/topic.json
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBank, loadKey, validateKey } from '../lib/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
let keyFile, bankFile;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--key' && args[i + 1]) keyFile = args[++i];
  if (args[i] === '--bank' && args[i + 1]) bankFile = args[++i];
}

if (!keyFile || !bankFile) {
  console.error('Usage: node validate-key.js --key keys/topic.json --bank banks/topic.json');
  process.exit(1);
}

try {
  const bank = loadBank(bankFile);
  const key = loadKey(keyFile);
  const errors = validateKey(key, bank);
  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✅ Key valid for ${bankFile} (${Object.keys(key.answers).length} answers)`);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
