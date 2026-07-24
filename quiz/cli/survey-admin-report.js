#!/usr/bin/env node
/**
 * survey-admin-report.js — Admin reports for survey results
 *
 * Generates aggregate statistics, per-question breakdowns, and CSV export
 * for survey session results stored in surveys/results/.
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

function getSurveysDir(root) {
  return join(root || PROJECT_ROOT, 'surveys');
}

function getBankPath(bankName, root) {
  return join(getSurveysDir(root), 'banks', bankName);
}

function getResultsDir(bankName, root) {
  return join(getSurveysDir(root), 'results', bankName.replace('.json', ''));
}

function loadBank(bankName, root) {
  const path = getBankPath(bankName, root);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function loadAllResults(bankName, root) {
  const dir = getResultsDir(bankName, root);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(dir, f), 'utf-8');
    return JSON.parse(content);
  });
}

export function listSurveyBanks(root) {
  const banksDir = join(getSurveysDir(root), 'banks');
  if (!existsSync(banksDir)) return [];
  return readdirSync(banksDir).filter(f => f.endsWith('.json'));
}

export function getSurveyStats(bankName, root) {
  const bank = loadBank(bankName, root);
  const results = loadAllResults(bankName, root);

  if (!bank || results.length === 0) {
    return { totalResponses: 0, questionStats: {} };
  }

  const questionStats = {};
  for (const q of bank.questions) {
    const answers = [];
    for (const session of results) {
      const sq = session.questions.find(x => x.id === q.id);
      if (sq && sq.selected && sq.selected.length > 0) {
        const selectedIds = sq.selected.flatMap(s => s.selected || []);
        answers.push(...selectedIds);
      }
    }

    const counts = {};
    for (const a of answers) {
      counts[a] = (counts[a] || 0) + 1;
    }

    questionStats[q.id] = {
      question: q.question,
      options: q.options,
      totalAnswers: answers.length,
      distribution: counts,
    };
  }

  return { totalResponses: results.length, questionStats };
}

export function generateSurveyReport(bankName, root) {
  const bank = loadBank(bankName, root);
  if (!bank) return `Error: Bank "${bankName}" not found`;

  const stats = getSurveyStats(bankName, root);
  if (stats.totalResponses === 0) return `No responses for "${bankName}"`;

  const lines = [];
  lines.push(`Survey Report: ${bank.title || bankName}`);
  lines.push('='.repeat(50));
  lines.push(`Total responses: ${stats.totalResponses}`);
  lines.push('');

  for (const [qId, qStat] of Object.entries(stats.questionStats)) {
    lines.push(`Question: ${qStat.question} (${qId})`);
    for (let i = 0; i < qStat.options.length; i++) {
      const count = qStat.distribution[i] || 0;
      const pct = stats.totalResponses > 0 ? Math.round((count / stats.totalResponses) * 100) : 0;
      lines.push(`  ${qStat.options[i]}: ${count} (${pct}%)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateSurveyReportCSV(bankName, root) {
  const bank = loadBank(bankName, root);
  if (!bank) return 'Error: Bank not found';

  const results = loadAllResults(bankName, root);
  if (results.length === 0) return 'session_id,participant_id,participant_name,date\n';

  const qIds = bank.questions.map(q => q.id);
  const header = ['session_id', 'participant_id', 'participant_name', 'date', ...qIds].join(',');

  const rows = results.map(s => {
    const qAnswers = qIds.map(qId => {
      const sq = s.questions.find(x => x.id === qId);
      if (sq && sq.selected && sq.selected.length > 0) {
        return (sq.selected.flatMap(sel => sel.selected || [])).join(';');
      }
      return '';
    });
    return [s.session_id, s.participant.id, s.participant.name, s.date, ...qAnswers].join(',');
  });

  return [header, ...rows].join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('survey-admin-report.js')) {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bank' && args[i + 1]) opts.bank = args[++i];
    else if (args[i] === '--csv' && args[i + 1]) opts.csv = args[++i];
    else if (args[i] === '--list') opts.list = true;
    else if (args[i] === '--root' && args[i + 1]) opts.root = args[++i];
  }

  if (opts.list) {
    const banks = listSurveyBanks(opts.root);
    if (banks.length === 0) {
      console.log('No survey banks found');
    } else {
      console.log('Survey banks:');
      for (const b of banks) console.log(`  ${b}`);
    }
  } else if (opts.bank) {
    const report = generateSurveyReport(opts.bank, opts.root);
    console.log(report);
    if (opts.csv) {
      const csv = generateSurveyReportCSV(opts.bank, opts.root);
      writeFileSync(opts.csv, csv);
      console.log(`\nCSV exported to: ${opts.csv}`);
    }
  } else {
    console.error('Usage: node survey-admin-report.js --bank BANK [--csv FILE] [--list] [--root DIR]');
    process.exit(1);
  }
}
