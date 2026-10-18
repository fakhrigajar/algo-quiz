export const QUESTIONS_PER_LEVEL = 10;
export const LEVELS = ['easy', 'medium', 'hard'];
export const TOTAL_QUESTIONS = QUESTIONS_PER_LEVEL * LEVELS.length;
export const POINTS = {
  easy: 1,
  medium: 2,
  hard: 3
};
/* ------------------------------------------------------------------ *
 * Random helpers
 * ------------------------------------------------------------------ */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[rand(0, arr.length - 1)];
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/* ------------------------------------------------------------------ *
 * Node / edge factories. Layouts use explicit connector lanes; the renderer fits their full bounds.
 * ------------------------------------------------------------------ */
const P = (id, label, x, y, width = 160) => ({
  id,
  type: 'PROCESS',
  label,
  x,
  y,
  width,
  height: label.length > 1 ? label.length * 26 + 12 : 46
});
const D = (id, label, x, y, width = 140, height = 72) => ({
  id,
  type: 'DECISION',
  label: [label],
  x,
  y,
  width,
  height
});
const O = (id, label, x, y, width = 84, height = 54) => ({
  id,
  type: 'OUTPUT',
  label: [label],
  x,
  y,
  width,
  height
});
const E = (from, to, fromSide, toSide, label, path) => ({
  from,
  to,
  fromSide,
  toSide,
  label,
  path
});
/** Width that comfortably fits the longest monospace label in a box. */
const fit = (labels, min = 150, max = 230) => {
  const longest = labels.reduce((m, l) => Math.max(m, l.length), 0);
  return Math.max(min, Math.min(max, Math.round(longest * 8.2 + 34)));
};
/* ------------------------------------------------------------------ *
 * Reusable chart skeletons
 * ------------------------------------------------------------------ */
