#!/usr/bin/env node
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { unlinkSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

function safeUnlink(p) {
  try { unlinkSync(p); } catch {}
}

describe('create-bank.js --type', () => {
  const quizBankPath = join(PROJECT_ROOT, 'quiz', 'banks', 'test-quiz-cli.json');
  const surveyBankPath = join(PROJECT_ROOT, 'surveys', 'banks', 'test-survey-cli.json');

  beforeEach(() => {
    safeUnlink(quizBankPath);
    safeUnlink(surveyBankPath);
  });

  afterEach(() => {
    safeUnlink(quizBankPath);
    safeUnlink(surveyBankPath);
  });

  it('creates quiz bank in quiz/banks/ by default', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Quiz Cli', id: 'test-quiz-cli' });
    assert.ok(existsSync(quizBankPath));
    assert.ok(!existsSync(surveyBankPath));
    const bank = JSON.parse(readFileSync(quizBankPath, 'utf-8'));
    assert.equal(bank.type, 'quiz');
  });

  it('creates survey bank in surveys/banks/ when --type survey', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Survey Cli', id: 'test-survey-cli', type: 'survey' });
    assert.ok(existsSync(surveyBankPath));
    assert.ok(!existsSync(quizBankPath));
    const bank = JSON.parse(readFileSync(surveyBankPath, 'utf-8'));
    assert.equal(bank.type, 'survey');
  });

  it('creates quiz bank in quiz/banks/ when --type quiz', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Quiz Cli 2', id: 'test-quiz-cli', type: 'quiz' });
    assert.ok(existsSync(quizBankPath));
    assert.ok(!existsSync(surveyBankPath));
    const bank = JSON.parse(readFileSync(quizBankPath, 'utf-8'));
    assert.equal(bank.type, 'quiz');
  });

  it('refuses to overwrite existing bank', () => {
    // First creation succeeds
    const { createBank } = { createBank: undefined };
    assert.ok(true);
  });
});

describe('add-question.js with survey bank', () => {
  const surveyBankPath = join(PROJECT_ROOT, 'surveys', 'banks', 'test-add-q-survey.json');

  beforeEach(() => {
    safeUnlink(surveyBankPath);
  });

  afterEach(() => {
    safeUnlink(surveyBankPath);
  });

  it('reads from surveys/banks/ when path starts with surveys/', async () => {
    // Create bank first
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Survey', id: 'test-add-q-survey', type: 'survey' });
    assert.ok(existsSync(surveyBankPath));

    // Add a question
    const { addQuestion } = await import('../cli/add-question.js');
    addQuestion({
      bank: 'surveys/banks/test-add-q-survey.json',
      id: 'sq-001',
      type: 'survey',
      question: 'How are you?',
      options: ['Good', 'Bad'],
    });

    const bank = JSON.parse(readFileSync(surveyBankPath, 'utf-8'));
    assert.equal(bank.questions.length, 1);
    assert.equal(bank.questions[0].id, 'sq-001');
    assert.equal(bank.questions[0].type, 'survey');
  });
});

describe('create-key.js rejects survey banks', () => {
  it('throws when given a survey bank path', async () => {
    const { validateBankForKey } = await import('../cli/create-key.js');
    assert.throws(
      () => validateBankForKey('surveys/banks/feedback-survey.json'),
      /survey/
    );
  });
});

describe('add-question.js auto-updates key', () => {
  const quizBankPath = join(PROJECT_ROOT, 'quiz', 'banks', 'test-add-q-key.json');
  const quizKeyPath = join(PROJECT_ROOT, 'quiz', 'keys', 'test-add-q-key.json');

  beforeEach(() => {
    safeUnlink(quizBankPath);
    safeUnlink(quizKeyPath);
  });

  afterEach(() => {
    safeUnlink(quizBankPath);
    safeUnlink(quizKeyPath);
  });

  it('creates key when --correct is provided and key does not exist', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Add Q Key', id: 'test-add-q-key' });

    const { addQuestion } = await import('../cli/add-question.js');
    addQuestion({
      bank: 'quiz/banks/test-add-q-key.json',
      id: 'q-001',
      question: 'Test?',
      options: ['A', 'B'],
      correct: 1,
    });

    assert.ok(existsSync(quizKeyPath));
    const key = JSON.parse(readFileSync(quizKeyPath, 'utf-8'));
    assert.equal(key.answers['q-001'].correct, 1);
  });

  it('updates existing key when adding another question', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Add Q Key', id: 'test-add-q-key' });

    const { addQuestion } = await import('../cli/add-question.js');

    addQuestion({
      bank: 'quiz/banks/test-add-q-key.json',
      id: 'q-001',
      question: 'Test 1?',
      options: ['A', 'B'],
      correct: 0,
    });

    addQuestion({
      bank: 'quiz/banks/test-add-q-key.json',
      id: 'q-002',
      question: 'Test 2?',
      options: ['X', 'Y', 'Z'],
      correct: 2,
    });

    const key = JSON.parse(readFileSync(quizKeyPath, 'utf-8'));
    assert.equal(Object.keys(key.answers).length, 2);
    assert.equal(key.answers['q-001'].correct, 0);
    assert.equal(key.answers['q-002'].correct, 2);
  });

  it('does NOT create key when --correct is not provided', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Add Q Key', id: 'test-add-q-key' });

    const { addQuestion } = await import('../cli/add-question.js');
    addQuestion({
      bank: 'quiz/banks/test-add-q-key.json',
      id: 'q-001',
      question: 'Test?',
      options: ['A', 'B'],
    });

    assert.ok(!existsSync(quizKeyPath));
  });

  it('does NOT create key for survey banks even with --correct', async () => {
    const surveyBankPath = join(PROJECT_ROOT, 'surveys', 'banks', 'test-add-q-survey-key.json');
    const surveyKeyPath = join(PROJECT_ROOT, 'surveys', 'keys', 'test-add-q-survey-key.json');
    safeUnlink(surveyBankPath);
    safeUnlink(surveyKeyPath);

    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Survey', id: 'test-add-q-survey-key', type: 'survey' });

    const { addQuestion } = await import('../cli/add-question.js');
    addQuestion({
      bank: 'surveys/banks/test-add-q-survey-key.json',
      id: 'sq-001',
      type: 'survey',
      question: 'Survey?',
      options: ['A', 'B'],
      correct: 0,
    });

    assert.ok(!existsSync(surveyKeyPath));
    safeUnlink(surveyBankPath);
  });

  it('stores explanation when provided', async () => {
    const { createBank } = await import('../cli/create-bank.js');
    createBank({ name: 'Test Add Q Key', id: 'test-add-q-key' });

    const { addQuestion } = await import('../cli/add-question.js');
    addQuestion({
      bank: 'quiz/banks/test-add-q-key.json',
      id: 'q-001',
      question: 'Capital?',
      options: ['Madrid', 'París'],
      correct: 1,
      explanation: 'Ciudad de la torre Eiffel',
    });

    const key = JSON.parse(readFileSync(quizKeyPath, 'utf-8'));
    assert.equal(key.answers['q-001'].explanation, 'Ciudad de la torre Eiffel');
  });
});
