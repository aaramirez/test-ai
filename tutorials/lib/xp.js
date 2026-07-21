#!/usr/bin/env node
/**
 * xp.js — XP calculation, streaks, and achievement system
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

export const XP_REWARDS = {
  correct: 10,
  code_run: 5,
  challenge: 20,
  streak3: 5,
  streak5: 10,
  streak10: 25,
};

export const ACHIEVEMENTS = [
  {
    id: 'first_tutorial',
    name: 'First Steps',
    description: 'Complete your first tutorial',
    icon: '🏆',
    check: (ctx) => ctx.tutorialsCompleted >= 1,
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Score 100% on a tutorial',
    icon: '💎',
    check: (ctx) => ctx.scorePercentage === 100,
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Get a streak of 5+ correct answers',
    icon: '🔥',
    check: (ctx) => ctx.streakBest >= 5,
  },
  {
    id: 'code_runner',
    name: 'Code Runner',
    description: 'Run all code exercises in a tutorial',
    icon: '💻',
    check: (ctx) => ctx.codeStepsRun > 0 && ctx.codeStepsRun === ctx.codeStepsTotal,
  },
  {
    id: 'speed_learner',
    name: 'Speed Learner',
    description: 'Complete a tutorial in under 5 minutes',
    icon: '⚡',
    check: (ctx) => ctx.durationSeconds < 300,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Complete 3 or more tutorials',
    icon: '🧭',
    check: (ctx) => ctx.tutorialsCompleted >= 3,
  },
];

export function getStreakBonus(streak) {
  if (streak >= 10) return XP_REWARDS.streak10;
  if (streak >= 5) return XP_REWARDS.streak5;
  if (streak >= 3) return XP_REWARDS.streak3;
  return 0;
}

export function calculateXP({ type, currentXP, streak = 0 }) {
  let xp = 0;

  switch (type) {
    case 'correct':
      xp = XP_REWARDS.correct;
      break;
    case 'code_run':
      xp = XP_REWARDS.code_run;
      break;
    case 'challenge':
      xp = XP_REWARDS.challenge;
      break;
  }

  const streakBonus = getStreakBonus(streak);
  xp += streakBonus;

  return {
    xp,
    totalXP: currentXP + xp,
    streakBonus: streakBonus > 0,
  };
}

export function checkAchievement(achievementId, context) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return { unlocked: false };

  const unlocked = achievement.check(context);
  return {
    unlocked,
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
  };
}
