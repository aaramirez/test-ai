#!/usr/bin/env node
/**
 * create-key.test.js — Tests for tutorial key creation
 *
 * TDD: Write failing tests first, then implement tutorials/cli/create-key.js
 * Uses Node.js built-in test runner — zero external dependencies.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TMP = join(tmpdir(), `tutorial-key-test-${Date.now()}`);
const TUTORIALS_DIR = join(TMP, 'tutorials');
const BANKS_DIR = join(TUTORIALS_DIR, 'banks');
const KEYS_DIR = join(TUTORIALS_DIR, 'keys');

function setup() {
  mkdirSync(BANKS_DIR, { recursive: true });
  mkdirSync(KEYS_DIR, { recursive: true });
}

function teardown() {
  rmSync(TMP, { recursive: true, force: true });
}

function writeTutorialBank(name, steps) {
  const bank = {
    name: `Tutorial: ${name}`,
    language: 'es',
    description: 'Test tutorial',
    version: '1.0.0',
    type: 'tutorial',
    steps: steps || [
      { id: 'intro', type: 'content', title: 'Intro', body: 'Welcome' },
      { id: 'q-001', type: 'question', question: 'Q1?', options: [{ label: 'A' }, { label: 'B' }] },
      { id: 'cp-001', type: 'checkpoint', question: 'Checkpoint?', options: [{ label: 'X' }, { label: 'Y' }], min_score: 1 },
    ],
  };
  writeFileSync(join(BANKS_DIR, name), JSON.stringify(bank, null, 2));
}

let mod;

describe('Tutorial Create Key', () => {
  beforeEach(async () => {
    setup();
    process.env.TUTORIALS_DIR = TUTORIALS_DIR;
    mod = await import('../cli/create-key.js');
  });

  afterEach(() => {
    delete process.env.TUTORIALS_DIR;
    teardown();
  });

  it('createTutorialKey creates key file from bank', () => {
    writeTutorialBank('test.json');

    const result = mod.createTutorialKey({ bankName: 'test.json', root: TUTORIALS_DIR });
    assert.ok(existsSync(join(KEYS_DIR, 'test.json')), 'Key file should exist');

    const key = JSON.parse(readFileSync(join(KEYS_DIR, 'test.json'), 'utf-8'));
    assert.equal(key.bank, 'test.json');
    assert.ok(key.answers, 'Should have answers object');
  });

  it('createTutorialKey creates key with answers for scorable steps', () => {
    writeTutorialBank('test.json');

    mod.createTutorialKey({ bankName: 'test.json', root: TUTORIALS_DIR });
    const key = JSON.parse(readFileSync(join(KEYS_DIR, 'test.json'), 'utf-8'));
    assert.ok('q-001' in key.answers || 'cp-001' in key.answers, 'Should have entries for scorable steps');
  });

  it('createTutorialKey throws if bank not found', () => {
    assert.throws(() => {
      mod.createTutorialKey({ bankName: 'nonexistent.json', root: TUTORIALS_DIR });
    }, /not found|No bank/i);
  });

  it('createTutorialKey throws if key already exists', () => {
    writeTutorialBank('test.json');
    writeFileSync(join(KEYS_DIR, 'test.json'), '{"answers":{}}');

    assert.throws(() => {
      mod.createTutorialKey({ bankName: 'test.json', root: TUTORIALS_DIR });
    }, /already exists/i);
  });

  it('addTutorialAnswer adds correct answer to key', () => {
    writeTutorialBank('test.json');
    mod.createTutorialKey({ bankName: 'test.json', root: TUTORIALS_DIR });

    mod.addTutorialAnswer({ keyName: 'test.json', stepId: 'q-001', correct: 1, root: TUTORIALS_DIR });
    const key = JSON.parse(readFileSync(join(KEYS_DIR, 'test.json'), 'utf-8'));
    assert.equal(key.answers['q-001'].correct, 1);
  });

  it('addTutorialAnswer supports explanation', () => {
    writeTutorialBank('test.json');
    mod.createTutorialKey({ bankName: 'test.json', root: TUTORIALS_DIR });

    mod.addTutorialAnswer({ keyName: 'test.json', stepId: 'q-001', correct: 0, explanation: 'Because X', root: TUTORIALS_DIR });
    const key = JSON.parse(readFileSync(join(KEYS_DIR, 'test.json'), 'utf-8'));
    assert.equal(key.answers['q-001'].explanation, 'Because X');
  });

  it('addTutorialAnswer throws if key not found', () => {
    assert.throws(() => {
      mod.addTutorialAnswer({ keyName: 'nonexistent.json', stepId: 'q-001', correct: 0, root: TUTORIALS_DIR });
    }, /not found|No key/i);
  });

  it('listTutorialKeys returns available keys', () => {
    writeFileSync(join(KEYS_DIR, 'a.json'), '{"answers":{}}');
    writeFileSync(join(KEYS_DIR, 'b.json'), '{"answers":{}}');

    const keys = mod.listTutorialKeys(TUTORIALS_DIR);
    assert.ok(Array.isArray(keys));
    assert.ok(keys.length >= 2);
  });

  it('listTutorialKeys returns empty when no keys', () => {
    const keys = mod.listTutorialKeys(TUTORIALS_DIR);
    assert.equal(keys.length, 0);
  });
});
