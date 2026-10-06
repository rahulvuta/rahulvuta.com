import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrameScheduler } from '../render-scheduler.js';

function fixture() {
  let active = true, time = 0, nextId = 1, rendered = 0;
  const frames = new Map(), timers = new Map();
  const scheduler = createFrameScheduler(() => rendered++, {
    isActive: () => active, now: () => time,
    requestFrame: callback => { const id = nextId++; frames.set(id, callback); return id; },
    cancelFrame: id => frames.delete(id),
    delay: (callback, ms) => { const id = nextId++; timers.set(id, {callback, at:time + ms}); return id; },
    clearDelay: id => timers.delete(id)
  });
  return { scheduler, frames, timers, get rendered() { return rendered; },
    setActive(value) { active = value; },
    advance(ms) {
      time += ms;
      for (const [id, item] of [...timers]) if (item.at <= time) { timers.delete(id); item.callback(); }
      for (const [id, callback] of [...frames]) { frames.delete(id); callback(time); }
    }
  };
}

test('idle deadlines do not spin a RAF loop and duplicate requests do not add work', () => {
  const f = fixture();
  f.scheduler.requestAt(250); f.scheduler.requestAt(250);
  assert.equal(f.timers.size, 1); assert.equal(f.frames.size, 0);
  f.advance(200); assert.equal(f.rendered, 0);
  f.advance(50); assert.equal(f.rendered, 1);
  assert.equal(f.timers.size + f.frames.size, 0);
});

test('hidden or mobile state prevents frames, including callbacks queued before suspension', () => {
  const f = fixture();
  f.scheduler.requestAt(250); f.setActive(false); f.scheduler.cancel();
  f.advance(10000); f.scheduler.requestAt(0); f.advance(10000);
  assert.equal(f.rendered, 0); assert.equal(f.timers.size + f.frames.size, 0);
  f.setActive(true); f.scheduler.requestAt(0); f.setActive(false); f.advance(17);
  assert.equal(f.rendered, 0);
  f.setActive(true); f.scheduler.requestAt(0); f.advance(17);
  assert.equal(f.rendered, 1);
});

test('disposing cancels pending work permanently', () => {
  const f = fixture();
  f.scheduler.requestAt(0); f.scheduler.dispose(); f.advance(1000);
  f.scheduler.requestAt(0); f.advance(1000);
  assert.equal(f.rendered, 0); assert.equal(f.frames.size + f.timers.size, 0);
});
