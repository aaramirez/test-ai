#!/usr/bin/env node
/**
 * install.js — Install quiz & testing system to a target directory
 *
 * Usage:
 *   node install.js                        # install to current directory
 *   node install.js --dir /path/to/target  # install to specific directory
 *   node install.js --dry-run              # preview without copying
 *   node install.js --verbose              # show each file as copied
 *   node install.js --no-ci-fix            # skip ci-validate.js rewrite
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync } from 'fs';
import { join, resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    targetDir: process.cwd(),
    dryRun: false,
    verbose: false,
    fixCi: true,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) opts.targetDir = resolve(process.cwd(), args[++i]);
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--verbose') opts.verbose = true;
    else if (args[i] === '--no-ci-fix') opts.fixCi = false;
    else if (args[i] === '--force') opts.force = true;
    else if (args[i] === '--help') {
      console.log(`
Usage: node install.js [options]

Install quiz & testing system to a target directory.

Options:
  --dir <path>     Target directory (default: current directory)
  --dry-run        Preview files that would be copied
  --verbose        Show each file as it is copied
  --no-ci-fix      Skip ci-validate.js path rewrite
  --force          Overwrite protected user data files
  --help           Show this help
`);
      process.exit(0);
    }
  }

  return opts;
}

const EXCLUDE_PREFIXES = [
  'node_modules',
  '.DS_Store',
  'plans',
  'assets',
  'repos.json',           // Never copy repos.json from source
  'id.json',              // Never copy id.json from source
  'team.json',            // Never copy team.json from source
  'quiz/results/',        // Never copy results from source
  'quiz/banks/',          // Never copy banks from source
  'quiz/keys/',           // Never copy keys from source
  'surveys/results/',     // Never copy survey results from source
  'surveys/banks/',       // Never copy survey banks from source
  '.opencode/skills/branding/',
  '.opencode/skills/ci-validate/',
  '.opencode/skills/code-review/',
  '.opencode/skills/content-ingestion/',
  '.opencode/skills/customize-opencode/',
  '.opencode/skills/document-generation/',
  '.opencode/skills/email/',
  '.opencode/skills/git/',
  '.opencode/skills/google-workspace/',
  '.opencode/skills/kb-management/',
  '.opencode/skills/m365/',
  '.opencode/skills/pdf-extraction/',
  '.opencode/skills/repos-sync/',
  '.opencode/skills/vault-pdf-export/',
  '.opencode/skills/youtube/',
  '.opencode/prompts/',
  '.opencode/node_modules/',
];

const EXCLUDE_FILES = new Set([
  '.opencode/scripts/create-brand.js',
  '.opencode/scripts/extract-pdf.js',
  '.opencode/scripts/getrepo.js',
  '.opencode/scripts/ingest-content.js',
  '.opencode/scripts/kb-sync.js',
  '.opencode/scripts/mcp-email.js',
  '.opencode/scripts/repos-sync.js',
  '.opencode/scripts/send-email.js',
  '.opencode/scripts/updaterepos.js',
  '.opencode/scripts/docgen-vault.js',
  '.opencode/scripts/youtube-transcript.js',
  '.opencode/scripts/docgen',
]);

/**
 * Paths that will NOT be overwritten during install or update.
 * These are user data / configuration files.
 * Protected paths are matched by prefix (any file starting with one of these strings).
 */
const PROTECTED_PREFIXES = [
  'id.json',              // User ID lookup registry
  'team.json',            // User participant registry
  'quiz/results/',
  'quiz/keys/',
  'quiz/banks/',
  'quiz/bank.json',
  'surveys/results/',
  'surveys/banks/',
];

/**
 * Paths that are NEVER overwritten, even with --force.
 * These are user data files that should be created empty on fresh install
 * but never overwritten on update.
 */
const ALWAYS_PROTECTED_PREFIXES = [
  'surveys/registry.json',
  'surveys/_index.json',
  'surveys/visibility.json',
  'quiz/results/_index.json',
];

const CI_SCRIPT_REL = join('.opencode', 'scripts', 'ci-validate.js');

function shouldInclude(relPath) {
  for (const prefix of EXCLUDE_PREFIXES) {
    if (relPath.startsWith(prefix)) return false;
  }
  if (EXCLUDE_FILES.has(relPath)) return false;
  return true;
}

function isProtected(relPath) {
  for (const prefix of PROTECTED_PREFIXES) {
    if (relPath.startsWith(prefix)) return true;
  }
  return false;
}

function isAlwaysProtected(relPath) {
  for (const prefix of ALWAYS_PROTECTED_PREFIXES) {
    if (relPath.startsWith(prefix)) return true;
  }
  return false;
}

function walkDir(dir, sourceRoot) {
  const entries = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return entries;
  }

  for (const name of names) {
    const full = join(dir, name);
    const rel = relative(sourceRoot, full);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      if (name === 'node_modules') continue;
      const sub = walkDir(full, sourceRoot);
      entries.push(...sub);
    } else if (shouldInclude(rel)) {
      entries.push(full);
    }
  }

  return entries;
}

