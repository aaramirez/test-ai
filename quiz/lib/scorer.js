#!/usr/bin/env node
/**
 * scorer.js — Scoring engine for single, multiple, and survey questions
 *
 * Cross-platform: macOS, Linux, Windows — zero external dependencies.
 */

export function scoreSingle(selected, correct) {
  if (typeof correct === 'string') {
    return typeof selected === 'string' && selected === correct;
  }
  return selected === correct;
}

export function scoreMultiple(selected, correct) {
  if (!Array.isArray(selected) || !Array.isArray(correct)) return false;
  if (selected.length !== correct.length) return false;
  const sortedSelected = [...selected].sort((a, b) => a - b);
  const sortedCorrect = [...correct].sort((a, b) => a - b);
  return sortedSelected.every((v, i) => v === sortedCorrect[i]);
}

export function scoreSurvey() {
  return null;
}

export function scoreQuestion(question, selected, key) {
  if (question.type === 'survey') {
    return { correct: null };
  }
  if (!key || !key.answers || !key.answers[question.id]) {
    return { correct: false, noKey: true };
  }
  const answer = key.answers[question.id];
  let correct;
  if (question.type === 'multiple') {
    correct = scoreMultiple(selected, answer.correct);
  } else {
    correct = scoreSingle(selected[0], answer.correct);
  }
  return { correct, explanation: answer.explanation };
}

export function calculateResults(questions, selections, key) {
  const results = [];
  let correctCount = 0;
  let totalScoreable = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const sel = selections[i];
    const result = scoreQuestion(q, sel, key);

    results.push({
      id: q.id,
      type: q.type,
      selected: Array.isArray(sel) ? sel : [sel],
      correct: result.correct,
    });

    if (q.type !== 'survey') {
      totalScoreable++;
      if (result.correct) correctCount++;
    }
  }

  return {
    questions: results,
    score: {
      correct: correctCount,
      total: totalScoreable,
      percentage: totalScoreable > 0 ? Math.round((correctCount / totalScoreable) * 100) : 0,
    },
  };
}
