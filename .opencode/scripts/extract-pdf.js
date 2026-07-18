#!/usr/bin/env node
/**
 * extract-pdf.js — PDF text extraction CLI
 *
 * Extracts text content from PDF files using available tools.
 *
 * Usage:
 *   node shared/scripts/extract-pdf.js <file.pdf>
 *   node shared/scripts/extract-pdf.js <file.pdf> --output <file.txt>
 *   node shared/scripts/extract-pdf.js <file.pdf> --format markdown
 *   node shared/scripts/extract-pdf.js --help
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HELP = `
extract-pdf.js — PDF text extraction

Usage:
  extract-pdf.js <file.pdf>                  Extract text to stdout
  extract-pdf.js <file.pdf> --output <file>  Extract text to file
  extract-pdf.js <file.pdf> --format <fmt>   Output format: text, markdown
  extract-pdf.js --help                      Show this help

Options:
  --output <file>     Write output to file instead of stdout
  --format <fmt>      Output format (default: text)
  --help              Show this help

Requires one of: pdftotext (poppler), or fallback to raw extraction.
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { file: null, output: null, format: 'text', help: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') opts.help = true;
    else if (args[i] === '--output' && args[i + 1]) opts.output = args[++i];
    else if (args[i] === '--format' && args[i + 1]) opts.format = args[++i];
    else if (!args[i].startsWith('-')) opts.file = args[i];
  }
  return opts;
}

function hasCommand(cmd) {
  const result = spawnSync(cmd, ['--version'], { encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0;
}

function extractWithPdftotext(filePath) {
  const result = spawnSync('pdftotext', ['-layout', filePath, '-'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status === 0) {
    return result.stdout;
  }
  return null;
}

function extractRaw(filePath) {
  const content = readFileSync(filePath);
  const text = content.toString('utf8');
  const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  if (printable.length > 50) {
    return printable;
  }
  return null;
}

function extractPdf(filePath) {
  if (!existsSync(filePath)) {
    console.error(`Error: ${filePath} not found`);
    process.exit(1);
  }

  let text = null;

  if (hasCommand('pdftotext')) {
    text = extractWithPdftotext(filePath);
  }

  if (!text) {
    text = extractRaw(filePath);
  }

  if (!text) {
    console.error(`Error: Could not extract text from ${filePath}`);
    console.error('Tip: install pdftotext (poppler) for better extraction:');
    console.error('  macOS: brew install poppler');
    console.error('  Ubuntu: sudo apt install poppler-utils');
    process.exit(1);
  }

  return text;
}

function formatAsMarkdown(text) {
  const lines = text.split('\n').filter(l => l.trim());
  let md = '';
  for (const line of lines) {
    if (/^\s{2,}/.test(line)) {
      md += `  ${line.trim()}\n`;
    } else {
      md += `${line.trim()}\n\n`;
    }
  }
  return md.trim() + '\n';
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (!opts.file) {
    console.error('Error: PDF file is required');
    console.log(HELP);
    process.exit(1);
  }

  const text = extractPdf(opts.file);
  const output = opts.format === 'markdown' ? formatAsMarkdown(text) : text;

  if (opts.output) {
    writeFileSync(opts.output, output);
    console.log(`Extracted text → ${opts.output}`);
  } else {
    process.stdout.write(output);
  }
}

main();
