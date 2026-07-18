#!/usr/bin/env node
/**
 * docgen/components.js — Reusable HTML components for deck and report themes
 *
 * Pure functions: no mutable state, no side effects.
 * All HTML is properly escaped via esc().
 * Cross-platform: macOS, Linux, Windows.
 */

import { esc, imageDataUri, logoHref } from './theme-utils.js';

/* ─── Logo ─── */

export function logo(pos = 'tr', variant = 'blue') {
  const href = logoHref(variant);
  const cls = pos === 'tr' ? 'logo logo--tr' : 'logo logo--center';
  return `<div class="${cls}"><img src="${href}" alt="Logo"/></div>`;
}

/* ─── Footer ─── */

export function foot(center = false, page = null, footerText = '') {
  const cls = center ? 'footer footer--center' : 'footer';
  let parts = [`<div class="${cls}">${esc(footerText)}</div>`];
  if (page !== null && !center) {
    parts.push(`<div class="pageno">${esc(page)}</div>`);
  }
  return parts.join('');
}

/* ─── Head (deck header) ─── */

export function head(titulo = '', subtitulo = '', eyebrow = '') {
  let parts = ['<div class="head">'];
  if (eyebrow) parts.push(`<span class="eyebrow">${esc(eyebrow)}</span>`);
  parts.push(`<h1>${esc(titulo)}</h1>`);
  if (subtitulo) parts.push(`<div class="sub">${esc(subtitulo)}</div>`);
  parts.push('</div>');
  return parts.join('');
}

/* ─── Section Block (report section header) ─── */

export function sectionBlock(titulo = '', subtitulo = '') {
  let parts = ['<div class="section-block">'];
  parts.push('<div class="section-bar"></div>');
  parts.push(`<h2>${esc(titulo)}</h2>`);
  if (subtitulo) parts.push(`<div class="section-sub">${esc(subtitulo)}</div>`);
  parts.push('</div>');
  return parts.join('');
}

/* ─── Bullets ─── */

export function bullets(items = [], cls = 'bullet-list') {
  const lis = items.map(i => `<li>${esc(i)}</li>`).join('');
  return `<ul class="${cls}">${lis}</ul>`;
}

/* ─── Table ─── */

