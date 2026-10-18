import { isMathQuestion } from "./questionRules.js";

export const PROGRESS_KEY = 'algoflow-progress-v1';
export const emptyProgress = () => ({ bestScore: 0, completed: 0, answered: 0, correct: 0, levels: {}, recent: [], mistakes: [] });

export function readProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem(PROGRESS_KEY) || 'null');
    const legacyBest = Number(storage.getItem('algoflow-highscore')) || 0;
    if (!data || data.version !== 1) return { ...emptyProgress(), bestScore: Math.max(0, legacyBest) };
    const progress = { ...emptyProgress(), ...data };
    for (const key of ['bestScore', 'completed', 'answered', 'correct']) {
      if (!Number.isFinite(progress[key]) || progress[key] < 0) progress[key] = 0;
    }
    progress.bestScore = Math.max(progress.bestScore, legacyBest);
    progress.recent = Array.isArray(data.recent) ? data.recent.filter(item => item && Number.isFinite(item.score) && Number.isFinite(item.correct) && Number.isFinite(item.total)).slice(0, 8) : [];
    progress.mistakes = Array.isArray(data.mistakes) ? data.mistakes.filter(item => item && item.question?.flowchart?.nodes && item.question?.flowchart?.edges && Array.isArray(item.question?.options) && isMathQuestion(item.question)).slice(0, 12) : [];
    progress.levels = data.levels && typeof data.levels === 'object' ? data.levels : {};
    return progress;
  } catch {
    return emptyProgress();
  }
}

export function recordAnswer(progress, question, selectedAnswer, difficulty, date = new Date().toISOString()) {
  const correct = selectedAnswer === question.correctAnswer;
  const level = progress.levels[difficulty] || { answered: 0, correct: 0 };
  return {
    ...progress,
    answered: progress.answered + 1,
    correct: progress.correct + Number(correct),
    levels: { ...progress.levels, [difficulty]: { answered: level.answered + 1, correct: level.correct + Number(correct) } },
    mistakes: correct ? progress.mistakes : [{ question, selectedAnswer, difficulty, date }, ...progress.mistakes].slice(0, 12),
  };
}

export function recordCompletion(progress, score, results, date = new Date().toISOString()) {
  return {
    ...progress,
    bestScore: Math.max(progress.bestScore, score),
    completed: progress.completed + 1,
    recent: [{ score, correct: results.filter(result => result.correct).length, total: results.length, date }, ...progress.recent].slice(0, 8),
  };
}

export function saveProgress(storage, progress) {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, version: 1 }));
    return true;
  } catch {
    return false;
  }
}
