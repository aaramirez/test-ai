#!/usr/bin/env node
/**
 * schema.test.js — Tests for tutorial schema loading and validation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  loadTutorial,
  loadKey,
  listTutorials,
  validateTutorial,
  validateStep,
  validateKey,
  STEP_TYPES,
  DIFFICULTIES,
} from '../lib/schema.js';

const FIXTURES = join(tmpdir(), 'tutorial-schema-test-' + Date.now());

function makeTutorial(overrides = {}) {
  return {
    name: 'Test Tutorial',
    description: 'A test tutorial',
    version: '1.0.0',
    type: 'tutorial',
    difficulty: 'easy',
    duration_estimate: 10,
    xp_per_correct: 10,
    steps: [
      {
        id: 'intro',
        type: 'content',
        title: 'Welcome',
        body: 'This is the intro step.',
      },
      {
        id: 'q-001',
        type: 'question',
        question: 'What is 2+2?',
        options: [
          { label: '3' },
          { label: '4' },
          { label: '5' },
        ],
        difficulty: 'easy',
      },
      {
        id: 'choice-001',
        type: 'choice',
        question: 'Choose a path',
        options: [
          { label: 'Easy', goto: 'q-001' },
          { label: 'Hard', goto: 'q-001' },
        ],
      },
      {
        id: 'code-001',
        type: 'code',
        title: 'Run this',
        body: 'Execute the command below',
        code: 'echo hello',
        expected_output: 'hello',
      },
      {
        id: 'challenge-001',
        type: 'challenge',
        title: 'Create a file',
        instructions: 'Create a file called test.txt',
      },
      {
        id: 'scenario-001',
        type: 'scenario',
        title: 'The Decision',
        narrative: 'You are at a crossroads.',
        options: [
          { label: 'Left', correct: true, feedback: 'Good!' },
          { label: 'Right', correct: false, feedback: 'Wrong!' },
        ],
      },
      {
        id: 'checkpoint-001',
        type: 'checkpoint',
        question: 'Quick check',
        options: [
          { label: 'A' },
          { label: 'B' },
        ],
        min_score_to_pass: 1,
      },
    ],
    ...overrides,
  };
}

function makeKey(overrides = {}) {
  return {
    bank: 'test-tutorial.json',
    bank_version: '1.0.0',
    answers: {
      'q-001': { correct: '4', explanation: '2+2=4' },
      'checkpoint-001': { correct: 'A' },
    },
    ...overrides,
  };
}

describe('STEP_TYPES', () => {
  it('includes all 7 step types', () => {
    assert.equal(STEP_TYPES.length, 7);
    assert.ok(STEP_TYPES.includes('content'));
    assert.ok(STEP_TYPES.includes('question'));
    assert.ok(STEP_TYPES.includes('choice'));
    assert.ok(STEP_TYPES.includes('code'));
    assert.ok(STEP_TYPES.includes('challenge'));
    assert.ok(STEP_TYPES.includes('scenario'));
    assert.ok(STEP_TYPES.includes('checkpoint'));
  });
});

describe('DIFFICULTIES', () => {
  it('includes easy, medium, hard', () => {
    assert.ok(DIFFICULTIES.includes('easy'));
    assert.ok(DIFFICULTIES.includes('medium'));
    assert.ok(DIFFICULTIES.includes('hard'));
  });
});

describe('validateStep', () => {
  it('returns empty for valid content step', () => {
    const errors = validateStep({ id: 's1', type: 'content', title: 'T', body: 'B' }, 0);
    assert.equal(errors.length, 0);
  });

  it('returns error for missing id', () => {
    const errors = validateStep({ type: 'content', title: 'T', body: 'B' }, 0);
    assert.ok(errors.some(e => e.includes('missing')));
  });

  it('returns error for invalid type', () => {
    const errors = validateStep({ id: 's1', type: 'invalid' }, 0);
    assert.ok(errors.some(e => e.includes('invalid')));
  });

  it('validates question step needs options', () => {
    const errors = validateStep({ id: 's1', type: 'question', question: 'Q?' }, 0);
    assert.ok(errors.some(e => e.includes('options')));
  });

  it('validates choice step needs goto', () => {
    const errors = validateStep({ id: 's1', type: 'choice', question: 'Q?', options: [{ label: 'A' }] }, 0);
    assert.ok(errors.some(e => e.includes('goto')));
  });

  it('validates checkpoint needs min_score_to_pass', () => {
    const errors = validateStep({ id: 's1', type: 'checkpoint', question: 'Q?', options: [{ label: 'A' }] }, 0);
    assert.ok(errors.some(e => e.includes('min_score_to_pass')));
  });

  it('validates scenario needs options with feedback', () => {
    const errors = validateStep({ id: 's1', type: 'scenario', title: 'T', narrative: 'N', options: [{ label: 'A' }] }, 0);
    assert.ok(errors.some(e => e.includes('feedback')));
  });
});

describe('validateTutorial', () => {
  it('returns empty for valid tutorial', () => {
    const errors = validateTutorial(makeTutorial());
    assert.equal(errors.length, 0);
  });

  it('returns error for missing name', () => {
    const errors = validateTutorial({ version: '1.0.0', steps: [] });
    assert.ok(errors.some(e => e.includes('name')));
  });

  it('returns error for missing version', () => {
    const errors = validateTutorial({ name: 'T', steps: [] });
    assert.ok(errors.some(e => e.includes('version')));
  });

  it('returns error for missing steps', () => {
    const errors = validateTutorial({ name: 'T', version: '1.0.0' });
    assert.ok(errors.some(e => e.includes('steps')));
  });

  it('detects duplicate step ids', () => {
    const t = makeTutorial({
      steps: [
        { id: 'dup', type: 'content', title: 'A', body: 'B' },
        { id: 'dup', type: 'content', title: 'C', body: 'D' },
      ],
    });
    const errors = validateTutorial(t);
    assert.ok(errors.some(e => e.includes('Duplicate')));
  });

  it('detects broken goto references', () => {
    const t = makeTutorial({
      steps: [
        { id: 's1', type: 'choice', question: 'Q?', options: [{ label: 'A', goto: 'nonexistent' }] },
      ],
    });
    const errors = validateTutorial(t);
    assert.ok(errors.some(e => e.includes('nonexistent')));
  });
});

describe('validateKey', () => {
  it('returns empty for valid key matching tutorial', () => {
    const errors = validateKey(makeKey(), makeTutorial());
    assert.equal(errors.length, 0);
  });

  it('returns error for missing bank', () => {
    const errors = validateKey({ answers: {} }, makeTutorial());
    assert.ok(errors.some(e => e.includes('bank')));
  });

  it('detects missing answer for question step', () => {
    const key = makeKey({ answers: {} });
    const errors = validateKey(key, makeTutorial());
    assert.ok(errors.some(e => e.includes('q-001')));
  });

  it('detects answer for unknown step', () => {
    const key = makeKey({ answers: { 'nonexistent': { correct: 'A' } } });
    const errors = validateKey(key, makeTutorial());
    assert.ok(errors.some(e => e.includes('nonexistent')));
  });
});

describe('listTutorials', () => {
  it('returns empty array when no tutorials exist', () => {
    const list = listTutorials(FIXTURES);
    assert.equal(list.length, 0);
  });
});
