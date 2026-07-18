import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { brand, esc } from './index.js';
import { brandCss, imageDataUri } from './theme-utils.js';
import { logo, foot, head, bullets, tableV, card, panel, kpi, person, media } from './components.js';
import { renderChart } from './charts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const CSS_PATH = join(REPO_ROOT, 'assets', 'templates', 'deck.css');

/* ─── Helpers ─── */

let _currentMeta = null;

function resolveFooterText(s) {
  if (s?.footer) return s.footer;
  const b = brand();
  const org = (_currentMeta && _currentMeta.organization) || b.name;
  if (b.footer) return b.footer.replace(/\{\{organization\}\}/g, org);
  return 'Contenido confidencial';
}

function _css() {
  let css = '';
  if (existsSync(CSS_PATH)) css = readFileSync(CSS_PATH, 'utf8');
  return brandCss('deck') + '\n' + css;
}

/* ─── Slide wrapper ─── */

function _slide(inner, extraCls = '', page = null, footerCenter = false, withLogo = 'tr', logoVariant = 'blue', footerText = '') {
  const cls = 'slide' + (extraCls ? ` ${extraCls}` : '');
  let parts = [`<section class="${cls}">`];
  if (withLogo) parts.push(logo(withLogo, logoVariant));
  parts.push(inner);
  parts.push(foot(footerCenter, page, footerText));
  parts.push('</section>');
  return parts.join('');
}

/* ─── Layout functions ─── */

function _slide_portada(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = `<div class="cover body-area"><h1>${esc(s.titulo || '')}</h1>`;
  if (s.subtitulo) inner += `<div class="sub">${esc(s.subtitulo)}</div>`;
  inner += '<div class="accent-bar"></div></div>';
  return _slide(inner, 'cover', null, true, 'center', logoVariant, resolveFooterText(s));
}

