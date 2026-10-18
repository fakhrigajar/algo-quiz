import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, readProgress, recordAnswer, recordCompletion, saveProgress, PROGRESS_KEY } from '../src/progress.js';
import { generateQuizSet, difficultyForIndex, POINTS } from '../src/constants.js';
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('answers and reviewable mistakes survive a reload, including unfinished runs', () => {
  const store = storage();
  const question = generateQuizSet()[0];
  const wrong = (question.correctAnswer + 1) % 4;
  const progress = recordAnswer(emptyProgress(), question, wrong, 'easy');
  assert.equal(progress.completed, 0);
  assert.equal(progress.answered, 1);
  assert.equal(progress.correct, 0);
  assert.equal(saveProgress(store, progress), true);
  const loaded = readProgress(store);
  assert.deepEqual(loaded.mistakes[0].question.flowchart, JSON.parse(JSON.stringify(question.flowchart)));
  assert.equal(loaded.mistakes[0].selectedAnswer, wrong);
  assert.equal(loaded.levels.easy.answered, 1);
});

test('completed challenge records weighted score, accuracy and best without losing previous best', () => {
  let progress = emptyProgress();
  const questions = generateQuizSet();
  let score = 0;
  const results = questions.map((question, index) => {
    const difficulty = difficultyForIndex(index);
    progress = recordAnswer(progress, question, question.correctAnswer, difficulty);
    score += POINTS[difficulty];
    return { difficulty, correct: true };
  });
  progress = recordCompletion(progress, score, results);
  assert.equal(progress.bestScore, 60);
  assert.equal(progress.correct, 30);
  assert.equal(progress.mistakes.length, 0);
  assert.equal(progress.recent[0].correct, 30);
  progress = recordCompletion(progress, 10, [{ correct: false }]);
  assert.equal(progress.bestScore, 60);
  assert.equal(progress.completed, 2);
  assert.equal(progress.recent[0].score, 10);
});

test('history is bounded and legacy high scores migrate', () => {
  const store = storage();
  store.setItem('algoflow-highscore', '42');
  let progress = readProgress(store);
  assert.equal(progress.bestScore, 42);
  const question = generateQuizSet()[0];
  for (let index = 0; index < 20; index++) {
    progress = recordAnswer(progress, question, (question.correctAnswer + 1) % 4, 'easy');
    progress = recordCompletion(progress, index, [{ correct: false }]);
  }
  assert.equal(progress.mistakes.length, 12);
  assert.equal(progress.recent.length, 8);
  assert.equal(progress.bestScore, 42);
  assert.equal(saveProgress(store, progress), true);
  assert.equal(readProgress(store).completed, 20);
});

test('unavailable or malformed storage does not interrupt the quiz', () => {
  const unavailable = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(readProgress(unavailable), emptyProgress());
  assert.equal(saveProgress(unavailable, emptyProgress()), false);
  const store = storage();
  store.setItem(PROGRESS_KEY, 'broken json');
  assert.deepEqual(readProgress(store), emptyProgress());
});

test('legacy remainder questions are excluded from saved mistakes without losing scores', () => {
  const store = storage();
  const mathQuestion = generateQuizSet()[0];
  const remainderQuestion = {
    ...mathQuestion,
    title: 'Combine the quotient and the remainder',
    flowchart: { ...mathQuestion.flowchart, nodes: [{ ...mathQuestion.flowchart.nodes[0], label: ['r = a % b'] }] },
  };
  saveProgress(store, {
    ...emptyProgress(), bestScore: 42,
    mistakes: [
      { question: remainderQuestion, selectedAnswer: 0, difficulty: 'easy' },
      { question: mathQuestion, selectedAnswer: 0, difficulty: 'easy' },
    ],
  });
  const loaded = readProgress(store);
  assert.equal(loaded.bestScore, 42);
  assert.equal(loaded.mistakes.length, 1);
  assert.equal(loaded.mistakes[0].question.title, mathQuestion.title);
});
