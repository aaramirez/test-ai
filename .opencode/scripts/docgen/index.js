#!/usr/bin/env node
/**
 * docgen/index.js — Document generation core library
 *
 * Cross-platform: macOS, Linux, Windows.
 * Zero npm dependencies (subprocess tools optional).
 *
 * Ported from gda-ai (repos/GrupoConex/gda-ai/shared/scripts/deck_lib.py).
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';
import { homedir, platform as osPlatform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

/* ─── Brand loading ─── */

let _brand = null;

export function loadBrand(brandPath) {
  if (brandPath) {
    _brand = JSON.parse(readFileSync(brandPath, 'utf8')).brand;
  } else {
    const paths = [
      join(REPO_ROOT, 'shared', 'brand.json'),
      join(process.cwd(), 'shared', 'brand.json'),
    ];
    for (const p of paths) {
      if (existsSync(p)) {
        _brand = JSON.parse(readFileSync(p, 'utf8')).brand;
        return;
      }
    }
    _brand = {
      name: 'Project',
      colors: { primary: '#1a365d', secondary: '#2b6cb0', accent: '#e53e3e', text: '#1a202c', background: '#ffffff', 'light-bg': '#f7fafc' },
      logo: null, logo_white: null,
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
    };
  }
}

export function brand() {
  if (!_brand) loadBrand();
  return _brand;
}

/* ─── Constants ─── */

export const WIDTH = 1600;
export const HEIGHT = 900;
export const PAGE_WIDTH = 1600;
export const PAGE_HEIGHT = 900;

/* ─── SVG helpers ─── */

export function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function svgOpen() {
  const b = brand();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${b.colors.background}"/>
      <stop offset="100%" stop-color="${b.colors['light-bg']}"/>
    </linearGradient>
    <linearGradient id="accent-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${b.colors.primary}"/>
      <stop offset="100%" stop-color="${b.colors.secondary}"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.12"/>
    </filter>
    <style>
      .title { font-family: ${b.fonts.heading}; font-size: 48px; font-weight: 700; fill: ${b.colors.primary}; }
      .subtitle { font-family: ${b.fonts.body}; font-size: 24px; fill: ${b.colors.secondary}; }
      .body { font-family: ${b.fonts.body}; font-size: 20px; fill: ${b.colors.text}; }
      .small { font-family: ${b.fonts.body}; font-size: 16px; fill: ${b.colors.text}; }
      .accent { font-family: ${b.fonts.body}; font-size: 20px; fill: ${b.colors.accent}; font-weight: 600; }
    </style>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg-grad)"/>`;
}

export function svgClose() {
  return `\n  <text x="${WIDTH - 40}" y="${HEIGHT - 20}" text-anchor="end" font-family="Inter, sans-serif" font-size="11" fill="#999">\u00A9 ${brand().name}</text>\n</svg>`;
}

/* ─── SVG helpers: logo positions ─── */

export function logoSvgCentered(href) {
  if (!href) return '';
  const logoPath = resolve(join(REPO_ROOT, href));
  if (!existsSync(logoPath)) return '';
  const data = readFileSync(logoPath).toString('base64');
  return `<image x="${WIDTH / 2 - 100}" y="200" width="200" height="60" href="data:image/svg+xml;base64,${data}" preserveAspectRatio="xMidYMid meet"/>`;
}

export function logoSvgTopRight(href) {
  if (!href) return '';
  const logoPath = resolve(join(REPO_ROOT, href));
  if (!existsSync(logoPath)) return '';
  const data = readFileSync(logoPath).toString('base64');
  return `<image x="${WIDTH - 180}" y="20" width="140" height="42" href="data:image/svg+xml;base64,${data}" preserveAspectRatio="xMidYMid meet"/>`;
}

/* ─── SVG slide builders ─── */

