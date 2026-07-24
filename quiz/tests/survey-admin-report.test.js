#!/usr/bin/env node
/**
 * survey-admin-report.test.js — Tests for survey admin report generation
 *
 * TDD: Write failing tests first, then implement survey-admin-report.js
 * Uses Node.js built-in test runner — zero external dependencies.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TMP = join(tmpdir(), `survey-admin-report-test-${Date.now()}`);
const SURVEYS_DIR = join(TMP, 'surveys');
const RESULTS_DIR = join(SURVEYS_DIR, 'results');
const BANKS_DIR = join(SURVEYS_DIR, 'banks');

function setup() {
  mkdirSync(RESULTS_DIR, { recursive: true });
  mkdirSync(BANKS_DIR, { recursive: true });
  writeFileSync(join(SURVEYS_DIR, 'registry.json'), '{}');
  writeFileSync(join(SURVEYS_DIR, '_index.json'), JSON.stringify({ sessions: {}, by_participant: {}, by_bank: {} }));
  writeFileSync(join(SURVEYS_DIR, 'visibility.json'), '{}');
}

function teardown() {
  rmSync(TMP, { recursive: true, force: true });
}

function writeBank(name, questions) {
  const bank = {
    id: name.replace('.json', ''),
    title: `Survey: ${name}`,
    version: '1.0.0',
    type: 'survey',
    questions: questions.map((q, i) => ({
      id: q.id || `q-${String(i + 1).padStart(3, '0')}`,
      type: 'survey',
      question: q.text || `Question ${i + 1}`,
      options: q.options || ['Option A', 'Option B', 'Option C'],
    })),
  };
  writeFileSync(join(BANKS_DIR, name), JSON.stringify(bank, null, 2));
}

function writeSession(bankName, participantId, answers, sessionId) {
  const dir = join(RESULTS_DIR, bankName.replace('.json', ''));
  mkdirSync(dir, { recursive: true });
  const session = {
    session_id: sessionId || `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    mode: 'survey',
    bank: bankName,
    participant: { id: participantId, name: `User ${participantId}` },
    questions: answers.map((a, i) => ({
      id: `q-${String(i + 1).padStart(3, '0')}`,
      type: 'survey',
      selected: [{ id: `q-${String(i + 1).padStart(3, '0')}`, selected: [a] }],
    })),
  };
  writeFileSync(join(dir, `${session.session_id}.json`), JSON.stringify(session, null, 2));
  return session;
}

let mod;

describe('Survey Admin Report', () => {
  beforeEach(async () => {
    setup();
    mod = await import('../cli/survey-admin-report.js');
  });

  afterEach(() => {
    teardown();
  });

  it('generateSurveyReport returns summary with total responses', () => {
    writeBank('feedback.json', [
      { id: 'q-001', text: 'How satisfied?', options: ['Very', 'Somewhat', 'Not'] },
      { id: 'q-002', text: 'Would recommend?', options: ['Yes', 'No'] },
    ]);
    writeSession('feedback.json', '100', [0, 0], 's-001');
    writeSession('feedback.json', '200', [1, 0], 's-002');

    const report = mod.generateSurveyReport('feedback.json', TMP);
    assert.ok(report.includes('2'), 'Should show 2 responses');
    assert.ok(report.includes('feedback'), 'Should mention bank name');
  });

  it('generateSurveyReport includes per-question breakdown', () => {
    writeBank('feedback.json', [
      { id: 'q-001', text: 'Satisfaction', options: ['Good', 'Bad'] },
    ]);
    writeSession('feedback.json', '100', [0], 's-001');
    writeSession('feedback.json', '200', [0], 's-002');
    writeSession('feedback.json', '300', [1], 's-003');

    const report = mod.generateSurveyReport('feedback.json', TMP);
    assert.ok(report.includes('Good') || report.includes('q-001'), 'Should include question breakdown');
  });

  it('generateSurveyReport returns empty message when no results', () => {
    writeBank('empty.json', [{ id: 'q-001', text: 'Q1', options: ['A', 'B'] }]);

    const report = mod.generateSurveyReport('empty.json', TMP);
    assert.ok(report.includes('0') || report.includes('no') || report.includes('No'), 'Should indicate no responses');
  });

  it('generateSurveyReport handles missing bank gracefully', () => {
    const report = mod.generateSurveyReport('nonexistent.json', TMP);
    assert.ok(report.includes('error') || report.includes('Error') || report.includes('not found') || report.includes('No bank'), 'Should handle missing bank');
  });

  it('generateSurveyReportCSV returns CSV format', () => {
    writeBank('feedback.json', [
      { id: 'q-001', text: 'Q1', options: ['A', 'B'] },
    ]);
    writeSession('feedback.json', '100', [0], 's-001');

    const csv = mod.generateSurveyReportCSV('feedback.json', TMP);
    assert.ok(typeof csv === 'string', 'Should return string');
    assert.ok(csv.includes(','), 'Should be comma-separated');
  });

  it('listSurveyBanks returns available banks', () => {
    writeBank('survey-a.json', [{ id: 'q-001', text: 'Q1', options: ['A'] }]);
    writeBank('survey-b.json', [{ id: 'q-001', text: 'Q1', options: ['A'] }]);

    const banks = mod.listSurveyBanks(TMP);
    assert.ok(Array.isArray(banks), 'Should return array');
    assert.ok(banks.length >= 2, 'Should find both banks');
    assert.ok(banks.includes('survey-a.json'));
    assert.ok(banks.includes('survey-b.json'));
  });

  it('listSurveyBanks returns empty array when no banks exist', () => {
    const banks = mod.listSurveyBanks(TMP);
    assert.equal(banks.length, 0);
  });

  it('getSurveyStats returns numeric stats', () => {
    writeBank('feedback.json', [
      { id: 'q-001', text: 'Q1', options: ['A', 'B', 'C'] },
    ]);
    writeSession('feedback.json', '100', [0], 's-001');
    writeSession('feedback.json', '200', [1], 's-002');
    writeSession('feedback.json', '300', [2], 's-003');

    const stats = mod.getSurveyStats('feedback.json', TMP);
    assert.equal(typeof stats.totalResponses, 'number');
    assert.equal(stats.totalResponses, 3);
    assert.ok(stats.questionStats, 'Should have questionStats');
  });

  it('getSurveyStats returns zero for empty bank', () => {
    writeBank('empty.json', [{ id: 'q-001', text: 'Q1', options: ['A'] }]);

    const stats = mod.getSurveyStats('empty.json', TMP);
    assert.equal(stats.totalResponses, 0);
  });
});
