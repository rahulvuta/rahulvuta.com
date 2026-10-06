import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdaptiveQuality } from '../render-budget.js';

test('sustained overload reduces DPR, respects the floor, and recovers with hysteresis', () => {
  const changes = [];
  const quality = createAdaptiveQuality(1.5, dpr => changes.push(dpr));
  let time = 0;
  const run = (seconds, cost, elapsed = 1 / 60, active = true) => {
    for (let i = 0; i < seconds * 60; i++) { time += 1000 / 60; quality.sample(cost, elapsed, time, active); }
  };
  run(4, 12);
  assert.deepEqual(changes, []);
  run(14, 12);
  assert.deepEqual(changes, [1.375, 1.25]);
  run(8, 1);
  assert.deepEqual(changes, [1.375, 1.25]);
  run(35, 1);
  assert.deepEqual(changes, [1.375, 1.25, 1.375, 1.5]);
});

test('missed frames can reduce resolution even when CPU submission is cheap', () => {
  const changes = [];
  const quality = createAdaptiveQuality(1.5, dpr => changes.push(dpr));
  for (let time = 0; time < 9000; time += 1000 / 30) quality.sample(1, 1 / 30, time, true);
  assert.deepEqual(changes, [1.375]);
});

test('idle work and one slow frame do not degrade quality or upscale a 1x display', () => {
  const changes = [];
  const quality = createAdaptiveQuality(1.5, dpr => changes.push(dpr));
  for (let time = 0; time < 60000; time += 250) quality.sample(40, .25, time, false);
  for (let time = 60000; time < 68000; time += 1000 / 60) quality.sample(time < 60020 ? 40 : 1, 1 / 60, time, true);
  assert.deepEqual(changes, []);
  const lowDpr = createAdaptiveQuality(1, dpr => changes.push(dpr));
  for (let time = 0; time < 20000; time += 1000 / 60) lowDpr.sample(12, 1 / 60, time, true);
  assert.deepEqual(changes, []);
});

test('the 30 FPS alert cadence is healthy, while sustained alert overload can adapt', () => {
  const changes = [];
  const quality = createAdaptiveQuality(1.5, dpr => changes.push(dpr));
  for (let time = 0; time < 15000; time += 1000 / 30) quality.sample(1, 1 / 30, time, true, 30);
  assert.deepEqual(changes, []);
  for (let time = 15000; time < 19000; time += 1000 / 18) quality.sample(12, 1 / 18, time, true, 30);
  assert.deepEqual(changes, [1.375]);
});
