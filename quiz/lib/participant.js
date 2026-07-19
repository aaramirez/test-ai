#!/usr/bin/env node
/**
 * participant.js — Participant registry operations (team.json + id.json)
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const TEAM_PATH = process.env.TEAM_PATH || join(PROJECT_ROOT, 'team.json');
const ID_PATH = process.env.ID_PATH || join(PROJECT_ROOT, 'id.json');

function loadTeamRegistry() {
  if (!existsSync(TEAM_PATH)) {
    return { participants: {}, groups: {} };
  }
  return JSON.parse(readFileSync(TEAM_PATH, 'utf-8'));
}

function saveTeamRegistry(registry) {
  writeFileSync(TEAM_PATH, JSON.stringify(registry, null, 2));
}

function loadIdRegistry() {
  if (!existsSync(ID_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(ID_PATH, 'utf-8'));
}

function saveIdRegistry(registry) {
  writeFileSync(ID_PATH, JSON.stringify(registry, null, 2));
}

export function findById(cedula) {
  const ids = loadIdRegistry();
  return ids[cedula] || null;
}

export function registerParticipant({ id, name, email, metadata }) {
  const registry = loadTeamRegistry();
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
  saveTeamRegistry(registry);

  // Also save to id.json for quick lookup
  const ids = loadIdRegistry();
  ids[id] = { name, email: email || '' };
  saveIdRegistry(ids);

  return { registered: true, participant, message: 'Registered' };
}

export function findParticipant(id) {
  const registry = loadTeamRegistry();
  return registry.participants[id] || null;
}

export function listParticipants() {
  const registry = loadTeamRegistry();
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
  const registry = loadTeamRegistry();
  if (!registry.participants[id]) {
    return { updated: false, message: 'Participant not found' };
  }
  Object.assign(registry.participants[id], updates);
  saveTeamRegistry(registry);

  // Update id.json too
  const ids = loadIdRegistry();
  if (ids[id]) {
    if (updates.name) ids[id].name = updates.name;
    if (updates.email) ids[id].email = updates.email;
    saveIdRegistry(ids);
  }

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

  const registry = loadTeamRegistry();
  const ids = loadIdRegistry();
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
      ids[id] = { name, email };
      imported++;
    }

    if (group) {
      if (!registry.groups[group]) registry.groups[group] = [];
      if (!registry.groups[group].includes(id)) {
        registry.groups[group].push(id);
      }
    }
  }

  saveTeamRegistry(registry);
  saveIdRegistry(ids);
  return { imported, errors };
}

export function hasRegisteredId() {
  const ids = loadIdRegistry();
  const entries = Object.keys(ids);
  if (entries.length === 0) return null;
  const id = entries[0];
  return { id, ...ids[id] };
}

export function addToGroup(groupId, participantIds) {
  const registry = loadTeamRegistry();
  if (!registry.groups[groupId]) registry.groups[groupId] = [];
  for (const id of participantIds) {
    if (registry.participants[id] && !registry.groups[groupId].includes(id)) {
      registry.groups[groupId].push(id);
    }
  }
  saveTeamRegistry(registry);
  return registry.groups[groupId];
}

export function getGroup(groupId) {
  const registry = loadTeamRegistry();
  return (registry.groups[groupId] || []).map(id => registry.participants[id]).filter(Boolean);
}

export function listGroups() {
  const registry = loadTeamRegistry();
  return Object.entries(registry.groups).map(([id, members]) => ({
    id,
    count: members.length,
    members,
  }));
}