export function portada(titulo, subtitulo) {
  const b = brand();
  return `${svgOpen()}
  ${logoSvgCentered(b.logo)}
  <text x="${WIDTH / 2}" y="420" text-anchor="middle" class="title">${esc(titulo)}</text>
  ${subtitulo ? `\n  <text x="${WIDTH / 2}" y="470" text-anchor="middle" class="subtitle">${esc(subtitulo)}</text>` : ''}
  <rect x="${WIDTH / 2 - 60}" y="510" width="120" height="4" rx="2" fill="${b.colors.secondary}"/>
  <text x="${WIDTH / 2}" y="${HEIGHT - 60}" text-anchor="middle" class="small">${esc(b.name)}</text>
${svgClose()}`;
}

export function lamina(titulo, subtitulo, bloques) {
  const b = brand();
  const ls = [`${svgOpen()}`];

  // Logo top-right
  const logoHref = b.logo;
  if (logoHref) ls.push(`  ${logoSvgTopRight(logoHref)}`);

  // Header bar
  ls.push(`  <rect x="0" y="0" width="8" height="${HEIGHT}" fill="${b.colors.primary}" opacity="0.15"/>`);
  ls.push(`  <text x="50" y="80" class="title">${esc(titulo)}</text>`);
  if (subtitulo) ls.push(`  <text x="50" y="115" class="subtitle">${esc(subtitulo)}</text>`);
  ls.push(`  <rect x="50" y="130" width="80" height="4" rx="2" fill="${b.colors.secondary}"/>`);

  // Content blocks
  let y = 170;
  for (const block of (bloques || [])) {
    if (block.tipo === 'hdr') {
      ls.push(`  <text x="50" y="${y}" class="accent">${esc(block.texto)}</text>`);
      y += 40;
    } else if (block.tipo === 'txt') {
      ls.push(`  <text x="50" y="${y}" class="body">${esc(block.texto)}</text>`);
      y += 30;
    } else if (block.tipo === 'li') {
      ls.push(`  <circle cx="65" cy="${y - 5}" r="4" fill="${b.colors.secondary}"/>`);
      ls.push(`  <text x="85" y="${y}" class="body">${esc(block.texto)}</text>`);
      y += 30;
    }
  }

  ls.push(svgClose());
  return ls.join('\n');
}