function getFileList(sourceRoot) {
  const rootFiles = ['opencode.json', 'AGENTS.md', 'README.md', 'package.json', '.gitignore']
    .filter(f => existsSync(join(sourceRoot, f)))
    .map(f => join(sourceRoot, f));

  const subDirs = ['quiz', '.opencode', 'surveys'];
  const walked = [];
  for (const sub of subDirs) {
    const fullPath = join(sourceRoot, sub);
    if (existsSync(fullPath)) {
      walked.push(...walkDir(fullPath, sourceRoot));
    }
  }

  const all = [...rootFiles, ...walked];
  const seen = new Set();
  return all.filter(f => {
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });
}

function getCiValidatePatchedContent(sourcePath) {
  const orig = readFileSync(sourcePath, 'utf-8');
  return orig
    .replace(/join\s*\(\s*ROOT\s*,\s*'shared'\s*\)/g, "join(ROOT, '.opencode')")
    .replace(/join\s*\(\s*ROOT\s*,\s*'shared'/g, "join(ROOT, '.opencode'")
    .replace(/'tutorials'/g, "'quiz/banks'")
    .replace(/'shared\/tasks'/g, "'.opencode/commands'");
}

function copyFile(src, dest) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  cpSync(src, dest);
}

function install(opts) {
  const { sourceRoot, targetDir, dryRun, verbose, fixCi, force } = {
    sourceRoot: PROJECT_ROOT,
    targetDir: process.cwd(),
    dryRun: false,
    verbose: false,
    fixCi: true,
    force: false,
    ...opts,
  };

  const resolvedTarget = resolve(targetDir);
  const files = getFileList(sourceRoot);

  if (dryRun) {
    console.log(`\nDry-run: would install to ${resolvedTarget}`);
    console.log(`Total files: ${files.length}\n`);
    const byDir = {};
    for (const f of files) {
      const rel = relative(sourceRoot, f);
      const dir = dirname(rel).split('/')[0];
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push(rel);
    }
    for (const [dir, items] of Object.entries(byDir)) {
      console.log(`  ${dir}/ (${items.length} files)`);
      if (verbose) {
        for (const item of items) {
          const note = !force && isProtected(item) ? '  [protected]' : '';
          console.log(`    ${item}${note}`);
        }
      }
    }
    if (fixCi) {
      console.log('\n  [ci-validate.js will be patched to check .opencode/]');
    }
    console.log('');
    return;
  }

  let count = 0;
  let skipped = 0;
  let created = 0;

  // Create empty ALWAYS_PROTECTED files if they don't exist (fresh install only)
  const alwaysProtectedDefaults = {
    'surveys/registry.json': '{}',
    'surveys/_index.json': '{"by_bank":{}}',
    'surveys/visibility.json': '{}',
    'quiz/results/_index.json': '{}',
  };

  for (const [relPath, defaultContent] of Object.entries(alwaysProtectedDefaults)) {
    const dest = join(resolvedTarget, relPath);
    if (!existsSync(dest)) {
      const destDir = dirname(dest);
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      writeFileSync(dest, defaultContent, 'utf-8');
      if (verbose) console.log(`  create   ${relPath}  [empty default]`);
      created++;
    }
  }

  for (const src of files) {
    const rel = relative(sourceRoot, src);

    // ALWAYS skip always-protected files (even with --force)
    if (isAlwaysProtected(rel)) {
      if (verbose) console.log(`  skip     ${rel}  [always protected]`);
      skipped++;
      continue;
    }

    // Skip user data files unless --force is used
    if (!force && isProtected(rel)) {
      if (verbose) console.log(`  skip     ${rel}  [protected]`);
      skipped++;
      continue;
    }

    const dest = join(resolvedTarget, rel);

    if (rel === CI_SCRIPT_REL && fixCi) {
      if (verbose) console.log(`  patched  ${rel}`);
      const destDir = dirname(dest);
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      writeFileSync(dest, getCiValidatePatchedContent(src), 'utf-8');
      count++;
      continue;
    }

    if (verbose) console.log(`  copy     ${rel}`);
    copyFile(src, dest);
    count++;
  }

  console.log(`\nInstalled ${count} files to ${resolvedTarget}`);
  if (created > 0) {
    console.log(`  (${created} empty data files created)`);
  }
  if (skipped > 0) {
    console.log(`  (${skipped} protected files skipped — use --force to overwrite)`);
  }
  if (fixCi) {
    console.log('  (ci-validate.js patched for .opencode/ directory)');
  }
  console.log('');
}

function main() {
  const opts = parseArgs();
  install(opts);
}

export { install, getFileList, isProtected, isAlwaysProtected };

if (process.argv[1] && (process.argv[1].endsWith('install.js') || process.argv[1].endsWith('install'))) {
  main();
}
