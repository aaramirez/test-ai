#!/usr/bin/env node
/**
 * scorer.test.js — Tests for scoring engine
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSingle, scoreMultiple, scoreSurvey, scoreQuestion, calculateResults } from '../lib/scorer.js';

describe('scoreSingle', () => {
  it('returns true for correct answer', () => {
    assert.equal(scoreSingle(1, 1), true);
  });

  it('returns false for incorrect answer', () => {
    assert.equal(scoreSingle(0, 1), false);
  });
});

describe('scoreMultiple', () => {
  it('returns true for correct answers in order', () => {
    assert.equal(scoreMultiple([0, 1, 2], [0, 1, 2]), true);
  });

  it('returns true for correct answers out of order', () => {
    assert.equal(scoreMultiple([2, 0, 1], [0, 1, 2]), true);
  });

  it('returns false for incorrect answers', () => {
    assert.equal(scoreMultiple([0, 1], [0, 1, 2]), false);
  });

  it('returns false for non-array input', () => {
    assert.equal(scoreMultiple(0, [0, 1]), false);
  });
});

describe('scoreSurvey', () => {
  it('always returns null', () => {
    assert.equal(scoreSurvey(), null);
  });
});

describe('scoreQuestion', () => {
  const key = { answers: { q1: { correct: 1, explanation: 'Because' } } };

  it('scores single question correctly', () => {
    const q = { id: 'q1', type: 'single' };
    const result = scoreQuestion(q, [1], key);
    assert.equal(result.correct, true);
    assert.equal(result.explanation, 'Because');
  });

  it('scores single question incorrectly', () => {
    const q = { id: 'q1', type: 'single' };
    const result = scoreQuestion(q, [0], key);
    assert.equal(result.correct, false);
  });

  it('returns null for survey', () => {
    const q = { id: 'q1', type: 'survey' };
    const result = scoreQuestion(q, ['yes'], key);
    assert.equal(result.correct, null);
  });

  it('returns noKey when key missing', () => {
    const q = { id: 'q99', type: 'single' };
    const result = scoreQuestion(q, [0], key);
    assert.equal(result.correct, false);
    assert.equal(result.noKey, true);
  });
});

describe('calculateResults', () => {
  const questions = [
    { id: 'q1', type: 'single' },
    { id: 'q2', type: 'single' },
    { id: 'q3', type: 'survey' },
  ];
  const selections = [[1], [0], ['yes']];
  const key = { answers: { q1: { correct: 1 }, q2: { correct: 0 } } };

  it('calculates correct count and percentage', () => {
    const result = calculateResults(questions, selections, key);
    assert.equal(result.score.correct, 2);
    assert.equal(result.score.total, 2);
    assert.equal(result.score.percentage, 100);
  });

  it('excludes survey from total', () => {
    const result = calculateResults(questions, selections, key);
    assert.equal(result.score.total, 2);
  });

  it('returns empty results for no scoreable questions', () => {
    const surveyQuestions = [{ id: 's1', type: 'survey' }];
    const result = calculateResults(surveyQuestions, [['yes']], key);
    assert.equal(result.score.correct, 0);
    assert.equal(result.score.total, 0);
    assert.equal(result.score.percentage, 0);
  });
});
