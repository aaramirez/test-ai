#!/usr/bin/env node
/**
 * session.test.js — Tests for session management
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSessionId } from '../lib/session.js';

describe('generateSessionId', () => {
  it('generates live session ID with q- prefix', () => {
    const id = generateSessionId('live');
    assert.match(id, /^q-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('generates practice session ID with p- prefix', () => {
    const id = generateSessionId('practice');
    assert.match(id, /^p-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('generates survey session ID with s- prefix', () => {
    const id = generateSessionId('survey');
    assert.match(id, /^s-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('uses x- prefix for unknown mode', () => {
    const id = generateSessionId('unknown');
    assert.match(id, /^x-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId('live'));
    }
    assert.equal(ids.size, 100);
  });
});
