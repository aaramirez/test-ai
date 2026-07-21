#!/usr/bin/env node
/**
 * xp.test.js — Tests for XP calculation, streaks, and achievements
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateXP,
  getStreakBonus,
  checkAchievement,
  ACHIEVEMENTS,
  XP_REWARDS,
} from '../lib/xp.js';

describe('XP_REWARDS', () => {
  it('defines rewards for all scoring actions', () => {
    assert.equal(typeof XP_REWARDS.correct, 'number');
    assert.equal(typeof XP_REWARDS.code_run, 'number');
    assert.equal(typeof XP_REWARDS.challenge, 'number');
    assert.equal(typeof XP_REWARDS.streak3, 'number');
    assert.equal(typeof XP_REWARDS.streak5, 'number');
    assert.equal(typeof XP_REWARDS.streak10, 'number');
  });
});

describe('calculateXP', () => {
  it('adds correct answer XP', () => {
    const result = calculateXP({ type: 'correct', currentXP: 0 });
    assert.equal(result.xp, XP_REWARDS.correct);
  });

  it('adds code run XP', () => {
    const result = calculateXP({ type: 'code_run', currentXP: 0 });
    assert.equal(result.xp, XP_REWARDS.code_run);
  });

  it('adds challenge XP', () => {
    const result = calculateXP({ type: 'challenge', currentXP: 0 });
    assert.equal(result.xp, XP_REWARDS.challenge);
  });

  it('applies streak bonus at 3', () => {
    const result = calculateXP({ type: 'correct', currentXP: 0, streak: 3 });
    assert.equal(result.xp, XP_REWARDS.correct + XP_REWARDS.streak3);
    assert.ok(result.streakBonus);
  });

  it('applies streak bonus at 5', () => {
    const result = calculateXP({ type: 'correct', currentXP: 0, streak: 5 });
    assert.equal(result.xp, XP_REWARDS.correct + XP_REWARDS.streak5);
  });

  it('applies streak bonus at 10', () => {
    const result = calculateXP({ type: 'correct', currentXP: 0, streak: 10 });
    assert.equal(result.xp, XP_REWARDS.correct + XP_REWARDS.streak10);
  });

  it('returns total XP', () => {
    const result = calculateXP({ type: 'correct', currentXP: 50, streak: 0 });
    assert.equal(result.totalXP, 50 + XP_REWARDS.correct);
  });
});

describe('getStreakBonus', () => {
  it('returns 0 for streak < 3', () => {
    assert.equal(getStreakBonus(0), 0);
    assert.equal(getStreakBonus(1), 0);
    assert.equal(getStreakBonus(2), 0);
  });

  it('returns bonus for streak >= 3', () => {
    assert.equal(getStreakBonus(3), XP_REWARDS.streak3);
    assert.equal(getStreakBonus(5), XP_REWARDS.streak5);
    assert.equal(getStreakBonus(10), XP_REWARDS.streak10);
  });

  it('uses highest applicable bonus', () => {
    assert.equal(getStreakBonus(15), XP_REWARDS.streak10);
  });
});

describe('ACHIEVEMENTS', () => {
  it('includes required achievements', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    assert.ok(ids.includes('first_tutorial'));
    assert.ok(ids.includes('perfect_score'));
    assert.ok(ids.includes('on_fire'));
    assert.ok(ids.includes('code_runner'));
    assert.ok(ids.includes('speed_learner'));
    assert.ok(ids.includes('explorer'));
  });
});

describe('checkAchievement', () => {
  it('unlocks first_tutorial when tutorial completed', () => {
    const result = checkAchievement('first_tutorial', {
      tutorialsCompleted: 1,
      streakBest: 0,
      scorePercentage: 80,
    });
    assert.equal(result.unlocked, true);
  });

  it('unlocks perfect_score when 100%', () => {
    const result = checkAchievement('perfect_score', {
      tutorialsCompleted: 1,
      streakBest: 5,
      scorePercentage: 100,
    });
    assert.equal(result.unlocked, true);
  });

  it('unlocks on_fire when streak >= 5', () => {
    const result = checkAchievement('on_fire', {
      tutorialsCompleted: 1,
      streakBest: 5,
      scorePercentage: 80,
    });
    assert.equal(result.unlocked, true);
  });

  it('unlocks code_runner when all code steps run', () => {
    const result = checkAchievement('code_runner', {
      tutorialsCompleted: 1,
      streakBest: 0,
      scorePercentage: 80,
      codeStepsRun: 3,
      codeStepsTotal: 3,
    });
    assert.equal(result.unlocked, true);
  });

  it('does not unlock code_runner if not all run', () => {
    const result = checkAchievement('code_runner', {
      tutorialsCompleted: 1,
      streakBest: 0,
      scorePercentage: 80,
      codeStepsRun: 1,
      codeStepsTotal: 3,
    });
    assert.equal(result.unlocked, false);
  });

  it('unlocks speed_learner when completed in < 5 min', () => {
    const result = checkAchievement('speed_learner', {
      tutorialsCompleted: 1,
      streakBest: 0,
      scorePercentage: 80,
      durationSeconds: 240,
    });
    assert.equal(result.unlocked, true);
  });

  it('does not unlock speed_learner when > 5 min', () => {
    const result = checkAchievement('speed_learner', {
      tutorialsCompleted: 1,
      streakBest: 0,
      scorePercentage: 80,
      durationSeconds: 400,
    });
    assert.equal(result.unlocked, false);
  });

  it('unlocks explorer when completed 3+ tutorials', () => {
    const result = checkAchievement('explorer', {
      tutorialsCompleted: 3,
      streakBest: 0,
      scorePercentage: 80,
    });
    assert.equal(result.unlocked, true);
  });

  it('returns achievement info when unlocked', () => {
    const result = checkAchievement('first_tutorial', {
      tutorialsCompleted: 1,
      streakBest: 0,
      scorePercentage: 80,
    });
    assert.ok(result.name);
    assert.ok(result.description);
    assert.ok(result.icon);
  });
});
