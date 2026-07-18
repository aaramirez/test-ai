#!/usr/bin/env node
/**
 * docgen/build-deck.js — Generate a presentation PDF
 *
 * Ported from gda-ai build-deck.py.
 *
 * Two engines:
 *   - html (recommended): HTML+CSS slides rendered to PDF via headless browser
 *   - svg: rasterizes SVG slides to PNG, combines to PDF
 *
 * Usage:
 *   node shared/scripts/docgen/build-deck.js assets/decks/deck.json
 *   node shared/scripts/docgen/build-deck.js deck.md --engine svg
 *   node shared/scripts/docgen/build-deck.js deck.json --output assets/docs/x.pdf
 */

import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadSource, htmlToPdf, svgsToPdf, slideToSvg, findBrowser } from './index.js';
import { buildHtml, slideToHtml } from './html-theme.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

function resolveEngine(requested, deckEngine) {
  if (requested && requested !== 'auto') return requested;
  if (deckEngine) return deckEngine;
  return findBrowser() ? 'html' : 'svg';
}

function resolveOutput(specOutput, source) {
  if (specOutput) {
    const out = resolve(String(specOutput));
    return out;
  }
  const name = source.split('/').pop().replace(/\.(json|md|js|mjs)$/, '') + '.pdf';
  return join(REPO_ROOT, 'assets', 'docs', name);
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = {
    source: null,
    output: null,
    engine: 'auto',
    scale: 1.25,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) parsed.output = args[++i];
    else if (args[i] === '--engine' && i + 1 < args.length) parsed.engine = args[++i];
    else if (args[i] === '--scale' && i + 1 < args.length) parsed.scale = parseFloat(args[++i]);
    else if (!args[i].startsWith('--')) parsed.source = args[i];
  }

  if (!parsed.source) {
    console.error('Usage: build-deck.js <source> [--output path] [--engine auto|html|svg] [--scale 1.25]');
    process.exit(1);
  }

  if (!existsSync(parsed.source)) {
    console.error(`Error: file not found: ${parsed.source}`);
    process.exit(1);
  }

  const spec = await loadSource(parsed.source);
  if (!spec.slides || !spec.slides.length) {
    console.error('Error: no slides to generate.');
    process.exit(1);
  }

  const output = resolveOutput(parsed.output || spec.output, parsed.source);
  const engine = resolveEngine(parsed.engine, spec.engine);
  const slides = spec.slides;

  try {
    if (engine === 'html') {
      const html = buildHtml(slides, spec.mostrar_paginas || false, spec.meta || null);
      htmlToPdf(html, output);
    } else {
      const svgs = slides.map(s => slideToSvg(s));
      svgsToPdf(svgs, output, parsed.scale);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  console.log(`PDF generated: ${output} (${slides.length} slides, engine: ${engine})`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