export function tableV(headers = [], rows = [], cls = 'data-table') {
  const th = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = rows.map(row =>
    '<tr>' + row.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>'
  ).join('');
  return `<table class="${cls}"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

/* ─── Card ─── */

export function card(data = {}) {
  const { titulo, items, subtitulo, icon, image, iconImg, accentTop = true } = data;
  let parts = ['<div class="card">'];
  const banner = image ? media(image, 'card-banner') : '';
  if (banner) parts.push(banner);
  const iconMedia = iconImg ? media(iconImg, 'card-icon-img') : '';
  if (iconMedia) parts.push(iconMedia);
  else if (icon) parts.push(`<div class="card-icon">${esc(icon)}</div>`);
  else if (accentTop && !banner) parts.push('<div class="accent-top"></div>');
  parts.push('<div class="card-body">');
  parts.push(`<h3>${esc(titulo)}</h3>`);
  if (subtitulo) parts.push(`<div class="card-sub">${esc(subtitulo)}</div>`);
  if (items && items.length) {
    parts.push('<ul>' + items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>');
  }
  parts.push('</div></div>');
  return parts.join('');
}

/* ─── Panel ─── */

export function panel(data = {}) {
  const { titulo, items, tag, image } = data;
  let parts = ['<div class="panel">'];
  const banner = image ? media(image, 'panel-banner') : '';
  if (banner) parts.push(banner);
  parts.push('<div class="panel-body">');
  if (tag) parts.push(`<span class="panel-tag">${esc(tag)}</span>`);
  parts.push(`<h3>${esc(titulo)}</h3>`);
  if (items && items.length) {
    parts.push('<ul>' + items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>');
  }
  parts.push('</div></div>');
  return parts.join('');
}

/* ─── KPI ─── */

export function kpi(valor = '', etiqueta = '') {
  return `<div class="kpi"><div class="kpi-value">${esc(valor)}</div><div class="kpi-label">${esc(etiqueta)}</div></div>`;
}

/* ─── Person ─── */

function _initials(nombre) {
  const parts = String(nombre).split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function person(data = {}) {
  const { nombre, rol, avatar, avatarImg } = data;
  const uri = avatarImg ? imageDataUri(avatarImg) : null;
  let av;
  if (uri) {
    av = `<div class="avatar avatar--img"><img src="${uri}" alt=""/></div>`;
  } else {
    const text = avatar ? esc(avatar) : esc(_initials(nombre));
    av = `<div class="avatar">${text}</div>`;
  }
  return `<div class="person">${av}<div class="pname">${esc(nombre)}</div><div class="prole">${esc(rol || '')}</div></div>`;
}

/* ─── Media (image block) ─── */

export function media(src = null, cls = 'media', fit = 'cover') {
  if (!src) return '';
  const uri = imageDataUri(src);
  if (!uri) return '';
  const style = fit ? ` style="object-fit:${fit}"` : '';
  return `<div class="${cls}"><img src="${uri}"${style} alt=""/></div>`;
}

/* ─── Callout (report) ─── */

export function callout(headline = '', parrafos = []) {
  const items = Array.isArray(parrafos) ? parrafos : [parrafos];
  let parts = ['<div class="callout-box">'];
  parts.push(`<div class="callout-headline">${esc(headline)}</div>`);
  if (items.length) {
    parts.push('<div class="callout-body">');
    for (const p of items) parts.push(`<p>${esc(p)}</p>`);
    parts.push('</div>');
  }
  parts.push('</div>');
  return parts.join('');
}

/* ─── Recommendation (report) ─── */

export function recommendation(data = {}) {
  const { titulo, problema, recomendacion, acciones, problem, recommendation, actions } = data;
  let parts = ['<div class="recommendation">'];
  parts.push(`<h3>${esc(titulo)}</h3>`);
  const p = problema || problem;
  if (p) parts.push(`<div class="rec-field"><strong>Problema:</strong> ${esc(p)}</div>`);
  const r = recomendacion || recommendation;
  if (r) parts.push(`<div class="rec-field"><strong>Recomendación:</strong> ${esc(r)}</div>`);
  const a = acciones || actions;
  if (a && a.length) {
    parts.push('<div class="rec-field"><strong>Acciones sugeridas:</strong></div>');
    parts.push('<ul class="rec-actions">');
    for (const item of a) parts.push(`<li>${esc(item)}</li>`);
    parts.push('</ul>');
  }
  parts.push('</div>');
  return parts.join('');
}

/* ─── Roadmap (report) ─── */

export function roadmap(headers = [], phases = []) {
  const hdrs = headers.length ? headers : ['Periodo', 'Foco', 'Entregables'];
  const th = hdrs.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = phases.map(phase => {
    const deliverables = phase.entregables || phase.deliverables || [];
    const delivHtml = deliverables.map(d => `• ${esc(d)}`).join('<br/>');
    return '<tr>' +
      `<td>${esc(phase.phase || phase.periodo || '')}</td>` +
      `<td>${esc(phase.focus || phase.foco || '')}</td>` +
      `<td>${delivHtml}</td>` +
      '</tr>';
  }).join('');
  return `<table class="roadmap-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
}

/* ─── KPI Table (report) ─── */

export function kpiTable(headers = [], kpis = []) {
  const hdrs = headers.length ? headers : ['Dominio', 'Indicador', 'Meta'];
  const th = hdrs.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = kpis.map(k =>
    '<tr>' +
    `<td>${esc(k.domain || k.dominio || '')}</td>` +
    `<td>${esc(k.metric || k.metrica || '')}</td>` +
    `<td>${esc(k.target || k.meta || '')}</td>` +
    '</tr>'
  ).join('');
  return `<table class="kpi-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
}

/* ─── Closing (report) ─── */

export function closing(parrafos = []) {
  const items = Array.isArray(parrafos) ? parrafos : [parrafos];
  let parts = ['<div class="closing-block">'];
  parts.push('<div class="closing-icon">\u201c</div>');
  for (const p of items) parts.push(`<p>${esc(p)}</p>`);
  parts.push('</div>');
  return parts.join('');
}
