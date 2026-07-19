#!/usr/bin/env node
/**
 * install-protection.test.js — Tests for install data protection
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getFileList, isProtected, isAlwaysProtected } from '../cli/install.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

describe('isProtected', () => {
  it('protects id.json', () => {
    assert.ok(isProtected('id.json'));
  });

  it('protects team.json', () => {
    assert.ok(isProtected('team.json'));
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

  it('does not protect surveys/registry.json (always protected instead)', () => {
    assert.ok(!isProtected('surveys/registry.json'));
    assert.ok(isAlwaysProtected('surveys/registry.json'));
  });

  it('does not protect surveys/_index.json (always protected instead)', () => {
    assert.ok(!isProtected('surveys/_index.json'));
    assert.ok(isAlwaysProtected('surveys/_index.json'));
  });

  it('does not protect surveys/visibility.json (always protected instead)', () => {
    assert.ok(!isProtected('surveys/visibility.json'));
    assert.ok(isAlwaysProtected('surveys/visibility.json'));
  });

  it('protects surveys/results/', () => {
    assert.ok(isProtected('surveys/results/feedback-survey/session-1.json'));
  });

  it('protects surveys/banks/', () => {
    assert.ok(isProtected('surveys/banks/feedback-survey.json'));
  });

  it('does not protect quiz/lib/', () => {
    assert.ok(!isProtected('quiz/lib/schema.js'));
  });

  it('does not protect quiz/cli/', () => {
    assert.ok(!isProtected('quiz/cli/install.js'));
  });
});

describe('isAlwaysProtected', () => {
  it('always protects surveys/registry.json', () => {
    assert.ok(isAlwaysProtected('surveys/registry.json'));
  });

  it('always protects surveys/_index.json', () => {
    assert.ok(isAlwaysProtected('surveys/_index.json'));
  });

  it('always protects surveys/visibility.json', () => {
    assert.ok(isAlwaysProtected('surveys/visibility.json'));
  });

  it('always protects quiz/results/_index.json', () => {
    assert.ok(isAlwaysProtected('quiz/results/_index.json'));
  });

  it('does not always protect id.json (regular protected)', () => {
    assert.ok(!isAlwaysProtected('id.json'));
  });

  it('does not always protect team.json (regular protected)', () => {
    assert.ok(!isAlwaysProtected('team.json'));
  });

  it('does not always protect quiz/lib/', () => {
    assert.ok(!isAlwaysProtected('quiz/lib/schema.js'));
  });
});

describe('getFileList excludes results, banks, and user data', () => {
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

  it('excludes repos.json', () => {
    const reposFiles = relFiles.filter(f => f === 'repos.json');
    assert.equal(reposFiles.length, 0, 'Found repos.json — should be excluded');
  });

  it('excludes id.json', () => {
    const idFiles = relFiles.filter(f => f === 'id.json');
    assert.equal(idFiles.length, 0, 'Found id.json — should be excluded');
  });

  it('excludes team.json', () => {
    const teamFiles = relFiles.filter(f => f === 'team.json');
    assert.equal(teamFiles.length, 0, 'Found team.json — should be excluded');
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
