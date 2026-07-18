#!/usr/bin/env node
/**
 * ci-validate.js — Portable CI/CD validation script
 *
 * Checks project integrity: required files, placeholder detection,
 * skill frontmatter validity, and structural consistency.
 *
 * Usage:
  *   node .opencode/scripts/ci-validate.js              # validate project
  *   node .opencode/scripts/ci-validate.js --strict      # fail on warnings
  *   node .opencode/scripts/ci-validate.js --verbose     # show all checks
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — errors found
 *   2 — warnings found (non-strict)
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const args = process.argv.slice(2);

const dirIndex = args.indexOf('--dir');
const ROOT = resolve(dirIndex >= 0 && args[dirIndex + 1] ? args[dirIndex + 1] : resolve(__dirname, '..', '..'));

const STRICT = args.includes('--strict');
const VERBOSE = args.includes('--verbose');

let errors = 0;
let warnings = 0;

function check(condition, label, detail, level = 'error') {
  if (!condition) {
    if (level === 'error') {
      console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
      errors++;
    } else {
      console.warn(`  ⚠ ${label}${detail ? ': ' + detail : ''}`);
      warnings++;
    }
  } else if (VERBOSE) {
    console.log(`  ✓ ${label}`);
  }
}

function exists(p) { return existsSync(p); }
function isDir(p) { return existsSync(p) && statSync(p).isDirectory(); }
function isFile(p) { return existsSync(p) && statSync(p).isFile(); }

console.log(`\n🔍 ci-validate — ${ROOT}\n`);

// ── Project structure ──

check(exists(join(ROOT, 'AGENTS.md')), 'AGENTS.md exists', '', 'warn');

// .opencode/skills/ — check frontmatter
if (isDir(join(ROOT, '.opencode', 'skills'))) {
  const skills = readdirSync(join(ROOT, '.opencode', 'skills')).filter(f =>
    isDir(join(ROOT, '.opencode', 'skills', f))
  );
  check(skills.length > 0, 'At least one skill exists');
  if (VERBOSE) console.log(`  Skills: ${skills.length} total`);

  for (const skill of skills) {
    const skillPath = join(ROOT, '.opencode', 'skills', skill, 'SKILL.md');
    check(isFile(skillPath), `Skill "${skill}" has SKILL.md`);

    if (isFile(skillPath)) {
      const content = readFileSync(skillPath, 'utf8');
      const hasName = /^name:\s*\S+/m.test(content);
      const hasDesc = /^description:\s*\S+/m.test(content);
      check(hasName, `Skill "${skill}" has name in frontmatter`);
      check(hasDesc, `Skill "${skill}" has description in frontmatter`);

      const hasTodo = /\/\/\s*TODO\b|TODO:|\[[ x]\]\s*TODO/i.test(content);
      check(!hasTodo, `Skill "${skill}" has no TODO placeholders`, '', 'warn');
    }
  }
}

// .opencode/scripts/ — check for TODO placeholders
if (isDir(join(ROOT, '.opencode', 'scripts'))) {
  const scripts = readdirSync(join(ROOT, '.opencode', 'scripts')).filter(f =>
    isFile(join(ROOT, '.opencode', 'scripts', f)) && f.endsWith('.js') && f !== 'ci-validate.js'
  );
  if (VERBOSE) console.log(`  Scripts: ${scripts.length} total`);

  for (const script of scripts) {
    const content = readFileSync(join(ROOT, '.opencode', 'scripts', script), 'utf8');
    const hasTodo = /\/\/\s*TODO\b|TODO:|\[[ x]\]\s*TODO/i.test(content);
    check(!hasTodo, `Script "${script}" has no TODO placeholders`, '', 'warn');
  }
}

// ── .opencode/ structure ──
check(isDir(join(ROOT, '.opencode')), '.opencode/ directory exists');
check(isDir(join(ROOT, '.opencode', 'agents')), '.opencode/agents/ directory exists');
check(isDir(join(ROOT, '.opencode', 'commands')), '.opencode/commands/ directory exists');
check(isFile(join(ROOT, 'opencode.json')), 'opencode.json exists at root');

// ── brand.json ──
const brandPath = join(ROOT, 'assets', 'brand.json');
if (isFile(brandPath)) {
  try {
    const brand = JSON.parse(readFileSync(brandPath, 'utf8'));
    check(brand.brand?.name, 'brand.json has brand name');
    check(brand.brand?.colors?.primary, 'brand.json has primary color');
  } catch {
    check(false, 'brand.json is valid JSON');
  }
}

// ── Wikilinks in quiz manuals ──
const tutorialsDir = join(ROOT, 'quiz', 'manuals');
if (isDir(tutorialsDir)) {
  const mdFiles = [];
  function collectMd(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) collectMd(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) mdFiles.push(full);
    }
  }
  collectMd(tutorialsDir);

  const wikilinkRe = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const backtickRe = /`[^`]*`/g;
  let brokenLinks = 0;
  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf8');
    const codeSpans = new Set();
    let cm;
    while ((cm = backtickRe.exec(content)) !== null) {
      for (let i = cm.index; i < cm.index + cm[0].length; i++) codeSpans.add(i);
    }
    let match;
    while ((match = wikilinkRe.exec(content)) !== null) {
      if (codeSpans.has(match.index)) continue;
      const target = match[1].trim();
      let resolved;
      if (target.startsWith('../')) {
        resolved = resolve(join(dirname(file), target + (target.endsWith('.md') ? '' : '.md')));
      } else {
        resolved = join(tutorialsDir, target + (target.endsWith('.md') ? '' : '.md'));
      }
      if (!existsSync(resolved)) {
        let altResolved;
        if (target.startsWith('../')) {
          altResolved = resolve(join(dirname(file), target + '/Index.md'));
        } else {
          altResolved = join(tutorialsDir, target + '/Index.md');
        }
        if (!existsSync(altResolved)) {
          const rel = file.replace(ROOT + '/', '');
          check(false, `Broken wikilink in ${rel}`, `[[${target}]] → not found`, 'warn');
          brokenLinks++;
        }
      }
    }
  }
  if (VERBOSE && brokenLinks === 0) console.log(`  Wikilinks: all valid across ${mdFiles.length} files`);
}

// ── Template specs: English keyword detection ──
const specsDir = join(ROOT, 'assets', 'templates', 'specs');
if (isDir(specsDir)) {
  const specFiles = readdirSync(specsDir).filter(f => f.endsWith('.json'));
  const englishKeywords = /\b(OK|Created|Bad Request|Not Found|Forbidden|Unauthorized|Internal Server Error|Too Many Requests|Unprocessable Entity|Conflict)\b/g;
  for (const spec of specFiles) {
    const content = readFileSync(join(specsDir, spec), 'utf8');
    let parsed;
    try { parsed = JSON.parse(content); } catch { check(false, `Spec "${spec}" is valid JSON`, '', 'warn'); continue; }
    const titles = [parsed.meta?.title, parsed.meta?.subtitle].filter(Boolean).join(' ');
    const matches = titles.match(englishKeywords);
    if (matches) {
      check(false, `Spec "${spec}" has English in titles`, `Found: ${matches.join(', ')}`, 'warn');
    }
  }
  if (VERBOSE) console.log(`  Specs: ${specFiles.length} checked for English keywords`);
}

// ── Creator scripts: TODO guard ──
if (isDir(join(ROOT, '.opencode', 'scripts'))) {
  const creatorScripts = readdirSync(join(ROOT, '.opencode', 'scripts')).filter(f =>
    f.startsWith('create-') && f.endsWith('.js')
  );
  for (const script of creatorScripts) {
    const content = readFileSync(join(ROOT, '.opencode', 'scripts', script), 'utf8');
    const hasTodo = /\/\/\s*TODO\b|TODO:|\[[ x]\]\s*TODO|\bFIXME\b|\bHACK\b|\bXXX\b/i.test(content);
    check(!hasTodo, `Creator "${script}" has no TODO/FIXME/HACK/XXX`, '', 'warn');
  }
  if (VERBOSE) console.log(`  Creator scripts: ${creatorScripts.length} checked for TODOs`);
}

// ── .gitignore ──
check(isFile(join(ROOT, '.gitignore')), '.gitignore exists');
if (isFile(join(ROOT, '.gitignore'))) {
  const gi = readFileSync(join(ROOT, '.gitignore'), 'utf8');
  check(gi.includes('node_modules'), '.gitignore excludes node_modules');
  check(gi.includes('.env'), '.gitignore excludes .env');
}

// ── Summary ──
console.log();
if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed');
  process.exit(0);
} else {
  if (errors > 0) console.log(`❌ ${errors} error(s)`);
  if (warnings > 0) console.log(`⚠ ${warnings} warning(s)`);
  if (errors > 0) process.exit(1);
  if (STRICT && warnings > 0) process.exit(1);
  process.exit(warnings > 0 ? 2 : 0);
}
