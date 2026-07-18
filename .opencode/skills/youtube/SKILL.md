---
name: youtube
description: Use for fetching and processing YouTube video transcriptions to feed into AI models, generate summaries, create course notes, or analyze video content.
license: MIT
scripts:
  - youtube-transcript.js
---

# YouTube Transcript Skill

Fetch clean, timestamped transcriptions from any YouTube video.

## Usage

### CLI

```bash
# Using the script directly
node .opencode/scripts/youtube-transcript.js <video-id-or-url>

# Example
node .opencode/scripts/youtube-transcript.js GarWqdHzwac

# With language selection
node .opencode/scripts/youtube-transcript.js GarWqdHzwac --lang es
```

### Programmatic (Node.js)

```js
import { fetchTranscript } from './.opencode/scripts/youtube-transcript.js';

const transcript = await fetchTranscript('GarWqdHzwac', 'es');
console.log(transcript.text);   // Clean text
console.log(transcript.title);  // Video title
```

## Workflow

1. Get the YouTube video ID from the URL (`v=XXXXX` or the 11-char slug)
2. Fetch the transcript using the script or module
3. Process the text: summarize, extract key concepts, generate notes
4. **Save the raw transcript** as a reference file in the Obsidian vault: `Transcripciones/<video-id> - <title>.md`
5. Create or update course notes linking to the transcript

### Ejemplo de guardado

```bash
# Obtener transcripción
node .opencode/scripts/youtube-transcript.js ZZq4TpNgnvg --lang es > "curso-ia/Transcripciones/ZZq4TpNgnvg - Curso de OpenCode desde cero.md"
```

## Cross-platform

Works on macOS, Linux, and Windows — no external dependencies beyond Node.js built-ins.

## Related

- Use with [git](git) skill for commit messages referencing video sources
- Use with [code-review](code-review) skill when reviewing code from tutorials
- Use with [kb-management](kb-management) skill to maintain the Obsidian vault structure
