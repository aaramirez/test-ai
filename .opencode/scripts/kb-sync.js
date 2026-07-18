#!/usr/bin/env node
/**
 * kb-sync.js — Knowledge base synchronization and validation
 *
 * Validates wikilinks, fixes broken links, and reindexes KB structure.
 *
 * Usage:
 *   node shared/scripts/kb-sync.js --validate <kb-dir>
 *   node shared/scripts/kb-sync.js --fix-links <kb-dir>
 *   node shared/scripts/kb-sync.js --reindex <kb-dir>
 *   node shared/scripts/kb-sync.js --help
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HELP = `
kb-sync.js — Knowledge base synchronization and validation

Usage:
  kb-sync.js --validate <dir>       Validate wikilinks and structure
  kb-sync.js --fix-links <dir>      Fix broken wikilinks
  kb-sync.js --reindex <dir>        Reindex KB structure
  kb-sync.js --help                 Show this help

Options:
  <dir>                 KB directory to process
  --help                Show this help
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { validate: false, fixLinks: false, reindex: false, dir: null, help: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') opts.help = true;
    else if (args[i] === '--validate') opts.validate = true;
    else if (args[i] === '--fix-links') opts.fixLinks = true;
    else if (args[i] === '--reindex') opts.reindex = true;
    else if (!args[i].startsWith('-')) opts.dir = args[i];
  }
  return opts;
}

function findMarkdownFiles(dir) {
  const files = [];
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractWikilinks(content) {
  const links = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push({ text: match[1], index: match.index });
  }
  return links;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) fm[key.trim()] = rest.join(':').trim();
  }
  return fm;
}

function validate(kbDir) {
  const files = findMarkdownFiles(kbDir);
  const allNotes = new Set(files.map(f => basename(f, '.md')));
  const issues = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const links = extractWikilinks(content);
    const fm = extractFrontmatter(content);

    if (!fm || !fm.title) {
      issues.push({ file, issue: 'Missing frontmatter title' });
    }

    for (const link of links) {
      const target = link.text.split('|')[0].trim();
      if (!allNotes.has(target)) {
        issues.push({ file, issue: `Broken wikilink: [[${target}]]` });
      }
    }
  }

  if (issues.length === 0) {
    console.log(`Valid: ${files.length} files, 0 issues`);
    return true;
  }

  console.log(`Found ${issues.length} issues in ${files.length} files:`);
  for (const { file, issue } of issues) {
    console.log(`  ${basename(file)}: ${issue}`);
  }
  return false;
}

function fixLinks(kbDir) {
  const files = findMarkdownFiles(kbDir);
  const allNotes = new Set(files.map(f => basename(f, '.md')));
  let fixed = 0;

  for (const file of files) {
    let content = readFileSync(file, 'utf8');
    const links = extractWikilinks(content);

    for (const link of links) {
      const target = link.text.split('|')[0].trim();
      if (!allNotes.has(target)) {
        const suggestion = [...allNotes].find(n => n.toLowerCase() === target.toLowerCase());
        if (suggestion) {
          content = content.replace(`[[${link.text}]]`, `[[${suggestion}]]`);
          fixed++;
        }
      }
    }

    writeFileSync(file, content);
  }

  console.log(`Fixed ${fixed} broken links in ${files.length} files`);
  return true;
}

function reindex(kbDir) {
  const files = findMarkdownFiles(kbDir);
  console.log(`Indexed ${files.length} files in ${kbDir}`);
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const links = extractWikilinks(content);
    console.log(`  ${basename(file)}: ${links.length} wikilinks`);
  }
  return true;
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (!opts.validate && !opts.fixLinks && !opts.reindex) {
    console.error('Error: provide --validate, --fix-links, or --reindex');
    console.log(HELP);
    process.exit(1);
  }

  if (!opts.dir) {
    console.error('Error: KB directory is required');
    process.exit(1);
  }

  if (!existsSync(opts.dir)) {
    console.error(`Error: ${opts.dir} not found`);
    process.exit(1);
  }

  let success = false;
  if (opts.validate) success = validate(opts.dir);
  else if (opts.fixLinks) success = fixLinks(opts.dir);
  else if (opts.reindex) success = reindex(opts.dir);

  process.exit(success ? 0 : 1);
}

main();
