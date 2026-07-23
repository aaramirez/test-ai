#!/usr/bin/env node
/**
 * encrypt-key-multi.test.js — Tests for multi-person encryption
 *
 * Admin-side tests running in this repo.
 * Each test fully isolates its file state.
 *
 * TDD: RED → GREEN → REFACTOR
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const KEYS_DIR = join(PROJECT_ROOT, 'quiz', 'keys');
const TEAM_PUBLIC_PATH = join(KEYS_DIR, 'team-public.json');
const TEAM_PATH = join(PROJECT_ROOT, 'team.json');
const TEST_KEY_PATH = join(KEYS_DIR, 'test-multi-key.json');

function safeUnlink(p) {
  try { unlinkSync(p); } catch {}
}

function safeMkdir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function generateAgeKey() {
  try {
    const output = execSync('age-keygen 2>/dev/null', { encoding: 'utf-8' });
    const match = output.match(/public key: (.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function createTempAdminKey() {
  const tmpDir = join(PROJECT_ROOT, '..', '.opencode', 'tmp');
  safeMkdir(tmpDir);
  const keyPath = join(tmpDir, 'test-admin-key.txt');
  try {
    execSync(`age-keygen -o "${keyPath}" 2>/dev/null`, { stdio: 'pipe' });
    const oldVal = process.env.SOPS_ADMIN_AGE_KEY;
    process.env.SOPS_ADMIN_AGE_KEY = keyPath;
    return { keyPath, oldVal };
  } catch {
    return null;
  }
}

function removeTempAdminKey(info) {
  if (info && info.keyPath) {
    safeUnlink(info.keyPath);
    if (info.oldVal !== undefined) {
      process.env.SOPS_ADMIN_AGE_KEY = info.oldVal;
    } else {
      delete process.env.SOPS_ADMIN_AGE_KEY;
    }
  }
}

describe('encrypt-key.js — multi-person', () => {
  beforeEach(() => {
    safeMkdir(KEYS_DIR);
  });

  afterEach(() => {
    safeUnlink(TEAM_PUBLIC_PATH);
    safeUnlink(TEAM_PATH);
    safeUnlink(TEST_KEY_PATH);
  });

  it('encrypts for single active member', async () => {
    const pubKey = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey || !adminKey) {
      console.log('# Skipping age test - age not installed');
      return;
    }

    try {
      writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
        '10488134': { publicKey: pubKey, status: 'active' }
      }, null, 2));

      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: { '10488134': { id: '10488134', name: 'Prof A' } },
        groups: {}
      }, null, 2));

      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import('../cli/encrypt-key.js');
      encryptKeyForMembers({
        keyFile: 'quiz/keys/test-multi-key.json',
        access: { read: ['10488134'] }
      });

      const content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'File should be encrypted');
    } finally {
      removeTempAdminKey(adminKey);
    }
  });

  it('encrypts for multiple active members', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping age test - age not installed');
      return;
    }

    try {
      writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
        '10488134': { publicKey: pubKey1, status: 'active' },
        '10488135': { publicKey: pubKey2, status: 'active' }
      }, null, 2));

      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' },
          '10488135': { id: '10488135', name: 'Prof B' }
        },
        groups: {}
      }, null, 2));

      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import('../cli/encrypt-key.js');
      encryptKeyForMembers({
        keyFile: 'quiz/keys/test-multi-key.json',
        access: { read: ['10488134', '10488135'] }
      });

      const content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'File should be encrypted');
    } finally {
      removeTempAdminKey(adminKey);
    }
  });

  it('does not encrypt for pending members', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping age test - age not installed');
      return;
    }

    try {
      writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
        '10488134': { publicKey: pubKey1, status: 'active' },
        '10488135': { publicKey: pubKey2, status: 'pending' }
      }, null, 2));

      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' },
          '10488135': { id: '10488135', name: 'Prof B' }
        },
        groups: {}
      }, null, 2));

      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import('../cli/encrypt-key.js');
      encryptKeyForMembers({
        keyFile: 'quiz/keys/test-multi-key.json',
        access: { read: ['10488134', '10488135'] }
      });

      const content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'File should be encrypted');
    } finally {
      removeTempAdminKey(adminKey);
    }
  });

  it('resolves groups for encryption', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping age test - age not installed');
      return;
    }

    try {
      writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
        '10488134': { publicKey: pubKey1, status: 'active' },
        '10488135': { publicKey: pubKey2, status: 'active' }
      }, null, 2));

      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' },
          '10488135': { id: '10488135', name: 'Prof B' }
        },
        groups: { 'evaluadores': ['10488134', '10488135'] }
      }, null, 2));

      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import('../cli/encrypt-key.js');
      encryptKeyForMembers({
        keyFile: 'quiz/keys/test-multi-key.json',
        access: { read: ['evaluadores'] }
      });

      const content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'File should be encrypted');
    } finally {
      removeTempAdminKey(adminKey);
    }
  });

  it('throws if no active members found', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'pending' }
    }, null, 2));

    writeFileSync(TEAM_PATH, JSON.stringify({
      participants: { '10488134': { id: '10488134', name: 'Prof A' } },
      groups: {}
    }, null, 2));

    writeFileSync(TEST_KEY_PATH, JSON.stringify({
      bank: 'test.json',
      answers: { 'q-001': { correct: 1 } }
    }, null, 2));

    const { encryptKeyForMembers } = await import('../cli/encrypt-key.js');
    assert.throws(
      () => encryptKeyForMembers({
        keyFile: 'quiz/keys/test-multi-key.json',
        access: { read: ['10488134'] }
      }),
      /no active members/i
    );
  });

  it('throws if key file does not exist', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'active' }
    }, null, 2));

    writeFileSync(TEAM_PATH, JSON.stringify({
      participants: { '10488134': { id: '10488134', name: 'Prof A' } },
      groups: {}
    }, null, 2));

    const { encryptKeyForMembers } = await import('../cli/encrypt-key.js');
    assert.throws(
      () => encryptKeyForMembers({
        keyFile: 'quiz/keys/nonexistent.json',
        access: { read: ['10488134'] }
      }),
      /not found/i
    );
  });
});
