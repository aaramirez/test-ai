#!/usr/bin/env node
/**
 * docgen/build-report.js — Generate an executive report PDF
 *
 * Ported from gda-ai build-report.py.
 *
 * Content source: JSON with meta + slides structure.
 * Output: Letter PDF via headless browser.
 *
 * Usage:
 *   node shared/scripts/docgen/build-report.js assets/decks/report.json
 *   node shared/scripts/docgen/build-report.js report.json --output assets/docs/report.pdf
 */

import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadSource, htmlToPdf } from './index.js';
import { buildHtml } from './report-theme.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

function resolveOutput(specOutput, source) {
  if (specOutput) return resolve(String(specOutput));
  const name = source.split('/').pop().replace(/\.(json|yaml|yml)$/, '') + '.pdf';
  return join(REPO_ROOT, 'assets', 'docs', name);
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = { source: null, output: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) parsed.output = args[++i];
    else if (!args[i].startsWith('--')) parsed.source = args[i];
  }

  if (!parsed.source) {
    console.error('Usage: build-report.js <source> [--output path]');
    process.exit(1);
  }

  if (!existsSync(parsed.source)) {
    console.error(`Error: file not found: ${parsed.source}`);
    process.exit(1);
  }

  const data = await loadSource(parsed.source);
  const meta = data.meta || {};
  const slides = data.slides || [];

  if (!slides.length) {
    console.error('Error: no slides content.');
    process.exit(1);
  }

  const output = resolveOutput(parsed.output || data.output, parsed.source);
  const html = buildHtml(meta, slides);

  try {
    htmlToPdf(html, output);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  console.log(`PDF generated: ${output} (${slides.length} sections)`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
