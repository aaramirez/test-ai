#!/usr/bin/env node
/**
 * lifecycle.test.js — Tests for key management lifecycle
 *
 * Tests: new-member, remove-member, revoke-access
 *
 * Uses TEST_DIR env var to target a separate directory (default: ../test-ai-test)
 * so admin and member flows don't share files.
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
const TEST_DIR = resolve(process.env.TEST_DIR || join(PROJECT_ROOT, '..', 'test-ai-test'));

const KEYS_DIR = join(TEST_DIR, 'quiz', 'keys');
const TEAM_PUBLIC_PATH = join(KEYS_DIR, 'team-public.json');
const TEAM_PATH = join(TEST_DIR, 'team.json');
const TEST_KEY_PATH = join(KEYS_DIR, 'test-lifecycle-key.json');

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

describe('Lifecycle — New Member', () => {
  beforeEach(() => {
    safeMkdir(KEYS_DIR);
  });

  afterEach(() => {
    safeUnlink(TEAM_PUBLIC_PATH);
    safeUnlink(TEAM_PATH);
    safeUnlink(TEST_KEY_PATH);
  });

  it('can upload key and approve in sequence', async () => {
    const pubKey = generateAgeKey();
    if (!pubKey) {
      console.log('# Skipping - age not installed');
      return;
    }

    const mod = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
    const { uploadKey, approveKey } = mod;

    // Step 1: Member uploads key
    uploadKey({ id: '10488136', publicKey: pubKey });
    
    let data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(data['10488136'].status, 'pending');

    // Step 2: Admin approves
    approveKey({ id: '10488136', approvedBy: '10488100' });
    
    data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(data['10488136'].status, 'active');
    assert.equal(data['10488136'].approved_by, '10488100');
  });

  it('new member can decrypt after approval', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping - age not installed');
      return;
    }

    try {
      // Setup: admin with active key
      writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
        '10488134': { publicKey: pubKey1, status: 'active' }
      }, null, 2));

      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: { '10488134': { id: '10488134', name: 'Admin' } },
        groups: { 'quiz-admin': ['10488134'] }
      }, null, 2));

      // Create and encrypt key for admin only
      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import(join(TEST_DIR, 'quiz', 'cli', 'encrypt-key.js'));
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['quiz-admin'] }
      });

      // Verify encrypted
      let content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'Should be encrypted');

      // New member uploads and gets approved
      const { uploadKey, approveKey } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      uploadKey({ id: '10488136', publicKey: pubKey2 });
      approveKey({ id: '10488136', approvedBy: '10488134' });

      // Add new member to group
      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Admin' },
          '10488136': { id: '10488136', name: 'New Member' }
        },
        groups: { 'quiz-admin': ['10488134', '10488136'] }
      }, null, 2));

      // Re-encrypt for new group
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['quiz-admin'] }
      });

      // Both can decrypt now
      content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'Should still be encrypted');
    } finally {
      removeTempAdminKey(adminKey);
    }
  });
});

describe('Lifecycle — Remove Member', () => {
  beforeEach(() => {
    safeMkdir(KEYS_DIR);
  });

  afterEach(() => {
    safeUnlink(TEAM_PUBLIC_PATH);
    safeUnlink(TEAM_PATH);
    safeUnlink(TEST_KEY_PATH);
  });

  it('removed member cannot decrypt', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping - age not installed');
      return;
    }

    try {
      // Setup: two active members
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

      // Encrypt for evaluadores
      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import(join(TEST_DIR, 'quiz', 'cli', 'encrypt-key.js'));
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['evaluadores'] }
      });

      // Verify encrypted
      let content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'Should be encrypted');

      // Remove member 10488135
      const { removeKey } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      removeKey({ id: '10488135' });

      // Remove from group
      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' }
        },
        groups: { 'evaluadores': ['10488134'] }
      }, null, 2));

      // Re-encrypt without removed member
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['evaluadores'] }
      });

      // Verify still encrypted
      content = readFileSync(TEST_KEY_PATH, 'utf-8');
      assert.ok(content.includes('ENC['), 'Should still be encrypted');

      // Verify removed member can't access
      const { canAccess } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
      assert.equal(data['10488135'], undefined, 'Member should be removed from team-public');
    } finally {
      removeTempAdminKey(adminKey);
    }
  });

  it('remaining members can still decrypt after removal', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping - age not installed');
      return;
    }

    try {
      // Setup: two active members
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

      // Encrypt for evaluadores
      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import(join(TEST_DIR, 'quiz', 'cli', 'encrypt-key.js'));
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['evaluadores'] }
      });

      // Remove member 10488135
      const { removeKey } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      removeKey({ id: '10488135' });

      // Update group
      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' }
        },
        groups: { 'evaluadores': ['10488134'] }
      }, null, 2));

      // Re-encrypt
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['evaluadores'] }
      });

      // Verify 10488134 can still access
      const { canAccess } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      const access = { read: ['evaluadores'] };
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488134', access }), true);
    } finally {
      removeTempAdminKey(adminKey);
    }
  });
});

describe('Lifecycle — Revoke Access', () => {
  beforeEach(() => {
    safeMkdir(KEYS_DIR);
  });

  afterEach(() => {
    safeUnlink(TEAM_PUBLIC_PATH);
    safeUnlink(TEAM_PATH);
    safeUnlink(TEST_KEY_PATH);
  });

  it('revoked member cannot access specific key', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping - age not installed');
      return;
    }

    try {
      // Setup: two active members in same group
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

      // Encrypt for evaluadores
      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      const { encryptKeyForMembers } = await import(join(TEST_DIR, 'quiz', 'cli', 'encrypt-key.js'));
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['evaluadores'] }
      });

      // Verify both can access
      const { canAccess } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      const access = { read: ['evaluadores'] };
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488134', access }), true);
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488135', access }), true);

      // Revoke 10488135 from evaluadores (remove from group)
      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' },
          '10488135': { id: '10488135', name: 'Prof B' }
        },
        groups: { 'evaluadores': ['10488134'] }
      }, null, 2));

      // Re-encrypt
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['evaluadores'] }
      });

      // Verify 10488135 can no longer access
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488135', access }), false);
      // But 10488134 still can
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488134', access }), true);
    } finally {
      removeTempAdminKey(adminKey);
    }
  });

  it('revoke from one key does not affect other keys', async () => {
    const pubKey1 = generateAgeKey();
    const pubKey2 = generateAgeKey();
    const adminKey = createTempAdminKey();
    if (!pubKey1 || !pubKey2 || !adminKey) {
      console.log('# Skipping - age not installed');
      return;
    }

    try {
      // Setup
      writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
        '10488134': { publicKey: pubKey1, status: 'active' },
        '10488135': { publicKey: pubKey2, status: 'active' }
      }, null, 2));

      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' },
          '10488135': { id: '10488135', name: 'Prof B' }
        },
        groups: { 'quiz-admin': ['10488134', '10488135'] }
      }, null, 2));

      // Create two key files
      const testKeyPath2 = join(KEYS_DIR, 'test-lifecycle-key2.json');
      writeFileSync(TEST_KEY_PATH, JSON.stringify({
        bank: 'test.json',
        answers: { 'q-001': { correct: 1 } }
      }, null, 2));

      writeFileSync(testKeyPath2, JSON.stringify({
        bank: 'test2.json',
        answers: { 'q-002': { correct: 2 } }
      }, null, 2));

      // Both keys encrypted for quiz-admin
      const { encryptKeyForMembers } = await import(join(TEST_DIR, 'quiz', 'cli', 'encrypt-key.js'));
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['quiz-admin'] }
      });
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key2.json`,
        access: { read: ['quiz-admin'] }
      });

      // Verify both can access both keys
      const { canAccess } = await import(join(TEST_DIR, 'quiz', 'cli', 'manage-keys.js'));
      const access = { read: ['quiz-admin'] };
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488135', access }), true);
      assert.equal(canAccess({ key: 'quiz/keys/test2.json', id: '10488135', access }), true);

      // Remove 10488135 from quiz-admin
      writeFileSync(TEAM_PATH, JSON.stringify({
        participants: {
          '10488134': { id: '10488134', name: 'Prof A' },
          '10488135': { id: '10488135', name: 'Prof B' }
        },
        groups: { 'quiz-admin': ['10488134'] }
      }, null, 2));

      // Re-encrypt both keys
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key.json`,
        access: { read: ['quiz-admin'] }
      });
      encryptKeyForMembers({
        keyFile: `quiz/keys/test-lifecycle-key2.json`,
        access: { read: ['quiz-admin'] }
      });

      // 10488135 can no longer access either key
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488135', access }), false);
      assert.equal(canAccess({ key: 'quiz/keys/test2.json', id: '10488135', access }), false);

      // 10488134 can still access both
      assert.equal(canAccess({ key: 'quiz/keys/test.json', id: '10488134', access }), true);
      assert.equal(canAccess({ key: 'quiz/keys/test2.json', id: '10488134', access }), true);

      safeUnlink(testKeyPath2);
    } finally {
      removeTempAdminKey(adminKey);
    }
  });
});