/** Straight top-to-bottom chain of PROCESS boxes ending in an OUTPUT. */
function chainChart(steps, outLabel) {
  const width = fit(steps.flat());
  const count = steps.length + 1;
  const top = 60;
  const bottom = 440;
  const gap = (bottom - top) / (count - 1);
  const nodes = steps.map((labels, i) => P(`s${i}`, labels, 250, Math.round(top + i * gap), width));
  nodes.push(O('out', outLabel, 250, bottom, Math.max(84, outLabel.length * 11 + 50)));
  const edges = [];
  for (let i = 0; i < steps.length - 1; i++) edges.push(E(`s${i}`, `s${i + 1}`, 'bottom', 'top'));
  edges.push(E(`s${steps.length - 1}`, 'out', 'bottom', 'top'));
  return {
    nodes,
    edges
  };
}
/** if / else with the two arms merging into a single OUTPUT. */
function branchChart(init, condition, yesLabel, noLabel, outLabel) {
  return {
    nodes: [P('b_init', init, 250, 55, fit(init)), D('b_cond', condition, 250, 155, Math.max(140, Math.min(190, condition.length * 10 + 44))), P('b_yes', [yesLabel], 85, 275, fit([yesLabel], 130, 150)), P('b_no', [noLabel], 415, 275, fit([noLabel], 130, 150)), O('b_out', outLabel, 250, 400)],
    edges: [E('b_init', 'b_cond', 'bottom', 'top'), E('b_cond', 'b_yes', 'left', 'top', 'YES'), E('b_cond', 'b_no', 'right', 'top', 'NO'), E('b_yes', 'b_out', 'bottom', 'left', undefined, [{
      x: 85,
      y: 400
    }]), E('b_no', 'b_out', 'bottom', 'right', undefined, [{
      x: 415,
      y: 400
    }])]
  };
}
/** Cascading three-way branch: two decisions, three result boxes, one OUTPUT. */
function branch3Chart(init, cond1, cond2, resA, resB, resC, outLabel) {
  return {
    nodes: [P('t_init', init, 250, 42, fit(init)), D('t_d1', cond1, 250, 120, 130, 68), P('t_a', [resA], 70, 120, 120), D('t_d2', cond2, 250, 235, 130, 68), P('t_b', [resB], 430, 235, 120), P('t_c', [resC], 250, 345, 130), O('t_out', outLabel, 250, 430)],
    edges: [E('t_init', 't_d1', 'bottom', 'top'), E('t_d1', 't_a', 'left', 'right', 'YES'), E('t_d1', 't_d2', 'bottom', 'top', 'NO'), E('t_d2', 't_b', 'right', 'left', 'YES'), E('t_d2', 't_c', 'bottom', 'top', 'NO'), E('t_c', 't_out', 'bottom', 'top'), E('t_a', 't_out', 'bottom', 'left', undefined, [{
      x: 70,
      y: 430
    }]), E('t_b', 't_out', 'bottom', 'right', undefined, [{
      x: 430,
      y: 430
    }])]
  };
}
/** while-loop: init -> condition -> body -> back to condition, exit to OUTPUT. */
function loopChart(init, condition, body, outLabel) {
  const condW = Math.max(140, Math.min(190, condition.length * 10 + 46));
  const bodyW = fit(body, 170, 200);
  return {
    nodes: [P('lp_init', init, 250, 55, fit(init, 160, 200)), D('lp_cond', condition, 250, 160, condW, 78), P('lp_body', body, 250, 290, bodyW), O('lp_out', outLabel, 420, 160, Math.max(76, outLabel.length * 11 + 46))],
    edges: [E('lp_init', 'lp_cond', 'bottom', 'top'), E('lp_cond', 'lp_body', 'bottom', 'top', 'YES'), E('lp_cond', 'lp_out', 'right', 'left', 'NO'), E('lp_body', 'lp_cond', 'left', 'left', undefined, [{
      x: 70,
      y: 290
    }, {
      x: 70,
      y: 160
    }])]
  };
}
/** while-loop with an if inside the body. */
function loopWithIfChart(init, loopCond, innerCond, hit, step, outLabel) {
  return {
    nodes: [P('c_init', init, 250, 48, fit(init, 150, 190)), D('c_loop', loopCond, 250, 145, Math.max(140, Math.min(180, loopCond.length * 10 + 46)), 72), D('c_if', innerCond, 250, 262, Math.max(150, Math.min(190, innerCond.length * 10 + 46)), 74), P('c_hit', [hit], 80, 262, 130), P('c_step', [step], 250, 372, 140), O('c_out', outLabel, 420, 145, Math.max(76, outLabel.length * 11 + 46))],
    edges: [E('c_init', 'c_loop', 'bottom', 'top'), E('c_loop', 'c_if', 'bottom', 'top', 'YES'), E('c_loop', 'c_out', 'right', 'left', 'NO'), E('c_if', 'c_hit', 'left', 'right', 'YES'), E('c_if', 'c_step', 'bottom', 'top', 'NO'), E('c_hit', 'c_step', 'bottom', 'left', undefined, [{
      x: 80,
      y: 372
    }]), E('c_step', 'c_loop', 'bottom', 'left', undefined, [{
      x: 250,
      y: 425
    }, {
      x: -20,
      y: 425
    }, {
      x: -20,
      y: 145
    }])]
  };
}
/** Two chained comparisons used by the min / max questions. */
function compareChart(init, cond1, cond2, takeA, takeB, takeC, outLabel) {
  return {
    nodes: [P('m_init', init, 250, 42, fit(init, 170, 240)), D('m_d1', cond1, 250, 125, 120, 68), P('m_a', [takeA], 70, 125, 110), P('m_b', [takeB], 430, 125, 110), D('m_d2', cond2, 250, 255, 120, 68), P('m_c', [takeC], 250, 350, 120), O('m_out', outLabel, 250, 435)],
    edges: [E('m_init', 'm_d1', 'bottom', 'top'), E('m_d1', 'm_a', 'left', 'right', 'YES'), E('m_d1', 'm_b', 'right', 'left', 'NO'), E('m_a', 'm_d2', 'bottom', 'left', undefined, [{
      x: 70,
      y: 255
    }]), E('m_b', 'm_d2', 'bottom', 'top', undefined, [{
      x: 430,
      y: 210
    }, {
      x: 250,
      y: 210
    }]), E('m_d2', 'm_c', 'bottom', 'top', 'YES'), E('m_c', 'm_out', 'bottom', 'top'), E('m_d2', 'm_out', 'right', 'right', 'NO', [{
      x: 430,
      y: 255
    }, {
      x: 430,
      y: 435
    }])]
  };
}
/* ------------------------------------------------------------------ *
 * Question generators
 * ------------------------------------------------------------------ */
