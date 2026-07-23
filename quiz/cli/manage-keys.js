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
const APPROVALS_ENC_PATH = join(KEYS_DIR, 'approvals.json.enc');

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

// ==================== SOPS Encryption Helpers ====================

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
  } catch {
    return null;
  }
}

function getAdminKeyPath() {
  const keyPath = process.env.SOPS_ADMIN_AGE_KEY;
  if (!keyPath) {
    throw new Error('SOPS_ADMIN_AGE_KEY not set — admin key required for this operation');
  }
  return keyPath;
}

function encryptFile(filePath) {
  const adminKey = getAdminKeyPath();
  const pubKey = run(`age-keygen -y "${adminKey}"`);
  if (!pubKey) throw new Error('Cannot derive public key from admin key');
  try {
    execSync(`sops --age "${pubKey}" -e -i "${filePath}"`, {
      stdio: 'pipe',
      env: { ...process.env, SOPS_AGE_KEY_FILE: adminKey }
    });
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

function decryptFile(filePath) {
  const adminKey = getAdminKeyPath();
  try {
    return execSync(`sops -d "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, SOPS_AGE_KEY_FILE: adminKey }
    }).trim();
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

function readEncryptedJson(filePath) {
  if (!existsSync(filePath)) return null;
  const raw = decryptFile(filePath);
  return JSON.parse(raw);
}

function writeEncryptedJson(filePath, data) {
  const tmpPath = filePath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  encryptFile(tmpPath);
  const encrypted = readFileSync(tmpPath);
  writeFileSync(filePath, encrypted);
  try { execSync(`rm "${tmpPath}"`, { stdio: 'pipe' }); } catch {}
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

  if (data[id].status === 'rejected') {
    throw new Error(`Member ${id} was rejected and cannot be re-activated`);
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

// ==================== Access Control (access.json.enc) ====================

export function loadAccess() {
  return readEncryptedJson(ACCESS_ENC_PATH) || {};
}

export function saveAccess(data) {
  writeEncryptedJson(ACCESS_ENC_PATH, data);
}

export function grantAccess({ key, read = [], write = [] }) {
  if (!key) throw new Error('key is required');
  getAdminKeyPath(); // ensure admin key available

  const data = loadAccess();
  if (!data[key]) data[key] = { read: [], write: [] };

  for (const id of read) {
    if (!data[key].read.includes(id)) data[key].read.push(id);
  }
  for (const id of write) {
    if (!data[key].write.includes(id)) data[key].write.push(id);
  }

  saveAccess(data);
  return data[key];
}

export function revokeAccess({ key, read = [], write = [] }) {
  if (!key) throw new Error('key is required');
  getAdminKeyPath();

  const data = loadAccess();
  if (!data[key]) return { read: [], write: [] };

  data[key].read = data[key].read.filter(id => !read.includes(id));
  data[key].write = data[key].write.filter(id => !write.includes(id));

  saveAccess(data);
  return data[key];
}

export function listAccess() {
  return loadAccess();
}

// ==================== Approvals (approvals.json.enc) ====================

export function loadApprovals() {
  return readEncryptedJson(APPROVALS_ENC_PATH) || { pending: [], approved: [], rejected: [] };
}

export function saveApprovals(data) {
  writeEncryptedJson(APPROVALS_ENC_PATH, data);
}

export function addApproval({ id, publicKey, reason }) {
  if (!id) throw new Error('id is required');
  if (!publicKey) throw new Error('publicKey is required');

  const data = loadApprovals();

  const existing = data.pending.find(a => a.id === id);
  if (existing) throw new Error(`Approval already pending for ${id}`);

  data.pending.push({
    id,
    publicKey,
    uploaded_at: new Date().toISOString(),
    reason: reason || ''
  });

  saveApprovals(data);
  return data.pending[data.pending.length - 1];
}

export function processApproval({ id, action, approvedBy, reason }) {
  if (!id) throw new Error('id is required');
  if (!['approve', 'reject'].includes(action)) throw new Error('action must be approve or reject');

  const data = loadApprovals();
  const idx = data.pending.findIndex(a => a.id === id);
  if (idx === -1) throw new Error(`No pending approval for ${id}`);

  const [entry] = data.pending.splice(idx, 1);
  entry.processed_at = new Date().toISOString();

  if (action === 'approve') {
    entry.approved_by = approvedBy;
    data.approved.push(entry);
  } else {
    entry.rejected_reason = reason || '';
    data.rejected.push(entry);
  }

  saveApprovals(data);
  return entry;
}

export function listPendingApprovals() {
  return loadApprovals().pending;
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
    else if (args[i] === '--grant') opts.action = 'grant';
    else if (args[i] === '--revoke') opts.action = 'revoke';
    else if (args[i] === '--list-access') opts.action = 'list-access';
    else if (args[i] === '--list-pending') opts.action = 'list-pending';
    else if (args[i] === '--add-approval') opts.action = 'add-approval';
    else if (args[i] === '--process-approval') opts.action = 'process-approval';
    else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--public-key' && args[i + 1]) opts.publicKey = args[++i];
    else if (args[i] === '--approved-by' && args[i + 1]) opts.approvedBy = args[++i];
    else if (args[i] === '--reason' && args[i + 1]) opts.reason = args[++i];
    else if (args[i] === '--key' && args[i + 1]) opts.key = args[++i];
    else if (args[i] === '--read' && args[i + 1]) opts.read = args[++i].split(',');
    else if (args[i] === '--write' && args[i + 1]) opts.write = args[++i].split(',');
    else if (args[i] === '--action' && args[i + 1]) opts.approvalAction = args[++i];
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
        console.log('Usage: --can-access requires --access option');
        break;
      }
      case 'grant': {
        const result = grantAccess({ key: opts.key, read: opts.read || [], write: opts.write || [] });
        console.log(`Access granted for ${opts.key}: read=[${result.read}] write=[${result.write}]`);
        break;
      }
      case 'revoke': {
        const result = revokeAccess({ key: opts.key, read: opts.read || [], write: opts.write || [] });
        console.log(`Access revoked for ${opts.key}: read=[${result.read}] write=[${result.write}]`);
        break;
      }
      case 'list-access': {
        const data = listAccess();
        const keys = Object.keys(data);
        if (keys.length === 0) {
          console.log('No access entries');
        } else {
          for (const [k, v] of Object.entries(data)) {
            console.log(`${k}: read=[${v.read}] write=[${v.write}]`);
          }
        }
        break;
      }
      case 'list-pending': {
        const pending = listPendingApprovals();
        if (pending.length === 0) {
          console.log('No pending approvals');
        } else {
          for (const a of pending) {
            console.log(`${a.id}: uploaded ${a.uploaded_at} — ${a.reason || 'no reason'}`);
          }
        }
        break;
      }
      case 'add-approval': {
        const result = addApproval({ id: opts.id, publicKey: opts.publicKey, reason: opts.reason });
        console.log(`Approval request added for ${opts.id} (pending)`);
        break;
      }
      case 'process-approval': {
        const result = processApproval({ id: opts.id, action: opts.approvalAction, approvedBy: opts.approvedBy, reason: opts.reason });
        console.log(`Approval ${opts.approvalAction}d for ${opts.id}`);
        break;
      }
      default:
        console.log('Usage: node manage-keys.js <action> [options]');
        console.log('  --upload-key --id ID --public-key KEY');
        console.log('  --approve --id ID [--approved-by ADMIN]');
        console.log('  --reject --id ID [--reason REASON]');
        console.log('  --remove-key --id ID');
        console.log('  --list-keys');
        console.log('  --grant --key KEY [--read ID,GROUP] [--write ID,GROUP]');
        console.log('  --revoke --key KEY [--read ID,GROUP] [--write ID,GROUP]');
        console.log('  --list-access');
        console.log('  --list-pending');
        console.log('  --add-approval --id ID --public-key KEY [--reason REASON]');
        console.log('  --process-approval --id ID --action approve|reject [--reason REASON]');
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
