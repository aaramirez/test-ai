#!/usr/bin/env node
/**
 * session.test.js — Tests for tutorial session management
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  generateSessionId,
  createSession,
  saveSession,
  loadSession,
  updateSession,
  loadIndex,
} from '../lib/session.js';

const SESSIONS_DIR = join(tmpdir(), 'tutorial-session-test-' + Date.now());
const INDEX_PATH = join(SESSIONS_DIR, '_index.json');

before(() => {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify({ sessions: {}, by_participant: {}, by_tutorial: {} }));
});

after(() => {
  rmSync(SESSIONS_DIR, { recursive: true, force: true });
});

function makeTutorial() {
  return {
    name: 'Test Tutorial',
    version: '1.0.0',
    xp_per_correct: 10,
    xp_per_code_run: 5,
    xp_per_challenge: 20,
    steps: [
      { id: 'intro', type: 'content', title: 'Welcome', body: 'Hello' },
      { id: 'q-001', type: 'question', question: 'Q1?', options: [{ label: 'A' }, { label: 'B' }], difficulty: 'easy' },
      { id: 'q-002', type: 'question', question: 'Q2?', options: [{ label: 'X' }, { label: 'Y' }], difficulty: 'easy' },
    ],
  };
}

function makeKey() {
  return {
    bank: 'test.json',
    answers: {
      'q-001': { correct: 'A', explanation: 'Because' },
      'q-002': { correct: 'Y' },
    },
  };
}

describe('generateSessionId', () => {
  it('starts with t- prefix', () => {
    const id = generateSessionId();
    assert.ok(id.startsWith('t-'));
  });

  it('includes date in YYYY-MM-DD format', () => {
    const id = generateSessionId();
    const datePart = id.split('-').slice(1, 4).join('-');
    assert.match(datePart, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('includes random hex suffix', () => {
    const id = generateSessionId();
    const parts = id.split('-');
    assert.ok(parts.length >= 5);
    const hex = parts[parts.length - 1];
    assert.match(hex, /^[0-9a-f]{6}$/);
  });

  it('generates unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < 50; i++) ids.add(generateSessionId());
    assert.equal(ids.size, 50);
  });
});

describe('createSession', () => {
  it('creates session with correct structure', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test Student' },
    });
    assert.ok(session.session_id.startsWith('t-'));
    assert.equal(session.tutorial, 'test.json');
    assert.equal(session.participant.id, 'STU-001');
    assert.equal(session.steps_completed.length, 0);
    assert.equal(session.xp_earned, 0);
    assert.equal(session.streak_current, 0);
    assert.equal(session.completed, false);
  });

  it('sets date to current ISO string', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test' },
    });
    assert.ok(session.date);
    assert.ok(new Date(session.date).getTime() > 0);
  });
});

describe('saveSession / loadSession', () => {
  it('saves and loads a session', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test' },
      sessionsDir: SESSIONS_DIR,
    });
    const savedPath = saveSession(session, SESSIONS_DIR);
    assert.ok(existsSync(savedPath));

    const loaded = loadSession(session.session_id, SESSIONS_DIR);
    assert.equal(loaded.session_id, session.session_id);
    assert.equal(loaded.participant.id, 'STU-001');
  });

  it('returns null for non-existent session', () => {
    const loaded = loadSession('t-2026-01-01-deadbeef', SESSIONS_DIR);
    assert.equal(loaded, null);
  });
});

describe('updateSession', () => {
  it('updates step completion', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test' },
      sessionsDir: SESSIONS_DIR,
    });
    saveSession(session, SESSIONS_DIR);

    updateSession(session.session_id, {
      step_completed: 'q-001',
      answer: { selected: 'A', correct: true },
      xp: 10,
    }, SESSIONS_DIR);

    const loaded = loadSession(session.session_id, SESSIONS_DIR);
    assert.ok(loaded.steps_completed.includes('q-001'));
    assert.equal(loaded.answers['q-001'].selected, 'A');
    assert.equal(loaded.answers['q-001'].correct, true);
    assert.equal(loaded.xp_earned, 10);
    assert.equal(loaded.streak_current, 1);
  });

  it('increments streak on correct', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test' },
      sessionsDir: SESSIONS_DIR,
    });
    saveSession(session, SESSIONS_DIR);

    updateSession(session.session_id, { step_completed: 'q-001', answer: { correct: true }, xp: 10 }, SESSIONS_DIR);
    updateSession(session.session_id, { step_completed: 'q-002', answer: { correct: true }, xp: 10 }, SESSIONS_DIR);

    const loaded = loadSession(session.session_id, SESSIONS_DIR);
    assert.equal(loaded.streak_current, 2);
    assert.equal(loaded.streak_best, 2);
  });

  it('resets streak on wrong answer', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test' },
      sessionsDir: SESSIONS_DIR,
    });
    saveSession(session, SESSIONS_DIR);

    updateSession(session.session_id, { step_completed: 'q-001', answer: { correct: true }, xp: 10 }, SESSIONS_DIR);
    updateSession(session.session_id, { step_completed: 'q-002', answer: { correct: false }, xp: 0 }, SESSIONS_DIR);

    const loaded = loadSession(session.session_id, SESSIONS_DIR);
    assert.equal(loaded.streak_current, 0);
    assert.equal(loaded.streak_best, 1);
  });

  it('marks tutorial as completed', () => {
    const session = createSession({
      tutorial: makeTutorial(),
      tutorialName: 'test.json',
      key: makeKey(),
      participant: { id: 'STU-001', name: 'Test' },
      sessionsDir: SESSIONS_DIR,
    });
    saveSession(session, SESSIONS_DIR);

    updateSession(session.session_id, {
      completed: true,
      score: { correct: 1, total: 2, percentage: 50 },
    }, SESSIONS_DIR);

    const loaded = loadSession(session.session_id, SESSIONS_DIR);
    assert.equal(loaded.completed, true);
    assert.ok(loaded.completed_at);
    assert.equal(loaded.score.percentage, 50);
  });
});

describe('loadIndex', () => {
  it('loads the index file', () => {
    const index = loadIndex(SESSIONS_DIR);
    assert.ok(index.sessions);
    assert.ok(index.by_participant);
    assert.ok(index.by_tutorial);
  });
});
