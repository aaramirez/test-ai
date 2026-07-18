#!/usr/bin/env node
/**
 * manage-participants.js — Participant CRUD + bulk CSV import
 *
 * Usage:
 *   node manage-participants.js --list
 *   node manage-participants.js --find ID
 *   node manage-participants.js --search "query"
 *   node manage-participants.js --add --id ID --name "Name" [--email "..."]
 *   node manage-participants.js --import file.csv
 *   node manage-participants.js --history ID
 *   node manage-participants.js --group-add GROUP ID1,ID2
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  registerParticipant, findParticipant, listParticipants, searchParticipants,
  updateParticipant, importFromCSV, addToGroup, getGroup, listGroups,
} from '../lib/participant.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--list') opts.list = true;
  else if (args[i] === '--find' && args[i + 1]) opts.find = args[++i];
  else if (args[i] === '--search' && args[i + 1]) opts.search = args[++i];
  else if (args[i] === '--add') opts.add = true;
  else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  else if (args[i] === '--name' && args[i + 1]) opts.name = args[++i];
  else if (args[i] === '--email' && args[i + 1]) opts.email = args[++i];
  else if (args[i] === '--import' && args[i + 1]) opts.import = args[++i];
  else if (args[i] === '--history' && args[i + 1]) opts.history = args[++i];
  else if (args[i] === '--groups') opts.groups = true;
  else if (args[i] === '--group-add' && args[i + 1]) opts.groupAdd = args[++i];
}

if (opts.list) {
  const participants = listParticipants();
  console.log(`Participants (${participants.length}):`);
  for (const p of participants) {
    console.log(`  ${p.id} — ${p.name} (${p.email || 'no email'})`);
  }
} else if (opts.find) {
  const p = findParticipant(opts.find);
  if (p) {
    console.log(JSON.stringify(p, null, 2));
  } else {
    console.log(`Participant not found: ${opts.find}`);
  }
} else if (opts.search) {
  const results = searchParticipants(opts.search);
  console.log(`Found ${results.length}:`);
  for (const p of results) {
    console.log(`  ${p.id} — ${p.name}`);
  }
} else if (opts.add) {
  if (!opts.id || !opts.name) {
    console.error('--id and --name required');
    process.exit(1);
  }
  const result = registerParticipant({ id: opts.id, name: opts.name, email: opts.email });
  console.log(result.message);
} else if (opts.import) {
  const csv = readFileSync(resolve(__dirname, '..', opts.import), 'utf-8');
  const result = importFromCSV(csv);
  console.log(`Imported: ${result.imported}`);
  if (result.errors.length) result.errors.forEach(e => console.error(`  ${e}`));
} else if (opts.history) {
  const { listByParticipant } = await import('../lib/session.js');
  const sessions = listByParticipant(opts.history);
  console.log(`Sessions for ${opts.history} (${sessions.length}):`);
  for (const sid of sessions) console.log(`  ${sid}`);
} else if (opts.groups) {
  const groups = listGroups();
  for (const g of groups) {
    console.log(`${g.id} (${g.count} members)`);
  }
} else if (opts.groupAdd) {
  const ids = args.slice(args.indexOf(opts.groupAdd) + 1).join(',').split(',').filter(Boolean);
  addToGroup(opts.groupAdd, ids);
  console.log(`Added ${ids.length} participants to group ${opts.groupAdd}`);
} else {
  console.error('Usage: node manage-participants.js --list | --find ID | --add --id ID --name "Name" | --import file.csv | --groups');
  process.exit(1);
}
