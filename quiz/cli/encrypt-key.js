#!/usr/bin/env node
/**
 * encrypt-key.js — SOPS/age encrypt key files
 *
 * Usage:
 *   node encrypt-key.js keys/topic.json
 *
 * Falls back gracefully if sops/age not installed.
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const keyFile = process.argv[2];

if (!keyFile) {
  console.error('Usage: node encrypt-key.js keys/topic.json');
  process.exit(1);
}

const fullPath = resolve(ROOT, keyFile);

try {
  execSync(`sops -e -i "${fullPath}"`, { stdio: 'pipe' });
  console.log(`Encrypted: ${keyFile}`);
} catch {
  try {
    execSync(`sops --age $(age-keygen -y <<< "$SOPS_AGE_KEY") -e -i "${fullPath}"`, {
      stdio: 'pipe',
      env: { ...process.env },
    });
    console.log(`Encrypted with age: ${keyFile}`);
  } catch {
    console.log(`Skipped encryption (sops/age not installed): ${keyFile}`);
  }
}
