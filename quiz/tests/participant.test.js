#!/usr/bin/env node
/**
 * participant.test.js — Tests for participant registry
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_REGISTRY = join(__dirname, 'test-participants.json');

// Override the registry path for tests
const originalEnv = process.env;
let participantModule;

before(async () => {
  process.env.QUIZ_PARTICIPANTS_PATH = TEST_REGISTRY;
  participantModule = await import('../lib/participant.js');
});

after(() => {
  if (existsSync(TEST_REGISTRY)) unlinkSync(TEST_REGISTRY);
});

describe('registerParticipant', () => {
  after(() => {
    if (existsSync(TEST_REGISTRY)) unlinkSync(TEST_REGISTRY);
  });

  it('registers a new participant', () => {
    const result = participantModule.registerParticipant({
      id: 'STU-001',
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    assert.equal(result.registered, true);
    assert.equal(result.participant.id, 'STU-001');
    assert.equal(result.participant.name, 'Jane Doe');
  });

  it('rejects duplicate participant', () => {
    const result = participantModule.registerParticipant({
      id: 'STU-001',
      name: 'Jane Doe',
    });
    assert.equal(result.registered, false);
    assert.equal(result.message, 'Already registered');
  });
});

describe('findParticipant', () => {
  before(() => {
    participantModule.registerParticipant({ id: 'STU-002', name: 'John Doe' });
  });

  after(() => {
    if (existsSync(TEST_REGISTRY)) unlinkSync(TEST_REGISTRY);
  });

  it('finds existing participant', () => {
    const p = participantModule.findParticipant('STU-002');
    assert.ok(p);
    assert.equal(p.name, 'John Doe');
  });

  it('returns null for unknown participant', () => {
    const p = participantModule.findParticipant('STU-999');
    assert.equal(p, null);
  });
});

describe('searchParticipants', () => {
  before(() => {
    participantModule.registerParticipant({ id: 'STU-010', name: 'Alice Smith', email: 'alice@test.com' });
    participantModule.registerParticipant({ id: 'STU-011', name: 'Bob Smith', email: 'bob@test.com' });
  });

  after(() => {
    if (existsSync(TEST_REGISTRY)) unlinkSync(TEST_REGISTRY);
  });

  it('searches by name', () => {
    const results = participantModule.searchParticipants('Smith');
    assert.equal(results.length, 2);
  });

  it('searches by email', () => {
    const results = participantModule.searchParticipants('alice@test.com');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'STU-010');
  });

  it('returns empty for no match', () => {
    const results = participantModule.searchParticipants('ZZZ');
    assert.equal(results.length, 0);
  });
});

describe('importFromCSV', () => {
  after(() => {
    if (existsSync(TEST_REGISTRY)) unlinkSync(TEST_REGISTRY);
  });

  it('imports participants from CSV', () => {
    const csv = 'id,name,email,group\nSTU-020,Alice,a@test.com,cohorte-A\nSTU-021,Bob,b@test.com,cohorte-A';
    const result = participantModule.importFromCSV(csv);
    assert.equal(result.imported, 2);
    assert.equal(result.errors.length, 0);
  });

  it('returns error for CSV without id/name', () => {
    const csv = 'email,name\ntest@test.com,Alice';
    const result = participantModule.importFromCSV(csv);
    assert.equal(result.imported, 0);
    assert.ok(result.errors.length > 0);
  });

  it('handles empty CSV', () => {
    const csv = 'id,name';
    const result = participantModule.importFromCSV(csv);
    assert.equal(result.imported, 0);
  });
});
