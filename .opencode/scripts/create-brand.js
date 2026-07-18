#!/usr/bin/env node
/**
 * create-brand.js — Brand identity generator/validator
 *
 * Generates, validates, or displays brand.json configuration.
 *
 * Usage:
 *   node shared/scripts/create-brand.js --init --name "My Company"
 *   node shared/scripts/create-brand.js --validate
 *   node shared/scripts/create-brand.js --show
 *   node shared/scripts/create-brand.js --help
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const HELP = `
create-brand.js — Brand identity generator/validator

Usage:
  create-brand.js --init [--name <company>]   Generate brand.json with defaults
  create-brand.js --validate                  Validate existing brand.json
  create-brand.js --show                      Display current brand config
  create-brand.js --help                      Show this help

Options:
  --name <company>    Company name (default: "My Company")
  --output <path>     Output path (default: ./brand.json)
  --help              Show this help
`;

const DEFAULT_BRAND = (name) => ({
  brand: {
    name: name,
    colors: {
      primary: '#1a365d',
      secondary: '#2b6cb0',
      accent: '#e53e3e',
      text: '#1a202c',
      background: '#ffffff',
      'light-bg': '#f7fafc',
    },
    logo: 'assets/images/logo.svg',
    logo_white: 'assets/images/logo-white.svg',
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
  },
});

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { init: false, validate: false, show: false, help: false, name: 'My Company', output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') opts.help = true;
    else if (args[i] === '--init') opts.init = true;
    else if (args[i] === '--validate') opts.validate = true;
    else if (args[i] === '--show') opts.show = true;
    else if (args[i] === '--name' && args[i + 1]) opts.name = args[++i];
    else if (args[i] === '--output' && args[i + 1]) opts.output = args[++i];
  }
  return opts;
}

function validateBrand(data) {
  const errors = [];
  if (!data.brand) {
    errors.push('Missing top-level "brand" key');
    return errors;
  }
  if (!data.brand.name || typeof data.brand.name !== 'string') {
    errors.push('Missing or invalid brand.name');
  }
  if (!data.brand.colors || typeof data.brand.colors !== 'object') {
    errors.push('Missing or invalid brand.colors');
  } else {
    for (const key of ['primary', 'secondary', 'accent', 'text', 'background']) {
      if (!data.brand.colors[key]) {
        errors.push(`Missing brand.colors.${key}`);
      } else if (!/^#[0-9a-fA-F]{6}$/.test(data.brand.colors[key])) {
        errors.push(`Invalid hex color for brand.colors.${key}: ${data.brand.colors[key]}`);
      }
    }
  }
  if (!data.brand.fonts || typeof data.brand.fonts !== 'object') {
    errors.push('Missing or invalid brand.fonts');
  } else {
    if (!data.brand.fonts.heading) errors.push('Missing brand.fonts.heading');
    if (!data.brand.fonts.body) errors.push('Missing brand.fonts.body');
  }
  return errors;
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }

  const brandPath = opts.output || join(process.cwd(), 'brand.json');

  if (opts.init) {
    if (existsSync(brandPath)) {
      console.error(`Error: ${brandPath} already exists. Use --validate or delete it first.`);
      process.exit(1);
    }
    const brand = DEFAULT_BRAND(opts.name);
    writeFileSync(brandPath, JSON.stringify(brand, null, 2) + '\n');
    console.log(`Created ${brandPath} with brand "${opts.name}"`);
    process.exit(0);
  }

  if (opts.validate) {
    if (!existsSync(brandPath)) {
      console.error(`Error: ${brandPath} not found. Run --init first.`);
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(brandPath, 'utf8'));
    const errors = validateBrand(data);
    if (errors.length > 0) {
      console.error('Validation errors:');
      errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }
    console.log(`Valid: ${brandPath}`);
    process.exit(0);
  }

  if (opts.show) {
    if (!existsSync(brandPath)) {
      console.error(`Error: ${brandPath} not found. Run --init first.`);
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(brandPath, 'utf8'));
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  }

  console.log(HELP);
  process.exit(1);
}

main();
