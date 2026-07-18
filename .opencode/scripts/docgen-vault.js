#!/usr/bin/env node
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname, resolve, dirname } from 'path';
import { htmlToPdf, brand, loadBrand } from '../document-generation/scripts/docgen/index.js';
import { brandCss, logoHref } from '../document-generation/scripts/docgen/theme-utils.js';

const REPO_ROOT = resolve(new URL('.', import.meta.url).pathname, '../..');
const BRAND_PATH = join(REPO_ROOT, 'shared', 'brand.json');

const DEFAULT_EXCLUDES = {
  curso:    { dirs: ['Transcripciones', '.obsidian', 'Recursos'], files: ['Index.md'] },
  topics:   { dirs: ['.obsidian', 'assets'],                      files: ['Index.md'] },
  flat:     { dirs: ['.obsidian', 'assets'],                      files: ['Index.md'] },
  arbitrary:{ dirs: ['.obsidian', 'assets'],                      files: ['Index.md'] },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = i + 1 < args.length && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      if (flags[key] !== undefined) {
        flags[key] = [].concat(flags[key], val);
      } else {
        flags[key] = val;
      }
      if (val !== true) i++;
    }
  }
  return flags;
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function detectVaultType(vaultPath) {
  const entries = readdirSync(vaultPath, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.md'));
  if (dirs.some(d => /Módulo/i.test(d.name))) return 'curso';
  const topicDirs = dirs.filter(d => /^\d+-[a-zA-Z]/.test(d.name));
  if (dirs.length > 0 && topicDirs.length / dirs.length >= 0.6) return 'topics';
  const numberedDirs = dirs.filter(d => /^\d+\s*[—\-]/.test(d.name));
  if (dirs.length > 0 && numberedDirs.length / dirs.length >= 0.5) return 'curso';
  if (dirs.length === 0 && files.length > 0) return 'flat';
  return 'arbitrary';
}

function makeExcludes(vaultType, extraDirs, extraFiles) {
  const base = DEFAULT_EXCLUDES[vaultType] || DEFAULT_EXCLUDES.arbitrary;
  const dirs = new Set(base.dirs);
  const files = new Set(base.files);
  if (extraDirs) {
    for (const d of [].concat(extraDirs)) dirs.add(d);
  }
  if (extraFiles) {
    for (const f of [].concat(extraFiles)) files.add(f);
  }
  return { dirs, files };
}

function vaultFiles(vaultPath, excludeDirs, excludeFiles) {
  const files = [];
  const entries = readdirSync(vaultPath, { withFileTypes: true });
  for (const e of entries) {
    if (excludeDirs.has(e.name)) continue;
    if (e.isDirectory()) {
      files.push(...vaultFiles(join(vaultPath, e.name), excludeDirs, excludeFiles));
    } else if (e.isFile() && extname(e.name) === '.md' && !excludeFiles.has(e.name)) {
      files.push(join(vaultPath, e.name));
    }
  }
  return files;
}

function slugify(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function displayName(s) {
  return s.replace(/^\d+[-]\s*/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

/* ---------- parseadores por tipo de vault ---------- */

function parseCurso(rel, name) {
  const modMatch = rel.match(/(\d+)|Módulo\s+(\d+)/);
  const modNum = modMatch ? parseInt(modMatch[1] || modMatch[2]) : 99;
  const lesMatch = name.match(/^(\d+)/);
  const lesNum = lesMatch ? parseInt(lesMatch[1]) : 99;
  const modDisplay = displayName(rel);
  const lesDisplay = displayName(name);
  return {
    groupKey: modDisplay || rel || 'General',
    sortKey: `${String(modNum).padStart(3,'0')}-${String(lesNum).padStart(3,'0')}`,
    title: name,
    subtitle: `Lección ${lesMatch?.[1] || ''}${lesDisplay ? ` — ${lesDisplay}` : ''}`,
  };
}

function parseTopics(rel, name) {
  const secMatch = rel.match(/^(\d+)/);
  const pageMatch = name.match(/^(\d+)/);
  const secNum = secMatch ? parseInt(secMatch[1]) : 99;
  const pageNum = pageMatch ? parseInt(pageMatch[1]) : 99;
  const secDisplay = displayName(rel);
  const pageDisplay = displayName(name);
  return {
    groupKey: secDisplay || rel,
    sortKey: `${String(secNum).padStart(3,'0')}-${String(pageNum).padStart(3,'0')}`,
    title: pageDisplay || name,
    subtitle: `${secDisplay} — ${pageDisplay}`,
  };
}

function parseFlat(rel, name) {
  const display = displayName(name);
  return {
    groupKey: '_flat',
    sortKey: name,
    title: display,
    subtitle: display,
  };
}

function parseArbitrary(rel, name) {
  const parts = rel.split('/');
  const groupName = parts[0] || 'General';
  const display = displayName(name);
  return {
    groupKey: groupName,
    sortKey: `${rel}/${name}`,
    title: display,
    subtitle: `${display}`,
  };
}

function parseByType(filePath, vaultPath, vaultType) {
  const rel = dirname(filePath).slice(vaultPath.length + 1);
  const name = basename(filePath, '.md');
  const parsed = (vaultType === 'curso') ? parseCurso(rel, name) :
    (vaultType === 'topics') ? parseTopics(rel, name) :
    (vaultType === 'flat') ? parseFlat(rel, name) :
    parseArbitrary(rel, name);
  return { path: filePath, rel, name, ...parsed };
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function readVaultTitle(vaultPath) {
  const indexPath = join(vaultPath, 'Index.md');
  if (!existsSync(indexPath)) return basename(vaultPath);
  const md = readFileSync(indexPath, 'utf8');
  const match = md.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : basename(vaultPath);
}

function buildMeta(title, subtitle, vaultName) {
  return {
    title,
    subtitle,
    classification: `Generado desde ${vaultName}`,
    organization: brand()?.name || '',
    version: '1.0',
  };
}

/* ---------- mdToHtml / inlineMd ---------- */

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inCodeBlock = false;
  let codeBuf = [];
  let inList = null;
  let listBuf = [];
  let inBlockquote = false;
  let bqBuf = [];

  function flushList() {
    if (listBuf.length === 0) return;
    const tag = inList === 'ul' ? 'ul' : 'ol';
    out.push(`<${tag}>`);
    for (const item of listBuf) {
      if (item.startsWith('\x00CB ')) {
        out.push(`<li class="checkbox-item"><input type="checkbox" disabled> ${inlineMd(item.slice(4))}</li>`);
      } else if (item.startsWith('\x00CBX ')) {
        out.push(`<li class="checkbox-item"><input type="checkbox" disabled checked> ${inlineMd(item.slice(5))}</li>`);
      } else if (item.startsWith('<')) {
        out.push(`<li>${item}</li>`);
      } else {
        out.push(`<li>${inlineMd(item)}</li>`);
      }
    }
    out.push(`</${tag}>`);
    listBuf = [];
    inList = null;
  }

  function flushBlockquote() {
    if (bqBuf.length === 0) return;
    out.push(`<blockquote><p>${inlineMd(bqBuf.join('\n'))}</p></blockquote>`);
    bqBuf = [];
    inBlockquote = false;
  }

  function renderTable(rows) {
    const sep = rows[1] && /^[\s|:-]+$/.test(rows[1]) ? rows.splice(1, 1)[0] : null;
    let html = '<table>';
    if (rows.length > 0) {
      const headers = rows[0].split('|').filter(c => c.trim());
      html += '<thead><tr>';
      for (const h of headers) html += `<th>${inlineMd(h.trim())}</th>`;
      html += '</tr></thead>';
      rows = rows.slice(1);
    }
    if (rows.length > 0) {
      html += '<tbody>';
      for (const row of rows) {
        const cells = row.split('|').filter(c => c.trim());
        html += '<tr>';
        for (const c of cells) html += `<td>${inlineMd(c.trim())}</td>`;
        html += '</tr>';
      }
      html += '</tbody>';
    }
    html += '</table>';
    return html;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const code = escHtml(codeBuf.join('\n'));
        out.push(`<pre><code>${code}</code></pre>`);
        codeBuf = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushBlockquote();
        inCodeBlock = true;
        codeBuf = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuf.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (trimmed === '') {
      flushList();
      if (inBlockquote) { flushBlockquote(); }
      continue;
    }

    if (trimmed.startsWith('---')) {
      flushList();
      flushBlockquote();
      out.push('<hr />');
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      bqBuf.push(trimmed.slice(2));
      inBlockquote = true;
      continue;
    }

    if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      flushBlockquote();
      if (inList !== 'ul') { flushList(); inList = 'ul'; }
      listBuf.push(`\x00CBX ${trimmed.slice(6)}`);
      continue;
    }

    if (trimmed.startsWith('- [ ] ')) {
      flushBlockquote();
      if (inList !== 'ul') { flushList(); inList = 'ul'; }
      listBuf.push(`\x00CB ${trimmed.slice(6)}`);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushBlockquote();
      if (inList !== 'ul') { flushList(); inList = 'ul'; }
      listBuf.push(trimmed.slice(2));
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      flushBlockquote();
      if (inList !== 'ol') { flushList(); inList = 'ol'; }
      listBuf.push(trimmed.replace(/^\d+[.)]\s/, ''));
      continue;
    }

    if (trimmed.startsWith('|')) {
      flushList();
      flushBlockquote();
      const tableRows = [trimmed];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        tableRows.push(lines[++i].trim());
      }
      out.push(renderTable(tableRows));
      continue;
    }

    flushList();
    flushBlockquote();

    if (trimmed.startsWith('#### ')) {
      out.push(`<h4>${inlineMd(trimmed.slice(5))}</h4>`);
    } else if (trimmed.startsWith('### ')) {
      out.push(`<h3>${inlineMd(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      out.push(`<h2>${inlineMd(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      out.push(`<h1>${inlineMd(trimmed.slice(2))}</h1>`);
    } else {
      out.push(`<p>${inlineMd(trimmed)}</p>`);
    }
  }

  flushList();
  flushBlockquote();
  if (inCodeBlock) {
    const code = escHtml(codeBuf.join('\n'));
    out.push(`<pre><code>${code}</code></pre>`);
  }

  return out.join('\n');
}

function inlineMd(text) {
  let s = escHtml(text);

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  s = s.replace(/(^|\s)__([^_]+)__(\s|$)/g, '$1<strong>$2</strong>$3');

  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');

  s = s.replace(/\[\[([^\]]+)\]\]/g, (m, t) => {
    const parts = t.split('|');
    const label = parts.length > 1 ? parts[1] : parts[0];
    const slug = label.replace(/^(\d+[-])/, '').replace(/-/g, ' ');
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  });

  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');

  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  s = s.replace(/✅/g, '').replace(/📋/g, '').replace(/🔧/g, '').replace(/→/g, '→');

  return s;
}

/* ---------- HTML assembly ---------- */

function pageHeader(meta) {
  const logo = logoHref('blue');
  const logoHtml = logo ? `<div class="header-logo"><img src="${logo}" alt="Logo" /></div>` : '';
  return `<div class="page-header">${logoHtml}<div class="header-classification">${escHtml(meta.classification || '')}</div></div>`;
}

function pageFooter(meta) {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="page-footer"><div class="footer-org">${escHtml(meta.organization || '')}</div><div class="footer-page">1</div><div class="footer-date">${date}</div></div>`;
}

function buildCoverHtml(meta, brandData) {
  const logo = logoHref('blue');
  const org = meta.organization || brandData?.name || '';
  const classification = meta.classification || '';

  return `<section class="page cover-page">
  <div class="page-body">
    ${logo ? `<div class="cover-logo"><img src="${logo}" alt="Logo" /></div>` : ''}
    <h1>${escHtml(meta.title)}</h1>
    <div class="cover-subtitle">${escHtml(meta.subtitle || '')}</div>
    <table class="cover-meta">
      ${org ? `<tr><td>Organización</td><td>${escHtml(org)}</td></tr>` : ''}
      ${classification ? `<tr><td>Clasificación</td><td>${escHtml(classification)}</td></tr>` : ''}
      <tr><td>Fecha</td><td>${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
      <tr><td>Versión</td><td>${escHtml(meta.version || '1.0')}</td></tr>
    </table>
  </div>
</section>`;
}

function buildContentHtml(title, contentHtml) {
  return `<section class="page">
  <div class="page-body body-text">
    <div class="section-block">
      <div class="section-bar"></div>
      <h2>${escHtml(title)}</h2>
    </div>
    ${contentHtml}
  </div>
</section>`;
}

function assembleHtml(coverHtml, contentHtmls) {
  const css = brandCss('report');
  const cssPath = join(REPO_ROOT, 'assets/templates/report.css');
  const reportCss = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8">
<style>
${css}
${reportCss}
.body-text pre {
  background: var(--bg-soft, #f4f5fa);
  border: 1px solid var(--line, #d9dee8);
  border-radius: 6px;
  padding: 12px 16px;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 8.5pt;
  line-height: 1.5;
  overflow-x: auto;
  margin: 10px 0;
}
.body-text p code {
  background: var(--bg-soft, #f4f5fa);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 8.5pt;
}
.body-text ul, .body-text ol {
  margin: 6px 0 10px 22px;
}
.body-text li {
  margin-bottom: 3px;
  font-size: 9.5pt;
  line-height: 1.5;
}
.body-text blockquote {
  border-left: 3px solid var(--accent, #3730a3);
  padding: 6px 14px;
  margin: 10px 0;
  background: var(--bg-soft, #f4f5fa);
  border-radius: 0 6px 6px 0;
}
.body-text blockquote p {
  margin-bottom: 0;
}
.body-text hr {
  border: none;
  border-top: 1px solid var(--line, #d9dee8);
  margin: 16px 0;
}
.body-text h3 {
  font-size: 13pt;
  margin-top: 14px;
  margin-bottom: 6px;
  color: var(--ink, #23264f);
}
.body-text h4 {
  font-size: 11pt;
  margin-top: 12px;
  margin-bottom: 4px;
  color: var(--ink, #23264f);
}
.body-text strong {
  font-weight: 700;
  color: var(--ink, #23264f);
}
.body-text em {
  font-style: italic;
}
.body-text table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 9pt;
}
.body-text th, .body-text td {
  border: 0.5px solid var(--line, #d9dee8);
  padding: 6px 10px;
  text-align: left;
}
.body-text th {
  background: var(--bg-soft, #f4f5fa);
  font-weight: 700;
  color: var(--ink, #23264f);
}
.body-text input[type="checkbox"] {
  margin-right: 6px;
  transform: scale(0.9);
}
.body-text li.checkbox-item {
  list-style: none;
  padding-left: 0;
}
</style>
</head>
<body>
${coverHtml}
${contentHtmls.join('\n')}
</body></html>`;
}

/* ---------- colección y exportación ---------- */

function collectByScope(vaultPath, vaultType, excludeOpts, scope, moduleName, lessonNum) {
  let files = vaultFiles(vaultPath, excludeOpts.dirs, excludeOpts.files);
  let entries = files.map(f => parseByType(f, vaultPath, vaultType));

  entries.sort((a, b) => a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0);

  const modLower = moduleName.toLowerCase();
  if (scope === 'lesson') {
    entries = entries.filter(e =>
      (e.groupKey.toLowerCase().includes(modLower) || e.rel.toLowerCase().includes(modLower)) &&
      (lessonNum ? e.name.startsWith(lessonNum) : true)
    );
  } else if (scope === 'section') {
    entries = entries.filter(e =>
      slugify(e.groupKey) === slugify(moduleName) ||
      e.groupKey.toLowerCase().includes(modLower) ||
      e.rel.toLowerCase().includes(modLower)
    );
  } else if (scope === 'module') {
    entries = entries.filter(e =>
      e.groupKey.toLowerCase().includes(modLower) ||
      e.rel.toLowerCase().includes(modLower)
    );
  }

  const groups = {};
  for (const e of entries) {
    if (!groups[e.groupKey]) groups[e.groupKey] = [];
    groups[e.groupKey].push(e);
  }
  return groups;
}

/* ---------- main ---------- */

async function main() {
  const flags = parseArgs();

  if (flags.help || flags.h) {
    console.log(`
Usage: node shared/scripts/docgen-vault.js [options]

Export an Obsidian vault to a branded PDF.

Options:
  --vault <path>             Path to vault (default: curso-ia/)
  --scope <all|module|section|lesson>
                             Scope of export (default: auto)
  --module <name>            Module/section name (for module/section/lesson scope)
  --lesson <num>             Lesson/page number (for lesson scope)
  --mode <merged|separate>   Output mode (default: merged)
  --structure <auto|curso|topics|flat|arbitrary>
                             Vault structure type (default: auto-detect)
  --exclude-dir <name>       Extra directory to exclude (multi-value)
  --exclude-file <name>      Extra file to exclude (multi-value)
  --output <dir>             Base output directory (default: generated)
  --help                     Show this help

Structure types:
  curso      Module/lesson format (e.g. "Módulo 1/01-Leccion.md")
  topics     Numbered sections  (e.g. "01-Tema/01-Pagina.md")
  flat       All .md files in root directory
  arbitrary  Any other folder hierarchy
`);
    process.exit(0);
  }

  const vaultPath = resolve(flags.vault || 'curso-ia');
  const baseOutput = flags.output || 'generated';
  const mode = flags.mode || 'merged';
  const moduleName = flags.module || '';
  const lessonNum = flags.lesson || '';

  if (!existsSync(vaultPath)) {
    console.error(`Error: Vault path not found: ${vaultPath}`);
    process.exit(1);
  }

  const vaultType = flags.structure === 'auto' || !flags.structure
    ? detectVaultType(vaultPath)
    : flags.structure;

  if (!['curso', 'topics', 'flat', 'arbitrary'].includes(vaultType)) {
    console.error(`Error: Unknown structure type "${vaultType}". Use: auto, curso, topics, flat, arbitrary`);
    process.exit(1);
  }

  let scope = flags.scope;
  if (!scope) {
    scope = vaultType === 'flat' ? 'all' : (moduleName ? 'module' : 'module');
  }

  if ((scope === 'lesson' || scope === 'section' || scope === 'module') && !moduleName) {
    console.error(`Error: --module is required for ${scope} scope`);
    process.exit(1);
  }

  if (existsSync(BRAND_PATH)) {
    loadBrand(BRAND_PATH);
  }

  const extraDirs = flags['exclude-dir'];
  const extraFiles = flags['exclude-file'];
  const excludeOpts = makeExcludes(vaultType, extraDirs, extraFiles);

  const vaultName = basename(vaultPath);
  const ts = timestamp();
  const outDir = join(baseOutput, `${vaultName}-${ts}`);
  mkdirSync(outDir, { recursive: true });

  const groups = collectByScope(vaultPath, vaultType, excludeOpts, scope, moduleName, lessonNum);

  if (Object.keys(groups).length === 0) {
    console.error('Error: No markdown files found matching the criteria');
    process.exit(1);
  }

  const brandData = brand();
  const totalItems = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
  const typeLabel = vaultType === 'curso' ? 'lesson(s)' : 'page(s)';
  const groupLabel = vaultType === 'curso' ? 'module(s)' : 'section(s)';
  console.log(`[${vaultType}] Found ${totalItems} ${typeLabel} in ${Object.keys(groups).length} ${groupLabel}`);
  console.log(`Output: ${outDir}\n`);

  /* ---------- build cover and content ---------- */

  const vaultTitle = readVaultTitle(vaultPath);

  function buildCoverSubtitle() {
    if (scope === 'all') return vaultName;
    if (scope === 'module' || scope === 'section') {
      const key = Object.keys(groups).length === 1 ? Object.keys(groups)[0] : moduleName;
      return vaultType === 'curso' ? key : key;
    }
    const first = Object.values(groups)[0]?.[0];
    if (!first) return moduleName;
    return first.subtitle || moduleName;
  }

  const coverMeta = buildMeta(vaultTitle, buildCoverSubtitle(), vaultName);
  const coverHtml = buildCoverHtml(coverMeta, brandData);

  if (mode === 'separate') {
    for (const [groupName, items] of Object.entries(groups)) {
      for (const item of items) {
        const md = readFileSync(item.path, 'utf8');
        const htmlContent = mdToHtml(md);
        const meta = buildMeta(vaultTitle, item.subtitle, vaultName);
        const pageCoverHtml = buildCoverHtml(meta, brandData);
        const contentHtml = buildContentHtml(item.title, htmlContent);
        const fullHtml = assembleHtml(pageCoverHtml, [contentHtml]);

        const filename = `${item.name}.pdf`;
        const pdfPath = join(outDir, filename);
        await htmlToPdf(fullHtml, pdfPath);
        console.log(`  ✔ ${filename}`);
      }
    }
  } else {
    const contentHtmls = [];

    for (const [groupName, items] of Object.entries(groups)) {
      for (const item of items) {
        const md = readFileSync(item.path, 'utf8');
        const htmlContent = mdToHtml(md);
        contentHtmls.push(buildContentHtml(item.title, htmlContent));
      }
    }

    const fullHtml = assembleHtml(coverHtml, contentHtmls);

    let filename;
    if (scope === 'all') {
      filename = `${slugify(vaultName)}.pdf`;
    } else if (scope === 'module' || scope === 'section') {
      const nameForSlug = Object.keys(groups).length === 1 ? Object.keys(groups)[0] : moduleName;
      filename = `${slugify(nameForSlug)}.pdf`;
    } else {
      const first = Object.values(groups)[0]?.[0];
      const prefix = vaultType === 'curso' ? 'leccion' : 'pagina';
      filename = `${prefix}-${slugify(moduleName || first?.name || lessonNum)}.pdf`;
    }

    const pdfPath = join(outDir, filename);
    await htmlToPdf(fullHtml, pdfPath);
    console.log(`  ✔ ${filename}`);
  }

  console.log(`\nDone! PDFs generated in: ${outDir}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
