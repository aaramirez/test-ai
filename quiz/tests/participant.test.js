#!/usr/bin/env node
/**
 * participant.test.js — Tests for participant registry
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function freshModule() {
  const modulePath = join(__dirname, '../lib/participant.js');
  return import(`file://${modulePath}`);
}

describe('registerParticipant', () => {
  let testFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-register-${Date.now()}.json`);
    process.env.QUIZ_PARTICIPANTS_PATH = testFile;
    p = await freshModule();
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
  });

  it('registers a new participant', () => {
    const result = p.registerParticipant({
      id: 'STU-001',
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    assert.equal(result.registered, true);
    assert.equal(result.participant.id, 'STU-001');
    assert.equal(result.participant.name, 'Jane Doe');
  });

  it('rejects duplicate participant', () => {
    const result = p.registerParticipant({
      id: 'STU-001',
      name: 'Jane Doe',
    });
    assert.equal(result.registered, false);
    assert.equal(result.message, 'Already registered');
  });
});

describe('findParticipant', () => {
  let testFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-find-${Date.now()}.json`);
    process.env.QUIZ_PARTICIPANTS_PATH = testFile;
    p = await freshModule();
    p.registerParticipant({ id: 'STU-002', name: 'John Doe' });
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
  });

  it('finds existing participant', () => {
    const result = p.findParticipant('STU-002');
    assert.ok(result);
    assert.equal(result.name, 'John Doe');
  });

  it('returns null for unknown participant', () => {
    const result = p.findParticipant('STU-999');
    assert.equal(result, null);
  });
});

describe('searchParticipants', () => {
  let testFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-search-${Date.now()}.json`);
    process.env.QUIZ_PARTICIPANTS_PATH = testFile;
    p = await freshModule();
    p.registerParticipant({ id: 'STU-010', name: 'Alice Smith', email: 'alice@test.com' });
    p.registerParticipant({ id: 'STU-011', name: 'Bob Smith', email: 'bob@test.com' });
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
  });

  it('searches by name', () => {
    const results = p.searchParticipants('Smith');
    assert.equal(results.length, 2);
  });

  it('searches by email', () => {
    const results = p.searchParticipants('alice@test.com');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'STU-010');
  });

  it('returns empty for no match', () => {
    const results = p.searchParticipants('ZZZ');
    assert.equal(results.length, 0);
  });
});

describe('importFromCSV', () => {
  let testFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-csv-${Date.now()}.json`);
    process.env.QUIZ_PARTICIPANTS_PATH = testFile;
    p = await freshModule();
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
  });

  it('imports participants from CSV', () => {
    const csv = 'id,name,email,group\nSTU-020,Alice,a@test.com,cohorte-A\nSTU-021,Bob,b@test.com,cohorte-A';
    const result = p.importFromCSV(csv);
    assert.equal(result.imported, 2);
    assert.equal(result.errors.length, 0);
  });

  it('returns error for CSV without id/name', () => {
    const csv = 'email,name\ntest@test.com,Alice';
    const result = p.importFromCSV(csv);
    assert.equal(result.imported, 0);
    assert.ok(result.errors.length > 0);
  });

  it('handles empty CSV', () => {
    const csv = 'id,name';
    const result = p.importFromCSV(csv);
    assert.equal(result.imported, 0);
  });
});
