#!/usr/bin/env node
/**
 * survey-session.test.js — Tests for survey session management
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

// These tests will fail until we implement survey-session.js
describe('survey-session module exports', () => {
  it('exports saveSurveyResult', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.saveSurveyResult, 'function');
  });

  it('exports loadSurveyResult', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.loadSurveyResult, 'function');
  });

  it('exports loadSurveyIndex', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.loadSurveyIndex, 'function');
  });

  it('exports loadSurveyRegistry', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.loadSurveyRegistry, 'function');
  });

  it('exports updateSurveyRegistry', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.updateSurveyRegistry, 'function');
  });

  it('exports getPendingSurveys', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.getPendingSurveys, 'function');
  });

  it('exports ensureSurveyDirs', async () => {
    const mod = await import('../lib/survey-session.js');
    assert.equal(typeof mod.ensureSurveyDirs, 'function');
  });
});

describe('saveSurveyResult', () => {
  let tmpDir;
  let mod;

  before(async () => {
    tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-survey-test-'));
    process.env.SURVEY_ROOT = tmpDir;
    mod = await import('../lib/survey-session.js');
  });

  after(() => {
    delete process.env.SURVEY_ROOT;
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('creates directories on first save', () => {
    const session = {
      session_id: 's-test-000001',
      date: '2026-07-18T10:00:00.000Z',
      mode: 'survey',
      bank: 'test-survey.json',
      bank_version: '1.0.0',
      participant: { id: 'STU-001', name: 'Jane Doe', email: 'jane@example.com' },
      questions: [
        { id: 'q-001', type: 'survey', selected: [0] }
      ],
      score: null,
    };

    const result = mod.saveSurveyResult(session, tmpDir);
    assert.ok(result.endsWith('.json'), 'returns file path');
    assert.ok(existsSync(result), 'file was created');
    assert.ok(existsSync(join(tmpDir, 'surveys', 'registry.json')), 'registry exists');
    assert.ok(existsSync(join(tmpDir, 'surveys', '_index.json')), 'index exists');
    assert.ok(existsSync(join(tmpDir, 'surveys', 'results', 'test-survey')), 'results bank dir exists');
  });

  it('writes valid JSON result file', () => {
    const filePath = join(tmpDir, 'surveys', 'results', 'test-survey', 's-test-000001.json');
    assert.ok(existsSync(filePath), 'session file exists');
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    assert.equal(parsed.mode, 'survey');
    assert.equal(parsed.session_id, 's-test-000001');
    assert.equal(parsed.participant.id, 'STU-001');
    assert.equal(parsed.score, null);
    assert.equal(parsed.evaluated, undefined);
    assert.equal(parsed.sent, undefined);
  });

  it('updates the index', () => {
    const index = mod.loadSurveyIndex(tmpDir);
    assert.ok(index.sessions['s-test-000001']);
    assert.equal(index.sessions['s-test-000001'].participant_id, 'STU-001');
    assert.equal(index.sessions['s-test-000001'].bank, 'test-survey.json');
    assert.equal(index.sessions['s-test-000001'].mode, 'survey');
    assert.ok(index.by_participant['STU-001'].includes('s-test-000001'));
    assert.ok(index.by_bank['test-survey.json'].includes('s-test-000001'));
  });

  it('updates registry', () => {
    const registry = mod.loadSurveyRegistry(tmpDir);
    assert.ok(registry['STU-001']);
    assert.ok(registry['STU-001']['test-survey.json']);
    assert.equal(registry['STU-001']['test-survey.json'].taken, true);
    assert.equal(registry['STU-001']['test-survey.json'].session_id, 's-test-000001');
  });

  it('loads registry with correct default', () => {
    const registry = mod.loadSurveyRegistry(tmpDir);
    assert.equal(typeof registry, 'object');
  });
});

describe('getPendingSurveys', () => {
  let tmpDir;
  let mod;

  before(async () => {
    tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-survey-pending-'));
    process.env.SURVEY_ROOT = tmpDir;
    mod = await import('../lib/survey-session.js');
    // Create surveys directory for the test writes
    mod.ensureSurveyDirs(tmpDir);
  });

  after(() => {
    delete process.env.SURVEY_ROOT;
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns all banks when no surveys taken', () => {
    const banks = ['feedback-survey.json', 'happy.json'];
    const pending = mod.getPendingSurveys('STU-001', banks, tmpDir);
    assert.equal(pending.length, 2);
    assert.ok(pending.includes('feedback-survey.json'));
    assert.ok(pending.includes('happy.json'));
  });

  it('excludes taken banks', () => {
    const reg = mod.loadSurveyRegistry(tmpDir);
    reg['STU-001'] = { 'happy.json': { taken: true, session_id: 's-test-001', date: '...' } };
    writeFileSync(join(tmpDir, 'surveys', 'registry.json'), JSON.stringify(reg, null, 2));

    const banks = ['feedback-survey.json', 'happy.json'];
    const pending = mod.getPendingSurveys('STU-001', banks, tmpDir);
    assert.equal(pending.length, 1);
    assert.equal(pending[0], 'feedback-survey.json');
  });

  it('returns empty array when all taken', () => {
    const reg = mod.loadSurveyRegistry(tmpDir);
    reg['STU-001'] = {
      'happy.json': { taken: true, session_id: 's-test-001', date: '...' },
      'feedback-survey.json': { taken: true, session_id: 's-test-002', date: '...' },
    };
    writeFileSync(join(tmpDir, 'surveys', 'registry.json'), JSON.stringify(reg, null, 2));

    const banks = ['feedback-survey.json', 'happy.json'];
    const pending = mod.getPendingSurveys('STU-001', banks, tmpDir);
    assert.equal(pending.length, 0);
  });
});

describe('surveys directory exists at source', () => {
  it('surveys/ directory has registry, index, results', () => {
    assert.ok(existsSync(join(PROJECT_ROOT, 'surveys', 'registry.json')), 'registry.json exists');
    assert.ok(existsSync(join(PROJECT_ROOT, 'surveys', '_index.json')), '_index.json exists');
    assert.ok(existsSync(join(PROJECT_ROOT, 'surveys', 'results')), 'results dir exists');
  });
});

describe('install.js includes surveys', () => {
  it('getFileList includes surveys/', async () => {
    const mod = await import('../cli/install.js');
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(paths.some(p => p.startsWith('surveys/')), 'includes surveys/');
    assert.ok(paths.some(p => p.startsWith('surveys/registry.json')), 'includes registry.json');
    assert.ok(paths.some(p => p.startsWith('surveys/_index.json')), 'includes _index.json');
  });
});
