#!/usr/bin/env node
/**
 * schema.test.js — Tests for schema validation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestion, validateBank, validateKey, QUESTION_TYPES, DIFFICULTIES } from '../lib/schema.js';

describe('validateQuestion', () => {
  it('returns no errors for valid question', () => {
    const q = { id: 'q1', question: 'What?', type: 'single', difficulty: 'easy', options: ['A', 'B'] };
    assert.deepEqual(validateQuestion(q, 0), []);
  });

  it('returns error for missing id', () => {
    const q = { question: 'What?', type: 'single', difficulty: 'easy', options: ['A', 'B'] };
    const errors = validateQuestion(q, 0);
    assert.ok(errors.some(e => e.includes('missing')));
  });

  it('returns error for missing question', () => {
    const q = { id: 'q1', type: 'single', difficulty: 'easy', options: ['A', 'B'] };
    const errors = validateQuestion(q, 0);
    assert.ok(errors.some(e => e.includes('missing')));
  });

  it('returns error for invalid type', () => {
    const q = { id: 'q1', question: 'What?', type: 'invalid', difficulty: 'easy', options: ['A', 'B'] };
    const errors = validateQuestion(q, 0);
    assert.ok(errors.some(e => e.includes('invalid type')));
  });

  it('returns error for missing difficulty in non-survey', () => {
    const q = { id: 'q1', question: 'What?', type: 'single', options: ['A', 'B'] };
    const errors = validateQuestion(q, 0);
    assert.ok(errors.some(e => e.includes('difficulty')));
  });

  it('allows survey without difficulty', () => {
    const q = { id: 'q1', question: 'What?', type: 'survey', options: ['A', 'B'] };
    assert.deepEqual(validateQuestion(q, 0), []);
  });

  it('returns error for less than 2 options', () => {
    const q = { id: 'q1', question: 'What?', type: 'single', difficulty: 'easy', options: ['A'] };
    const errors = validateQuestion(q, 0);
    assert.ok(errors.some(e => e.includes('at least 2')));
  });

  it('sets default type to single', () => {
    const q = { id: 'q1', question: 'What?', difficulty: 'easy', options: ['A', 'B'] };
    validateQuestion(q, 0);
    assert.equal(q.type, 'single');
  });
});

describe('validateBank', () => {
  it('returns no errors for valid bank', () => {
    const bank = {
      name: 'Test Bank',
      version: '1.0.0',
      questions: [
        { id: 'q1', question: 'What?', type: 'single', difficulty: 'easy', options: ['A', 'B'] },
      ],
    };
    assert.deepEqual(validateBank(bank), []);
  });

  it('returns error for missing name', () => {
    const bank = { version: '1.0.0', questions: [] };
    const errors = validateBank(bank);
    assert.ok(errors.some(e => e.includes('name')));
  });

  it('returns error for missing version', () => {
    const bank = { name: 'Test', questions: [] };
    const errors = validateBank(bank);
    assert.ok(errors.some(e => e.includes('version')));
  });

  it('returns error for missing questions', () => {
    const bank = { name: 'Test', version: '1.0.0' };
    const errors = validateBank(bank);
    assert.ok(errors.some(e => e.includes('questions')));
  });

  it('returns error for duplicate ids', () => {
    const bank = {
      name: 'Test',
      version: '1.0.0',
      questions: [
        { id: 'q1', question: 'What?', type: 'single', difficulty: 'easy', options: ['A', 'B'] },
        { id: 'q1', question: 'What2?', type: 'single', difficulty: 'easy', options: ['A', 'B'] },
      ],
    };
    const errors = validateBank(bank);
    assert.ok(errors.some(e => e.includes('Duplicate')));
  });
});

describe('validateKey', () => {
  it('returns no errors for valid key', () => {
    const bank = { questions: [{ id: 'q1' }, { id: 'q2' }] };
    const key = { bank: 'test.json', answers: { q1: { correct: 0 }, q2: { correct: 1 } } };
    assert.deepEqual(validateKey(key, bank), []);
  });

  it('returns error for missing answer', () => {
    const bank = { questions: [{ id: 'q1' }, { id: 'q2' }] };
    const key = { bank: 'test.json', answers: { q1: { correct: 0 } } };
    const errors = validateKey(key, bank);
    assert.ok(errors.some(e => e.includes('Missing answer for question: q2')));
  });

  it('returns error for answer to unknown question', () => {
    const bank = { questions: [{ id: 'q1' }] };
    const key = { bank: 'test.json', answers: { q1: { correct: 0 }, q3: { correct: 0 } } };
    const errors = validateKey(key, bank);
    assert.ok(errors.some(e => e.includes('unknown question')));
  });
});
