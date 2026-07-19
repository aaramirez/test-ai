#!/usr/bin/env node
/**
 * install-protection.test.js — Tests for install data protection
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getFileList, isProtected } from '../cli/install.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

describe('isProtected', () => {
  it('protects participants.json', () => {
    assert.ok(isProtected('quiz/participants.json'));
  });

  it('protects quiz/results/', () => {
    assert.ok(isProtected('quiz/results/javascript/session-1.json'));
  });

  it('protects quiz/keys/', () => {
    assert.ok(isProtected('quiz/keys/javascript.json'));
  });

  it('protects quiz/banks/', () => {
    assert.ok(isProtected('quiz/banks/javascript.json'));
  });

  it('protects surveys/registry.json', () => {
    assert.ok(isProtected('surveys/registry.json'));
  });

  it('protects surveys/_index.json', () => {
    assert.ok(isProtected('surveys/_index.json'));
  });

  it('protects surveys/visibility.json', () => {
    assert.ok(isProtected('surveys/visibility.json'));
  });

  it('protects surveys/results/', () => {
    assert.ok(isProtected('surveys/results/feedback-survey/session-1.json'));
  });

  it('protects surveys/banks/', () => {
    assert.ok(isProtected('surveys/banks/feedback-survey.json'));
  });

  it('protects repos.json', () => {
    assert.ok(isProtected('repos.json'));
  });

  it('does not protect quiz/lib/', () => {
    assert.ok(!isProtected('quiz/lib/schema.js'));
  });

  it('does not protect quiz/cli/', () => {
    assert.ok(!isProtected('quiz/cli/install.js'));
  });
});

describe('getFileList excludes results and banks', () => {
  const files = getFileList(PROJECT_ROOT);
  const relFiles = files.map(f => f.replace(PROJECT_ROOT + '/', ''));

  it('excludes quiz/results/ directory', () => {
    const resultsFiles = relFiles.filter(f => f.startsWith('quiz/results/'));
    assert.equal(resultsFiles.length, 0, `Found quiz/results/ files: ${resultsFiles.join(', ')}`);
  });

  it('excludes quiz/banks/ directory', () => {
    const banksFiles = relFiles.filter(f => f.startsWith('quiz/banks/'));
    assert.equal(banksFiles.length, 0, `Found quiz/banks/ files: ${banksFiles.join(', ')}`);
  });

  it('excludes surveys/results/ directory', () => {
    const resultsFiles = relFiles.filter(f => f.startsWith('surveys/results/'));
    assert.equal(resultsFiles.length, 0, `Found surveys/results/ files: ${resultsFiles.join(', ')}`);
  });

  it('excludes surveys/banks/ directory', () => {
    const banksFiles = relFiles.filter(f => f.startsWith('surveys/banks/'));
    assert.equal(banksFiles.length, 0, `Found surveys/banks/ files: ${banksFiles.join(', ')}`);
  });

  it('excludes quiz/keys/ directory', () => {
    const keysFiles = relFiles.filter(f => f.startsWith('quiz/keys/'));
    assert.equal(keysFiles.length, 0, `Found quiz/keys/ files: ${keysFiles.join(', ')}`);
  });

  it('includes quiz/lib/ files', () => {
    const libFiles = relFiles.filter(f => f.startsWith('quiz/lib/'));
    assert.ok(libFiles.length > 0, 'Expected quiz/lib/ files to be included');
  });

  it('includes quiz/cli/ files', () => {
    const cliFiles = relFiles.filter(f => f.startsWith('quiz/cli/'));
    assert.ok(cliFiles.length > 0, 'Expected quiz/cli/ files to be included');
  });

  it('includes .opencode/skills/ files', () => {
    const skillFiles = relFiles.filter(f => f.startsWith('.opencode/skills/'));
    assert.ok(skillFiles.length > 0, 'Expected .opencode/skills/ files to be included');
  });
});
