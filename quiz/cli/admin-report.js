#!/usr/bin/env node
/**
 * admin-report.js — Generate aggregate admin report
 *
 * Usage:
 *   node admin-report.js --bank javascript.json [--csv report.csv] [--participants]
 *   node admin-report.js --participant STU-001
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateReport, generateParticipantReport, exportCSV } from '../lib/admin-report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
  else if (args[i] === '--csv' && args[i + 1]) opts.csv = args[++i];
  else if (args[i] === '--participants') opts.participants = true;
  else if (args[i] === '--participant' && args[i + 1]) opts.participant = args[++i];
}

if (opts.participant) {
  console.log(generateParticipantReport(opts.participant));
} else if (opts.bank) {
  const report = generateReport(opts.bank, { showParticipants: opts.participants });
  console.log(report);
  if (opts.csv) {
    const csv = exportCSV(opts.csv.replace('.json', '.json'));
    writeFileSync(resolve(__dirname, '..', opts.csv), exportCSV(opts.bank));
    console.log(`\nCSV exported to: ${opts.csv}`);
  }
} else {
  console.error('Usage: node admin-report.js --bank BANK [--csv report.csv] [--participants] | --participant ID');
  process.exit(1);
}
