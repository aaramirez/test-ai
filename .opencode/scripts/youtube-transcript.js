#!/usr/bin/env node
/**
 * youtube-transcript.js — Cross-platform YouTube transcript fetcher
 *
 * Fetches clean, timestamped transcripts from any YouTube video.
 * Uses the free youtube-transcript.ai API (no API key required).
 *
 * Usage:
 *   node shared/scripts/youtube-transcript.js <video-id-or-url>
 *   node shared/scripts/youtube-transcript.js <video-id-or-url> --lang es
 *
 * Programmatic (ESM):
 *   import { fetchTranscript } from './youtube-transcript.js';
 *   const transcript = await fetchTranscript('GarWqdHzwac', 'es');
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

import https from 'https';
import http from 'http';

const API_HOST = 'youtube-transcript.ai';

function parseVideoId(input) {
  input = input.trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  throw new Error(
    'Could not extract video ID. Provide a YouTube URL or an 11-character video ID.'
  );
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

function removeRepeatedNgrams(text) {
  const words = text.split(/\s+/);
  const out = [];
  let i = 0;

  while (i < words.length) {
    let bestN = 0;
    let bestReps = 0;

    for (let n = 1; n <= 12 && i + 2 * n <= words.length; n++) {
      const a = words.slice(i, i + n).join(' ');
      const b = words.slice(i + n, i + 2 * n).join(' ');
      if (a === b) {
        let reps = 1;
        while (i + n * (reps + 1) <= words.length &&
               a === words.slice(i + n * reps, i + n * (reps + 1)).join(' ')) {
          reps++;
        }
        if (reps > bestReps) {
          bestN = n;
          bestReps = reps;
        }
      }
    }

    if (bestReps > 0) {
      for (let w = 0; w < bestN; w++) {
        out.push(words[i + w]);
      }
      i += bestN * (1 + bestReps);
    } else {
      out.push(words[i]);
      i++;
    }
  }

  return out.join(' ');
}

async function fetchTranscript(videoId, lang = 'es') {
  const url = `https://${API_HOST}/transcript/${videoId}.txt?lang=${lang}`;
  const raw = await httpGet(url);

  // Parse header
  const lines = raw.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## Transcript')) {
      bodyStart = i + 1;
      break;
    }
  }

  const titleMatch = raw.match(/^# Transcript: (.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

  const metaMatch = raw.match(/^Language: (.+?) · Duration: (.+?) · Words: (.+)$/m);
  const language = metaMatch ? metaMatch[1] : lang;
  const duration = metaMatch ? metaMatch[2] : '';
  const wordCount = metaMatch ? parseInt(metaMatch[3], 10) : 0;

  // Parse segments with timestamps
  const bodyLines = lines.slice(bodyStart).filter(l => l.trim());
  const segments = bodyLines.map(line => {
    const tsMatch = line.match(/^\[(\d+:\d+)\]\s*(.*)/);
    if (tsMatch) {
      return { timestamp: tsMatch[1], text: tsMatch[2].trim() };
    }
    return null;
  }).filter(Boolean);

  // Deduplicate consecutive identical segments
  const deduped = [];
  for (const seg of segments) {
    const last = deduped[deduped.length - 1];
    if (!last || last.text !== seg.text) {
      deduped.push(seg);
    }
  }

  // Remove word-level repeated n-grams (auto-gen artifact)
  for (const seg of deduped) {
    seg.text = removeRepeatedNgrams(seg.text);
  }

  const cleanText = deduped.map(s => s.text).join(' ');

  return {
    videoId,
    title,
    language,
    duration,
    wordCount,
    segments: deduped,
    text: cleanText,
    raw,
  };
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const help = `
Usage:
  node shared/scripts/youtube-transcript.js <video-id-or-url> [--lang <language>]

Examples:
  node shared/scripts/youtube-transcript.js GarWqdHzwac
  node shared/scripts/youtube-transcript.js https://www.youtube.com/watch?v=GarWqdHzwac --lang en
`;

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(help);
    process.exit(0);
  }

  const langIndex = args.indexOf('--lang');
  const lang = langIndex >= 0 && args[langIndex + 1] ? args[langIndex + 1] : 'es';
  const input = args[0];

  try {
    const videoId = parseVideoId(input);
    const transcript = await fetchTranscript(videoId, lang);

    console.log(`# ${transcript.title}`);
    console.log(`Language: ${transcript.language}`);
    console.log(`Duration: ${transcript.duration}`);
    console.log(`Words: ${transcript.wordCount}`);
    console.log('');
    console.log(transcript.text);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { fetchTranscript, parseVideoId };
