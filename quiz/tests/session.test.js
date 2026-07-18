#!/usr/bin/env node
/**
 * session.test.js — Tests for session management
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSessionId, createSession } from '../lib/session.js';

describe('generateSessionId', () => {
  it('generates live session ID with q- prefix', () => {
    const id = generateSessionId('live');
    assert.match(id, /^q-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('generates practice session ID with p- prefix', () => {
    const id = generateSessionId('practice');
    assert.match(id, /^p-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('generates survey session ID with s- prefix', () => {
    const id = generateSessionId('survey');
    assert.match(id, /^s-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('uses x- prefix for unknown mode', () => {
    const id = generateSessionId('unknown');
    assert.match(id, /^x-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId('live'));
    }
    assert.equal(ids.size, 100);
  });
});

describe('createSession', () => {
  const questions = [
    { id: 'q1', type: 'single', difficulty: 'easy', question: 'Q1?', options: [{ label: 'A' }, { label: 'B' }] },
    { id: 'q2', type: 'single', difficulty: 'easy', question: 'Q2?', options: [{ label: 'A' }, { label: 'B' }] },
  ];
  const selections = [[0], [1]];
  const key = { answers: { q1: { correct: 0 }, q2: { correct: 1 } } };
  const participant = { id: 'STU-001', name: 'Jane', email: 'jane@example.com' };
  const baseOpts = { bank: 'test.json', bankVersion: '1.0.0', participant, questions, selections, key };

  it('stores raw selections for live mode — no score, no correct fields', () => {
    const session = createSession({ ...baseOpts, mode: 'live' });
    assert.equal(session.mode, 'live');
    assert.equal(session.score, null);
    assert.equal(session.evaluated, false);
    assert.equal(session.questions.length, 2);
    for (const q of session.questions) {
      assert.equal(q.correct, undefined);
      assert.ok(Array.isArray(q.selected));
    }
    assert.deepEqual(session.questions[0].selected, [0]);
    assert.deepEqual(session.questions[1].selected, [1]);
  });

  it('computes score for practice mode', () => {
    const session = createSession({ ...baseOpts, mode: 'practice' });
    assert.equal(session.mode, 'practice');
    assert.ok(session.score !== null && session.score !== undefined);
    assert.equal(typeof session.score.correct, 'number');
    assert.equal(typeof session.score.total, 'number');
    assert.equal(typeof session.score.percentage, 'number');
    assert.equal(session.questions.length, 2);
    for (const q of session.questions) {
      assert.equal(typeof q.correct, 'boolean');
    }
  });

  it('stores raw selections for survey mode — no score, no correct fields', () => {
    const surveyQs = [
      { id: 's1', type: 'survey', question: 'Rate?', options: [{ label: 'Good' }, { label: 'Bad' }] },
    ];
    const session = createSession({
      mode: 'survey', bank: 'survey.json', bankVersion: '1.0.0',
      participant, questions: surveyQs, selections: [['Good']],
    });
    assert.equal(session.mode, 'survey');
    assert.equal(session.score, null);
    assert.equal(session.evaluated, undefined);
    assert.equal(session.questions.length, 1);
    assert.equal(session.questions[0].correct, undefined);
    assert.deepEqual(session.questions[0].selected, ['Good']);
  });
});
