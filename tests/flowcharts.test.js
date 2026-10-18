import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuizSet, TOTAL_QUESTIONS, QUESTION_TYPE_COUNT } from '../src/constants.js';
import { isMathQuestion } from '../src/questionRules.js';
import { edgePoints, chartBounds } from '../src/flowchartGeometry.js';

const segments = points => points.slice(1).map((end, i) => [points[i], end]);
const inside = (value, a, b) => value > Math.min(a, b) && value < Math.max(a, b);
function intersects([a, b], [c, d]) {
  if (a.x === b.x && c.y === d.y) return inside(a.x, c.x, d.x) && inside(c.y, a.y, b.y);
  if (a.y === b.y && c.x === d.x) return inside(c.x, a.x, b.x) && inside(a.y, c.y, d.y);
  if (a.x === b.x && c.x === d.x && a.x === c.x) return Math.max(Math.min(a.y,b.y), Math.min(c.y,d.y)) < Math.min(Math.max(a.y,b.y), Math.max(c.y,d.y));
  if (a.y === b.y && c.y === d.y && a.y === c.y) return Math.max(Math.min(a.x,b.x), Math.min(c.x,d.x)) < Math.min(Math.max(a.x,b.x), Math.max(c.x,d.x));
  return false;
}

test('numeric quizzes use clear orthogonal connectors and bounds centered on the complete chart', () => {
  assert.equal(QUESTION_TYPE_COUNT, 12);
  for (let run = 0; run < 100; run++) {
    const questions = generateQuizSet();
    assert.equal(questions.length, TOTAL_QUESTIONS);
    for (const question of questions) {
      assert(isMathQuestion(question), "Questions must not use remainders or integer division");
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert(question.options.every(option => Number.isFinite(Number(option))));
      const chart = question.flowchart;
      const routes = chart.edges.map(edge => segments(edgePoints(chart, edge)));
      const bounds = chartBounds(chart);
      for (const [i, route] of routes.entries()) {
        for (const [a, b] of route) {
          assert(a.x === b.x || a.y === b.y, 'Connector must be orthogonal');
          assert(a.x > bounds.x && a.y > bounds.y && a.x < bounds.x + bounds.width && a.y < bounds.y + bounds.height);
          for (const node of chart.nodes) {
            if ([chart.edges[i].from, chart.edges[i].to].includes(node.id)) continue;
            const left = node.x - node.width / 2, right = node.x + node.width / 2;
            const top = node.y - node.height / 2, bottom = node.y + node.height / 2;
            const hits = a.x === b.x
              ? inside(a.x, left, right) && Math.max(Math.min(a.y,b.y),top) < Math.min(Math.max(a.y,b.y),bottom)
              : inside(a.y, top, bottom) && Math.max(Math.min(a.x,b.x),left) < Math.min(Math.max(a.x,b.x),right);
            assert(!hits, `Connector passes through ${node.id}`);
          }
        }
        for (let j = i + 1; j < routes.length; j++) {
          assert(!route.some(segment => routes[j].some(other => intersects(segment, other))), `Connectors intersect in ${question.title}`);
        }
      }
    }
  }
});
