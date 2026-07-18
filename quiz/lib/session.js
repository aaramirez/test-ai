#!/usr/bin/env node
/**
 * session.js — Session management, ID generation, result persistence
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { calculateResults } from './scorer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZ_ROOT = resolve(__dirname, '..');
const RESULTS_DIR = join(QUIZ_ROOT, 'results');
const INDEX_PATH = join(RESULTS_DIR, '_index.json');

function generateHex(length = 6) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export function generateSessionId(mode) {
  const prefixes = { live: 'q', practice: 'p', survey: 's' };
  const prefix = prefixes[mode] || 'x';
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}-${generateHex()}`;
}

function getResultDir(bankName) {
  const dirName = bankName.replace('.json', '');
  const dir = join(RESULTS_DIR, dirName);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveResult(session) {
  const dir = getResultDir(session.bank);
  const filePath = join(dir, `${session.session_id}.json`);
  writeFileSync(filePath, JSON.stringify(session, null, 2));
  updateIndex(session);
  return filePath;
}

export function loadResult(sessionId) {
  for (const bankDir of readdirSync(RESULTS_DIR)) {
    const dirPath = join(RESULTS_DIR, bankDir);
    if (!existsSync(dirPath) || !join(dirPath, `${sessionId}.json`)) continue;
    const filePath = join(dirPath, `${sessionId}.json`);
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  }
  return null;
}

export function loadIndex() {
  if (!existsSync(INDEX_PATH)) {
    return { sessions: {}, by_participant: {}, by_bank: {} };
  }
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
}

function updateIndex(session) {
  const index = loadIndex();
  const file = `${session.bank.replace('.json', '')}/${session.session_id}.json`;

  index.sessions[session.session_id] = {
    participant_id: session.participant.id,
    bank: session.bank,
    mode: session.mode,
    date: session.date,
    file,
  };

  if (!index.by_participant[session.participant.id]) {
    index.by_participant[session.participant.id] = [];
  }
  if (!index.by_participant[session.participant.id].includes(session.session_id)) {
    index.by_participant[session.participant.id].push(session.session_id);
  }

  if (!index.by_bank[session.bank]) {
    index.by_bank[session.bank] = [];
  }
  if (!index.by_bank[session.bank].includes(session.session_id)) {
    index.by_bank[session.bank].push(session.session_id);
  }

  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

export function listByParticipant(participantId) {
  const index = loadIndex();
  return index.by_participant[participantId] || [];
}

export function listByBank(bankName) {
  const index = loadIndex();
  return index.by_bank[bankName] || [];
}

export function listAllSessions() {
  const index = loadIndex();
  return Object.keys(index.sessions);
}

export function createSession({ mode, bank, bankVersion, difficulty, participant, questions, selections, key }) {
  const session_id = generateSessionId(mode);
  const date = new Date().toISOString();

  let result;
  if (mode === 'survey') {
    result = { questions: selections };
  } else {
    result = calculateResults(questions, selections, key);
  }

  const session = {
    session_id,
    date,
    mode,
    bank,
    bank_version: bankVersion,
    difficulty: difficulty || undefined,
    participant,
    ...result,
  };

  if (mode === 'live') {
    session.evaluated = true;
    session.sent = false;
  }

  return session;
}
