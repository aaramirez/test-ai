---
description: Ingest content from file or URL into knowledge base.
---

Detect the source format (file or URL) and ingest it into the knowledge base.

1. Identify source type (text, markdown, PDF, URL)
2. Extract content preserving structure
3. Generate a note with frontmatter (title, source, created)
4. Save to the KB directory with proper wikilinks

Use `ingest-content.js` for CLI ingestion or the `content-ingestion` skill for full pipeline.
