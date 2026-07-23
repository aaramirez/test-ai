#!/usr/bin/env node
/**
 * security.test.js — Fase D: Security tests
 *
 * Tests impersonation prevention, pending-not-active enforcement,
 * and admin-only access control for key management.
 *
 * Runs with --test-concurrency=1 (shared team-public.json).
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
const BACKUP_DIR = join(KEYS_DIR, '.test-backup-sec');

const { uploadKey, approveKey, rejectKey, removeKey, getActiveMembers, canAccess, getAuthorizedMembers, loadTeamPublic, loadTeam } = await import('../cli/manage-keys.js');
const { encryptKeyForMembers, getActivePublicKeys } = await import('../cli/encrypt-key.js');

function safeUnlink(p) { try { unlinkSync(p); } catch {} }
function safeMkdir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function backupFile(path) {
  const name = path === TEAM_PUBLIC_PATH ? 'team-public.json' : 'team.json';
  const backupPath = join(BACKUP_DIR, name);
  if (existsSync(path)) writeFileSync(backupPath, readFileSync(path));
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

function writeTeamPublic(data) {
  writeFileSync(TEAM_PUBLIC_PATH, JSON.stringify(data, null, 2));
}

function writeTeam(data) {
  writeFileSync(TEAM_PATH, JSON.stringify(data, null, 2));
}

// ==================== Impersonation Tests ====================

describe('Security: impersonation prevention', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('uploaded key is always pending, never active', () => {
    const result = uploadKey({ id: 'attacker-999', publicKey: 'age1attacker_fake_key' });
    assert.equal(result.status, 'pending');
    assert.equal(result.approved_by, null);
    assert.equal(result.approved_at, null);
  });

  it('impersonated key is not in active members list', () => {
    uploadKey({ id: 'attacker-999', publicKey: 'age1attacker_fake_key' });
    const active = getActiveMembers();
    const found = active.find(m => m.id === 'attacker-999');
    assert.equal(found, undefined);
  });

  it('impersonated key is excluded from encryption', () => {
    writeTeam({
      participants: { 'attacker-999': { id: 'attacker-999', name: 'Attacker' } },
      groups: {}
    });
    writeTeamPublic({
      'attacker-999': { publicKey: 'age1attacker_fake_key', status: 'pending' }
    });

    const activeKeys = getActivePublicKeys(['attacker-999']);
    assert.equal(activeKeys.length, 0);
  });

  it('upload does not overwrite existing active key', () => {
    writeTeamPublic({
      '10488134': {
        publicKey: 'age1real_key',
        status: 'active',
        approved_by: 'admin',
        approved_at: '2026-07-22T00:00:00Z',
        uploaded_at: '2026-07-21T00:00:00Z'
      }
    });

    const result = uploadKey({ id: '10488134', publicKey: 'age1fake_override' });
    assert.equal(result.status, 'pending');

    const data = loadTeamPublic();
    assert.equal(data['10488134'].status, 'pending');
    assert.equal(data['10488134'].publicKey, 'age1fake_override');
  });
});

// ==================== Pending-Not-Active Tests ====================

describe('Security: pending keys are not active', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('pending key is not returned by getActiveMembers', () => {
    uploadKey({ id: '100', publicKey: 'age1pending' });
    const active = getActiveMembers();
    assert.equal(active.length, 0);
  });

  it('pending key is excluded from encryption public keys', () => {
    writeTeamPublic({
      '100': { publicKey: 'age1pending', status: 'pending' },
      '200': { publicKey: 'age1active', status: 'active' }
    });

    const keys = getActivePublicKeys(['100', '200']);
    assert.equal(keys.length, 1);
    assert.equal(keys[0], 'age1active');
  });

  it('rejected key is excluded from encryption', () => {
    writeTeamPublic({
      '100': { publicKey: 'age1rejected', status: 'rejected' }
    });

    const keys = getActivePublicKeys(['100']);
    assert.equal(keys.length, 0);
  });

  it('canAccess returns false for pending member', () => {
    writeTeamPublic({
      '100': { publicKey: 'age1pending', status: 'pending' }
    });
    writeTeam({
      participants: { '100': { id: '100', name: 'Pending' } },
      groups: {}
    });

    const access = { read: ['100'] };
    assert.equal(canAccess({ key: 'test.json', id: '100', access }), false);
  });

  it('canAccess returns true only for active member', () => {
    writeTeamPublic({
      '100': { publicKey: 'age1active', status: 'active' }
    });
    writeTeam({
      participants: { '100': { id: '100', name: 'Active' } },
      groups: {}
    });

    const access = { read: ['100'] };
    assert.equal(canAccess({ key: 'test.json', id: '100', access }), true);
  });
});

// ==================== Admin-Only Approval Tests ====================

describe('Security: admin-only approval', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('only approveKey can activate a pending key', () => {
    uploadKey({ id: '100', publicKey: 'age1key' });
    let data = loadTeamPublic();
    assert.equal(data['100'].status, 'pending');

    approveKey({ id: '100', approvedBy: 'admin' });
    data = loadTeamPublic();
    assert.equal(data['100'].status, 'active');
    assert.equal(data['100'].approved_by, 'admin');
  });

  it('rejectKey prevents activation', () => {
    uploadKey({ id: '100', publicKey: 'age1key' });
    rejectKey({ id: '100', reason: 'Not authorized' });

    const data = loadTeamPublic();
    assert.equal(data['100'].status, 'rejected');

    assert.throws(() => approveKey({ id: '100' }), /already active|not found|rejected/i);
  });

  it('removeKey permanently deletes the entry', () => {
    uploadKey({ id: '100', publicKey: 'age1key' });
    approveKey({ id: '100', approvedBy: 'admin' });

    removeKey({ id: '100' });
    const data = loadTeamPublic();
    assert.equal(data['100'], undefined);
  });

  it('approveKey fails on non-existent member', () => {
    assert.throws(() => approveKey({ id: 'ghost' }), /not found/i);
  });

  it('rejectKey fails on non-existent member', () => {
    assert.throws(() => rejectKey({ id: 'ghost' }), /not found/i);
  });

  it('removeKey fails on non-existent member', () => {
    assert.throws(() => removeKey({ id: 'ghost' }), /not found/i);
  });
});

// ==================== Access Control Tests ====================

describe('Security: access control enforcement', () => {
  beforeEach(setupDescribe);
  afterEach(teardownDescribe);

  it('getAuthorizedMembers excludes pending members', () => {
    writeTeam({
      participants: {
        '100': { id: '100', name: 'Active' },
        '200': { id: '200', name: 'Pending' }
      },
      groups: {}
    });
    writeTeamPublic({
      '100': { publicKey: 'age1active', status: 'active' },
      '200': { publicKey: 'age1pending', status: 'pending' }
    });

    const authorized = getAuthorizedMembers({
      key: 'test.json',
      access: { read: ['100', '200'] }
    });
    assert.deepEqual(authorized, ['100']);
  });

  it('getAuthorizedMembers resolves groups but only returns active', () => {
    writeTeam({
      participants: {
        '100': { id: '100', name: 'Active A' },
        '200': { id: '200', name: 'Pending B' },
        '300': { id: '300', name: 'Active C' }
      },
      groups: { 'evaluadores': ['100', '200', '300'] }
    });
    writeTeamPublic({
      '100': { publicKey: 'age1a', status: 'active' },
      '200': { publicKey: 'age1b', status: 'pending' },
      '300': { publicKey: 'age1c', status: 'active' }
    });

    const authorized = getAuthorizedMembers({
      key: 'test.json',
      access: { read: ['evaluadores'] }
    });
    assert.deepEqual(authorized.sort(), ['100', '300']);
  });

  it('empty access.read returns no authorized members', () => {
    writeTeamPublic({
      '100': { publicKey: 'age1active', status: 'active' }
    });

    const authorized = getAuthorizedMembers({
      key: 'test.json',
      access: { read: [] }
    });
    assert.deepEqual(authorized, []);
  });

  it('missing access object returns no authorized members', () => {
    const authorized = getAuthorizedMembers({ key: 'test.json', access: null });
    assert.deepEqual(authorized, []);
  });
});
