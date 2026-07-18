#!/usr/bin/env node
/**
 * ingest-content.js — Content ingestion pipeline
 *
 * Takes content from files or URLs and structures it into a knowledge base
 * with proper frontmatter, wikilinks, and formatting.
 *
 * Usage:
 *   node shared/scripts/ingest-content.js --source <file> --output <kb-dir>
 *   node shared/scripts/ingest-content.js --batch <dir> --output <kb-dir>
 *   node shared/scripts/ingest-content.js --source-url <url> --output <kb-dir>
 *   node shared/scripts/ingest-content.js --help
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HELP = `
ingest-content.js — Content ingestion pipeline

Usage:
  ingest-content.js --source <file> --output <dir>   Ingest single file
  ingest-content.js --batch <dir> --output <dir>     Ingest all files in directory
  ingest-content.js --source-url <url> --output <dir> Ingest URL content
  ingest-content.js --help                           Show this help

Options:
  --source <file>      Source file to ingest
  --batch <dir>        Directory with files to ingest
  --source-url <url>   URL to fetch content from
  --output <dir>       Output directory for KB notes
  --format <fmt>       Output format: markdown (default)
  --help               Show this help
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { source: null, batch: null, sourceUrl: null, output: null, format: 'markdown', help: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') opts.help = true;
    else if (args[i] === '--source' && args[i + 1]) opts.source = args[++i];
    else if (args[i] === '--batch' && args[i + 1]) opts.batch = args[++i];
    else if (args[i] === '--source-url' && args[i + 1]) opts.sourceUrl = args[++i];
    else if (args[i] === '--output' && args[i + 1]) opts.output = args[++i];
    else if (args[i] === '--format' && args[i + 1]) opts.format = args[++i];
  }
  return opts;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractTitle(content, filePath) {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  return basename(filePath, ext(filePath));
}

function ext(filePath) {
  const dot = filePath.lastIndexOf('.');
  return dot >= 0 ? filePath.slice(dot) : '';
}

function createFrontmatter(title, source) {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: "${title.replace(/"/g, '\\"')}"
source: "${source}"
created: ${date}
type: note
---

`;
}

function ingestFile(filePath, outputDir) {
  if (!existsSync(filePath)) {
    console.error(`Error: ${filePath} not found`);
    return false;
  }

  const content = readFileSync(filePath, 'utf8');
  const title = extractTitle(content, filePath);
  const slug = slugify(title);
  const frontmatter = createFrontmatter(title, basename(filePath));

  const outPath = join(outputDir, `${slug}.md`);
  writeFileSync(outPath, frontmatter + content);
  console.log(`Ingested: ${basename(filePath)} → ${outPath}`);
  return true;
}

function ingestBatch(batchDir, outputDir) {
  if (!existsSync(batchDir) || !statSync(batchDir).isDirectory()) {
    console.error(`Error: ${batchDir} is not a directory`);
    return false;
  }

  const files = readdirSync(batchDir).filter(f => {
    const stat = statSync(join(batchDir, f));
    return stat.isFile() && /\.(txt|md|markdown|text)$/i.test(f);
  });

  if (files.length === 0) {
    console.error(`No ingestible files found in ${batchDir}`);
    return false;
  }

  let success = 0;
  for (const file of files) {
    if (ingestFile(join(batchDir, file), outputDir)) success++;
  }
  console.log(`Ingested ${success}/${files.length} files`);
  return success > 0;
}

function ingestUrl(url, outputDir) {
  console.log(`Note: URL ingestion requires 'webfetch' tool in opencode environment.`);
  console.log(`Manual step: fetch content from ${url} and save to a local file first.`);
  console.log(`Then run: ingest-content.js --source <file> --output ${outputDir}`);
  return false;
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (!opts.source && !opts.batch && !opts.sourceUrl) {
    console.error('Error: provide --source, --batch, or --source-url');
    console.log(HELP);
    process.exit(1);
  }

  if (!opts.output) {
    console.error('Error: --output is required');
    process.exit(1);
  }

  if (!existsSync(opts.output)) {
    mkdirSync(opts.output, { recursive: true });
  }

  let success = false;
  if (opts.source) {
    success = ingestFile(opts.source, opts.output);
  } else if (opts.batch) {
    success = ingestBatch(opts.batch, opts.output);
  } else if (opts.sourceUrl) {
    success = ingestUrl(opts.sourceUrl, opts.output);
  }

  process.exit(success ? 0 : 1);
}

main();
