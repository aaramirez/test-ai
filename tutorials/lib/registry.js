#!/usr/bin/env node
/**
 * registry.js — Tutorial completion tracking
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TUTORIALS_ROOT = resolve(__dirname, '..');
const DEFAULT_REGISTRY = join(TUTORIALS_ROOT, 'registry.json');

function loadRegistry(registryPath) {
  const path = registryPath || DEFAULT_REGISTRY;
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveRegistry(data, registryPath) {
  const path = registryPath || DEFAULT_REGISTRY;
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export function markCompleted(participantId, tutorialName, data, registryPath) {
  const registry = loadRegistry(registryPath);

  if (!registry[participantId]) {
    registry[participantId] = {};
  }

  registry[participantId][tutorialName] = {
    completed: true,
    date: new Date().toISOString(),
    session_id: data.session_id,
    score_percentage: data.score_percentage,
    xp_earned: data.xp_earned,
    achievements: data.achievements || [],
  };

  saveRegistry(registry, registryPath);
}

export function isCompleted(participantId, tutorialName, registryPath) {
  const registry = loadRegistry(registryPath);
  return !!(registry[participantId] && registry[participantId][tutorialName]);
}

export function getCompletedTutorials(participantId, registryPath) {
  const registry = loadRegistry(registryPath);
  if (!registry[participantId]) return [];
  return Object.keys(registry[participantId]);
}

export function getParticipantsForTutorial(tutorialName, registryPath) {
  const registry = loadRegistry(registryPath);
  const participants = [];
  for (const [pid, tutorials] of Object.entries(registry)) {
    if (tutorials[tutorialName]) {
      participants.push(pid);
    }
  }
  return participants;
}

export function getScore(participantId, tutorialName, registryPath) {
  const registry = loadRegistry(registryPath);
  if (!registry[participantId] || !registry[participantId][tutorialName]) return null;
  return registry[participantId][tutorialName];
}

export function getAll(registryPath) {
  return loadRegistry(registryPath);
}
