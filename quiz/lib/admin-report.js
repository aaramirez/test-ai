#!/usr/bin/env node
/**
 * admin-report.js — Aggregate reporting for quiz results
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZ_ROOT = resolve(__dirname, '..');
const RESULTS_DIR = join(QUIZ_ROOT, 'results');

function loadResultsForBank(bankName) {
  const dirName = bankName.replace('.json', '');
  const dir = join(RESULTS_DIR, dirName);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')));
}

function loadResultsForParticipant(participantId) {
  const results = [];
  for (const bankDir of readdirSync(RESULTS_DIR)) {
    const dir = join(RESULTS_DIR, bankDir);
    if (!existsSync(dir) || bankDir === '_index.json') continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json') || f.startsWith('_')) continue;
      const session = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      if (session.participant && session.participant.id === participantId) {
        results.push(session);
      }
    }
  }
  return results;
}

export function perQuestionStats(results) {
  const stats = {};
  for (const session of results) {
    if (!session.questions) continue;
    for (const q of session.questions) {
      if (!stats[q.id]) {
        stats[q.id] = { id: q.id, type: q.type, total: 0, correct: 0, selections: {} };
      }
      stats[q.id].total++;
      if (q.correct === true) stats[q.id].correct++;
      for (const s of (q.selected || [])) {
        stats[q.id].selections[s] = (stats[q.id].selections[s] || 0) + 1;
      }
    }
  }
  return stats;
}

export function participantStats(results) {
  const byParticipant = {};
  for (const session of results) {
    if (!session.participant) continue;
    const pid = session.participant.id;
    if (!byParticipant[pid]) {
      byParticipant[pid] = { id: pid, name: session.participant.name, sessions: [] };
    }
    byParticipant[pid].sessions.push({
      session_id: session.session_id,
      mode: session.mode,
      bank: session.bank,
      date: session.date,
      score: session.score,
    });
  }
  return byParticipant;
}

export function formatReport(bankName, results, options = {}) {
  const { showParticipants = false } = options;
  const qStats = perQuestionStats(results);
  const lines = [];

  const quizResults = results.filter(r => r.mode === 'live');
  const practiceResults = results.filter(r => r.mode === 'practice');

  lines.push(`Bank: ${bankName}`);
  lines.push(`Total sessions: ${results.length} (${quizResults.length} live, ${practiceResults.length} practice)`);
  lines.push('');

  for (const [id, stat] of Object.entries(qStats)) {
    const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    lines.push(`${id} (${stat.type || 'single'}): ${pct}% correct (${stat.correct}/${stat.total})`);
    for (const [sel, count] of Object.entries(stat.selections)) {
      const selPct = Math.round((count / stat.total) * 100);
      lines.push(`  [${sel}] ${selPct}% (${count})`);
    }
    lines.push('');
  }

  if (showParticipants) {
    const pStats = participantStats(results);
    lines.push('--- Participant Summary ---');
    for (const [pid, pstat] of Object.entries(pStats)) {
      const liveSessions = pstat.sessions.filter(s => s.mode === 'live');
      const bestScore = liveSessions.reduce((best, s) =>
        s.score && s.score.percentage > best ? s.score.percentage : best, 0);
      lines.push(`${pstat.name} (${pid}): ${liveSessions.length} live sessions, best: ${bestScore}%`);
    }
  }

  return lines.join('\n');
}

export function generateReport(bankName, options = {}) {
  const results = loadResultsForBank(bankName);
  return formatReport(bankName, results, options);
}

export function generateParticipantReport(participantId) {
  const results = loadResultsForParticipant(participantId);
  if (results.length === 0) return `No results found for participant: ${participantId}`;
  const byBank = {};
  for (const r of results) {
    if (!byBank[r.bank]) byBank[r.bank] = [];
    byBank[r.bank].push(r);
  }
  const lines = [`Participant: ${results[0].participant.name} (${participantId})`, ''];
  for (const [bank, bankResults] of Object.entries(byBank)) {
    lines.push(...formatReport(bank, bankResults, { showParticipants: false }).split('\n'));
    lines.push('');
  }
  return lines.join('\n');
}

export function exportCSV(bankName) {
  const results = loadResultsForBank(bankName);
  const qStats = perQuestionStats(results);
  const lines = ['question_id,type,total,correct,percentage'];
  for (const [id, stat] of Object.entries(qStats)) {
    const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    lines.push(`${id},${stat.type || 'single'},${stat.total},${stat.correct},${pct}`);
  }
  return lines.join('\n');
}
