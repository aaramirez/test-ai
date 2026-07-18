#!/usr/bin/env node
/**
 * docgen/charts.js — Pure-SVG chart generation
 *
 * 12 chart types: bar, grouped-bar, stacked-bar, donut, pie, line,
 * progress, gauge, timeline, gantt, radar, waterfall, heatmap.
 *
 * Zero dependencies. Uses brand colors from shared/brand.json.
 *
 * Ported from gda-ai (repos/GrupoConex/gda-ai/shared/scripts/charts.py).
 */

import { loadBrand, brand, esc, WIDTH } from './index.js';

/* ─── Helpers ─── */

function hexToRgb(h) {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const SERIES = ['#3b5bdb', '#2f9e6f', '#e67700', '#cc3333', '#8854d0', '#1098ad'];

function seriesColor(i) {
  return SERIES[i % SERIES.length];
}

/* ─── Bar chart ─── */

export function barChart(data, { horizontal = false, width = 600, height = 300, color, showValues = true } = {}) {
  const b = brand();
  const barColor = color || b.colors.secondary;
  const maxVal = Math.max(...data.map(d => d[1]), 1);
  const pad = { t: 20, r: 20, b: 40, l: 60 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const bw = cw / data.length * 0.7;
  const gap = cw / data.length * 0.3;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  for (let i = 0; i < data.length; i++) {
    const [label, val] = data[i];
    const barH = (val / maxVal) * ch;
    const x = pad.l + i * (bw + gap) + gap / 2;
    const y = pad.t + ch - barH;
    svg += `\n  <rect x="${x}" y="${y}" width="${bw}" height="${barH}" rx="3" fill="${barColor}" opacity="${0.6 + 0.4 * (1 - i / data.length)}"/>`;
    if (showValues) svg += `\n  <text x="${x + bw / 2}" y="${y - 8}" text-anchor="middle" font-family="${b.fonts.body}" font-size="12" fill="${b.colors.text}">${val}</text>`;
    svg += `\n  <text x="${x + bw / 2}" y="${pad.t + ch + 16}" text-anchor="middle" font-family="${b.fonts.body}" font-size="11" fill="${b.colors.text}">${esc(label)}</text>`;
  }
  // Baseline
  svg += `\n  <line x1="${pad.l}" y1="${pad.t + ch}" x2="${pad.l + cw}" y2="${pad.t + ch}" stroke="${b.colors.text}" stroke-width="1" opacity="0.3"/>`;
  svg += '\n</svg>';
  return svg;
}

/* ─── Grouped bar chart ─── */

export function groupedBarChart(categories, series, width = 700, height = 350) {
  const b = brand();
  const groups = categories.length;
  const items = series.length;
  const pad = { t: 30, r: 20, b: 50, l: 60 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const gw = cw / groups;
  const bw = gw / items * 0.75;
  const maxVal = Math.max(...series.flatMap(s => s[1]), 1);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  for (let g = 0; g < groups; g++) {
    for (let s = 0; s < items; s++) {
      const val = series[s][1][g];
      const barH = (val / maxVal) * ch;
      const x = pad.l + g * gw + (gw - items * bw) / 2 + s * bw;
      const y = pad.t + ch - barH;
      svg += `\n  <rect x="${x}" y="${y}" width="${bw - 2}" height="${barH}" rx="2" fill="${seriesColor(s)}"/>`;
    }
    svg += `\n  <text x="${pad.l + g * gw + gw / 2}" y="${pad.t + ch + 16}" text-anchor="middle" font-family="${b.fonts.body}" font-size="11" fill="${b.colors.text}">${esc(categories[g])}</text>`;
  }
  svg += `\n  <line x1="${pad.l}" y1="${pad.t + ch}" x2="${pad.l + cw}" y2="${pad.t + ch}" stroke="${b.colors.text}" stroke-width="1" opacity="0.3"/>`;
  // Legend
  for (let s = 0; s < items; s++) {
    const lx = width - 200;
    const ly = pad.t + s * 20;
    svg += `\n  <rect x="${lx}" y="${ly - 8}" width="12" height="12" rx="2" fill="${seriesColor(s)}"/>`;
    svg += `\n  <text x="${lx + 18}" y="${ly + 2}" font-family="${b.fonts.body}" font-size="11" fill="${b.colors.text}">${esc(series[s][0])}</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Stacked bar chart ─── */

export function stackedBarChart(categories, series, width = 700, height = 350) {
  const b = brand();
  const groups = categories.length;
  const items = series.length;
  const pad = { t: 30, r: 20, b: 50, l: 60 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const bw = cw / groups * 0.6;
  const maxTotals = Math.max(...categories.map((_, g) => series.reduce((sum, s) => sum + (s[1][g] || 0), 0)), 1);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  for (let g = 0; g < groups; g++) {
    let yOffset = 0;
    for (let s = 0; s < items; s++) {
      const val = series[s][1][g] || 0;
      const barH = (val / maxTotals) * ch;
      const x = pad.l + g * (cw / groups) + (cw / groups - bw) / 2;
      const y = pad.t + ch - yOffset - barH;
      if (barH > 0) svg += `\n  <rect x="${x}" y="${y}" width="${bw}" height="${barH}" fill="${seriesColor(s)}" opacity="0.85"/>`;
      yOffset += barH;
    }
    svg += `\n  <text x="${pad.l + g * (cw / groups) + (cw / groups) / 2}" y="${pad.t + ch + 16}" text-anchor="middle" font-family="${b.fonts.body}" font-size="11" fill="${b.colors.text}">${esc(categories[g])}</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Donut chart ─── */

export function donutChart(data, { width = 300, height = 300, hole = 0.58, centerLabel } = {}) {
  const b = brand();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 20;
  const ir = r * hole;
  const total = data.reduce((s, d) => s + d[1], 0) || 1;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  let angle = -Math.PI / 2;

  for (let i = 0; i < data.length; i++) {
    const [label, val] = data[i];
    const frac = val / total;
    const endAngle = angle + frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    const x1i = cx + ir * Math.cos(endAngle);
    const y1i = cy + ir * Math.sin(endAngle);
    const x2i = cx + ir * Math.cos(angle);
    const y2i = cy + ir * Math.sin(angle);
    const c = seriesColor(i);
    svg += `\n  <path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x1i} ${y1i} A ${ir} ${ir} 0 ${largeArc} 0 ${x2i} ${y2i} Z" fill="${c}" stroke="#fff" stroke-width="1"/>`;
    svg += `\n  <text x="${cx + (r + 20) * Math.cos(angle + frac * Math.PI)}" y="${cy + (r + 20) * Math.sin(angle + frac * Math.PI)}" text-anchor="middle" dominant-baseline="middle" font-family="${b.fonts.body}" font-size="10" fill="${b.colors.text}">${esc(label)}</text>`;
    angle = endAngle;
  }
  if (centerLabel) {
    svg += `\n  <text x="${cx}" y="${cy - 5}" text-anchor="middle" dominant-baseline="middle" font-family="${b.fonts.heading}" font-size="22" font-weight="700" fill="${b.colors.primary}">${esc(centerLabel)}</text>`;
    svg += `\n  <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="${b.fonts.body}" font-size="11" fill="${b.colors.secondary}">Total</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

export function pieChart(data, opts = {}) {
  return donutChart(data, { ...opts, hole: 0 });
}

/* ─── Line chart ─── */

export function lineChart(data, { width = 600, height = 300, area = false, color } = {}) {
  const b = brand();
  const lineColor = color || b.colors.secondary;
  const maxVal = Math.max(...data.map(d => d[1]), 1);
  const pad = { t: 20, r: 20, b: 40, l: 60 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const stepX = data.length > 1 ? cw / (data.length - 1) : cw;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  const points = data.map((d, i) => ({
    x: pad.l + i * stepX,
    y: pad.t + ch - (d[1] / maxVal) * ch,
  }));

  // Area fill
  if (area && points.length > 1) {
    const areaPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x} ${pad.t + ch} L ${points[0].x} ${pad.t + ch} Z`;
    svg += `\n  <path d="${areaPath}" fill="${lineColor}" opacity="0.1"/>`;
  }

  // Line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  svg += `\n  <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round"/>`;

  // Dots + labels
  for (let i = 0; i < points.length; i++) {
    svg += `\n  <circle cx="${points[i].x}" cy="${points[i].y}" r="4" fill="#fff" stroke="${lineColor}" stroke-width="2"/>`;
    svg += `\n  <text x="${points[i].x}" y="${pad.t + ch + 16}" text-anchor="middle" font-family="${b.fonts.body}" font-size="10" fill="${b.colors.text}">${esc(data[i][0])}</text>`;
    svg += `\n  <text x="${points[i].x}" y="${points[i].y - 10}" text-anchor="middle" font-family="${b.fonts.body}" font-size="10" fill="${b.colors.text}">${data[i][1]}</text>`;
  }

  svg += `\n  <line x1="${pad.l}" y1="${pad.t + ch}" x2="${pad.l + cw}" y2="${pad.t + ch}" stroke="${b.colors.text}" stroke-width="1" opacity="0.2"/>`;
  svg += '\n</svg>';
  return svg;
}

/* ─── Progress bars ─── */

export function progressChart(data, { width = 600, height: chartH = 200, color } = {}) {
  const b = brand();
  const barColor = color || b.colors.secondary;
  const barH = 24;
  const gap = 8;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${chartH}" width="${width}" height="${chartH}">`;
  const totalH = data.length * (barH + gap);
  const startY = (chartH - totalH) / 2;

  for (let i = 0; i < data.length; i++) {
    const [label, pct] = data[i];
    const y = startY + i * (barH + gap);
    svg += `\n  <rect x="120" y="${y}" width="${width - 140}" height="${barH}" rx="${barH / 2}" fill="${b.colors['light-bg']}"/>`;
    const fillW = ((width - 140) * pct) / 100;
    svg += `\n  <rect x="120" y="${y}" width="${fillW}" height="${barH}" rx="${barH / 2}" fill="${barColor}" opacity="0.85"/>`;
    svg += `\n  <text x="110" y="${y + barH / 2 + 4}" text-anchor="end" font-family="${b.fonts.body}" font-size="12" fill="${b.colors.text}">${esc(label)}</text>`;
    svg += `\n  <text x="${120 + fillW - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-family="${b.fonts.body}" font-size="11" fill="#fff" font-weight="600">${Math.round(pct)}%</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Gauge ─── */

export function gaugeChart(value, { width = 300, height = 200, vmin = 0, vmax = 100, label, color } = {}) {
  const b = brand();
  const gColor = color || (value > 75 ? '#2f9e6f' : value > 40 ? '#e67700' : '#cc3333');
  const cx = width / 2;
  const cy = height * 0.75;
  const r = Math.min(cx, cy) - 20;
  const frac = (value - vmin) / (vmax - vmin);
  const angle = -Math.PI * (0.75 - 1.5 * frac);
  const startAngle = -Math.PI * 0.75;
  const endAngle = Math.PI * 0.75;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  // Background arc
  svg += `\n  <path d="M ${cx + r * Math.cos(startAngle)} ${cy + r * Math.sin(startAngle)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(endAngle)} ${cy + r * Math.sin(endAngle)}" fill="none" stroke="${b.colors['light-bg']}" stroke-width="16" stroke-linecap="round"/>`;
  // Value arc
  const valAngle = -Math.PI * (0.75 - 1.5 * frac);
  svg += `\n  <path d="M ${cx + r * Math.cos(startAngle)} ${cy + r * Math.sin(startAngle)} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(valAngle)} ${cy + r * Math.sin(valAngle)}" fill="none" stroke="${gColor}" stroke-width="16" stroke-linecap="round"/>`;
  svg += `\n  <text x="${cx}" y="${cy + 5}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="36" font-weight="700" fill="${b.colors.primary}">${value}</text>`;
  if (label) svg += `\n  <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="${b.fonts.body}" font-size="12" fill="${b.colors.secondary}">${esc(label)}</text>`;
  svg += '\n</svg>';
  return svg;
}

/* ─── Timeline ─── */

export function timelineChart(milestones, { width = 900, height = 140 } = {}) {
  const b = brand();
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  const cy = height / 2;
  const stepX = (width - 80) / (milestones.length - 1 || 1);
  svg += `\n  <line x1="60" y1="${cy}" x2="${width - 20}" y2="${cy}" stroke="${b.colors.secondary}" stroke-width="2" stroke-dasharray="6,4"/>`;
  for (let i = 0; i < milestones.length; i++) {
    const [date, title] = milestones[i];
    const x = 60 + i * stepX;
    svg += `\n  <circle cx="${x}" cy="${cy}" r="8" fill="${b.colors.secondary}" stroke="#fff" stroke-width="2"/>`;
    svg += `\n  <text x="${x}" y="${cy - 18}" text-anchor="middle" font-family="${b.fonts.body}" font-size="10" fill="${b.colors.primary}" font-weight="600">${esc(date)}</text>`;
    svg += `\n  <text x="${x}" y="${cy + 28}" text-anchor="middle" font-family="${b.fonts.body}" font-size="9" fill="${b.colors.text}">${esc(title)}</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Gantt chart ─── */

export function ganttChart(tareas, { width = 700, height: chartH = 300 } = {}) {
  const b = brand();
  const pad = { t: 30, r: 20, b: 20, l: 160 };
  const cw = width - pad.l - pad.r;
  const totalDur = Math.max(...tareas.map(t => t.inicio + t.duracion), 1);
  const rowH = 28;
  const gap = 4;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${chartH}" width="${width}" height="${chartH}">`;
  for (let i = 0; i < tareas.length; i++) {
    const t = tareas[i];
    const y = pad.t + i * (rowH + gap);
    const x = pad.l + (t.inicio / totalDur) * cw;
    const w = (t.duracion / totalDur) * cw;
    const colorIndex = tareas.filter((_, j) => j < i && t.grupo ? t.grupo === tareas[j].grupo : false).length;
    svg += `\n  <rect x="${pad.l}" y="${y}" width="${cw}" height="${rowH}" rx="4" fill="${b.colors['light-bg']}"/>`;
    svg += `\n  <rect x="${x}" y="${y + 2}" width="${Math.max(w - 2, 4)}" height="${rowH - 4}" rx="3" fill="${t.color || seriesColor(i)}" opacity="0.8"/>`;
    svg += `\n  <text x="${pad.l - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" font-family="${b.fonts.body}" font-size="11" fill="${b.colors.text}">${esc(t.nombre || t.name)}</text>`;
  }
  // Time markers
  for (let m = 0; m <= 5; m++) {
    const x = pad.l + (m / 5) * cw;
    svg += `\n  <text x="${x}" y="18" text-anchor="middle" font-family="${b.fonts.body}" font-size="10" fill="${b.colors.text}" opacity="0.6">${Math.round((m / 5) * totalDur)}</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Radar chart ─── */

export function radarChart(categorias, series, { width = 350, height = 350 } = {}) {
  const b = brand();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 30;
  const n = categorias.length;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  // Grid
  for (let ring = 1; ring <= 5; ring++) {
    const rr = (r / 5) * ring;
    const pts = categorias.map((_, i) => {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    }).join(' ');
    svg += `\n  <polygon points="${pts}" fill="none" stroke="${b.colors.text}" stroke-width="0.5" opacity="0.15"/>`;
  }
  // Axes
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    svg += `\n  <line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="${b.colors.text}" stroke-width="0.5" opacity="0.15"/>`;
    svg += `\n  <text x="${cx + (r + 20) * Math.cos(a)}" y="${cy + (r + 20) * Math.sin(a)}" text-anchor="middle" dominant-baseline="middle" font-family="${b.fonts.body}" font-size="9" fill="${b.colors.text}">${esc(categorias[i])}</text>`;
  }
  // Series
  for (let s = 0; s < series.length; s++) {
    const vals = series[s][1];
    const maxVal = Math.max(...vals, 1);
    const pts = vals.map((v, i) => {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      const vr = (v / maxVal) * r;
      return `${cx + vr * Math.cos(a)},${cy + vr * Math.sin(a)}`;
    }).join(' ');
    svg += `\n  <polygon points="${pts}" fill="${seriesColor(s)}" fill-opacity="0.15" stroke="${seriesColor(s)}" stroke-width="2" stroke-linejoin="round"/>`;
    for (let i = 0; i < vals.length; i++) {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      const vr = (vals[i] / maxVal) * r;
      svg += `\n  <circle cx="${cx + vr * Math.cos(a)}" cy="${cy + vr * Math.sin(a)}" r="3" fill="${seriesColor(s)}"/>`;
    }
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Waterfall chart ─── */

export function waterfallChart(data, { width = 600, height: chartH = 350 } = {}) {
  const b = brand();
  const pad = { t: 30, r: 20, b: 50, l: 60 };
  const cw = width - pad.l - pad.r;
  const ch = chartH - pad.t - pad.b;
  const vals = data.map(d => d.valor);
  const total = vals.reduce((s, v) => s + Math.abs(v), 0);
  let running = Math.max(...vals.filter(v => v < 0).reduce((a, v) => { a.push((a[a.length - 1] || 0) + v); return a; }, []).map(v => Math.abs(v)), 0);
  if (data[0]?.tipo === 'total') running = 0;
  const maxBar = Math.max(...data.map((d, i) => {
    if (d.tipo === 'total') return d.valor;
    let run = running;
    for (let j = 0; j <= i; j++) { if (data[j]?.tipo !== 'total') run += (data[j]?.valor || 0); }
    return run;
  }), 1);
  const scale = ch / maxBar;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${chartH}" width="${width}" height="${chartH}">`;
  let yOffset = 0;
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const bw = cw / data.length * 0.6;
    const x = pad.l + i * (cw / data.length) + (cw / data.length - bw) / 2;
    let barH, y;
    if (d.tipo === 'total') {
      barH = Math.abs(d.valor) * scale;
      y = pad.t + ch - barH;
      yOffset = barH;
      svg += `\n  <rect x="${x}" y="${y}" width="${bw}" height="${barH}" rx="2" fill="${b.colors.primary}"/>`;
    } else if (d.valor >= 0) {
      barH = d.valor * scale;
      y = pad.t + ch - yOffset - barH;
      svg += `\n  <rect x="${x}" y="${y}" width="${bw}" height="${barH}" rx="2" fill="${b.colors.secondary}"/>`;
      yOffset += barH;
    } else {
      barH = Math.abs(d.valor) * scale;
      y = pad.t + ch - yOffset;
      svg += `\n  <rect x="${x}" y="${y}" width="${bw}" height="${barH}" rx="2" fill="${b.colors.accent}"/>`;
      yOffset -= barH;
    }
    svg += `\n  <text x="${x + bw / 2}" y="${y + barH / 2 + 4}" text-anchor="middle" font-family="${b.fonts.body}" font-size="10" fill="#fff">${d.valor}</text>`;
    svg += `\n  <text x="${x + bw / 2}" y="${pad.t + ch + 16}" text-anchor="middle" font-family="${b.fonts.body}" font-size="9" fill="${b.colors.text}">${esc(d.label || '')}</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Heatmap ─── */

export function heatmapChart(matrix, { width = 500, height: chartH = 400 } = {}) {
  const b = brand();
  const { headers_fila: rowLabels, headers_col: colLabels, datos } = matrix;
  const rows = rowLabels.length;
  const cols = colLabels.length;
  const cellW = (width - 120) / cols;
  const cellH = (chartH - 60) / rows;
  const maxVal = Math.max(...datos.flat(), 1);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${chartH}" width="${width}" height="${chartH}">`;
  for (let r = 0; r < rows; r++) {
    svg += `\n  <text x="110" y="${30 + r * cellH + cellH / 2 + 4}" text-anchor="end" font-family="${b.fonts.body}" font-size="10" fill="${b.colors.text}">${esc(rowLabels[r])}</text>`;
    for (let c = 0; c < cols; c++) {
      const val = datos[r][c] || 0;
      const intensity = val / maxVal;
      const x = 120 + c * cellW;
      const y = 30 + r * cellH;
      const rr = Math.round(180 - 180 * intensity);
      const gg = Math.round(200 - 200 * intensity);
      const bb = Math.round(230 - 200 * intensity);
      svg += `\n  <rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 1}" fill="rgb(${rr},${gg},${bb})" rx="1"/>`;
      svg += `\n  <text x="${x + cellW / 2}" y="${y + cellH / 2 + 4}" text-anchor="middle" font-family="${b.fonts.body}" font-size="10" fill="${val > maxVal / 2 ? '#fff' : b.colors.text}">${val}</text>`;
    }
  }
  for (let c = 0; c < cols; c++) {
    svg += `\n  <text x="${120 + c * cellW + cellW / 2}" y="20" text-anchor="middle" font-family="${b.fonts.body}" font-size="9" fill="${b.colors.text}">${esc(colLabels[c])}</text>`;
  }
  svg += '\n</svg>';
  return svg;
}

/* ─── Universal dispatcher ─── */

export function renderChart(kind, spec) {
  const dispatch = {
    barras: () => barChart(spec.datos || spec.data, spec),
    bar: () => barChart(spec.datos || spec.data, spec),
    'barras-agrupadas': () => groupedBarChart(spec.categorias || spec.categories, spec.series, spec.width, spec.height),
    grouped: () => groupedBarChart(spec.categorias || spec.categories, spec.series, spec.width, spec.height),
    'barras-apiladas': () => stackedBarChart(spec.categorias || spec.categories, spec.series, spec.width, spec.height),
    stacked: () => stackedBarChart(spec.categorias || spec.categories, spec.series, spec.width, spec.height),
    donut: () => donutChart(spec.datos || spec.data, spec),
    pastel: () => donutChart(spec.datos || spec.data, { ...spec, hole: 0 }),
    pie: () => donutChart(spec.datos || spec.data, { ...spec, hole: 0 }),
    lineas: () => lineChart(spec.datos || spec.data, spec),
    line: () => lineChart(spec.datos || spec.data, spec),
    progreso: () => progressChart(spec.datos || spec.data, spec),
    progress: () => progressChart(spec.datos || spec.data, spec),
    gauge: () => gaugeChart(spec.valor || spec.value, spec),
    timeline: () => timelineChart(spec.hitos || spec.milestones, spec),
    gantt: () => ganttChart(spec.tareas || spec.tasks, spec),
    radar: () => radarChart(spec.categorias || spec.categories, spec.series, spec),
    waterfall: () => waterfallChart(spec.datos || spec.data, spec),
    heatmap: () => heatmapChart(spec.matrix, spec),
  };
  const fn = dispatch[kind];
  if (!fn) throw new Error(`Unknown chart type: ${kind}`);
  return fn();
}
