#!/usr/bin/env node
/**
 * participant.js — Participant registry operations
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZ_ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = process.env.QUIZ_PARTICIPANTS_PATH || join(QUIZ_ROOT, 'participants.json');

function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    return { participants: {}, groups: {} };
  }
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
}

function saveRegistry(registry) {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function registerParticipant({ id, name, email, metadata }) {
  const registry = loadRegistry();
  if (registry.participants[id]) {
    return { registered: false, participant: registry.participants[id], message: 'Already registered' };
  }
  const participant = {
    id,
    name,
    email: email || '',
    registered_at: new Date().toISOString(),
    metadata: metadata || {},
  };
  registry.participants[id] = participant;
  saveRegistry(registry);
  return { registered: true, participant, message: 'Registered' };
}

export function findParticipant(id) {
  const registry = loadRegistry();
  return registry.participants[id] || null;
}

export function listParticipants() {
  const registry = loadRegistry();
  return Object.values(registry.participants);
}

export function searchParticipants(query) {
  const lower = query.toLowerCase();
  return listParticipants().filter(p =>
    p.id.toLowerCase().includes(lower) ||
    p.name.toLowerCase().includes(lower) ||
    (p.email && p.email.toLowerCase().includes(lower))
  );
}

export function updateParticipant(id, updates) {
  const registry = loadRegistry();
  if (!registry.participants[id]) {
    return { updated: false, message: 'Participant not found' };
  }
  Object.assign(registry.participants[id], updates);
  saveRegistry(registry);
  return { updated: true, participant: registry.participants[id] };
}

export function importFromCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return { imported: 0, errors: ['CSV has no data rows'] };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const emailIdx = header.indexOf('email');
  const groupIdx = header.indexOf('group');

  if (idIdx === -1 || nameIdx === -1) {
    return { imported: 0, errors: ['CSV must have at least "id" and "name" columns'] };
  }

  const registry = loadRegistry();
  let imported = 0;
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const id = cols[idIdx];
    const name = cols[nameIdx];
    const email = emailIdx !== -1 ? cols[emailIdx] || '' : '';
    const group = groupIdx !== -1 ? cols[groupIdx] || '' : '';

    if (!id || !name) {
      errors.push(`Row ${i + 1}: missing id or name`);
      continue;
    }

    if (!registry.participants[id]) {
      registry.participants[id] = {
        id,
        name,
        email,
        registered_at: new Date().toISOString(),
        metadata: group ? { group } : {},
      };
      imported++;
    }

    if (group) {
      if (!registry.groups[group]) registry.groups[group] = [];
      if (!registry.groups[group].includes(id)) {
        registry.groups[group].push(id);
      }
    }
  }

  saveRegistry(registry);
  return { imported, errors };
}

export function addToGroup(groupId, participantIds) {
  const registry = loadRegistry();
  if (!registry.groups[groupId]) registry.groups[groupId] = [];
  for (const id of participantIds) {
    if (registry.participants[id] && !registry.groups[groupId].includes(id)) {
      registry.groups[groupId].push(id);
    }
  }
  saveRegistry(registry);
  return registry.groups[groupId];
}

export function getGroup(groupId) {
  const registry = loadRegistry();
  return (registry.groups[groupId] || []).map(id => registry.participants[id]).filter(Boolean);
}

export function listGroups() {
  const registry = loadRegistry();
  return Object.entries(registry.groups).map(([id, members]) => ({
    id,
    count: members.length,
    members,
  }));
}
