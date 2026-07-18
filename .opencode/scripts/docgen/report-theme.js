import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { brand, esc } from './index.js';
import { brandCss, logoHref } from './theme-utils.js';
import { foot, sectionBlock, bullets, tableV, callout, recommendation, roadmap, kpiTable, closing } from './components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const CSS_PATH = join(REPO_ROOT, 'assets', 'templates', 'report.css');

/* ─── Helpers ─── */

function _css() {
  let css = '';
  if (existsSync(CSS_PATH)) css = readFileSync(CSS_PATH, 'utf8');
  return brandCss('report') + '\n' + css;
}

function _pageHeader(meta) {
  const classification = esc(meta.classification || brand().classification || '');
  const logo = logoHref('blue');
  return (
    '<div class="page-header">' +
    `<span class="header-classification">${classification}</span>` +
    `<span class="header-logo"><img src="${logo}" alt="Logo"/></span>` +
    '</div>\n'
  );
}

function _pageFooter(meta) {
  const b = brand();
  const template = b.footer || 'Contenido confidencial de {{organization}}';
  const org = esc(meta.organization || b.name);
  const text = esc(template.replace('{{organization}}', org));
  return (
    '<div class="page-footer">' +
    `<span class="footer-org">${text}</span>` +
    '</div>\n'
  );
}

/* ─── Renderers ─── */

function _renderCover(s, meta) {
  const b = brand();
  const logo = logoHref('blue');
  const title = esc(s.titulo || meta.title || '');
  const subtitle = esc(s.subtitulo || meta.subtitle || '');
  const desc = meta.description ? `<div class="cover-description">${esc(meta.description)}</div>\n` : '';
  const org = esc(meta.organization || b.name);
  const prepared = esc(meta.prepared_by || '');
  const date = esc(meta.date || '');
  const classification = esc(meta.classification || b.classification || 'Interno');
  const rows = [
    ['Organizaci\u00f3n', org],
    ['Preparado por', prepared],
    ['Fecha', date],
    ['Clasificaci\u00f3n', classification],
  ];
  if (Array.isArray(meta.custom_fields)) {
    for (const cf of meta.custom_fields) {
      rows.push([esc(cf.label || ''), esc(cf.value || '')]);
    }
  }
  const rowHtml = rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>\n`).join('');
  return (
    '<section class="page cover-page">\n' +
    '<div class="page-body">\n' +
    `<div class="cover-logo"><img src="${logo}" alt="Logo"/></div>\n` +
    `<h1>${title}</h1>\n` +
    (subtitle ? `<div class="cover-subtitle">${subtitle}</div>\n` : '') +
    desc +
    `<table class="cover-meta">${rowHtml}</table>\n` +
    '</div>\n' +
    '</section>\n'
  );
}

function _renderSection(s) {
  return sectionBlock(s.titulo || '', s.subtitulo || '');
}

function _renderText(s) {
  let paras = s.parrafos || s.items || [];
  if (typeof paras === 'string') paras = [paras];
  let parts = ['<div class="body-text">'];
  for (const p of paras) parts.push(`<p>${esc(p)}</p>`);
  parts.push('</div>');
  return parts.join('');
}

function _renderCallout(s) {
  return callout(s.headline || s.titulo || '', s.parrafos || s.texto || []);
}

function _renderTable(s) {
  return tableV(s.headers || [], s.filas || [], 'data-table');
}

function _renderBullets(s) {
  return bullets(s.items || [], 'bullet-list');
}

function _renderRecommendation(s) {
  return recommendation({
    titulo: s.titulo,
    problema: s.problema || s.problem,
    recomendacion: s.recomendacion || s.recommendation,
    acciones: s.acciones || s.actions,
  });
}

function _renderRoadmap(s) {
  return roadmap(s.headers || ['Periodo', 'Foco', 'Entregables'], s.fases || s.phases || []);
}

function _renderKpiTable(s) {
  return kpiTable(s.headers || ['Dominio', 'Indicador', 'Meta'], s.kpis || s.items || []);
}

function _renderClosing(s) {
  return closing(s.parrafos || s.items || []);
}

/* ─── API Spec renderers ─── */

function _methodBadge(method) {
  const m = (method || 'GET').toUpperCase();
  return `<span class="method-badge method-badge--${m}">${esc(m)}</span>`;
}

function _statusBadge(status) {
  const s = Number(status) || 200;
  const cat = s >= 500 ? '5xx' : s >= 400 ? '4xx' : '2xx';
  return `<span class="status-badge status-badge--${cat}">${s}</span>`;
}

function _locBadge(loc) {
  if (!loc) return '';
  return `<span class="loc-badge loc-badge--${esc(loc)}">${esc(loc)}</span>`;
}

function _reqBadge(required) {
  return required
    ? '<span class="req-badge req-badge--yes">Sí</span>'
    : '<span class="req-badge req-badge--no">No</span>';
}

function _renderChangeLog(s) {
  const headers = s.headers || ['Versión', 'Fecha', 'Cambio'];
  const entries = s.entries || [];
  if (!entries.length) return '<div class="body-text"><p>Sin cambios registrados.</p></div>';
  const th = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = entries.map(e =>
    '<tr>' +
    `<td>${esc(e.version || '')}</td>` +
    `<td>${esc(e.date || e.fecha || '')}</td>` +
    `<td>${esc(e.change || e.cambio || '')}</td>` +
    '</tr>'
  ).join('');
  return `<table class="change-log"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
}

