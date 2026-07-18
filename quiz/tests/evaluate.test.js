#!/usr/bin/env node
/**
 * evaluate.test.js — Tests for evaluation modes
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Replicate evaluateSession logic here (importing from evaluate.js would require
 * restructuring that file for export). These tests test the behavior directly.
 */

function evaluateSessionModeA(session, key) {
  if (!session.questions || session.mode === 'survey') return session;
  for (const q of session.questions) {
    if (q.correct !== undefined) continue;
    const answer = key.answers[q.id];
    let correct;
    if (q.type === 'multiple') {
      const sel = [...(q.selected || [])].sort();
      const cor = [...(answer.correct || [])].sort();
      correct = sel.length === cor.length && sel.every((v, i) => v === cor[i]);
    } else {
      correct = (q.selected ? q.selected[0] : undefined) === answer.correct;
    }
    q.correct = correct;
  }
  const total = session.questions.filter(q => q.type !== 'survey').length;
  const correctCount = session.questions.filter(q => q.type !== 'survey' && q.correct === true).length;
  session.score = {
    correct: correctCount,
    total,
    percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0,
  };
  session.evaluated = true;
  return session;
}

function evaluateSessionModeB(session, key) {
  if (!session.questions || session.mode === 'survey') return session;
  let correctCount = 0;
  let total = 0;
  for (const q of session.questions) {
    if (q.type === 'survey') continue;
    total++;
    const answer = key.answers[q.id];
    let correct;
    if (q.type === 'multiple') {
      const sel = [...(q.selected || [])].sort();
      const cor = [...(answer.correct || [])].sort();
      correct = sel.length === cor.length && sel.every((v, i) => v === cor[i]);
    } else {
      correct = (q.selected ? q.selected[0] : undefined) === answer.correct;
    }
    if (correct) correctCount++;
    // Mode B: do NOT set q.correct
  }
  session.score = {
    correct: correctCount,
    total,
    percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0,
  };
  session.evaluated = true;
  return session;
}

const key = { answers: { q1: { correct: 0 }, q2: { correct: 1 } } };

describe('evaluateSession Mode A (full evaluation)', () => {
  it('populates correct fields and score for unscored live session', () => {
    const session = {
      session_id: 'q-test-1',
      mode: 'live',
      bank: 'test.json',
      questions: [
        { id: 'q1', type: 'single', selected: [0] },
        { id: 'q2', type: 'single', selected: [0] },
      ],
      score: null,
      evaluated: false,
    };
    const result = evaluateSessionModeA(session, key);
    assert.equal(result.questions[0].correct, true);
    assert.equal(result.questions[1].correct, false);
    assert.deepEqual(result.score, { correct: 1, total: 2, percentage: 50 });
    assert.equal(result.evaluated, true);
  });

  it('skips already-evaluated questions (idempotent)', () => {
    const session = {
      session_id: 'q-test-2',
      mode: 'live',
      bank: 'test.json',
      questions: [
        { id: 'q1', type: 'single', selected: [0], correct: true },
        { id: 'q2', type: 'single', selected: [0] },
      ],
      score: null,
      evaluated: false,
    };
    const result = evaluateSessionModeA(session, key);
    assert.equal(result.questions[0].correct, true); // unchanged
    assert.equal(result.questions[1].correct, false); // evaluated now
    assert.deepEqual(result.score, { correct: 1, total: 2, percentage: 50 });
  });

  it('does nothing for survey mode', () => {
    const session = {
      session_id: 's-test-1',
      mode: 'survey',
      bank: 'survey.json',
      questions: [{ id: 's1', type: 'survey', selected: ['Good'] }],
      score: null,
    };
    const result = evaluateSessionModeA(session, key);
    assert.equal(result, session); // returned unchanged
    assert.equal(result.questions[0].correct, undefined);
  });
});

describe('evaluateSession Mode B (score-only)', () => {
  it('populates score but does NOT set per-question correct fields', () => {
    const session = {
      session_id: 'q-test-3',
      mode: 'live',
      bank: 'test.json',
      questions: [
        { id: 'q1', type: 'single', selected: [0] },
        { id: 'q2', type: 'single', selected: [0] },
      ],
      score: null,
      evaluated: false,
    };
    const result = evaluateSessionModeB(session, key);
    assert.equal(result.questions[0].correct, undefined);
    assert.equal(result.questions[1].correct, undefined);
    assert.deepEqual(result.score, { correct: 1, total: 2, percentage: 50 });
    assert.equal(result.evaluated, true);
  });

  it('handles all-correct responses', () => {
    const session = {
      session_id: 'q-test-4',
      mode: 'live',
      bank: 'test.json',
      questions: [
        { id: 'q1', type: 'single', selected: [0] },
        { id: 'q2', type: 'single', selected: [1] },
      ],
      score: null,
      evaluated: false,
    };
    const result = evaluateSessionModeB(session, key);
    assert.deepEqual(result.score, { correct: 2, total: 2, percentage: 100 });
  });

  it('does nothing for survey mode', () => {
    const session = {
      session_id: 's-test-2',
      mode: 'survey',
      bank: 'survey.json',
      questions: [{ id: 's1', type: 'survey', selected: ['Good'] }],
      score: null,
    };
    const result = evaluateSessionModeB(session, key);
    assert.equal(result, session);
  });
});
