export function createFrameScheduler(render, {
  isActive,
  now = () => performance.now(),
  requestFrame = callback => requestAnimationFrame(callback),
  cancelFrame = id => cancelAnimationFrame(id),
  delay = (callback, ms) => setTimeout(callback, ms),
  clearDelay = id => clearTimeout(id)
}) {
  let frame = 0, timer = 0, disposed = false;
  function enqueueFrame() {
    timer = 0;
    if (disposed || !isActive()) return;
    frame = requestFrame(time => {
      frame = 0;
      if (!disposed && isActive()) render(time);
    });
  }
  function cancel() { cancelFrame(frame); clearDelay(timer); frame = timer = 0; }
  return {
    requestAt(deadline) {
      if (disposed || frame || timer || !isActive()) return;
      const wait = Math.max(0, deadline - now() - 2);
      if (wait > 2) timer = delay(enqueueFrame, wait);
      else enqueueFrame();
    },
    cancel,
    dispose() { disposed = true; cancel(); }
  };
}