function wrapText(text, maxLen) {
  const paragraphs = text.split(/\n\n+/);
  const lines = [];
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(''); continue; }
    const words = para.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (test.length > maxLen && line) { lines.push(line); line = word; }
      else { line = test; }
    }
    if (line) lines.push(line);
    lines.push('');
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export function profileCard(slide) {
  const b = brand();
  const W = WIDTH, H = HEIGHT, L = 340;

  let s = '<?xml version="1.0" encoding="UTF-8"?>\n';
  s += `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">\n`;

  s += `  <defs>
    <linearGradient id="profileBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6f8fc"/>
      <stop offset="1" stop-color="#eef1f8"/>
    </linearGradient>
    <linearGradient id="leftPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#23264f"/>
      <stop offset="1" stop-color="#2f3463"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-20%" width="120%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#23264f" flood-opacity="0.12"/>
    </filter>
    <style>
      .title    { fill:#23264f; font-weight:700; }
      .subtitle { fill:#5b6080; font-weight:400; }
      .body     { fill:#3a3f63; font-weight:400; }
      .hdr      { fill:#23264f; font-weight:700; }
      .footer   { fill:#5b6080; font-weight:400; }
      .name     { fill:#ffffff; font-weight:700; }
      .role     { fill:#aab0d6; font-weight:400; }
      .label    { fill:#7b82b3; font-weight:700; font-size:12px; letter-spacing:0.6px; }
      .value    { fill:#ffffff; font-weight:400; font-size:13px; }
      .sidehdr  { fill:#aab0d6; font-weight:700; font-size:13px; letter-spacing:1.4px; }
      .skill    { fill:#e7e9f5; font-weight:400; font-size:13px; }
      .date     { fill:#3b5bdb; font-weight:700; font-size:11px; letter-spacing:0.4px; }
    </style>
  </defs>\n`;
  s += `  <rect width="${W}" height="${H}" fill="#ffffff"/>\n`;
  s += `  <rect width="${W}" height="${H}" fill="url(#profileBg)"/>\n`;
  s += `  <rect x="0" y="0" width="${L}" height="${H}" fill="url(#leftPanel)"/>\n`;

  // Photo
  s += `  <circle cx="170" cy="170" r="102" fill="#ffffff" fill-opacity="0.15"/>\n`;
  s += `  <circle cx="170" cy="170" r="100" fill="#eef1f8"/>\n`;
  if (slide.foto) {
    const photoPath = resolve(join(REPO_ROOT, slide.foto));
    if (existsSync(photoPath)) {
      const raw = readFileSync(photoPath);
      const data = raw.toString('base64');
      const ext = slide.foto.toLowerCase().match(/\.(png|jpg|jpeg|svg)$/)?.[1] || 'jpeg';
      const mime = ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext;
      s += `  <clipPath id="photoClip"><circle cx="170" cy="170" r="100"/></clipPath>\n`;
      s += `  <image x="70" y="70" width="200" height="200" clip-path="url(#photoClip)" xlink:href="data:image/${mime};base64,${data}" preserveAspectRatio="xMidYMid slice"/>\n`;
    } else {
      s += `  <text x="170" y="178" text-anchor="middle" fill="#5b6080" font-size="48" font-weight="700">${esc((slide.nombre_linea1||'?')[0])}${esc((slide.nombre_linea2||'?')[0])}</text>\n`;
    }
  } else {
    s += `  <text x="170" y="178" text-anchor="middle" fill="#5b6080" font-size="48" font-weight="700">${esc((slide.nombre_linea1||'?')[0])}${esc((slide.nombre_linea2||'?')[0])}</text>\n`;
  }

  // Name & role (left panel)
  s += `  <text x="170" y="326" text-anchor="middle" font-size="25" class="name">${esc(slide.nombre_linea1||'')}<tspan x="170" dy="30">${esc(slide.nombre_linea2||'')}</tspan></text>\n`;
  s += `  <text x="170" y="394" text-anchor="middle" font-size="14" class="role">${esc(slide.cargo_linea1||'')}</text>\n`;
  s += `  <text x="170" y="413" text-anchor="middle" font-size="14" class="role">${esc(slide.cargo_linea2||'')}</text>\n`;
  s += `  <text x="170" y="434" text-anchor="middle" font-size="12" class="role" fill-opacity="0.7">${esc(slide.organizacion||'')}</text>\n`;
  s += `  <line x1="44" y1="457" x2="296" y2="457" stroke="#7b82b3" stroke-opacity="0.25" stroke-width="1"/>\n`;

  // Contact
  s += `  <text x="44" y="489" class="sidehdr">CONTACTO</text>\n`;
  const cItems = [
    { label: 'TELÉFONO', value: slide.telefono },
    { label: 'EMAIL', value: slide.email },
    { label: 'UBICACIÓN', value: slide.ubicacion },
  ];
  let yc = 515;
  for (const item of cItems) {
    if (item.value) {
      s += `  <text x="44" y="${yc}" class="label">${item.label}</text>\n`;
      s += `  <text x="44" y="${yc + 18}" class="value">${esc(item.value)}</text>\n`;
    }
    yc += 46;
  }
  s += `  <line x1="44" y1="651" x2="296" y2="651" stroke="#7b82b3" stroke-opacity="0.25" stroke-width="1"/>\n`;

  // Skills
  s += `  <text x="44" y="683" class="sidehdr">HABILIDADES CLAVE</text>\n`;
  const skills = slide.habilidades || [];
  let ys = 711;
  for (const sk of skills) {
    s += `  <circle cx="48" cy="${ys - 4}" r="2.6" fill="#aab0d6"/>\n`;
    s += `  <text x="60" y="${ys}" class="skill">${esc(sk)}</text>\n`;
    ys += 17;
  }

  // Logo (top-right on light panel → use dark logo)
  const logoSrc = b.logo ? resolve(join(REPO_ROOT, b.logo)) : null;
  if (logoSrc && existsSync(logoSrc)) {
    const raw = readFileSync(logoSrc);
    s += `  <image x="1346" y="42" width="220" height="86" xlink:href="data:image/svg+xml;base64,${raw.toString('base64')}" preserveAspectRatio="xMidYMid meet"/>\n`;
  }

  // Right panel — badge + header
  s += `  <rect x="380" y="70" width="192" height="28" rx="14" fill="#e7ecff"/>\n`;
  s += `  <text x="476" y="89" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="1.2" fill="#3b5bdb">MIEMBRO DEL EQUIPO</text>\n`;
  s += `  <text x="380" y="128" font-size="33" class="title">${esc(slide.nombre_completo || (slide.nombre_linea1 + ' ' + slide.nombre_linea2) || '')}</text>\n`;
  s += `  <text x="380" y="156" font-size="16" class="subtitle">${esc(slide.cargo_completo || (slide.cargo_linea1 + ' · ' + slide.cargo_linea2) || '')}</text>\n`;
  s += `  <line x1="380" y1="178" x2="1530" y2="178" stroke="#23264f" stroke-opacity="0.10" stroke-width="1.5"/>\n`;

  // Left column (x=380): SOBRE MÍ
  const lx = 380;
  s += `  <text x="${lx}" y="222" font-size="18" class="hdr">SOBRE MÍ</text>\n`;
  const smLines = wrapText(slide.sobre_mi || '', 80);
  let yt = 256;
  for (const line of smLines) {
    if (line) {
      s += `  <text x="${lx}" y="${yt}" font-size="14" class="body">${esc(line)}</text>\n`;
      yt += 28;
    } else {
      yt += 17;
    }
  }

  // Left column: EXPERIENCIA DESTACADA
  const yExp = yt + 12;
  s += `  <text x="${lx}" y="${yExp}" font-size="18" class="hdr">EXPERIENCIA DESTACADA</text>\n`;
  let cy = yExp + 18;
  for (const exp of (slide.experiencia_destacada || [])) {
    s += `  <rect x="${lx}" y="${cy}" width="510" height="148" rx="16" fill="#ffffff" stroke="#23264f" stroke-opacity="0.07" stroke-width="1" filter="url(#cardShadow)"/>\n`;
    s += `  <text x="${lx + 24}" y="${cy + 32}" class="date">${esc(exp.periodo || '')}</text>\n`;
    s += `  <text x="${lx + 24}" y="${cy + 55}" font-size="15" class="hdr">${esc(exp.empresa || '')}</text>\n`;
    s += `  <text x="${lx + 24}" y="${cy + 77}" font-size="13" class="subtitle">${esc(exp.rol || '')}</text>\n`;
    const descText = (exp.logros || []).join(' · ');
    const descLines = wrapText(descText, 58);
    let dy = cy + 99;
    for (let di = 0; di < Math.min(descLines.length, 2); di++) {
      s += `  <text x="${lx + 24}" y="${dy}" font-size="12" class="body">${esc(descLines[di])}</text>\n`;
      dy += 20;
    }
    cy += 164;
  }

  // Right column (x=940): EXPERIENCIA RECIENTE
  const rx = 940;
  s += `  <text x="${rx}" y="222" font-size="18" class="hdr">EXPERIENCIA RECIENTE</text>\n`;
  let ye = 240;
  for (const exp of (slide.experiencia_reciente || [])) {
    s += `  <rect x="${rx}" y="${ye}" width="590" height="106" rx="16" fill="#ffffff" stroke="#23264f" stroke-opacity="0.07" stroke-width="1" filter="url(#cardShadow)"/>\n`;
    s += `  <text x="${rx + 24}" y="${ye + 32}" class="date">${esc(exp.periodo || '')}</text>\n`;
    s += `  <text x="${rx + 24}" y="${ye + 55}" font-size="15" class="hdr">${esc(exp.empresa || '')}</text>\n`;
    s += `  <text x="${rx + 24}" y="${ye + 77}" font-size="13" class="subtitle">${esc(exp.rol || '')}</text>\n`;
    ye += 122;
  }

  // Right column: ESTUDIOS RECIENTES
  const yEst = ye + 22;
  s += `  <text x="${rx}" y="${yEst}" font-size="18" class="hdr">ESTUDIOS RECIENTES</text>\n`;
  ye = yEst + 18;
  for (const est of (slide.estudios || [])) {
    s += `  <rect x="${rx}" y="${ye}" width="590" height="106" rx="16" fill="#ffffff" stroke="#23264f" stroke-opacity="0.07" stroke-width="1" filter="url(#cardShadow)"/>\n`;
    s += `  <text x="${rx + 24}" y="${ye + 32}" class="date">${esc(String(est.year || ''))}</text>\n`;
    s += `  <text x="${rx + 24}" y="${ye + 55}" font-size="15" class="hdr">${esc(est.institucion || '')}</text>\n`;
    s += `  <text x="${rx + 24}" y="${ye + 77}" font-size="13" class="subtitle">${esc(est.titulo || '')}</text>\n`;
    ye += 122;
  }

  // Footer
  const org = slide.organizacion || b.name || '';
  const footerText = (b.footer || 'Contenido confidencial de {{organization}}').replace(/\{\{organization\}\}/g, org);
  s += `  <line x1="380" y1="838" x2="1530" y2="838" stroke="#23264f" stroke-opacity="0.08" stroke-width="1"/>\n`;
  s += `  <text x="955" y="868" text-anchor="middle" font-size="13" class="footer">${esc(footerText)}</text>\n`;

  s += `</svg>\n`;
  return s;
}

