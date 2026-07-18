#!/usr/bin/env node
/**
 * docgen/build-web.js — Generate a navigable HTML web presentation
 *
 * Ported from gda-ai build-web.py.
 *
 * Wraps the standard HTML deck in a navigation layer with keyboard arrows,
 * click/touch navigation, slide counter, fullscreen mode, and transitions.
 *
 * Output: single self-contained HTML file in assets/docs/<name>.html
 *
 * Usage:
 *   node shared/scripts/docgen/build-web.js assets/decks/deck.json
 *   node shared/scripts/docgen/build-web.js deck.json --output ruta.html
 */

import { existsSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadSource } from './index.js';
import { buildHtml } from './html-theme.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const NAV_JS = `
<script>
(function() {
  var slides = document.querySelectorAll('.slide');
  var current = 0;
  var total = slides.length;

  function show(n) {
    slides.forEach(function(s, i) {
      s.style.display = i === n ? 'flex' : 'none';
    });
    updateCounter();
  }

  function updateCounter() {
    var el = document.getElementById('slide-counter');
    if (el) el.textContent = (current + 1) + ' / ' + total;
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      if (current < total - 1) { current++; show(current); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (current > 0) { current--; show(current); }
    } else if (e.key === 'Home') {
      e.preventDefault(); current = 0; show(current);
    } else if (e.key === 'End') {
      e.preventDefault(); current = total - 1; show(current);
    } else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });

  document.addEventListener('click', function(e) {
    var x = e.clientX / window.innerWidth;
    if (x < 0.3 && current > 0) { current--; show(current); }
    else if (x > 0.7 && current < total - 1) { current++; show(current); }
  });

  var touchStartX = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  });
  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && current < total - 1) { current++; show(current); }
      else if (dx > 0 && current > 0) { current--; show(current); }
    }
  });

  show(0);
})();
</script>
`;

const NAV_BAR = `
<div id="nav-bar">
  <div id="slide-counter">1 / 1</div>
  <div id="nav-controls">
    <button onclick="var e=new Event('keydown');e.key='ArrowLeft';document.dispatchEvent(e)">\u25C0</button>
    <button onclick="var e=new Event('keydown');e.key='Home';document.dispatchEvent(e)">\u25B2</button>
    <button onclick="var e=new Event('keydown');e.key='End';document.dispatchEvent(e)">\u25BC</button>
    <button onclick="var e=new Event('keydown');e.key='ArrowRight';document.dispatchEvent(e)">\u25B6</button>
  </div>
</div>
`;

const NAV_CSS = `
#nav-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 24px; background: rgba(35,38,79,0.92); color: #fff;
  font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  font-size: 14px; z-index: 999; user-select: none;
  -webkit-user-select: none;
}
#slide-counter { font-weight: 600; letter-spacing: 0.05em; }
#nav-controls { display: flex; gap: 6px; }
#nav-controls button {
  background: rgba(255,255,255,0.12); color: #fff; border: none;
  border-radius: 6px; padding: 4px 12px; font-size: 16px; cursor: pointer;
  line-height: 1.4; transition: background 0.15s;
}
#nav-controls button:hover { background: rgba(255,255,255,0.25); }
.slide { display: none !important; }
.slide:first-child { display: flex !important; }
@media print {
  #nav-bar { display: none; }
  .slide { display: flex !important; page-break-after: always; }
}
`;

function buildWeb(slides, mostrarPaginas = false, meta = null) {
  let html = buildHtml(slides, mostrarPaginas, meta);
  html = html.replace('</style>', NAV_CSS + '\n</style>');
  html = html.replace('</body>', NAV_BAR + '\n</body>');
  html = html.replace('</body>', NAV_JS + '\n</body>');
  return html;
}

function resolveOutput(specOutput, source) {
  if (specOutput) {
    const out = resolve(String(specOutput));
    return out.replace(/\.\w+$/, '.html');
  }
  const name = source.split('/').pop().replace(/\.(json|md|js|mjs|yaml|yml)$/, '') + '.html';
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
    console.error('Usage: build-web.js <source> [--output path]');
    process.exit(1);
  }

  if (!existsSync(parsed.source)) {
    console.error(`Error: file not found: ${parsed.source}`);
    process.exit(1);
  }

  const spec = await loadSource(parsed.source);
  const slides = spec.slides || [];

  if (!slides.length) {
    console.error('Error: no slides content.');
    process.exit(1);
  }

  const output = resolveOutput(parsed.output || spec.output, parsed.source);
  const html = buildWeb(slides, spec.mostrarPaginas || false, spec.meta || null);

  const outDir = dirname(output);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  writeFileSync(output, html, 'utf8');
  console.log(`Web generated: ${output} (${slides.length} slides)`);
}

import { mkdirSync } from 'fs';
main().catch(err => { console.error(err.message); process.exit(1); });
