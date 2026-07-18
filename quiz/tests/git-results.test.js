#!/usr/bin/env node
/**
 * git-results.test.js — Tests for git commit + push of result files
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const TMP_DIR = join(import.meta.dirname, '..', '..', 'tmp-git-results-test');

describe('commitAndPushResult', () => {
  let originalCwd;

  beforeEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
    mkdirSync(TMP_DIR, { recursive: true });

    originalCwd = process.cwd();
    process.chdir(TMP_DIR);

    execSync('git init', { stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { stdio: 'pipe' });
    execSync('git config user.name "Test"', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  });

  it('module exports commitAndPushResult', async () => {
    const mod = await import('../lib/git-results.js');
    assert.equal(typeof mod.commitAndPushResult, 'function');
  });

  it('returns error when file does not exist', async () => {
    const { commitAndPushResult } = await import('../lib/git-results.js');
    const result = commitAndPushResult('/nonexistent/file.json', 'quiz');
    assert.equal(result.committed, false);
    assert.equal(result.pushed, false);
    assert.match(result.error, /not found/i);
  });

  it('commits a result file successfully', async () => {
    const { commitAndPushResult } = await import('../lib/git-results.js');
    const filePath = join(TMP_DIR, 'test-result.json');
    writeFileSync(filePath, JSON.stringify({ session_id: 'q-001' }));

    const result = commitAndPushResult(filePath, 'quiz');
    assert.equal(result.committed, true);
    assert.equal(result.pushed, false); // no remote configured

    const log = execSync('git log --oneline -1', { encoding: 'utf-8' });
    assert.match(log, /chore\(quiz\): add results test-result\.json/);
  });

  it('uses "survey" prefix in commit message for survey mode', async () => {
    const { commitAndPushResult } = await import('../lib/git-results.js');
    const filePath = join(TMP_DIR, 'survey-result.json');
    writeFileSync(filePath, JSON.stringify({ session_id: 's-001' }));

    const result = commitAndPushResult(filePath, 'survey');
    assert.equal(result.committed, true);

    const log = execSync('git log --oneline -1', { encoding: 'utf-8' });
    assert.match(log, /chore\(survey\): add results survey-result\.json/);
  });

  it('returns null error when file is already committed', async () => {
    const { commitAndPushResult } = await import('../lib/git-results.js');
    const filePath = join(TMP_DIR, 'already-committed.json');
    writeFileSync(filePath, JSON.stringify({ session_id: 'q-002' }));

    commitAndPushResult(filePath, 'quiz');
    const result = commitAndPushResult(filePath, 'quiz');

    assert.equal(result.committed, false);
    assert.equal(result.pushed, false);
    assert.equal(result.error, null);
  });
});
