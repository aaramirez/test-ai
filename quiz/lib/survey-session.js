#!/usr/bin/env node
/**
 * survey-session.js — Survey session management
 *
 * Manages survey results in a separate directory tree (surveys/) independent of quiz results (quiz/results/).
 * Handles saving results, tracking taken status via a registry, and finding pending surveys.
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

function getSurveysDir(root) {
  return join(root || PROJECT_ROOT, 'surveys');
}

function getResultsDir(surveysDir) {
  return join(surveysDir, 'results');
}

function getIndexPath(surveysDir) {
  return join(surveysDir, '_index.json');
}

function getRegistryPath(surveysDir) {
  return join(surveysDir, 'registry.json');
}

function getBankResultDir(surveysDir, bankName) {
  const dirName = bankName.replace('.json', '');
  const dir = join(getResultsDir(surveysDir), dirName);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureSurveyDirs(root) {
  const surveysDir = getSurveysDir(root);
  if (!existsSync(surveysDir)) mkdirSync(surveysDir, { recursive: true });
  if (!existsSync(getResultsDir(surveysDir))) mkdirSync(getResultsDir(surveysDir), { recursive: true });
}

export function loadSurveyIndex(root) {
  const path = getIndexPath(getSurveysDir(root));
  if (!existsSync(path)) {
    return { sessions: {}, by_participant: {}, by_bank: {} };
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveSurveyIndex(index, root) {
  const path = getIndexPath(getSurveysDir(root));
  writeFileSync(path, JSON.stringify(index, null, 2));
}

export function loadSurveyRegistry(root) {
  const path = getRegistryPath(getSurveysDir(root));
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveSurveyRegistry(registry, root) {
  const path = getRegistryPath(getSurveysDir(root));
  writeFileSync(path, JSON.stringify(registry, null, 2));
}

export function updateSurveyRegistry(participantId, bankName, sessionId, date, root) {
  const registry = loadSurveyRegistry(root);
  if (!registry[participantId]) registry[participantId] = {};
  registry[participantId][bankName] = {
    taken: true,
    session_id: sessionId,
    date: date || new Date().toISOString(),
  };
  saveSurveyRegistry(registry, root);
}

function updateSurveyIndex(session, root) {
  const index = loadSurveyIndex(root);
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

  saveSurveyIndex(index, root);
}

export function saveSurveyResult(session, root) {
  ensureSurveyDirs(root);
  const surveysDir = getSurveysDir(root);
  const dir = getBankResultDir(surveysDir, session.bank);
  const filePath = join(dir, `${session.session_id}.json`);
  writeFileSync(filePath, JSON.stringify(session, null, 2));
  updateSurveyIndex(session, root);
  updateSurveyRegistry(session.participant.id, session.bank, session.session_id, session.date, root);
  return filePath;
}

export function loadSurveyResult(sessionId, root) {
  const index = loadSurveyIndex(root);
  const entry = index.sessions[sessionId];
  if (!entry) return null;

  const filePath = join(getResultsDir(getSurveysDir(root)), entry.file);
  if (!existsSync(filePath)) return null;

  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function getPendingSurveys(participantId, surveyBanks, root) {
  const registry = loadSurveyRegistry(root);
  const participantRegistry = registry[participantId] || {};
  return surveyBanks.filter(bank => !participantRegistry[bank] || !participantRegistry[bank].taken);
}
