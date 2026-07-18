---
name: pdf-extraction
description: Extract literal text from PDF files — handle column breaks, paragraph reconstruction, table detection, and encoding issues.
license: MIT
scripts:
  - extract-pdf.js
---

# PDF extraction

Extract text content from PDF documents. This skill handles the technical extraction process; structuring the result for a knowledge base is handled by `content-ingestion`.

## Techniques

### Python (recommended for batch/document extraction)

```python
import subprocess, tempfile
from pathlib import Path

# Option A: pdftotext (poppler) — best for text-heavy PDFs
text = subprocess.check_output(['pdftotext', '-layout', str(pdf_path), '-']).decode('utf-8', errors='replace')

# Option B: PyMuPDF (fitz) for structured access
# pip install PyMuPDF
# import fitz
# doc = fitz.open(pdf_path)
# for page in doc: text = page.get_text()
```

### macOS built-in

```bash
# Quick text dump (works out of the box)
textutil -convert txt -output /tmp/output.txt archivo.pdf
cat /tmp/output.txt
```

### python-docx (if PDF is actually DOCX)

```python
from docx import Document
doc = Document(path)
text = '\n'.join(p.text for p in doc.paragraphs)
```

## PDF-specific handling

- **Column layout:** PDFs often have multi-column text. Use `pdftotext -layout` to preserve column position, then reorder left-to-right, top-to-bottom.
- **Hyphenation:** remove soft hyphens at line breaks (`proce-\nsamiento` → `procesamiento`).
- **Tables:** detect tab-separated runs; use `pdfplumber` (`pip install pdfplumber`) for table extraction when `pdftotext` loses alignment.
- **Encoding:** use `errors='replace'` for non-decodable bytes; log suspect characters.
- **Images/embedded content:** skip non-text elements; note their position in comments.

## Output

Pass the raw extracted text to `content-ingestion` for structuring into knowledge base notes. Do not add frontmatter or wikilinks here — that is the responsibility of `content-ingestion`.
