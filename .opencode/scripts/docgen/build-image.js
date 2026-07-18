#!/usr/bin/env node
/**
 * docgen/build-image.js — Generate a single PNG image (16:9)
 *
 * Ported from gda-ai build-image.py.
 *
 * Content source: .json, .md, or .js/.mjs
 * Output: PNG in assets/images/ (optionally SVG alongside)
 *
 * Usage:
 *   node shared/scripts/docgen/build-image.js image.json
 *   node shared/scripts/docgen/build-image.js image.md --svg
 *   node shared/scripts/docgen/build-image.js image.py --output assets/images/x.png
 */

import { existsSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadSource, svgToPng, slideToSvg } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

function resolveOutput(specOutput, source) {
  if (specOutput) return resolve(String(specOutput));
  const name = source.split('/').pop().replace(/\.(json|md|js|mjs)$/, '') + '.png';
  return join(REPO_ROOT, 'assets', 'images', name);
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = { source: null, output: null, scale: 1.25, svg: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) parsed.output = args[++i];
    else if (args[i] === '--format' && i + 1 < args.length) i++; // accepted for compatibility, default is png
    else if (args[i] === '--scale' && i + 1 < args.length) parsed.scale = parseFloat(args[++i]);
    else if (args[i] === '--svg') parsed.svg = true;
    else if (!args[i].startsWith('--')) parsed.source = args[i];
  }

  if (!parsed.source) {
    console.error('Usage: build-image.js <source> [--output path] [--scale 1.25] [--svg]');
    process.exit(1);
  }

  if (!existsSync(parsed.source)) {
    console.error(`Error: file not found: ${parsed.source}`);
    process.exit(1);
  }

  const spec = await loadSource(parsed.source);
  let svg;

  if (spec.svg) {
    svg = spec.svg;
  } else {
    const slides = spec.slides || [];
    if (!slides.length) {
      console.error('Error: no content for image.');
      process.exit(1);
    }
    svg = slideToSvg(slides[0]);
  }

  const output = resolveOutput(parsed.output || spec.output, parsed.source);
  svgToPng(svg, output, parsed.scale);
  console.log(`Image generated: ${output}`);

  if (parsed.svg) {
    const svgOut = output.replace(/\.png$/, '.svg');
    writeFileSync(svgOut, svg, 'utf8');
    console.log(`SVG generated: ${svgOut}`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
