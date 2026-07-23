#!/usr/bin/env node
/**
 * encrypt-key.js — SOPS/age encrypt key files
 *
 * Usage:
 *   node encrypt-key.js keys/topic.json
 *
 * Requires SOPS_AGE_KEY env var pointing to age key file.
 * Falls back gracefully if sops/age not installed.
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const KEYS_DIR = resolve(PROJECT_ROOT, 'quiz', 'keys');
const TEAM_PUBLIC_PATH = resolve(KEYS_DIR, 'team-public.json');
const TEAM_PATH = resolve(PROJECT_ROOT, 'team.json');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function loadTeamPublic() {
  if (!existsSync(TEAM_PUBLIC_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
}

function loadTeam() {
  if (!existsSync(TEAM_PATH)) {
    return { participants: {}, groups: {} };
  }
  return JSON.parse(readFileSync(TEAM_PATH, 'utf-8'));
}

function resolveGroups(entries) {
  const team = loadTeam();
  const resolved = new Set();
  
  for (const entry of entries) {
    // Direct ID
    if (team.participants[entry]) {
      resolved.add(entry);
    }
    // Group
    else if (team.groups[entry]) {
      for (const memberId of team.groups[entry]) {
        resolved.add(memberId);
      }
    }
  }
  
  return Array.from(resolved);
}

function getActivePublicKeys(memberIds) {
  const teamPublic = loadTeamPublic();
  const keys = [];
  
  for (const id of memberIds) {
    if (teamPublic[id] && teamPublic[id].status === 'active') {
      keys.push(teamPublic[id].publicKey);
    }
  }
  
  return keys;
}

// ==================== Multi-Person Encryption ====================

export function encryptKeyForMembers({ keyFile, access }) {
  if (!keyFile) throw new Error('keyFile is required');
  if (!access || !access.read) throw new Error('access.read is required');

  // Resolve key file path
  const fullPath = (keyFile.startsWith('quiz/') || keyFile.startsWith('surveys/'))
    ? resolve(PROJECT_ROOT, keyFile)
    : resolve(PROJECT_ROOT, 'quiz', keyFile);

  if (!existsSync(fullPath)) {
    throw new Error(`Key file not found: ${keyFile}`);
  }

  // Resolve member IDs from groups and direct IDs
  const memberIds = resolveGroups(access.read);
  
  // Get active public keys
  const publicKeys = getActivePublicKeys(memberIds);
  
  if (publicKeys.length === 0) {
    throw new Error('No active members found for encryption');
  }

  // Always include admin's public key for re-encryption capability
  const adminKeyPath = process.env.SOPS_ADMIN_AGE_KEY;
  if (adminKeyPath) {
    const adminPublicKey = run(`age-keygen -y "${adminKeyPath}"`);
    if (adminPublicKey && !publicKeys.includes(adminPublicKey)) {
      publicKeys.push(adminPublicKey);
    }
  }

  // Check if file is already encrypted (has sops metadata)
  const content = readFileSync(fullPath, 'utf-8');
  const isEncrypted = content.includes('"sops":') || content.includes('ENC[');
  
  if (isEncrypted) {
    // Decrypt first using admin key
    if (!adminKeyPath) {
      throw new Error('File is encrypted but SOPS_ADMIN_AGE_KEY not set for re-encryption');
    }
    
    try {
      // Set SOPS_AGE_KEY_FILE for decryption
      execSync(`sops -d -i "${fullPath}"`, { 
        stdio: 'pipe',
        env: { ...process.env, SOPS_AGE_KEY_FILE: adminKeyPath }
      });
    } catch {
      throw new Error('Cannot decrypt file for re-encryption');
    }
  }

  // Build sops command with multiple age keys
  const ageKeys = publicKeys.map(k => `--age "${k}"`).join(' ');
  
  try {
    execSync(`sops ${ageKeys} -e -i "${fullPath}"`, { stdio: 'pipe' });
    return { success: true, keys: publicKeys.length };
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

// ==================== CLI ====================

function main() {
  const keyFile = process.argv[2];
  
  if (!keyFile) {
    console.error('Usage: node encrypt-key.js keys/topic.json');
    process.exit(1);
  }

  // Check if sops is available
  if (!run('sops --version')) {
    console.log(`Skipped encryption (sops not installed): ${keyFile}`);
    process.exit(0);
  }

  // Resolve path
  const fullPath = (keyFile.startsWith('quiz/') || keyFile.startsWith('surveys/'))
    ? resolve(PROJECT_ROOT, keyFile)
    : resolve(PROJECT_ROOT, 'quiz', keyFile);

  // Try encryption with .sops.yaml config first
  try {
    execSync(`sops -e -i "${fullPath}"`, { stdio: 'pipe' });
    console.log(`Encrypted: ${keyFile}`);
    process.exit(0);
  } catch {
    // No .sops.yaml or no keys configured, try with explicit age key
  }

  // Try with SOPS_AGE_KEY environment variable
  const ageKeyPath = process.env.SOPS_AGE_KEY;
  if (ageKeyPath) {
    const publicKey = run(`age-keygen -y "${ageKeyPath}"`);
    if (publicKey) {
      try {
        execSync(`sops --age "${publicKey}" -e -i "${fullPath}"`, { stdio: 'pipe' });
        console.log(`Encrypted with age: ${keyFile}`);
        process.exit(0);
      } catch (err) {
        console.error(`Encryption failed: ${err.message}`);
        process.exit(1);
      }
    }
  }

  console.log(`Skipped encryption (no age key configured): ${keyFile}`);
}

export { loadTeamPublic, loadTeam, resolveGroups, getActivePublicKeys };

if (process.argv[1] && process.argv[1].endsWith('encrypt-key.js')) {
  main();
}
