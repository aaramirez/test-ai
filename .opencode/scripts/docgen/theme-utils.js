#!/usr/bin/env node
/**
 * docgen/theme-utils.js — Shared utilities for HTML/SVG theme rendering
 *
 * Pure functions: no mutable state, no side effects.
 * Zero npm dependencies. Cross-platform.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { brand, esc } from './index.js';

export { esc };

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const MIME_MAP = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function resolvePath(path) {
  const p = resolve(String(path));
  if (!existsSync(p)) return resolve(join(REPO_ROOT, path));
  return p;
}

/**
 * Read any file and return a base64 data URI.
 * Supports: svg, png, jpg, jpeg, gif, webp.
 * @param {string|null} path — absolute or REPO_ROOT-relative
 * @returns {string|null} — data URI or null if missing/unsupported
 */
export function imageDataUri(path) {
  if (!path) return null;
  const p = resolvePath(path);
  if (!existsSync(p)) return null;
  const data = readFileSync(p);
  const ext = p.split('.').pop().toLowerCase();
  const mime = MIME_MAP[ext];
  if (!mime) return null;
  return `data:${mime};base64,${data.toString('base64')}`;
}

/**
 * Return a data URI for the brand logo.
 * @param {'blue'|'white'} variant
 * @returns {string} — data URI or '' if no logo available
 */
export function logoHref(variant = 'blue') {
  const b = brand();
  const rel = variant === 'white' && b.logo_white ? b.logo_white : b.logo;
  if (!rel) return '';
  const logoPath = join(REPO_ROOT, rel);
  if (!existsSync(logoPath)) return '';
  const data = readFileSync(logoPath).toString('base64');
  return `data:image/svg+xml;base64,${data}`;
}

/**
 * Generate :root CSS block with brand color and font variables.
 * @param {'deck'|'report'} type — theme type
 * @returns {string} — CSS :root { ... } block
 */
export function brandCss(type) {
  const isDeck = type === 'deck';
  const isReport = type === 'report';
  if (!isDeck && !isReport) throw new Error(`Unknown brand CSS type: ${type}`);

  const b = brand();
  const vars = {
    '--ink': b.colors.primary,
    '--accent': b.colors.secondary,
    '--accent-soft': b.colors['light-bg'],
  };

  if (isDeck) {
    vars['--ink-2'] = b.colors.secondary;
    vars['--muted'] = b.colors.secondary;
    vars['--body'] = b.colors.text;
    vars['--bg-1'] = b.colors['light-bg'];
    vars['--bg-2'] = b.colors['light-bg'];
    vars['--card'] = b.colors.background;
  }

  if (isReport) {
    vars['--muted'] = b.colors.secondary;
    vars['--body'] = b.colors.text;
    vars['--body-light'] = b.colors.text;
    vars['--bg'] = b.colors.background;
    vars['--bg-soft'] = b.colors['light-bg'];
  }

  if (b.fonts) {
    vars['--font-heading'] = b.fonts.heading || 'Inter, sans-serif';
    vars['--font-body'] = b.fonts.body || 'Inter, sans-serif';
  }

  const lines = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  return `:root {\n${lines}\n}\n`;
}
