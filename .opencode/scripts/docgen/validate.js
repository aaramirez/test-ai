#!/usr/bin/env node
/**
 * docgen/validate.js — CI validation for the document generation pipeline
 *
 * Checks:
 *   1. All JS scripts parse correctly (syntax check via node --check)
 *   2. CSS/HTML templates exist and have expected structure
 *   3. Build a minimal deck to HTML (smoke test)
 *   4. Build a minimal report
 *
 * Usage:
 *   node shared/scripts/docgen/validate.js
 *   node shared/scripts/docgen/validate.js --quick
 *
 * Exit code: 0 if all OK, 1 if errors.
 */

import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const DOCGEN_DIR = resolve(__dirname);
const TEMPLATES_DIR = join(REPO_ROOT, 'assets', 'templates');

const FAILURES = [];

function check(description, ok) {
  const msg = ok ? '  \u2713' : '  \u2717';
  console.log('%s %s', msg, description);
  if (!ok) FAILURES.push(description);
  return ok;
}

function checkSyntax(filePath) {
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    const stderr = e.stderr?.toString().trim() || e.message;
    console.error('    Error: %s', stderr);
    return false;
  }
}

function checkTemplates() {
  let ok = true;
  const expected = ['deck.css', 'report.css'];
  for (const name of expected) {
    const path = join(TEMPLATES_DIR, name);
    ok = check(`Template ${name} exists`, existsSync(path)) && ok;
  }
  return ok;
}

async function main() {
  const args = process.argv.slice(2);
  const quick = args.includes('--quick');

  console.log('=== Validaci\u00f3n docgen (aramirez-ai) ===\n');

  check(`Repo root: ${REPO_ROOT}`, existsSync(REPO_ROOT));
  check(`Docgen dir: ${DOCGEN_DIR}`, existsSync(DOCGEN_DIR));

  // 1. Syntax check all scripts
  const scripts = ['index.js', 'charts.js', 'html-theme.js', 'report-theme.js',
    'build-deck.js', 'build-image.js', 'build-report.js', 'build-web.js', 'build-pptx.js'];
  let synOk = true;
  for (const name of scripts) {
    const path = join(DOCGEN_DIR, name);
    if (existsSync(path)) {
      synOk = checkSyntax(path) && synOk;
    } else {
      check(`Script ${name} exists`, false);
      synOk = false;
    }
  }
  check(`Syntax check (${scripts.length} scripts)`, synOk);

  // 2. Templates
  const tmplOk = checkTemplates();

  if (quick) {
    const total = synOk && tmplOk;
    console.log(total ? '\n\u2713 Quick validation passed' : '\n\u2717 Quick validation failed');
    return total ? 0 : 1;
  }

  // 3. Build smoke tests
  let buildOk = true;

  try {
    const { buildHtml } = await import('./html-theme.js');
    const slides = [
      { type: 'portada', titulo: 'Validaci\u00f3n', subtitulo: 'Test' },
      { type: 'bullets', titulo: 'Items', items: ['Uno', 'Dos'] },
      { type: 'seccion', titulo: 'Secci\u00f3n de prueba' },
    ];
    const html = buildHtml(slides);
    buildOk = check(`HTML generated from minimal deck (${slides.length} slides)`, html.length > 100) && buildOk;
  } catch (e) {
    buildOk = check(`HTML generated from minimal deck`, false) && buildOk;
    console.error('    Error:', e.message);
  }

  try {
    const { buildHtml: buildReport } = await import('./report-theme.js');
    const meta = { title: 'Test', subtitle: '', organization: '', prepared_by: '', date: '', classification: '' };
    const rslides = [
      { type: 'doc-cover' },
      { type: 'section', titulo: '1. Test' },
      { type: 'text', parrafos: ['Content'] },
    ];
    const html = buildReport(meta, rslides);
    buildOk = check(`Report generated from minimal deck (${rslides.length} sections)`, html.length > 100) && buildOk;
  } catch (e) {
    buildOk = check(`Report generated from minimal deck`, false) && buildOk;
    console.error('    Error:', e.message);
  }

  const total = synOk && tmplOk && buildOk;
  console.log();
  if (total) {
    console.log('\u2713 Validation passed');
    return 0;
  } else {
    console.log('\u2717 %d check(s) failed:', FAILURES.length);
    for (const f of FAILURES) console.log('  - %s', f);
    return 1;
  }
}

process.exit(await main());