function _renderConventionsTable(s) {
  const title = s.title || s.titulo || '';
  const headers = s.headers || [];
  const rows = s.rows || [];
  const titleHtml = title ? `<div class="conventions-title">${esc(title)}</div>` : '';
  const th = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = rows.map(r =>
    '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>'
  ).join('');
  return titleHtml + `<table class="conventions-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
}

function _renderEndpointSummary(s) {
  const headers = s.headers || ['Método', 'Ruta', 'Propósito', 'Scope'];
  const endpoints = s.endpoints || [];
  const th = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = endpoints.map(e =>
    '<tr>' +
    `<td>${_methodBadge(e.method || 'GET')}</td>` +
    `<td>${esc(e.path || '')}</td>` +
    `<td>${esc(e.purpose || e.proposito || '')}</td>` +
    `<td>${esc(e.scope || '')}</td>` +
    '</tr>'
  ).join('');
  return `<table class="endpoint-summary"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
}

function _renderEndpointDetail(s) {
  const method = s.method || 'GET';
  const path = s.path || '/';
  const desc = s.description || s.descripcion || '';
  const params = s.parameters || [];
  const requestBody = s.requestBody || null;
  const responses = s.responses || [];

  let html = '<div class="endpoint-detail">';
  html += `<div class="endpoint-header">${_methodBadge(method)}<span class="endpoint-path">${esc(path)}</span></div>`;
  if (desc) html += `<div class="endpoint-desc">${esc(desc)}</div>`;

  if (params.length) {
    html += '<h4>Parámetros</h4>';
    html += '<table class="param-table"><thead><tr>' +
      '<th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Obligatorio</th><th>Descripción</th>' +
      '</tr></thead><tbody>';
    for (const p of params) {
      html += '<tr>' +
        `<td>${esc(p.name || '')}</td>` +
        `<td>${esc(p.type || 'string')}</td>` +
        `<td>${_locBadge(p.location || '')}</td>` +
        `<td>${_reqBadge(p.required)}</td>` +
        `<td>${esc(p.description || '')}</td>` +
        '</tr>';
    }
    html += '</tbody></table>';
  }

  if (requestBody) {
    html += '<h4>Cuerpo de solicitud</h4>';
    const contentType = requestBody.contentType || 'application/json';
    const fields = requestBody.fields || [];
    if (fields.length) {
      html += `<div style="font-size:8pt;color:var(--muted);margin-bottom:3px">${esc(contentType)}</div>`;
      html += '<table class="param-table"><thead><tr>' +
        '<th>Nombre</th><th>Tipo</th><th>Obligatorio</th><th>Descripción</th>' +
        '</tr></thead><tbody>';
      for (const f of fields) {
        html += '<tr>' +
          `<td>${esc(f.name || '')}</td>` +
          `<td>${esc(f.type || 'string')}</td>` +
          `<td>${_reqBadge(f.required)}</td>` +
          `<td>${esc(f.description || '')}</td>` +
          '</tr>';
      }
      html += '</tbody></table>';
    }
  }

  if (responses.length) {
    html += '<h4>Respuestas</h4>';
    html += '<div class="response-list">';
    for (const r of responses) {
      html += '<div class="response-item">';
      html += _statusBadge(r.status);
      html += `<span class="response-detail"><strong>${esc(r.description || '')}</strong>`;
      if (r.details) html += ` — ${esc(r.details)}`;
      html += '</span></div>';
    }
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function _renderCodeBlock(s) {
  const code = s.code || s.content || '';
  const language = s.language || '';
  const title = s.title || '';
  const titleHtml = title ? `<div style="font-size:8pt;font-weight:700;color:var(--muted);margin-bottom:4px">${esc(title)}</div>` : '';
  return titleHtml + `<pre class="code-block"><code>${esc(code)}</code></pre>\n`;
}

function _renderHttpCodes(s) {
  const codes = s.codes || [];
  if (!codes.length) return '';
  const headers = s.headers || ['Código', 'Nombre', 'Descripción'];
  const th = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = codes.map(c =>
    '<tr>' +
    `<td>${c.code || ''}</td>` +
    `<td>${esc(c.name || '')}</td>` +
    `<td>${esc(c.description || '')}</td>` +
    '</tr>'
  ).join('');
  return `<table class="http-codes"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
}

/* ─── Renderer registry ─── */

const _RENDERERS = {
  section: _renderSection,
  text: _renderText,
  callout: _renderCallout,
  table: _renderTable,
  bullets: _renderBullets,
  recommendation: _renderRecommendation,
  roadmap: _renderRoadmap,
  'kpi-table': _renderKpiTable,
  closing: _renderClosing,
  'change-log': _renderChangeLog,
  'conventions-table': _renderConventionsTable,
  'endpoint-summary': _renderEndpointSummary,
  'endpoint-detail': _renderEndpointDetail,
  'code-block': _renderCodeBlock,
  'http-codes': _renderHttpCodes,
};

const _NEW_PAGE = new Set(['section', 'doc-cover']);

/* ─── Public API ─── */

export function buildHtml(meta, slides) {
  const pageList = [];
  let pageBody = [];

  function flushPage() {
    if (pageBody.length) {
      const h = _pageHeader(meta);
      const f = _pageFooter(meta);
      pageList.push(
        `<section class="page">\n${h}<div class="page-body">\n${pageBody.join('')}\n</div>\n${f}</section>\n`
      );
      pageBody = [];
      return true;
    }
    return false;
  }

  for (const s of slides) {
    const kind = s.type || 'text';

    if (kind === 'doc-cover') {
      flushPage();
      pageList.push(_renderCover(s, meta));
    } else if (kind === 'page-break') {
      flushPage();
    } else if (_NEW_PAGE.has(kind)) {
      flushPage();
      pageBody.push(_renderSection(s));
    } else {
      const renderer = _RENDERERS[kind];
      if (renderer) pageBody.push(renderer(s));
    }
  }

  flushPage();

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="es"><head><meta charset="utf-8">\n' +
    `<style>\n${_css()}\n</style>\n</head><body>\n` +
    pageList.join('\n') +
    '\n</body></html>\n'
  );
}
