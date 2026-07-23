#!/usr/bin/env node
/**
 * manage-keys.test.js — Tests for multi-person key management
 *
 * Admin-side tests running in this repo. Reads/writes the shared
 * quiz/keys/team-public.json and team.json, so the suite MUST run with
 * --test-concurrency=1 (see .opencode/commands/test.md). Backup/restore
 * additionally protects any real team files present during a run.
 *
 * TDD: RED → GREEN → REFACTOR
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const KEYS_DIR = join(PROJECT_ROOT, 'quiz', 'keys');
const TEAM_PUBLIC_PATH = join(KEYS_DIR, 'team-public.json');
const TEAM_PATH = join(PROJECT_ROOT, 'team.json');
const BACKUP_DIR = join(KEYS_DIR, '.test-backup-mk');

function safeUnlink(p) {
  try { unlinkSync(p); } catch {}
}

function safeMkdir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function backupFile(path) {
  const name = path === TEAM_PUBLIC_PATH ? 'team-public.json' : 'team.json';
  const backupPath = join(BACKUP_DIR, name);
  if (existsSync(path)) {
    writeFileSync(backupPath, readFileSync(path));
  }
  return backupPath;
}

function restoreFile(path) {
  const name = path === TEAM_PUBLIC_PATH ? 'team-public.json' : 'team.json';
  const backupPath = join(BACKUP_DIR, name);
  if (existsSync(backupPath)) {
    writeFileSync(path, readFileSync(backupPath));
    safeUnlink(backupPath);
  } else {
    safeUnlink(path);
  }
}

function setupDescribe() {
  safeMkdir(KEYS_DIR);
  safeMkdir(BACKUP_DIR);
  backupFile(TEAM_PUBLIC_PATH);
  backupFile(TEAM_PATH);
}

function teardownDescribe() {
  restoreFile(TEAM_PUBLIC_PATH);
  restoreFile(TEAM_PATH);
}

describe('manage-keys.js — upload-key', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('creates team-public.json if not exists', async () => {
    safeUnlink(TEAM_PUBLIC_PATH);
    const { uploadKey } = await import('../cli/manage-keys.js');
    uploadKey({ id: '10488134', publicKey: 'age1test123' });
    assert.ok(existsSync(TEAM_PUBLIC_PATH));
  });

  it('adds key with status pending', async () => {
    safeUnlink(TEAM_PUBLIC_PATH);
    const { uploadKey } = await import('../cli/manage-keys.js');
    uploadKey({ id: '10488134', publicKey: 'age1test123' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(data['10488134'].status, 'pending');
    assert.equal(data['10488134'].publicKey, 'age1test123');
    assert.equal(data['10488134'].approved_by, null);
  });

  it('includes uploaded_at timestamp', async () => {
    safeUnlink(TEAM_PUBLIC_PATH);
    const { uploadKey } = await import('../cli/manage-keys.js');
    uploadKey({ id: '10488134', publicKey: 'age1test123' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.ok(data['10488134'].uploaded_at);
    assert.ok(new Date(data['10488134'].uploaded_at) instanceof Date);
  });

  it('overwrites existing key for same id', async () => {
    safeUnlink(TEAM_PUBLIC_PATH);
    const { uploadKey } = await import('../cli/manage-keys.js');
    uploadKey({ id: '10488134', publicKey: 'age1old123' });
    uploadKey({ id: '10488134', publicKey: 'age1new456' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(data['10488134'].publicKey, 'age1new456');
  });

  it('can add multiple members', async () => {
    safeUnlink(TEAM_PUBLIC_PATH);
    const { uploadKey } = await import('../cli/manage-keys.js');
    uploadKey({ id: '10488134', publicKey: 'age1abc' });
    uploadKey({ id: '10488135', publicKey: 'age1def' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(Object.keys(data).length, 2);
    assert.ok(data['10488134']);
    assert.ok(data['10488135']);
  });

  it('throws if id is missing', async () => {
    const { uploadKey } = await import('../cli/manage-keys.js');
    assert.throws(
      () => uploadKey({ publicKey: 'age1test' }),
      /id.*required/i
    );
  });

  it('throws if publicKey is missing', async () => {
    const { uploadKey } = await import('../cli/manage-keys.js');
    assert.throws(
      () => uploadKey({ id: '10488134' }),
      /publicKey.*required/i
    );
  });
});

describe('manage-keys.js — approve', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('changes status from pending to active', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'pending', uploaded_at: '2026-07-22T00:00:00Z', approved_by: null }
    }, null, 2));

    const { approveKey } = await import('../cli/manage-keys.js');
    approveKey({ id: '10488134', approvedBy: '10488100' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(data['10488134'].status, 'active');
    assert.equal(data['10488134'].approved_by, '10488100');
  });

  it('adds approved_at timestamp', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'pending' }
    }, null, 2));

    const { approveKey } = await import('../cli/manage-keys.js');
    approveKey({ id: '10488134', approvedBy: '10488100' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.ok(data['10488134'].approved_at);
  });

  it('throws if member not found', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({}, null, 2));
    const { approveKey } = await import('../cli/manage-keys.js');
    assert.throws(
      () => approveKey({ id: '9999999', approvedBy: '10488100' }),
      /not found/i
    );
  });

  it('throws if already active', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'active' }
    }, null, 2));

    const { approveKey } = await import('../cli/manage-keys.js');
    assert.throws(
      () => approveKey({ id: '10488134', approvedBy: '10488100' }),
      /already active/i
    );
  });
});

describe('manage-keys.js — reject', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('changes status from pending to rejected', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'pending' }
    }, null, 2));

    const { rejectKey } = await import('../cli/manage-keys.js');
    rejectKey({ id: '10488134', reason: 'Not authorized' });
    
    const data = JSON.parse(readFileSync(TEAM_PUBLIC_PATH, 'utf-8'));
    assert.equal(data['10488134'].status, 'rejected');
    assert.equal(data['10488134'].rejected_reason, 'Not authorized');
  });
});

describe('manage-keys.js — can-access', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('returns true for active member with access', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'active' }
    }, null, 2));

    writeFileSync(TEAM_PATH, JSON.stringify({
      participants: { '10488134': { id: '10488134', name: 'Prof A' } },
      groups: { 'quiz-admin': ['10488134'] }
    }, null, 2));

    const { canAccess } = await import('../cli/manage-keys.js');
    const result = canAccess({
      key: 'quiz/keys/test-bank.json',
      id: '10488134',
      access: { read: ['quiz-admin'] }
    });
    assert.equal(result, true);
  });

  it('returns false for pending member', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'pending' }
    }, null, 2));

    writeFileSync(TEAM_PATH, JSON.stringify({
      participants: { '10488134': { id: '10488134', name: 'Prof A' } },
      groups: { 'quiz-admin': ['10488134'] }
    }, null, 2));

    const { canAccess } = await import('../cli/manage-keys.js');
    const result = canAccess({
      key: 'quiz/keys/test-bank.json',
      id: '10488134',
      access: { read: ['quiz-admin'] }
    });
    assert.equal(result, false);
  });

  it('resolves group membership', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'active' },
      '10488135': { publicKey: 'age1test2', status: 'active' }
    }, null, 2));

    writeFileSync(TEAM_PATH, JSON.stringify({
      participants: {
        '10488134': { id: '10488134', name: 'Prof A' },
        '10488135': { id: '10488135', name: 'Prof B' }
      },
      groups: { 'evaluadores': ['10488134', '10488135'] }
    }, null, 2));

    const { canAccess } = await import('../cli/manage-keys.js');
    
    const result1 = canAccess({
      key: 'quiz/keys/test-bank.json',
      id: '10488134',
      access: { read: ['evaluadores'] }
    });
    assert.equal(result1, true);

    const result2 = canAccess({
      key: 'quiz/keys/test-bank.json',
      id: '10488135',
      access: { read: ['evaluadores'] }
    });
    assert.equal(result2, true);
  });

  it('returns false for member not in group', async () => {
    writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify({
      '10488134': { publicKey: 'age1test', status: 'active' },
      '10488136': { publicKey: 'age1test3', status: 'active' }
    }, null, 2));

    writeFileSync(TEAM_PATH, JSON.stringify({
      participants: {
        '10488134': { id: '10488134', name: 'Prof A' },
        '10488136': { id: '10488136', name: 'Prof C' }
      },
      groups: { 'quiz-admin': ['10488134'] }
    }, null, 2));

    const { canAccess } = await import('../cli/manage-keys.js');
    const result = canAccess({
      key: 'quiz/keys/test-bank.json',
      id: '10488136',
      access: { read: ['quiz-admin'] }
    });
    assert.equal(result, false);
  });
});
