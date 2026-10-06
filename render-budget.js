export function createAdaptiveQuality(maximumDpr, onChange) {
  const steps = [maximumDpr, Math.min(maximumDpr, 1.375), Math.min(maximumDpr, 1.25)];
  let quality = 0, slow = 0, fast = 0, changed = 0;
  let started = 0, cost = 0, frames = 0, late = 0;
  function resetWindow(time) { started = time; cost = frames = late = 0; }
  return {
    sample(renderCost, elapsed, time, animated, targetFps = 60) {
      if (!animated || time - changed < 2000) { resetWindow(time); return; }
      // Idle gaps and sparse interactions don't count as missed frames.
      if (!started || time - started > 1500) resetWindow(time);
      cost += renderCost; frames++;
      if (elapsed > 1.6 / targetFps && elapsed < .2) late++;
      if (time - started < 1000) return;
      if (frames >= Math.floor(targetFps * .4)) {
        const overBudget = cost / frames > 8 || late / frames > .2;
        slow = overBudget ? slow + 1 : 0;
        fast = !overBudget && cost / frames < 4 && late / frames < .05 ? fast + 1 : 0;
        const next = slow >= 3 ? Math.min(2, quality + 1) : fast >= 10 && time - changed > 15000 ? Math.max(0, quality - 1) : quality;
        if (next !== quality && steps[next] !== steps[quality]) {
          quality = next; changed = time; slow = fast = 0;
          onChange(steps[quality]);
        }
      }
      resetWindow(time);
    }
  };
}
