#!/usr/bin/env node
/**
 * docgen/build-pptx.js — Generate a PowerPoint presentation (.pptx)
 *
 * Ported from gda-ai build-pptx.py. Delegates to the Python builder
 * (shared/scripts/build-pptx.py) which requires python-pptx.
 *
 * Usage:
 *   node shared/scripts/docgen/build-pptx.js assets/decks/deck.json
 *   node shared/scripts/docgen/build-pptx.js deck.json --output ruta.pptx
 *
 * Requirements: Python 3.6+, python-pptx (pip install python-pptx)
 */

import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const PY_SCRIPT = join(REPO_ROOT, 'repos', 'GrupoConex', 'gda-ai', 'shared', 'scripts', 'build-pptx.py');

function resolveOutput(specOutput, source) {
  if (specOutput) return resolve(String(specOutput));
  const name = source.split('/').pop().replace(/\.(json|md|js|mjs|yaml|yml)$/, '') + '.pptx';
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
    console.error('Usage: build-pptx.js <source> [--output path]');
    console.error('  Requires Python 3.6+ and python-pptx (pip install python-pptx)');
    process.exit(1);
  }

  if (!existsSync(parsed.source)) {
    console.error(`Error: file not found: ${parsed.source}`);
    process.exit(1);
  }

  if (!existsSync(PY_SCRIPT)) {
    console.error(`Error: Python builder not found at ${PY_SCRIPT}`);
    console.error('  Run: node shared/scripts/repos-sync.js to clone reference repos');
    process.exit(1);
  }

  try {
    execSync('python3 -c "import pptx" 2>/dev/null', { stdio: 'pipe' });
  } catch {
    console.error('Error: python-pptx not installed. Run: pip install python-pptx');
    process.exit(1);
  }

  const cmd = `python3 "${PY_SCRIPT}" "${resolve(parsed.source)}"`;
  const fullCmd = parsed.output ? `${cmd} --output "${resolve(parsed.output)}"` : cmd;

  try {
    const result = execSync(fullCmd, { stdio: 'pipe', cwd: REPO_ROOT });
    const output = result.stdout.toString().trim();
    console.log(output);
  } catch (err) {
    console.error(`Error: ${err.stderr?.toString().trim() || err.message}`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
