#!/usr/bin/env node
/**
 * git-results.js — Git commit + push for quiz/survey result files
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 * Uses execFileSync with array args (no shell).
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Commits and pushes a result file via git.
 * @param {string} filePath - Absolute path to the result file
 * @param {string} mode - 'quiz' or 'survey' (used in commit message prefix)
 * @returns {{ committed: boolean, pushed: boolean, error: string|null }}
 */
export function commitAndPushResult(filePath, mode) {
  if (!existsSync(filePath)) {
    return { committed: false, pushed: false, error: 'File not found' };
  }

  const filename = filePath.split('/').pop();
  const prefix = mode === 'survey' ? 'survey' : 'quiz';

  try {
    execFileSync('git', ['add', filePath], { stdio: 'pipe' });
  } catch (err) {
    return { committed: false, pushed: false, error: `git add failed: ${err.message}` };
  }

  try {
    execFileSync('git', ['commit', '-m', `chore(${prefix}): add results ${filename}`], { stdio: 'pipe' });
  } catch (err) {
    const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
    if (output.includes('nothing to commit') || output.includes('nothing added')) {
      return { committed: false, pushed: false, error: null };
    }
    return { committed: false, pushed: false, error: `git commit failed: ${err.message}` };
  }

  try {
    execFileSync('git', ['push', 'origin', 'main'], { stdio: 'pipe' });
    return { committed: true, pushed: true, error: null };
  } catch (err) {
    return { committed: true, pushed: false, error: `git push failed: ${err.message}` };
  }
}
