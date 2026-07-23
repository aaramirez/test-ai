#!/usr/bin/env node
/**
 * manage-keys.js — Multi-person key management
 *
 * Manages team-public.json and access.json.enc
 * Supports upload, approve, reject, grant, revoke, can-access
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const KEYS_DIR = join(PROJECT_ROOT, 'quiz', 'keys');
const TEAM_PUBLIC_PATH = join(KEYS_DIR, 'team-public.json');
const TEAM_PATH = join(PROJECT_ROOT, 'team.json');
const ACCESS_ENC_PATH = join(KEYS_DIR, 'access.json.enc');

// ==================== Team Public Keys ====================

function loadTeamPublic() {
  if (!existsSync(TEAM_PUBLIC_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
}

function saveTeamPublic(data) {
  writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify(data, null, 2));
}

function loadTeam() {
  if (!existsSync(TEAM_PATH)) {
    return { participants: {}, groups: {} };
  }
  return JSON.parse(readFileSync(TEAM_PATH, 'utf-8'));
}

// ==================== Upload Key ====================

export function uploadKey({ id, publicKey }) {
  if (!id) throw new Error('id is required');
  if (!publicKey) throw new Error('publicKey is required');

  const data = loadTeamPublic();
  
  data[id] = {
    publicKey,
    uploaded_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
    status: 'pending',
  };

  saveTeamPublic(data);
  return data[id];
}

// ==================== Approve Key ====================

export function approveKey({ id, approvedBy }) {
  if (!id) throw new Error('id is required');
  
  const data = loadTeamPublic();
  
  if (!data[id]) {
    throw new Error(`Member ${id} not found`);
  }
  
  if (data[id].status === 'active') {
    throw new Error(`Member ${id} already active`);
  }

  data[id].status = 'active';
  data[id].approved_by = approvedBy;
  data[id].approved_at = new Date().toISOString();

  saveTeamPublic(data);
  return data[id];
}

// ==================== Reject Key ====================

export function rejectKey({ id, reason }) {
  if (!id) throw new Error('id is required');
  
  const data = loadTeamPublic();
  
  if (!data[id]) {
    throw new Error(`Member ${id} not found`);
  }

  data[id].status = 'rejected';
  data[id].rejected_reason = reason || '';

  saveTeamPublic(data);
  return data[id];
}

// ==================== Remove Key ====================

export function removeKey({ id }) {
  if (!id) throw new Error('id is required');
  
  const data = loadTeamPublic();
  
  if (!data[id]) {
    throw new Error(`Member ${id} not found`);
  }

  delete data[id];
  saveTeamPublic(data);
  return true;
}

// ==================== Get Active Members ====================

export function getActiveMembers() {
  const data = loadTeamPublic();
  return Object.entries(data)
    .filter(([_, member]) => member.status === 'active')
    .map(([id, member]) => ({ id, ...member }));
}

// ==================== Resolve Groups ====================

export function resolveGroups(groupIds) {
  const team = loadTeam();
  const resolved = new Set();
  
  for (const groupId of groupIds) {
    if (team.groups[groupId]) {
      for (const memberId of team.groups[groupId]) {
        resolved.add(memberId);
      }
    }
  }
  
  return Array.from(resolved);
}

// ==================== Can Access ====================

export function canAccess({ key, id, access }) {
  const team = loadTeam();
  const teamPublic = loadTeamPublic();
  
  // Check if member is active
  if (!teamPublic[id] || teamPublic[id].status !== 'active') {
    return false;
  }
  
  // Check direct ID access
  if (access.read && access.read.includes(id)) {
    return true;
  }
  
  // Check group access
  if (access.read) {
    for (const groupId of access.read) {
      if (team.groups[groupId] && team.groups[groupId].includes(id)) {
        return true;
      }
    }
  }
  
  return false;
}

// ==================== Get Authorized Members ====================

export function getAuthorizedMembers({ key, access }) {
  const team = loadTeam();
  const teamPublic = loadTeamPublic();
  
  if (!access || !access.read) {
    return [];
  }
  
  const authorized = new Set();
  
  for (const entry of access.read) {
    // Direct ID
    if (teamPublic[entry] && teamPublic[entry].status === 'active') {
      authorized.add(entry);
    }
    
    // Group
    if (team.groups[entry]) {
      for (const memberId of team.groups[entry]) {
        if (teamPublic[memberId] && teamPublic[memberId].status === 'active') {
          authorized.add(memberId);
        }
      }
    }
  }
  
  return Array.from(authorized);
}

// ==================== CLI ====================

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--upload-key') opts.action = 'upload-key';
    else if (args[i] === '--approve') opts.action = 'approve';
    else if (args[i] === '--reject') opts.action = 'reject';
    else if (args[i] === '--remove-key') opts.action = 'remove-key';
    else if (args[i] === '--list-keys') opts.action = 'list-keys';
    else if (args[i] === '--can-access') opts.action = 'can-access';
    else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--public-key' && args[i + 1]) opts.publicKey = args[++i];
    else if (args[i] === '--approved-by' && args[i + 1]) opts.approvedBy = args[++i];
    else if (args[i] === '--reason' && args[i + 1]) opts.reason = args[++i];
    else if (args[i] === '--key' && args[i + 1]) opts.key = args[++i];
  }
  return opts;
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  try {
    switch (opts.action) {
      case 'upload-key': {
        const result = uploadKey({ id: opts.id, publicKey: opts.publicKey });
        console.log(`Key uploaded for ${opts.id} (status: pending)`);
        break;
      }
      case 'approve': {
        const result = approveKey({ id: opts.id, approvedBy: opts.approvedBy });
        console.log(`Key approved for ${opts.id} (status: active)`);
        break;
      }
      case 'reject': {
        const result = rejectKey({ id: opts.id, reason: opts.reason });
        console.log(`Key rejected for ${opts.id}`);
        break;
      }
      case 'remove-key': {
        removeKey({ id: opts.id });
        console.log(`Key removed for ${opts.id}`);
        break;
      }
      case 'list-keys': {
        const data = loadTeamPublic();
        const entries = Object.entries(data);
        if (entries.length === 0) {
          console.log('No keys registered');
        } else {
          for (const [id, info] of entries) {
            console.log(`${id}: ${info.status} (${info.publicKey.substring(0, 20)}...)`);
          }
        }
        break;
      }
      case 'can-access': {
        // This would need access.json content
        console.log('Usage: --can-access requires --access option');
        break;
      }
      default:
        console.log('Usage: node manage-keys.js --upload-key|--approve|--reject|--remove-key|--list-keys');
        console.log('  --upload-key --id ID --public-key KEY');
        console.log('  --approve --id ID');
        console.log('  --reject --id ID --reason REASON');
        console.log('  --remove-key --id ID');
        console.log('  --list-keys');
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

export { loadTeamPublic, loadTeam };

if (process.argv[1] && process.argv[1].endsWith('manage-keys.js')) {
  main();
}
