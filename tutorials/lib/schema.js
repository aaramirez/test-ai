#!/usr/bin/env node
/**
 * schema.js — Tutorial bank + key loading and validation
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TUTORIALS_ROOT = resolve(__dirname, '..');
const BANKS_DIR = join(TUTORIALS_ROOT, 'banks');
const KEYS_DIR = join(TUTORIALS_ROOT, 'keys');

export const STEP_TYPES = ['content', 'question', 'choice', 'code', 'challenge', 'scenario', 'checkpoint'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export function loadJson(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function loadTutorial(name) {
  const normalized = name.replace(/^tutorials\/banks\//, '');
  const filePath = join(BANKS_DIR, normalized);
  const tutorial = loadJson(filePath);
  if (!tutorial) throw new Error(`Tutorial not found: ${normalized}`);
  return tutorial;
}

export function loadKey(name) {
  const normalized = name.replace(/^tutorials\/keys\//, '');
  const filePath = join(KEYS_DIR, normalized);
  const key = loadJson(filePath);
  if (!key) throw new Error(`Key not found: ${normalized}`);
  return key;
}

export function listTutorials(dir) {
  const banksDir = dir || BANKS_DIR;
  if (!existsSync(banksDir)) return [];
  return readdirSync(banksDir).filter(f => f.endsWith('.json'));
}

export function listKeys() {
  if (!existsSync(KEYS_DIR)) return [];
  return readdirSync(KEYS_DIR).filter(f => f.endsWith('.json'));
}

export function validateStep(step, index) {
  const errors = [];
  const prefix = `Step ${index}`;

  if (!step.id) errors.push(`${prefix}: missing 'id'`);
  if (!step.type) {
    errors.push(`${prefix}: missing 'type'`);
    return errors;
  }
  if (!STEP_TYPES.includes(step.type)) {
    errors.push(`${prefix}: invalid type '${step.type}'`);
    return errors;
  }

  switch (step.type) {
    case 'content':
      if (!step.title) errors.push(`${prefix}: content step missing 'title'`);
      if (!step.body) errors.push(`${prefix}: content step missing 'body'`);
      break;

    case 'question':
      if (!step.question) errors.push(`${prefix}: question step missing 'question'`);
      if (!Array.isArray(step.options) || step.options.length < 2) {
        errors.push(`${prefix}: question step needs at least 2 options`);
      }
      break;

    case 'choice':
      if (!step.question) errors.push(`${prefix}: choice step missing 'question'`);
      if (!Array.isArray(step.options) || step.options.length < 2) {
        errors.push(`${prefix}: choice step needs at least 2 options`);
      }
      if (step.options) {
        step.options.forEach((opt, i) => {
          if (!opt.goto) errors.push(`${prefix}: choice option ${i} missing 'goto'`);
        });
      }
      break;

    case 'code':
      if (!step.title) errors.push(`${prefix}: code step missing 'title'`);
      if (!step.code) errors.push(`${prefix}: code step missing 'code'`);
      break;

    case 'challenge':
      if (!step.title) errors.push(`${prefix}: challenge step missing 'title'`);
      if (!step.instructions) errors.push(`${prefix}: challenge step missing 'instructions'`);
      break;

    case 'scenario':
      if (!step.title) errors.push(`${prefix}: scenario step missing 'title'`);
      if (!step.narrative) errors.push(`${prefix}: scenario step missing 'narrative'`);
      if (!Array.isArray(step.options) || step.options.length < 2) {
        errors.push(`${prefix}: scenario step needs at least 2 options`);
      }
      if (step.options) {
        step.options.forEach((opt, i) => {
          if (!opt.feedback) errors.push(`${prefix}: scenario option ${i} missing 'feedback'`);
        });
      }
      break;

    case 'checkpoint':
      if (!step.question) errors.push(`${prefix}: checkpoint step missing 'question'`);
      if (!Array.isArray(step.options) || step.options.length < 2) {
        errors.push(`${prefix}: checkpoint step needs at least 2 options`);
      }
      if (typeof step.min_score_to_pass !== 'number') {
        errors.push(`${prefix}: checkpoint step missing 'min_score_to_pass'`);
      }
      break;
  }

  return errors;
}

export function validateTutorial(tutorial) {
  const errors = [];
  if (!tutorial.name) errors.push("Missing 'name'");
  if (!tutorial.version) errors.push("Missing 'version'");
  if (!Array.isArray(tutorial.steps)) {
    errors.push("Missing 'steps' array");
    return errors;
  }

  const ids = new Set();
  tutorial.steps.forEach((step, i) => {
    errors.push(...validateStep(step, i));
    if (ids.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
    ids.add(step.id);
  });

  // Validate goto references
  tutorial.steps.forEach(step => {
    if (step.type === 'choice' && step.options) {
      step.options.forEach(opt => {
        if (opt.goto && !ids.has(opt.goto)) {
          errors.push(`Step '${step.id}' references nonexistent goto: '${opt.goto}'`);
        }
      });
    }
  });

  return errors;
}

export function validateKey(key, tutorial) {
  const errors = [];
  if (!key.bank) errors.push("Missing 'bank'");
  if (!key.answers) {
    errors.push("Missing 'answers'");
    return errors;
  }

  if (!tutorial || !tutorial.steps) return errors;

  // Collect scorable step IDs (question and checkpoint)
  const scorableIds = new Set(
    tutorial.steps
      .filter(s => s.type === 'question' || s.type === 'checkpoint')
      .map(s => s.id)
  );

  const keyIds = new Set(Object.keys(key.answers));

  for (const id of scorableIds) {
    if (!keyIds.has(id)) errors.push(`Missing answer for step: ${id}`);
  }
  for (const id of keyIds) {
    if (!scorableIds.has(id)) errors.push(`Key has answer for unknown step: ${id}`);
  }

  return errors;
}