export function slideToSvg(slide) {
  if (slide.type === 'portada') return portada(slide.titulo, slide.subtitulo);
  if (slide.type === 'profile') return profileCard(slide);
  return lamina(slide.titulo || slide.title, slide.subtitulo || slide.subtitle, slide.bloques || slide.blocks || slide.bullets?.map(b => ({ tipo: 'li', texto: b })));
}

/* ─── Subprocess renderers ─── */

export function findBrowser() {
  const commonPaths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ],
    linux: ['google-chrome', 'chromium-browser', 'chromium', 'microsoft-edge'],
  };
  const paths = commonPaths[osPlatform()] || [];
  const envBrowser = process.env.DOCGEN_BROWSER;
  if (envBrowser && existsSync(envBrowser)) return envBrowser;
  for (const p of paths) {
    if (existsSync(p)) return p;
    try {
      execSync(`${p} --version 2>/dev/null`, { stdio: 'pipe' });
      return p;
    } catch { /* not found */ }
  }
  return null;
}

export function htmlToPdf(html, pdfPath, browserPath) {
  const browser = browserPath || findBrowser();
  if (!browser) throw new Error('No Chromium browser found. Install Chrome/Edge or set DOCGEN_BROWSER env var.');
  const htmlPath = join(dirname(pdfPath), `_temp_${Date.now()}.html`);
  writeFileSync(htmlPath, html, 'utf8');
  try {
    const result = spawnSync(browser, [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      '--no-pdf-header-footer',
      `--print-to-pdf=${resolve(pdfPath)}`, `file://${resolve(htmlPath)}`,
    ], { timeout: 120000, stdio: 'pipe' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Browser exited with code ${result.status}: ${result.stderr?.toString().slice(0, 200)}`);
  } finally {
    try { execSync(`rm "${htmlPath}"`); } catch { /* ok */ }
  }
}

export function renderSvgToPng(svgText, pngPath, scale = 1.25) {
  const dir = dirname(pngPath);
  mkdirSync(dir, { recursive: true });
  const svgPath = join(dir, `_svg_${Date.now()}.svg`);
  writeFileSync(svgPath, svgText, 'utf8');
  try {
    execSync(`rsvg-convert --width=${Math.round(WIDTH * scale)} "${svgPath}" -o "${pngPath}"`, { stdio: 'pipe' });
  } catch {
    execSync(`magick -background none -size ${Math.round(WIDTH * scale)}x${Math.round(HEIGHT * scale)} "${svgPath}" "${pngPath}"`, { stdio: 'pipe' });
  } finally {
    try { execSync(`rm -f "${svgPath}"`); } catch { /* ok */ }
  }
}

export function svgToPng(svgText, pngPath, scale = 1.25) {
  renderSvgToPng(svgText, pngPath, scale);
  return pngPath;
}

export function svgToPdf(svgText, pdfPath, scale = 1.25) {
  const tmpDir = join(dirname(pdfPath), `_tmp_${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  try {
    const pngPath = join(tmpDir, 'slide.png');
    renderSvgToPng(svgText, pngPath, scale);
    execSync(`magick "${pngPath}" "${pdfPath}"`, { stdio: 'pipe' });
  } finally {
    try { execSync(`rm -rf "${tmpDir}"`); } catch { /* ok */ }
  }
}

export function svgsToPdf(svgTexts, pdfPath, scale = 1.25) {
  const tmpDir = join(dirname(pdfPath), `_tmp_${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  try {
    const pngs = [];
    for (let i = 0; i < svgTexts.length; i++) {
      const pngPath = join(tmpDir, `slide_${String(i + 1).padStart(2, '0')}.png`);
      renderSvgToPng(svgTexts[i], pngPath, scale);
      pngs.push(pngPath);
    }
    execSync(`magick ${pngs.map(p => `"${p}"`).join(' ')} "${pdfPath}"`, { stdio: 'pipe' });
  } finally {
    try { execSync(`rm -rf "${tmpDir}"`); } catch { /* ok */ }
  }
}

/* ─── Content loaders ─── */

export function loadJson(source) {
  return JSON.parse(readFileSync(source, 'utf8'));
}

export async function loadJsModule(source) {
  const mod = await import(resolve(source));
  if (typeof mod.buildSlides === 'function') return { slides: await mod.buildSlides() };
  if (typeof mod.buildSvg === 'function') return { svg: await mod.buildSvg(), slides: [] };
  return mod;
}

export function loadMarkdown(source) {
  const content = readFileSync(source, 'utf8');
  const lines = content.split('\n');
  const slides = [];
  let current = null;

  for (const line of lines) {
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const bullet = line.match(/^[-*] (.+)/);
    const italic = line.match(/^\*(.+)\*$/);

    if (h1) {
      current = { type: 'portada', titulo: h1[1], bloques: [] };
      slides.push(current);
    } else if (h2) {
      current = { type: 'lamina', titulo: h2[1], bloques: [] };
      slides.push(current);
    } else if (h3 && current) {
      current.bloques.push({ tipo: 'hdr', texto: h3[1] });
    } else if (bullet && current) {
      current.bloques.push({ tipo: 'li', texto: bullet[1] });
    } else if (italic && current) {
      current.subtitulo = italic[1];
    } else if (line.trim() && current) {
      current.bloques.push({ tipo: 'txt', texto: line.trim() });
    }
  }
  return { slides };
}

export async function loadSource(source) {
  if (!existsSync(source)) throw new Error(`File not found: ${source}`);
  if (source.endsWith('.json')) return loadJson(source);
  if (source.endsWith('.js') || source.endsWith('.mjs')) return loadJsModule(source);
  if (source.endsWith('.md')) return loadMarkdown(source);
  if (source.endsWith('.yaml') || source.endsWith('.yml')) return loadJson(source);
  throw new Error(`Unsupported source format: ${source}. Use .json, .md, .js, or .yaml`);
}
