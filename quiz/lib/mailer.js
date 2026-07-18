#!/usr/bin/env node
/**
 * mailer.js — Email formatting for quiz results (wraps send-email.js)
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZ_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(QUIZ_ROOT, 'templates');

export function loadTemplate(name) {
  const path = join(TEMPLATES_DIR, name);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

export function formatQuizEmail(session, bankName) {
  const lines = [];
  lines.push(`Resultados del Quiz — ${bankName}`);
  lines.push('');
  lines.push(`Hola ${session.participant.name},`);
  lines.push('');
  lines.push(`Tu resultado: ${session.score.correct}/${session.score.total} (${session.score.percentage}%)`);
  lines.push('');

  for (const q of session.questions) {
    if (q.correct === true) {
      lines.push(`✅ ${q.id}: Correcto`);
    } else {
      lines.push(`❌ ${q.id}: Incorrecto`);
    }
  }

  lines.push('');
  lines.push('Gracias por participar.');

  return {
    subject: `Resultados del Quiz — ${bankName}`,
    body: lines.join('\n'),
  };
}

export function formatSurveyEmail(session, bankName) {
  return {
    subject: `Gracias por tu participación — ${bankName}`,
    body: `Hola ${session.participant.name},\n\nGracias por completar la encuesta. Tus respuestas han sido registradas.\n\nBanco: ${bankName}`,
  };
}

export function buildEmailPayload(session, bankName) {
  if (session.mode === 'survey') {
    return formatSurveyEmail(session, bankName);
  }
  return formatQuizEmail(session, bankName);
}