function _slide_seccion(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = '<div class="section body-area">';
  if (s.indice) inner += `<div class="idx">${esc(s.indice)}</div>`;
  inner += `<h1>${esc(s.titulo || '')}</h1>`;
  if (s.subtitulo) inner += `<div class="sub">${esc(s.subtitulo)}</div>`;
  inner += '</div>';
  return _slide(inner, 'section', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_lamina(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += '<div class="body-area">';
  let inList = false;
  for (const b of (s.bloques || [])) {
    if (b.tipo === 'hdr') {
      if (inList) { inner += '</ul>'; inList = false; }
      inner += `<h3>${esc(b.texto)}</h3>`;
    } else if (b.tipo === 'txt') {
      if (inList) { inner += '</ul>'; inList = false; }
      inner += `<p>${esc(b.texto)}</p>`;
    } else if (b.tipo === 'li') {
      if (!inList) { inner += '<ul class="bullet-list">'; inList = true; }
      inner += `<li>${esc(b.texto)}</li>`;
    }
  }
  if (inList) inner += '</ul>';
  inner += '</div>';
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_bullets(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="body-area">${bullets(s.items || [], 'bullets')}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_dos_columnas(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const cols = s.columnas || [];
  const panelsHtml = cols.map(c => panel({ titulo: c.titulo || '', items: c.items || [], tag: c.tag || '' })).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="twocol">${panelsHtml}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_tarjetas(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const items = s.tarjetas || [];
  const cols = s.columnas_grid || Math.min(Math.max(items.length, 1), 4);
  const cardsHtml = items.map(c =>
    card({ titulo: c.titulo || '', items: c.items || [], subtitulo: c.subtitulo || '', icon: c.icon || '', image: c.image || null, iconImg: c.icon_img || null })
  ).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="grid cols-${cols}">${cardsHtml}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_kpis(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const items = s.kpis || [];
  const cols = s.columnas_grid || Math.min(Math.max(items.length, 1), 4);
  const body = items.map(k => kpi(k.valor || '', k.etiqueta || '')).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="kpis grid cols-${cols}">${body}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_personas(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const items = s.personas || [];
  const cols = s.columnas_grid || Math.min(Math.max(items.length, 1), 4);
  const body = items.map(p => person({ nombre: p.nombre || '', rol: p.rol || '', avatar: p.avatar || null, avatarImg: p.avatar_img || null })).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="people grid cols-${cols}">${body}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_cita(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = `<div class="quote body-area"><blockquote>${esc(s.texto || '')}</blockquote>`;
  if (s.autor) inner += `<div class="qby">${esc(s.autor)}</div>`;
  inner += '</div>';
  return _slide(inner, 'quote', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_imagen(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const src = s.src ? imageDataUri(s.src) : '';
  const bare = s.bare ? ' bare' : '';
  let inner = '';
  if (s.titulo) inner += head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="figure${bare}"><img src="${src || ''}" alt=""/></div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_tabla(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="body-area">${tableV(s.headers || [], s.filas || [])}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_lamina_completa(s, page) {
  const src = s.src;
  let innerImg;
  if (s.bleed && src && String(src).endsWith('.svg')) {
    const svgPath = resolve(REPO_ROOT, src);
    innerImg = existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : '';
    innerImg = `<div class="fullbleed-svg">${innerImg}</div>`;
  } else {
    const uri = src ? imageDataUri(src) : '';
    innerImg = `<img class="fullbleed-img" src="${uri || ''}" alt=""/>`;
  }
  let parts = [innerImg];
  if (s.overlay) parts.push('<div class="fullbleed-overlay"></div>');
  const titulo = s.titulo;
  if (titulo) {
    const pos = s.pos || 'bottom-left';
    let cap = [`<div class="fullbleed-caption pos-${esc(pos)}">`];
    if (s.eyebrow) cap.push(`<span class="eyebrow">${esc(s.eyebrow)}</span>`);
    cap.push(`<h1>${esc(titulo)}</h1>`);
    if (s.subtitulo) cap.push(`<div class="sub">${esc(s.subtitulo)}</div>`);
    cap.push('</div>');
    parts.push(cap.join(''));
  }
  const withLogo = s.logo !== false ? 'tr' : null;
  const showFooter = s.footer !== false;
  const logoVariant = s.logo_variant || (s.overlay ? 'white' : 'blue');
  const cls = 'slide fullbleed';
  let out = [`<section class="${cls}">`];
  out.push(parts.join(''));
  if (withLogo) out.push(logo(withLogo, logoVariant));
  if (showFooter) out.push(foot(false, page, resolveFooterText(s)));
  out.push('</section>');
  return out.join('');
}

function _slide_grafico(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const chart = s.chart || {};
  const svg = renderChart(chart.tipo || '', chart);
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="body-area chart-area">${svg}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_imagen_texto(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const img = media(s.src, 'it-media', s.fit || 'cover');
  let textParts = [head(s.titulo || '', s.subtitulo || '', s.eyebrow || '')];
  if (s.items) textParts.push(bullets(s.items));
  else if (s.texto) textParts.push(`<p class="it-text">${esc(s.texto)}</p>`);
  const order = s.imagen_derecha ? 'reverse' : '';
  const inner = `<div class="imgtext ${order}"><div class="it-text-col">${textParts.join('')}</div>${img}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_destacado(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  let inner = '<div class="destacado body-area">';
  if (s.eyebrow) inner += `<span class="eyebrow">${esc(s.eyebrow)}</span>`;
  inner += `<div class="hero-stat">${esc(s.valor || '')}</div>`;
  if (s.titulo) inner += `<h1>${esc(s.titulo)}</h1>`;
  if (s.subtitulo) inner += `<div class="sub">${esc(s.subtitulo)}</div>`;
  inner += '</div>';
  return _slide(inner, 'destacado-slide', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_comparativa(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const cols = s.columnas || [];
  const panelsHtml = cols.map(c => {
    let p = ['<div class="cmp-panel">'];
    const m = c.src ? media(c.src, 'cmp-media', 'cover') : '';
    if (m) p.push(m);
    p.push('<div class="cmp-body">');
    if (c.tag) p.push(`<span class="panel-tag">${esc(c.tag)}</span>`);
    p.push(`<h3>${esc(c.titulo || '')}</h3>`);
    if (c.items) p.push('<ul>' + c.items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>');
    p.push('</div></div>');
    return p.join('');
  }).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="comparativa">${panelsHtml}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_timeline(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const hitos = (s.hitos || []).map(h => [h.fecha || '', h.titulo || '']);
  const svg = renderChart('timeline', { hitos });
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="body-area chart-area">${svg}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_n_columnas(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const cols = s.columnas || [];
  let n = s.numero_columnas || 3;
  n = Math.max(2, Math.min(6, n));
  const panelsHtml = cols.map(c => panel({ titulo: c.titulo || '', items: c.items || [], tag: c.tag || '' })).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="ncol cols-${n}">${panelsHtml}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_proceso(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const pasos = s.pasos || [];
  const many = pasos.length > 4 ? ' proceso--many' : '';
  let items = pasos.map((p, i) =>
    `<div class="paso">` +
    `<div class="paso-num">${i + 1}</div>` +
    `<div class="paso-body">` +
    `<h3>${esc(p.titulo || '')}</h3>` +
    `<p>${esc(p.descripcion || '')}</p>` +
    `</div></div>`
  ).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="proceso${many}">${items}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_masonry(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const imagenes = s.imagenes || [];
  let n = s.columnas || 3;
  n = Math.max(2, Math.min(6, n));
  const items = imagenes.filter(Boolean).map(img => {
    const caption = img.caption || '';
    const alt = esc(img.alt || '');
    const src = img.src ? imageDataUri(img.src) : '';
    if (!src) return null;
    let item = '<div class="mas-item">';
    item += `<img src="${src}" alt="${alt}"/>`;
    if (caption) item += `<div class="mas-caption">${esc(caption)}</div>`;
    item += '</div>';
    return item;
  }).filter(Boolean).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="masonry cols-${n}">${items}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

function _slide_faq(s, page) {
  const logoVariant = s.logo_variant || 'blue';
  const items = s.items || [];
  const details = items.map(item => {
    const pregunta = esc(item.pregunta || '');
    const respuesta = esc(item.respuesta || '');
    return `<details><summary>${pregunta}</summary><div class="faq-r">${respuesta}</div></details>`;
  }).join('');
  let inner = head(s.titulo || '', s.subtitulo || '', s.eyebrow || '');
  inner += `<div class="faq">${details}</div>`;
  return _slide(inner, '', page, false, 'tr', logoVariant, resolveFooterText(s));
}

/* ─── Layout registry ─── */

const _LAYOUTS = {
  portada: _slide_portada,
  lamina: _slide_lamina,
  seccion: _slide_seccion,
  bullets: _slide_bullets,
  'dos-columnas': _slide_dos_columnas,
  tarjetas: _slide_tarjetas,
  kpis: _slide_kpis,
  personas: _slide_personas,
  cita: _slide_cita,
  imagen: _slide_imagen,
  tabla: _slide_tabla,
  'lamina-completa': _slide_lamina_completa,
  grafico: _slide_grafico,
  'imagen-texto': _slide_imagen_texto,
  destacado: _slide_destacado,
  comparativa: _slide_comparativa,
  timeline: _slide_timeline,
  'n-columnas': _slide_n_columnas,
  proceso: _slide_proceso,
  workflow: _slide_proceso,
  masonry: _slide_masonry,
  faq: _slide_faq,
};

/* ─── Public API ─── */

export function slideToHtml(slide, page = null) {
  const kind = slide.type || 'bullets';
  const layout = _LAYOUTS[kind];
  if (!layout) throw new Error(`Unsupported slide type: ${kind}`);
  return layout(slide, page);
}

export function buildHtml(slides, mostrarPaginas = false, meta = null) {
  _currentMeta = meta;
  const sections = [];
  const total = slides.length;
  for (let i = 0; i < total; i++) {
    const page = mostrarPaginas ? `${i + 1} / ${total}` : null;
    sections.push(slideToHtml(slides[i], page));
  }
  return (
    '<!DOCTYPE html>\n' +
    '<html lang="es"><head><meta charset="utf-8">\n' +
    `<style>\n${_css()}\n</style>\n</head><body>\n` +
    sections.join('\n') +
    '\n</body></html>\n'
  );
}
