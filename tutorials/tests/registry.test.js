#!/usr/bin/env node
/**
 * registry.test.js — Tests for tutorial completion registry
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  markCompleted,
  isCompleted,
  getCompletedTutorials,
  getParticipantsForTutorial,
  getScore,
  getAll,
} from '../lib/registry.js';

const REGISTRY_PATH = join(tmpdir(), 'tutorial-registry-test-' + Date.now(), 'registry.json');

before(() => {
  mkdirSync(join(REGISTRY_PATH, '..'), { recursive: true });
  writeFileSync(REGISTRY_PATH, '{}');
});

after(() => {
  rmSync(join(REGISTRY_PATH, '..'), { recursive: true, force: true });
});

describe('markCompleted', () => {
  it('adds entry to registry', () => {
    markCompleted('STU-001', 'git-fundamentals.json', {
      session_id: 't-2026-07-20-abc123',
      score_percentage: 85,
      xp_earned: 120,
      achievements: ['first_tutorial'],
    }, REGISTRY_PATH);

    const data = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
    assert.ok(data['STU-001']);
    assert.ok(data['STU-001']['git-fundamentals.json']);
    assert.equal(data['STU-001']['git-fundamentals.json'].score_percentage, 85);
  });

  it('overwrites previous completion', () => {
    markCompleted('STU-001', 'git-fundamentals.json', {
      session_id: 't-2026-07-20-new',
      score_percentage: 95,
      xp_earned: 150,
      achievements: ['first_tutorial', 'perfect_score'],
    }, REGISTRY_PATH);

    const data = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
    assert.equal(data['STU-001']['git-fundamentals.json'].score_percentage, 95);
  });
});

describe('isCompleted', () => {
  it('returns true for completed tutorial', () => {
    assert.equal(isCompleted('STU-001', 'git-fundamentals.json', REGISTRY_PATH), true);
  });

  it('returns false for uncompleted tutorial', () => {
    assert.equal(isCompleted('STU-001', 'python-basics.json', REGISTRY_PATH), false);
  });

  it('returns false for unknown participant', () => {
    assert.equal(isCompleted('UNKNOWN', 'git-fundamentals.json', REGISTRY_PATH), false);
  });
});

describe('getCompletedTutorials', () => {
  it('returns list of completed tutorials', () => {
    const list = getCompletedTutorials('STU-001', REGISTRY_PATH);
    assert.ok(Array.isArray(list));
    assert.ok(list.includes('git-fundamentals.json'));
  });

  it('returns empty array for unknown participant', () => {
    const list = getCompletedTutorials('UNKNOWN', REGISTRY_PATH);
    assert.equal(list.length, 0);
  });
});

describe('getParticipantsForTutorial', () => {
  it('returns list of participants who completed', () => {
    markCompleted('STU-002', 'git-fundamentals.json', {
      session_id: 't-2026-07-20-xyz',
      score_percentage: 70,
      xp_earned: 80,
      achievements: [],
    }, REGISTRY_PATH);

    const participants = getParticipantsForTutorial('git-fundamentals.json', REGISTRY_PATH);
    assert.ok(participants.includes('STU-001'));
    assert.ok(participants.includes('STU-002'));
  });

  it('returns empty array for tutorial with no completions', () => {
    const participants = getParticipantsForTutorial('unknown.json', REGISTRY_PATH);
    assert.equal(participants.length, 0);
  });
});

describe('getScore', () => {
  it('returns score data', () => {
    const score = getScore('STU-001', 'git-fundamentals.json', REGISTRY_PATH);
    assert.equal(score.score_percentage, 95);
    assert.equal(score.xp_earned, 150);
  });

  it('returns null for unknown', () => {
    const score = getScore('UNKNOWN', 'unknown.json', REGISTRY_PATH);
    assert.equal(score, null);
  });
});

describe('getAll', () => {
  it('returns full registry', () => {
    const all = getAll(REGISTRY_PATH);
    assert.ok(all['STU-001']);
    assert.ok(all['STU-002']);
  });
});
