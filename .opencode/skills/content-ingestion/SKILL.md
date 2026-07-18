---
name: content-ingestion
description: Take content from any source (PDF, DOCX, web, text, markdown) and structure it into a knowledge base with proper frontmatter, wikilinks, and formatting.
license: MIT
scripts:
  - ingest-content.js
---

# Content ingestion

Ingest content from any source and create well-structured knowledge base notes. This skill handles formatting and vault conventions regardless of the source format. For PDF-specific extraction mechanics, see `pdf-extraction`.

## Sources

| Source | Pre-processing | Tooling |
|---|---|---|
| PDF | Run through `pdf-extraction` skill | pdftotext, PyMuPDF |
| Word (DOCX) | Extract paragraphs | `python-docx` |
| Web pages | Fetch and convert to markdown | `webfetch` tool, readability |
| Markdown | Use as-is | Direct copy |
| Plain text | Process directly | Manual formatting |

## Knowledge base formatting

- Use `##` and `###` for sections and subsections.
- Convert bullets (`•`, `o`, `*`) to `-` with proper indentation.
- Join paragraph fragments broken by source column width.
- Add YAML frontmatter with `tags`, `source` (original path/URL), and `created` date.
- Include `[[wikilinks]]` to parent notes.

## Frontmatter template

```yaml
---
tags:
  - fuente
  - <topic>
source: <original-path-or-url>
created: <YYYY-MM-DD>
---
```

## Rules

- **Literal extraction:** extract text exactly as-is from the source. No summaries, paraphrasing, or editorializing.
- **No data loss:** do not omit any section, table, note, or message from the original.
- **Atomic notes:** one concept per note; split large documents into multiple notes linked via `[[wikilinks]]`.
- **Source attribution:** always record the original source path/URL in frontmatter.

## Workflow

1. Read/retrieve the source document.
2. If PDF: use `pdf-extraction` skill for raw text extraction.
3. Structure the content per the formatting conventions above.
4. Create the `.md` file(s) in the appropriate directory.
5. Add `[[wikilinks]]` connecting new notes to existing vault structure.
