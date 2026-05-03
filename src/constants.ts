import { QuizQuestion } from './types';

export function generateRandomMathQuestion(id: number, type: number, difficulty: 'easy' | 'medium' | 'hard'): QuizQuestion {
  let res = 0;
  let title = "Solve the problem according to algorithm";
  let description = "Follow the flowchart to find the correct output.";
  let flowchartNodes: any[] = [];
  let flowchartEdges: any[] = [];

  // DIFFICULTY SCALING
  const range = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50;
  const multRange = difficulty === 'easy' ? 4 : 9;

  if (type === 0) {
    // LINEAR
    const a = Math.floor(Math.random() * range) + 2;
    const b = Math.floor(Math.random() * range) + 2;
    if (difficulty === 'easy') {
      res = a + b;
      flowchartNodes = [
        { id: 'l1', type: 'PROCESS', label: [`x = ${a}`, `y = ${b}`], x: 250, y: 80, width: 140, height: 60 },
        { id: 'l2', type: 'PROCESS', label: [`res = x + y`], x: 250, y: 200, width: 140, height: 50 },
        { id: 'l3', type: 'OUTPUT', label: ['res'], x: 250, y: 320, width: 80, height: 60 },
      ];
    } else {
      const c = Math.floor(Math.random() * multRange) + 2;
      res = a * c + b;
      flowchartNodes = [
        { id: 'l1', type: 'PROCESS', label: [`x = ${a} * ${c}`], x: 250, y: 80, width: 140, height: 60 },
        { id: 'l2', type: 'PROCESS', label: [`res = x + ${b}`], x: 250, y: 200, width: 140, height: 50 },
        { id: 'l3', type: 'OUTPUT', label: ['res'], x: 250, y: 320, width: 80, height: 60 },
      ];
    }
    flowchartEdges = [
      { from: 'l1', to: 'l2', fromSide: 'bottom', toSide: 'top' },
      { from: 'l2', to: 'l3', fromSide: 'bottom', toSide: 'top' },
    ];
  } else if (type === 1) {
    // BRANCHING
    const x = Math.floor(Math.random() * range) + 5;
    const threshold = Math.floor(range * 0.6);
    if (x > threshold) {
      res = difficulty === 'hard' ? x * 2 : x + 5;
    } else {
      res = difficulty === 'hard' ? x - 2 : x + 2;
    }
    flowchartNodes = [
      { id: 'b1', type: 'PROCESS', label: [`x = ${x}`], x: 250, y: 60, width: 140, height: 60 },
      { id: 'b2', type: 'DECISION', label: [`x > ${threshold}?`], x: 250, y: 160, width: 120, height: 80 },
      { id: 'b3', type: 'PROCESS', label: [`res = ${difficulty === 'hard' ? 'x * 2' : 'x + 5'}`], x: 120, y: 280, width: 120, height: 50 },
      { id: 'b4', type: 'PROCESS', label: [`res = ${difficulty === 'hard' ? 'x - 2' : 'x + 2'}`], x: 380, y: 280, width: 120, height: 50 },
      { id: 'b5', type: 'OUTPUT', label: ['res'], x: 250, y: 380, width: 80, height: 50 },
    ];
    flowchartEdges = [
      { from: 'b1', to: 'b2', fromSide: 'bottom', toSide: 'top' },
      { from: 'b2', to: 'b3', fromSide: 'left', toSide: 'top', label: 'YES' },
      { from: 'b2', to: 'b4', fromSide: 'right', toSide: 'top', label: 'NO' },
      { from: 'b3', to: 'b5', fromSide: 'bottom', toSide: 'top' },
      { from: 'b4', to: 'b5', fromSide: 'bottom', toSide: 'top' },
    ];
  } else {
    // LOOP
    const val = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 5 : 8;
    const count = difficulty === 'easy' ? 2 : 3;
    res = val * count;
    flowchartNodes = [
      { id: 'i1', type: 'PROCESS', label: [`S = 0`, `n = ${count}`], x: 250, y: 50, width: 140, height: 60 },
      { id: 'i2', type: 'DECISION', label: [`n > 0?`], x: 250, y: 150, width: 120, height: 80 },
      { id: 'i3', type: 'PROCESS', label: [`S = S + ${val}`, `n = n - 1`], x: 250, y: 270, width: 140, height: 60 },
      { id: 'i4', type: 'OUTPUT', label: ['S'], x: 420, y: 150, width: 60, height: 50 },
    ];
    flowchartEdges = [
      { from: 'i1', to: 'i2', fromSide: 'bottom', toSide: 'top' },
      { from: 'i2', to: 'i3', fromSide: 'bottom', toSide: 'top', label: 'YES' },
      { from: 'i2', to: 'i4', fromSide: 'right', toSide: 'left', label: 'NO' },
      { from: 'i3', to: 'i2', fromSide: 'left', toSide: 'left', path: [{x: 80, y: 270}, {x: 80, y: 150}] },
    ];
  }

  const options = [res.toString()];
  while (options.length < 4) {
    const wrong = res + (Math.floor(Math.random() * 11) - 5);
    if (wrong !== res && !options.includes(wrong.toString()) && wrong >= 0) {
      options.push(wrong.toString());
    }
  }
  
  const shuffled = options.sort(() => Math.random() - 0.5);
  return {
    id, title, description,
    flowchart: { nodes: flowchartNodes, edges: flowchartEdges },
    options: shuffled,
    correctAnswer: shuffled.indexOf(res.toString())
  };
}

export const QUESTIONS: QuizQuestion[] = []; // Empty, will be initialized in App.tsx


