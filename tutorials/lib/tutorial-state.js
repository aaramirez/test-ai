#!/usr/bin/env node
/**
 * tutorial-state.js — Update tutorials/current.json for TUI plugin
 *
 * Usage:
 *   node tutorials/lib/tutorial-state.js start "Git Fundamentals" 12
 *   node tutorials/lib/tutorial-state.js update 3 30 2 45
 *   node tutorials/lib/tutorial-state.js clear
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CURRENT_PATH = join(ROOT, 'current.json');

function start(tutorialName, totalSteps) {
  const state = {
    active: true,
    tutorialName,
    currentStep: 1,
    totalSteps: parseInt(totalSteps) || 0,
    xpEarned: 0,
    streakCurrent: 0,
    streakBest: 0,
    percentage: 0,
    elapsed: '0:00',
    startedAt: Date.now(),
  };
  writeFileSync(CURRENT_PATH, JSON.stringify(state, null, 2));
  console.log(`Tutorial started: ${tutorialName}`);
}

function update(step, xp, streak, streakBest) {
  if (!existsSync(CURRENT_PATH)) {
    console.error('No active tutorial. Run: tutorial-state.js start "Name" totalSteps');
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(CURRENT_PATH, 'utf-8'));
  state.currentStep = parseInt(step) || state.currentStep;
  state.xpEarned = parseInt(xp) || state.xpEarned;
  state.streakCurrent = parseInt(streak) || 0;
  state.streakBest = parseInt(streakBest) || state.streakBest;
  state.percentage = state.totalSteps > 0
    ? Math.round(((state.currentStep - 1) / state.totalSteps) * 100)
    : 0;
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  state.elapsed = `${m}:${String(s).padStart(2, '0')}`;
  writeFileSync(CURRENT_PATH, JSON.stringify(state, null, 2));
}

function complete(score, xp, achievements) {
  if (!existsSync(CURRENT_PATH)) return;
  const state = JSON.parse(readFileSync(CURRENT_PATH, 'utf-8'));
  state.active = false;
  state.percentage = 100;
  state.xpEarned = parseInt(xp) || state.xpEarned;
  state.score = score;
  state.achievements = achievements ? achievements.split(',') : [];
  writeFileSync(CURRENT_PATH, JSON.stringify(state, null, 2));
  console.log('Tutorial completed!');
}

function clear() {
  if (existsSync(CURRENT_PATH)) {
    writeFileSync(CURRENT_PATH, JSON.stringify({ active: false }));
    console.log('Tutorial state cleared.');
  }
}

const [action, ...args] = process.argv.slice(2);

switch (action) {
  case 'start':
    if (!args[0] || !args[1]) {
      console.error('Usage: tutorial-state.js start "Tutorial Name" totalSteps');
      process.exit(1);
    }
    start(args[0], args[1]);
    break;
  case 'update':
    update(args[0], args[1], args[2], args[3]);
    break;
  case 'complete':
    complete(args[0], args[1], args[2]);
    break;
  case 'clear':
    clear();
    break;
  default:
    console.error('Usage: tutorial-state.js <start|update|complete|clear> [args...]');
    process.exit(1);
}
