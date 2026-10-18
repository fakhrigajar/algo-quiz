import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

// Exercise the actual App handlers with persistent hook state. Reject any state
// update during rendering, the failure that previously prevented quiz startup.
test('dashboard opens the mistakes page, returns home, and starts a playable quiz', async () => {
  const states = [];
  let cursor = 0;
  let rendering = false;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => {
        assert.equal(rendering, false, 'App must not update state while rendering');
        states[index] = typeof value === 'function' ? value(states[index]) : value;
      }];
    },
    useEffect() {},
  };
  const bundle = await build({
    entryPoints: ['src/App.jsx'], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
    plugins: [{ name: 'app-hooks', setup(builder) {
      builder.onLoad({ filter: /\/App\.jsx$/ }, async ({ path }) => ({
        contents: (await readFile(path, 'utf8')).replace(
          'import React, { useState, useEffect } from "react";',
          'import React from "react"; const { useState, useEffect } = __hooks;'
        ), loader: 'jsx',
      }));
    } }],
  });
  const module = { exports: {} };
  new Function('__hooks', 'require', 'module', 'exports', bundle.outputFiles[0].text)(hooks, createRequire(import.meta.url), module, module.exports);
  const render = () => {
    cursor = 0;
    rendering = true;
    try { return module.exports.default(); }
    finally { rendering = false; }
  };
  const find = (node, predicate) => {
    if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
    if (!node || typeof node !== 'object') return undefined;
    return predicate(node) ? node : find(node.props?.children, predicate);
  };
  let tree = render();
  const home = find(tree, node => typeof node.props?.onStart === 'function');
  assert(home, 'Dashboard exposes Start Challenge');
  home.props.onViewMistakes();
  tree = render();
  const mistakesPage = find(tree, node => typeof node.props?.onBack === 'function');
  assert(mistakesPage, 'View mistakes opens the dedicated page');
  assert.deepEqual(mistakesPage.props.mistakes, []);
  assert.equal(find(tree, node => typeof node.props?.onStart === 'function'), undefined);
  mistakesPage.props.onBack();
  tree = render();
  find(tree, node => typeof node.props?.onStart === 'function').props.onStart();
  tree = render();
  assert(find(tree, node => node.type === 'main' && node.props.className.includes('quiz-layout')));
  const unanswered = find(tree, node => node.props?.id === 'next-step-btn');
  assert.equal(unanswered.props.disabled, true);
  const progressBefore = structuredClone(states[7]);
  find(tree, node => node.props?.id === 'option-0').props.onClick();
  tree = render();
  assert.equal(states[7].answered, progressBefore.answered + 1);
  assert.equal(find(tree, node => node.props?.id === 'next-step-btn').props.disabled, false);
  find(tree, node => node.props?.id === 'next-step-btn').props.onClick();
  tree = render();
  assert.equal(find(tree, node => node.props?.id === 'next-step-btn').props.disabled, true);
  assert.equal(states[7].answered, progressBefore.answered + 1);
});