const GENERATORS = [/* 1 — straight-line arithmetic ---------------------------------- */
{
  key: 'linear',
  title: 'Trace the sequential calculation',
  description: 'Execute every box from top to bottom and report the value that reaches the output.',
  build: d => {
    const a = rand(2, d === 'easy' ? 9 : d === 'medium' ? 15 : 24);
    const b = rand(2, d === 'easy' ? 9 : d === 'medium' ? 15 : 24);
    if (d === 'easy') {
      return {
        answer: String(a + b),
        chart: chainChart([[`x = ${a}`, `y = ${b}`], ['res = x + y']], 'res')
      };
    }
    if (d === 'medium') {
      const c = rand(2, 5);
      return {
        answer: String(a * c + b),
        chart: chainChart([[`x = ${a}`, `y = ${b}`], ['x = x * ' + c], ['res = x + y']], 'res')
      };
    }
    const c = rand(2, 6);
    const k = rand(1, 9);
    const e = rand(2, 4);
    const x = a * c + k;
    const y = b * e;
    const hi = Math.max(x, y);
    const lo = Math.min(x, y);
    return {
      answer: String(hi - lo),
      chart: chainChart([[`x = ${a}`, `y = ${b}`], [`x = x * ${c} + ${k}`], [`y = y * ${e}`], [x >= y ? 'res = x - y' : 'res = y - x']], 'res')
    };
  }
}, /* 2 — single if / else ------------------------------------------ */
{
  key: 'branch',
  title: 'Follow the conditional branch',
  description: 'Evaluate the condition, take the matching arm and report the printed value.',
  build: d => {
    const x = rand(3, d === 'easy' ? 14 : d === 'medium' ? 30 : 60);
    const flavour = pick(['gt', 'lt', 'equal']);
    const t = d === 'easy' ? rand(5, 12) : d === 'medium' ? rand(10, 26) : rand(20, 50);
    let cond;
    let takesYes;
    if (flavour === 'gt') {
      cond = `x > ${t}?`;
      takesYes = x > t;
    } else if (flavour === 'lt') {
      cond = `x < ${t}?`;
      takesYes = x < t;
    } else {
      cond = `x == ${t}?`;
      takesYes = x === t;
    }
    const yes = d === 'easy' ? {
      text: 'res = x + 5',
      value: x + 5
    } : d === 'medium' ? {
      text: 'res = x * 2',
      value: x * 2
    } : {
      text: 'res = x * 3 - 4',
      value: x * 3 - 4
    };
    const no = d === 'easy' ? {
      text: 'res = x + 2',
      value: x + 2
    } : d === 'medium' ? {
      text: 'res = x + 9',
      value: x + 9
    } : {
      text: 'res = x * 2 + 7',
      value: x * 2 + 7
    };
    return {
      answer: String(takesYes ? yes.value : no.value),
      chart: branchChart([`x = ${x}`], cond, yes.text, no.text, 'res')
    };
  }
}, /* 3 — cascading three-way branch --------------------------------- */
{
  key: 'branch3',
  title: 'Resolve the cascading conditions',
  description: 'Only the first condition that succeeds runs. Report the value that is printed.',
  build: d => {
    const top = d === 'easy' ? 20 : d === 'medium' ? 40 : 80;
    const x = rand(2, top);
    const t1 = Math.round(top * 0.66);
    const t2 = Math.round(top * 0.33);
    const kA = rand(2, 9);
    const kB = rand(2, 9);
    const kC = rand(2, 9);
    const arms = d === 'hard' ? [{
      text: `res = x * ${kA}`,
      value: x * kA
    }, {
      text: `res = x - ${kB}`,
      value: x - kB
    }, {
      text: `res = x + ${kC}`,
      value: x + kC
    }] : [{
      text: `res = x + ${kA}`,
      value: x + kA
    }, {
      text: `res = x + ${kB}`,
      value: x + kB
    }, {
      text: `res = ${kC}`,
      value: kC
    }];
    const chosen = x > t1 ? arms[0] : x > t2 ? arms[1] : arms[2];
    return {
      answer: String(chosen.value),
      chart: branch3Chart([`x = ${x}`], `x > ${t1}?`, `x > ${t2}?`, arms[0].text, arms[1].text, arms[2].text, 'res')
    };
  }
}, /* 4 — accumulating loop ------------------------------------------ */
{
  key: 'loopSum',
  title: 'Unroll the accumulator loop',
  description: 'Run the loop to completion and report the accumulated total.',
  build: d => {
    if (d === 'easy') {
      const k = rand(2, 7);
      const n = rand(2, 4);
      return {
        answer: String(k * n),
        chart: loopChart([`S = 0`, `n = ${n}`], 'n > 0?', [`S = S + ${k}`, 'n = n - 1'], 'S')
      };
    }
    if (d === 'medium') {
      const n = rand(4, 7);
      return {
        answer: String(n * (n + 1) / 2),
        chart: loopChart([`S = 0`, `i = 1`], `i <= ${n}?`, ['S = S + i', 'i = i + 1'], 'S')
      };
    }
    const n = rand(4, 7);
    const k = rand(2, 5);
    const start = rand(2, 12);
    return {
      answer: String(start + k * n * (n + 1) / 2),
      chart: loopChart([`S = ${start}`, `i = 1`], `i <= ${n}?`, [`S = S + i * ${k}`, 'i = i + 1'], 'S')
    };
  }
}, /* 5 — multiplying loop ------------------------------------------- */
{
  key: 'loopProduct',
  title: 'Evaluate the repeated product',
  description: 'The loop multiplies on every pass. Report the final product.',
  build: d => {
    if (d === 'easy') {
      const n = rand(2, 4);
      return {
        answer: String(Math.pow(2, n)),
        chart: loopChart(['P = 1', 'i = 1'], `i <= ${n}?`, ['P = P * 2', 'i = i + 1'], 'P')
      };
    }
    if (d === 'medium') {
      const k = rand(2, 4);
      const n = rand(2, 4);
      return {
        answer: String(Math.pow(k, n)),
        chart: loopChart(['P = 1', 'i = 1'], `i <= ${n}?`, [`P = P * ${k}`, 'i = i + 1'], 'P')
      };
    }
    const n = rand(4, 6);
    let p = 1;
    for (let i = 2; i <= n; i++) p *= i;
    return {
      answer: String(p),
      chart: loopChart(['P = 1', 'i = 2'], `i <= ${n}?`, ['P = P * i', 'i = i + 1'], 'P')
    };
  }
}, /* 6 — loop containing an if -------------------------------------- */
{
  key: 'loopCounter',
  title: 'Count the qualifying values',
  description: 'The loop tests every value on its way through. Report the final counter.',
  build: d => {
    const n = d === 'easy' ? rand(6, 10) : d === 'medium' ? rand(12, 20) : rand(18, 30);
    const k = d === 'easy' ? rand(2, 3) : rand(3, 5);
    if (d === 'hard') {
      let sum = 0;
      for (let i = 1; i <= n; i++) if (i > k) sum += i;
      return {
        answer: String(sum),
        chart: loopWithIfChart(['S = 0', 'i = 1'], `i <= ${n}?`, `i > ${k}?`, 'S = S + i', 'i = i + 1', 'S')
      };
    }
    let c = 0;
    for (let i = 1; i <= n; i++) if (i > k) c++;
    return {
      answer: String(c),
      chart: loopWithIfChart(['c = 0', 'i = 1'], `i <= ${n}?`, `i > ${k}?`, 'c = c + 1', 'i = i + 1', 'c')
    };
  }
}, /* 7 — variable swap / rotation ----------------------------------- */
{
  key: 'swap',
  title: 'Track the variables through the swap',
  description: 'The assignments move values between variables. Report what is finally printed.',
  build: d => {
    const a = rand(2, 12);
    const b = rand(13, 28);
    if (d === 'easy') {
      return {
        answer: String(a - b),
        // The tempting wrong answer is the one you get by ignoring the swap.
        distractors: [String(b - a)],
        chart: chainChart([[`a = ${a}`, `b = ${b}`], ['t = a', 'a = b', 'b = t'], ['res = b - a']], 'res')
      };
    }
    if (d === 'medium') {
      return {
        answer: String(2 * b - a),
        distractors: [String(2 * a - b)],
        chart: chainChart([[`a = ${a}`, `b = ${b}`], ['t = a', 'a = b', 'b = t'], ['res = a * 2 - b']], 'res')
      };
    }
    const c = rand(29, 45);
    // a,b,c -> b,c,a  =>  res = a + c = b + a(original)
    return {
      answer: String(b + a),
      distractors: [String(a + c)],
      chart: chainChart([[`a = ${a}`, `b = ${b}`, `c = ${c}`], ['t = a', 'a = b,  b = c', 'c = t'], ['res = a + c']], 'res')
    };
  }
}, /* 8 — largest / smallest of three -------------------------------- */
{
  key: 'minmax',
  title: 'Select the extreme value',
  description: 'Two comparisons narrow three numbers down to one. Report the printed value.',
  build: d => {
    const top = d === 'easy' ? 20 : d === 'medium' ? 60 : 120;
    const a = rand(2, top);
    let b = rand(2, top);
    let c = rand(2, top);
    while (b === a) b = rand(2, top);
    while (c === a || c === b) c = rand(2, top);
    const wantMax = d === 'hard' ? Math.random() < 0.5 : true;
    const answer = wantMax ? Math.max(a, b, c) : Math.min(a, b, c);
    const op = wantMax ? '>' : '<';
    return {
      answer: String(answer),
      chart: compareChart([`a = ${a}, b = ${b}, c = ${c}`], `a ${op} b?`, `c ${op} m?`, 'm = a', 'm = b', 'm = c', 'm')
    };
  }
}, /* 9 — squares and arithmetic */
{
  key: 'squares',
  title: 'Calculate with squared values',
  description: 'Multiply each number by itself, then follow the arithmetic to the output.',
  build: d => {
    const a = rand(2, d === 'easy' ? 6 : 12);
    const b = rand(2, d === 'easy' ? 5 : 9);
    const k = rand(2, 5);
    const expression = d === 'easy' ? 'res = x + y' : d === 'medium' ? 'res = x - y' : `res = x * ${k} - y`;
    const value = d === 'easy' ? a * a + b * b : d === 'medium' ? a * a - b * b : a * a * k - b * b;
    return {
      answer: String(value),
      chart: chainChart([[`a = ${a}`, `b = ${b}`], ['x = a * a', 'y = b * b'], [expression]], 'res'),
    };
  }
}, /* 10 — Fibonacci-style recurrence -------------------------------- */
{
  key: 'sequence',
  title: 'Advance the recurrence',
  description: 'Each pass builds the next term from the previous two. Report the final value of b.',
  build: d => {
    const a0 = rand(1, 4);
    const b0 = rand(1, 5);
    const n = d === 'easy' ? 3 : d === 'medium' ? 4 : rand(5, 6);
    let a = a0;
    let b = b0;
    for (let i = 1; i <= n; i++) {
      const t = a + b;
      a = b;
      b = t;
    }
    return {
      answer: String(b),
      chart: loopChart([`a = ${a0}`, `b = ${b0}`, 'i = 1'], `i <= ${n}?`, ['t = a + b', 'a = b,  b = t', 'i = i + 1'], 'b')
    };
  }
}, /* 11 — exact division */
{
  key: 'exactDivision',
  title: 'Divide and calculate',
  description: 'Every division is exact. Follow the arithmetic and report the final value.',
  build: d => {
    const divisor = rand(2, d === 'easy' ? 5 : 9);
    const quotient = rand(2, d === 'easy' ? 8 : 16);
    const k = rand(2, 8);
    const n = divisor * quotient;
    const expression = d === 'easy' ? `res = x + ${k}` : d === 'medium' ? `res = x * ${k}` : `res = x * ${k} - ${divisor}`;
    const value = d === 'easy' ? quotient + k : d === 'medium' ? quotient * k : quotient * k - divisor;
    return {
      answer: String(value),
      chart: chainChart([[`n = ${n}`, `d = ${divisor}`], ['x = n / d'], [expression]], 'res'),
    };
  }
}, /* 12 — arithmetic progression */
{
  key: 'progression',
  title: 'Sum the stepped sequence',
  description: 'Add the values in the sequence as the loop advances by a fixed step.',
  build: d => {
    const start = rand(1, d === 'easy' ? 5 : 12);
    const step = rand(2, d === 'easy' ? 3 : 7);
    const count = rand(3, d === 'easy' ? 4 : d === 'medium' ? 6 : 8);
    const last = start + step * (count - 1);
    let total = 0;
    for (let i = start; i <= last; i += step) total += i;
    return {
      answer: String(total),
      chart: loopChart(['S = 0', `i = ${start}`], `i <= ${last}?`, ['S = S + i', `i = i + ${step}`], 'S'),
    };
  }
}];
function buildOptions(answer, custom = []) {
  const opts = new Set([answer]);
  for (const option of shuffle(custom)) {
    if (opts.size === 4) break;
    opts.add(option);
  }
  const n = Number(answer);
  const spread = Math.max(1, Math.round(Math.abs(n) * 0.12));
  for (const delta of shuffle([1, -1, 2, -2, 3, -3, spread, -spread, spread * 2, -spread * 2, 10, -10])) {
    if (opts.size === 4) break;
    if (n >= 0 && n + delta < 0) continue;
    opts.add(String(n + delta));
  }
  for (let k = 1; opts.size < 4; k++) opts.add(String(n + k));
  const options = shuffle([...opts]);
  return {
    options,
    correctAnswer: options.indexOf(answer)
  };
}
const signature = (key, chart) => key + '|' + chart.nodes.map(n => n.label.join(';')).join('|');
function makeQuestion(id, gen, difficulty, seen) {
  let built = gen.build(difficulty);
  for (let attempt = 0; attempt < 15; attempt++) {
    const sig = signature(gen.key, built.chart);
    if (!seen.has(sig)) {
      seen.add(sig);
      break;
    }
    built = gen.build(difficulty);
  }
  return {
    id,
    title: gen.title,
    description: built.note ? gen.description + ' ' + built.note : gen.description,
    flowchart: built.chart,
    ...buildOptions(built.answer, built.distractors)
  };
}
function pickTypes(n) {
  const chosen = [];
  while (chosen.length < n) chosen.push(...shuffle(GENERATORS).slice(0, n - chosen.length));
  return chosen;
}
export function generateQuizSet() {
  const seen = new Set();
  const questions = [];
  for (const difficulty of LEVELS) {
    for (const gen of pickTypes(QUESTIONS_PER_LEVEL)) questions.push(makeQuestion(questions.length + 1, gen, difficulty, seen));
  }
  return questions;
}
export const difficultyForIndex = index => LEVELS[Math.min(LEVELS.length - 1, Math.floor(index / QUESTIONS_PER_LEVEL))];
export const QUESTION_TYPE_COUNT = GENERATORS.length;
