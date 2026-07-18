---
name: vault-pdf-export
description: Exporta contenido del vault Obsidian curso-ia a PDF profesional usando el pipeline document-generation.
license: MIT
scripts:
  - docgen-vault.js
---

# Vault PDF Export

Exporta lecciones, módulos o el vault completo de Obsidian a PDF profesional usando la infraestructura de generación de documentos existente (Chromium headless + branding).

## Pipeline

```
curso-ia/*.md  →  node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js  →  generated/<vault-name>-<timestamp>/
                                                              ├── leccion-03.pdf
                                                              ├── modulo-5.pdf
                                                              └── curso-completo.pdf
```

## Requisitos

- Node.js 18+
- Chromium/Chrome/Edge (headless) para generación PDF
- Opcional: `DOCGEN_BROWSER` env var para ruta personalizada del navegador

## Uso

```bash
# Una lección específica
node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js --scope lesson --module "Módulo 5" --lesson "03"

# Módulo completo (documento único)
node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js --scope module --module "Módulo 5"

# Módulo completo (un PDF por lección)
node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js --scope module --module "Módulo 5" --mode separate

# Todo el vault (todos los módulos, un PDF por lección)
node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js --scope all --mode separate

# Todo el vault (documento único)
node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js --scope all --mode merged
```

## Opciones

| Flag | Descripción | Default |
|------|-------------|---------|
| `--scope <lesson\|module\|all>` | Alcance de exportación | `module` |
| `--module <name>` | Nombre del módulo | — |
| `--lesson <num>` | Número de lección | — |
| `--mode <merged\|separate>` | Documento único o uno por lección | `merged` |
| `--vault <path>` | Ruta al vault | `curso-ia/` |
| `--output <dir>` | Directorio base de salida | `generated` |

## Comportamiento

- Excluye automáticamente `Transcripciones/`, `.obsidian/`, `Recursos/` e `Index.md`
- Ordena lecciones por número de módulo y lección
- Convierte markdown a HTML con formato: headers, bold, code, listas, blockquotes, tablas
- Aplica branding corporativo desde `.opencode/brand.json`
- Genera PDF en `generated/<vault-name>-<YYYYMMDD-HHmmss>/` (sin sobrescribir)

## Workflow para el agente

1. Preguntar al usuario: alcance (lesson / module / all)
2. Preguntar: modo merged (único PDF) o separate (un PDF por lección)
3. Ejecutar `node .opencode/skills/vault-pdf-export/scripts/docgen-vault.js` con los flags correspondientes
4. Informar al usuario dónde se generaron los PDFs
