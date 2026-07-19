#!/usr/bin/env node
/**
 * participant.test.js — Tests for participant registry (team.json + id.json)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function freshModule() {
  const modulePath = join(__dirname, '../lib/participant.js');
  return import(`file://${modulePath}?t=${Date.now()}`);
}

describe('registerParticipant', () => {
  let testFile;
  let testIdFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-register-${Date.now()}.json`);
    testIdFile = join(__dirname, `test-id-${Date.now()}.json`);
    process.env.TEAM_PATH = testFile;
    process.env.ID_PATH = testIdFile;
    p = await freshModule();
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
    if (testIdFile && existsSync(testIdFile)) unlinkSync(testIdFile);
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
  let testIdFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-find-${Date.now()}.json`);
    testIdFile = join(__dirname, `test-id-find-${Date.now()}.json`);
    process.env.TEAM_PATH = testFile;
    process.env.ID_PATH = testIdFile;
    p = await freshModule();
    p.registerParticipant({ id: 'STU-002', name: 'John Doe' });
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
    if (testIdFile && existsSync(testIdFile)) unlinkSync(testIdFile);
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

describe('findById (id.json lookup)', () => {
  let testFile;
  let testIdFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-idlookup-${Date.now()}.json`);
    testIdFile = join(__dirname, `test-idlookup-id-${Date.now()}.json`);
    process.env.TEAM_PATH = testFile;
    process.env.ID_PATH = testIdFile;
    p = await freshModule();
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
    if (testIdFile && existsSync(testIdFile)) unlinkSync(testIdFile);
  });

  it('returns null for unknown ID', () => {
    const result = p.findById('12345');
    assert.equal(result, null);
  });

  it('finds participant by ID after registration', () => {
    p.registerParticipant({ id: '12345', name: 'Juan Pérez', email: 'juan@test.com' });
    const result = p.findById('12345');
    assert.ok(result);
    assert.equal(result.name, 'Juan Pérez');
    assert.equal(result.email, 'juan@test.com');
  });

  it('does not find removed participant', () => {
    const result = p.findById('99999');
    assert.equal(result, null);
  });
});

describe('searchParticipants', () => {
  let testFile;
  let testIdFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-search-${Date.now()}.json`);
    testIdFile = join(__dirname, `test-id-search-${Date.now()}.json`);
    process.env.TEAM_PATH = testFile;
    process.env.ID_PATH = testIdFile;
    p = await freshModule();
    p.registerParticipant({ id: 'STU-010', name: 'Alice Smith', email: 'alice@test.com' });
    p.registerParticipant({ id: 'STU-011', name: 'Bob Smith', email: 'bob@test.com' });
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
    if (testIdFile && existsSync(testIdFile)) unlinkSync(testIdFile);
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
  let testIdFile;
  let p;

  before(async () => {
    testFile = join(__dirname, `test-csv-${Date.now()}.json`);
    testIdFile = join(__dirname, `test-id-csv-${Date.now()}.json`);
    process.env.TEAM_PATH = testFile;
    process.env.ID_PATH = testIdFile;
    p = await freshModule();
  });

  after(() => {
    if (testFile && existsSync(testFile)) unlinkSync(testFile);
    if (testIdFile && existsSync(testIdFile)) unlinkSync(testIdFile);
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

describe('team.json and id.json paths', () => {
  it('uses TEAM_PATH env var', () => {
    const customPath = join(__dirname, `custom-team-${Date.now()}.json`);
    process.env.TEAM_PATH = customPath;
    assert.ok(process.env.TEAM_PATH);
    delete process.env.TEAM_PATH;
  });

  it('uses ID_PATH env var', () => {
    const customPath = join(__dirname, `custom-id-${Date.now()}.json`);
    process.env.ID_PATH = customPath;
    assert.ok(process.env.ID_PATH);
    delete process.env.ID_PATH;
  });
});
