---
name: branding
description: Define and apply brand identity — colors, logos, and typography for all generated documents. Use when creating or customizing visual assets.
license: MIT
scripts:
  - create-brand.js
---

# Branding

Brand identity is centralized in `.opencode/brand.json`. All document generation and visual assets must use these tokens. Never hardcode brand colors, fonts, or logos.

## Token reference (`.opencode/brand.json`)

| Field | Purpose | Example |
|---|---|---|
| `brand.name` | Company name | `"Mi Empresa"` |
| `brand.colors.primary` | Main brand color | `"#1a365d"` |
| `brand.colors.secondary` | Secondary/accent | `"#2b6cb0"` |
| `brand.colors.accent` | Highlight/callout | `"#e53e3e"` |
| `brand.colors.text` | Body text | `"#1a202c"` |
| `brand.colors.background` | Page background | `"#ffffff"` |
| `brand.colors.light-bg` | Subtle background | `"#f7fafc"` |
| `brand.logo` | Primary logo path | `"assets/images/logo.svg"` |
| `brand.logo_white` | White variant for dark backgrounds | `"assets/images/logo-white.svg"` |
| `brand.fonts.heading` | Heading font stack | `"Inter, sans-serif"` |
| `brand.fonts.body` | Body font stack | `"Inter, sans-serif"` |

## Visual conventions

- Use the **primary** color for headers, titles, and main UI elements.
- Use **secondary** for subheadings, links, and secondary UI.
- Use **accent** sparingly — call-to-action, highlights, warnings.
- On dark backgrounds, use the white logo variant.
- Keep sufficient contrast ratios (WCAG AA minimum).
- All generated documents should reference `.opencode/brand.json` for color values — never hardcode hex values in templates.

## Workflow

```bash
# View current brand config
cat .opencode/brand.json

# Edit brand.json directly or use the create-brand.js script
node .opencode/skills/branding/scripts/create-brand.js --help
```

## Related

- Use with `document-generation` skill for branded documents
- Use with `content-ingestion` when creating branded knowledge base content
