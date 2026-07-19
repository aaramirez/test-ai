#!/usr/bin/env node
/**
 * schema.js — Bank + key loading and validation
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZ_ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(QUIZ_ROOT, '..');
const BANKS_DIR = join(QUIZ_ROOT, 'banks');
const KEYS_DIR = join(QUIZ_ROOT, 'keys');
const SURVEY_BANKS_DIR = join(PROJECT_ROOT, 'surveys', 'banks');

export const QUESTION_TYPES = ['single', 'multiple', 'survey'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export function normalizeBankPath(bankName) {
  return bankName
    .replace(/^banks\//, '')
    .replace(/^keys\//, '')
    .replace(/^quiz\/banks\//, '')
    .replace(/^quiz\/keys\//, '')
    .replace(/^surveys\/banks\//, '');
}

export function loadJson(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function loadBank(bankName) {
  const normalized = normalizeBankPath(bankName);
  const filePath = join(BANKS_DIR, normalized);
  const bank = loadJson(filePath);
  if (!bank) throw new Error(`Bank not found: ${normalized}`);
  return bank;
}

export function loadSurveyBank(bankName) {
  const normalized = normalizeBankPath(bankName);
  const filePath = join(SURVEY_BANKS_DIR, normalized);
  const bank = loadJson(filePath);
  if (!bank) throw new Error(`Survey bank not found: ${normalized}`);
  return bank;
}

export function loadKey(bankName) {
  const normalized = normalizeBankPath(bankName);
  const keyName = normalized.replace('.json', '') + '.json';
  const filePath = join(KEYS_DIR, keyName);
  const key = loadJson(filePath);
  if (!key) throw new Error(`Key not found for: ${normalized}`);
  return key;
}

export function listBanks() {
  if (!existsSync(BANKS_DIR)) return [];
  return readdirSync(BANKS_DIR).filter(f => f.endsWith('.json'));
}

export function listQuizBanks() {
  return listBanks().filter(f => {
    const bank = loadJson(join(BANKS_DIR, f));
    return bank && bank.type !== 'survey';
  });
}

export function listSurveyBanks() {
  if (!existsSync(SURVEY_BANKS_DIR)) return [];
  return readdirSync(SURVEY_BANKS_DIR).filter(f => f.endsWith('.json'));
}

export function listKeys() {
  if (!existsSync(KEYS_DIR)) return [];
  return readdirSync(KEYS_DIR).filter(f => f.endsWith('.json'));
}

export function validateQuestion(q, index) {
  const errors = [];
  if (!q.id) errors.push(`Question ${index}: missing 'id'`);
  if (!q.question) errors.push(`Question ${index}: missing 'question'`);
  if (!q.type) q.type = 'single';
  if (!QUESTION_TYPES.includes(q.type)) {
    errors.push(`Question ${index}: invalid type '${q.type}'`);
  }
  if (q.type !== 'survey' && !q.difficulty) {
    errors.push(`Question ${index}: missing 'difficulty'`);
  }
  if (q.type !== 'survey' && q.difficulty && !DIFFICULTIES.includes(q.difficulty)) {
    errors.push(`Question ${index}: invalid difficulty '${q.difficulty}'`);
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`Question ${index}: needs at least 2 options`);
  }
  return errors;
}

export function validateBank(bank) {
  const errors = [];
  if (!bank.name) errors.push("Missing 'name'");
  if (!bank.version) errors.push("Missing 'version'");
  if (!Array.isArray(bank.questions)) errors.push("Missing 'questions' array");
  if (bank.questions) {
    const ids = new Set();
    bank.questions.forEach((q, i) => {
      errors.push(...validateQuestion(q, i));
      if (ids.has(q.id)) errors.push(`Duplicate question id: ${q.id}`);
      ids.add(q.id);
    });
  }
  return errors;
}

export function validateKey(key, bank) {
  const errors = [];
  if (!key.bank) errors.push("Missing 'bank'");
  if (!key.answers) errors.push("Missing 'answers'");
  if (!bank || !bank.questions) return errors;

  const bankIds = new Set(bank.questions.map(q => q.id));
  const keyIds = new Set(Object.keys(key.answers || {}));

  for (const id of bankIds) {
    if (!keyIds.has(id)) errors.push(`Missing answer for question: ${id}`);
  }
  for (const id of keyIds) {
    if (!bankIds.has(id)) errors.push(`Key has answer for unknown question: ${id}`);
  }
  return errors;
}
