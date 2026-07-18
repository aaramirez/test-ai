#!/usr/bin/env node
/**
 * repos-sync.js — Cross-platform reference repository manager
 *
 * Clones or updates reference repos listed in repos.json (project root).
 * All repos go under repos/<name>/ which is gitignored.
 *
 * Usage:
 *   node shared/scripts/repos-sync.js                  # sync all repos
 *   node shared/scripts/repos-sync.js --list           # list configured repos
 *   node shared/scripts/repos-sync.js anthropics/skills # sync specific repo
 *   node shared/scripts/repos-sync.js --help           # show help
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const REPOS_DIR = join(ROOT, 'repos');
const CONFIG_PATH = join(ROOT, 'repos.json');

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Config not found: ${CONFIG_PATH}`);
    console.error('Create repos.json in the project root with the list of repos.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    return true;
  } catch (err) {
    return false;
  }
}

function syncRepo(repo) {
  const { name, url, description } = repo;
  const dest = join(REPOS_DIR, name);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  if (description) console.log(`  ${description}`);
  console.log(`  ${url}`);
  console.log(`${'='.repeat(60)}`);

  if (existsSync(join(dest, '.git'))) {
    console.log('  → Already cloned. Pulling latest...');
    const ok = run('git pull --ff-only', dest);
    if (ok) {
      console.log('  ✓ Updated');
    } else {
      console.log('  ⚠ Pull failed (may be up to date or have local changes)');
    }
  } else {
    console.log('  → Cloning...');
    mkdirSync(dirname(dest), { recursive: true });
    const ok = run(`git clone --depth 1 ${url} "${dest}"`, ROOT);
    if (ok) {
      console.log('  ✓ Cloned');
    } else {
      console.error('  ✗ Clone failed');
      process.exitCode = 1;
    }
  }
}

function listRepos(repos) {
  console.log(`\nConfigured reference repos (${repos.length}):\n`);
  for (const repo of repos) {
    const dest = join(REPOS_DIR, repo.name);
    const status = existsSync(join(dest, '.git')) ? '✓' : ' ';
    console.log(`  [${status}] ${repo.name}`);
    console.log(`        ${repo.description || ''}`);
    console.log(`        ${repo.url}`);
    console.log();
  }
}

function showHelp() {
  console.log(`
Usage:
  node shared/scripts/repos-sync.js                  sync all repos
  node shared/scripts/repos-sync.js --list           list configured repos
  node shared/scripts/repos-sync.js <name>           sync specific repo
  node shared/scripts/repos-sync.js --help           show this help

Config file: repos.json (project root)
Repos directory: repos/ (gitignored)
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const repos = loadConfig();

  if (args.includes('--list')) {
    listRepos(repos);
    process.exit(0);
  }

  if (!existsSync(REPOS_DIR)) {
    mkdirSync(REPOS_DIR, { recursive: true });
  }

  const specific = args.filter(a => !a.startsWith('--'));
  const toSync = specific.length > 0
    ? repos.filter(r => specific.includes(r.name))
    : repos;

  if (toSync.length === 0) {
    if (specific.length > 0) {
      console.error(`No configured repo matches: ${specific.join(', ')}`);
      console.error('Run with --list to see available repos.');
      process.exit(1);
    }
    console.log('No repos configured in repos.json.');
    process.exit(0);
  }

  for (const repo of toSync) {
    syncRepo(repo);
  }

  console.log('\nDone.');
}

main();
