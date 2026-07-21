#!/usr/bin/env node
/**
 * session.js — Tutorial session management, ID generation, result persistence
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TUTORIALS_ROOT = resolve(__dirname, '..');

function generateHex(length = 6) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export function generateSessionId() {
  const date = new Date().toISOString().slice(0, 10);
  return `t-${date}-${generateHex()}`;
}

export function createSession({ tutorial, tutorialName, key, participant, sessionsDir }) {
  const sessions_root = sessionsDir || join(TUTORIALS_ROOT, 'sessions');
  const session_id = generateSessionId();
  const date = new Date().toISOString();

  return {
    session_id,
    date,
    tutorial: tutorialName,
    tutorial_version: tutorial.version,
    participant,
    steps_completed: [],
    current_step: tutorial.steps?.[0]?.id || null,
    answers: {},
    xp_earned: 0,
    streak_current: 0,
    streak_best: 0,
    achievements: [],
    score: { correct: 0, total: 0, percentage: 0 },
    started_at: date,
    completed_at: null,
    duration_seconds: 0,
    completed: false,
    _sessionsDir: sessions_root,
  };
}

export function saveSession(session, sessionsDir) {
  const dir = sessionsDir || session._sessionsDir || join(TUTORIALS_ROOT, 'sessions');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const tutorialName = session.tutorial.replace('.json', '');
  const tutorialDir = join(dir, tutorialName);
  if (!existsSync(tutorialDir)) mkdirSync(tutorialDir, { recursive: true });

  const filePath = join(tutorialDir, `${session.session_id}.json`);
  writeFileSync(filePath, JSON.stringify(session, null, 2));
  updateIndex(session, dir);
  return filePath;
}

export function loadSession(sessionId, sessionsDir) {
  const dir = sessionsDir || join(TUTORIALS_ROOT, 'sessions');
  const index = loadIndex(dir);
  const entry = index.sessions[sessionId];
  if (!entry) return null;

  const filePath = join(dir, entry.file);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function updateSession(sessionId, updates, sessionsDir) {
  const dir = sessionsDir || join(TUTORIALS_ROOT, 'sessions');
  const session = loadSession(sessionId, dir);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  if (updates.step_completed) {
    if (!session.steps_completed.includes(updates.step_completed)) {
      session.steps_completed.push(updates.step_completed);
    }
    session.current_step = updates.next_step || null;
  }

  if (updates.answer) {
    session.answers[updates.step_completed || session.current_step] = updates.answer;

    if (typeof updates.answer.correct === 'boolean') {
      if (updates.answer.correct) {
        session.streak_current += 1;
        if (session.streak_current > session.streak_best) {
          session.streak_best = session.streak_current;
        }
      } else {
        session.streak_current = 0;
      }
    }
  }

  if (typeof updates.xp === 'number') {
    session.xp_earned += updates.xp;
  }

  if (typeof updates.streak === 'number') {
    session.streak_current = updates.streak;
    if (updates.streak > session.streak_best) {
      session.streak_best = updates.streak;
    }
  }

  if (updates.completed) {
    session.completed = true;
    session.completed_at = new Date().toISOString();
    const startTime = new Date(session.started_at).getTime();
    const endTime = new Date(session.completed_at).getTime();
    session.duration_seconds = Math.round((endTime - startTime) / 1000);
  }

  if (updates.score) {
    session.score = updates.score;
  }

  if (updates.achievements) {
    for (const a of updates.achievements) {
      if (!session.achievements.includes(a)) session.achievements.push(a);
    }
  }

  saveSession(session, dir);
  return session;
}

export function loadIndex(sessionsDir) {
  const dir = sessionsDir || join(TUTORIALS_ROOT, 'sessions');
  const indexPath = join(dir, '_index.json');
  if (!existsSync(indexPath)) {
    return { sessions: {}, by_participant: {}, by_tutorial: {} };
  }
  return JSON.parse(readFileSync(indexPath, 'utf-8'));
}

function updateIndex(session, sessionsDir) {
  const dir = sessionsDir || join(TUTORIALS_ROOT, 'sessions');
  const indexPath = join(dir, '_index.json');
  const index = loadIndex(dir);

  const file = `${session.tutorial.replace('.json', '')}/${session.session_id}.json`;

  index.sessions[session.session_id] = {
    participant_id: session.participant.id,
    tutorial: session.tutorial,
    date: session.date,
    file,
  };

  if (!index.by_participant[session.participant.id]) {
    index.by_participant[session.participant.id] = [];
  }
  if (!index.by_participant[session.participant.id].includes(session.session_id)) {
    index.by_participant[session.participant.id].push(session.session_id);
  }

  if (!index.by_tutorial[session.tutorial]) {
    index.by_tutorial[session.tutorial] = [];
  }
  if (!index.by_tutorial[session.tutorial].includes(session.session_id)) {
    index.by_tutorial[session.tutorial].push(session.session_id);
  }

  writeFileSync(indexPath, JSON.stringify(index, null, 2));
}
