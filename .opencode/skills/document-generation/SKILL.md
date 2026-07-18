---
name: document-generation
description: Generate branded PDF presentations, HTML decks, reports, and images using Node.js content builders.
license: MIT
scripts:
  - docgen/
---

# Document generation

Generate branded content using builders in `.opencode/skills/document-generation/scripts/docgen/`. Source files (JSON, Markdown, JS) define the content, which builders render into the final format.

## Pipeline

```
assets/decks/<name>.{json,md,js}  →  node .opencode/skills/document-generation/scripts/docgen/build-*.js  →  assets/docs/<name>.pdf
                                                                               →  assets/images/<name>.png
```

## Available builders

| Command | Output | Purpose |
|---|---|---|
| `build-deck.js` | PDF (16:9) | Presentations via HTML+CSS or SVG engines |
| `build-image.js` | PNG / SVG | Standalone images, diagrams, profiles |
| `build-report.js` | PDF Letter | Structured executive reports |

## Input formats

JSON, YAML (`.yaml`/`.yml`), Markdown (`.md`), JS (`.js`/`.mjs` with `buildSlides()` or `buildSvg()`).

## Slide types (HTML engine)

`portada`, `seccion`, `bullets`, `dos-columnas`, `n-columnas`, `tarjetas`, `kpis`, `personas`, `cita`, `imagen`, `tabla`, `lamina-completa`, `grafico`, `imagen-texto`, `destacado`, `comparativa`, `timeline`, `proceso`/`workflow`, `masonry`, `faq`.

## Chart types (SVG, zero deps)

`barras`/`bar`, `barras-agrupadas`/`grouped`, `barras-apiladas`/`stacked`, `donut`, `pastel`/`pie`, `lineas`/`line`, `progreso`/`progress`, `gauge`, `gantt`, `radar`, `waterfall`, `heatmap`, `timeline`.

## Quick reference

```bash
node .opencode/skills/document-generation/scripts/docgen/build-deck.js   assets/decks/mi-deck.json    # PDF
node .opencode/skills/document-generation/scripts/docgen/build-image.js  assets/decks/mi-imagen.json  # PNG/SVG
node .opencode/skills/document-generation/scripts/docgen/build-report.js assets/decks/mi-reporte.json # PDF Letter
```

## Report structure (JSON)

```json
{
  "output": "assets/docs/reporte.pdf",
  "meta": {
    "title": "Título",
    "subtitle": "Subtítulo",
    "organization": "Org",
    "prepared_by": "Autor",
    "date": "2026",
    "classification": "Uso interno"
  },
  "slides": [
    { "type": "doc-cover" },
    { "type": "section", "titulo": "1. Sección" },
    { "type": "text", "parrafos": ["..."] }
  ]
}
```

Report slide types: `doc-cover`, `section`, `text`, `callout`, `table`, `bullets`, `recommendation`, `roadmap`, `kpi-table`, `closing`.

## Core modules

| Module | Exports |
|---|---|
| `index.js` | `loadBrand()`, `brand()`, `esc()`, `svgOpen()`, `svgClose()`, `portada()`, `lamina()`, `slideToSvg()`, `findBrowser()`, `htmlToPdf()`, `svgToPdf()`, `loadSource()`, `loadJson()`, `loadMarkdown()`, `loadJsModule()` |
| `charts.js` | `renderChart(kind, spec)`, `barChart()`, `donutChart()`, `lineChart()`, `ganttChart()`, `radarChart()`, etc. |
| `html-theme.js` | `buildHtml(slides, mostrarPaginas)`, `slideToHtml(slide, page)` |
| `report-theme.js` | `buildHtml(meta, slides)` |

## Requirements

- Node.js 18+
- Chromium browser recommended for PDF engine `html`; falls back to `--engine svg` with `rsvg-convert` + `imagemagick`
- Zero npm dependencies for core pipeline

## Reference

Adapted from the Python pipeline in gda-ai (`repos/GrupoConex/gda-ai/.opencode/scripts/`). Brand colors read from `.opencode/brand.json` at runtime.
