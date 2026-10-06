export function createRenderProfile(renderer, world) {
  const enabled = new URLSearchParams(location.search).has('profile');
  const gl = renderer.getContext();
  const timer = enabled ? gl.getExtension('EXT_disjoint_timer_query_webgl2') : null;
  const pending = [];
  let query = null, start = 0, started = performance.now(), frames = 0, total = 0;
  let pausedAt = null, pausedFrames = 0;
  let cpuSamples = [], gpuSamples = [];
  const percentile = (samples, p) => {
    if (!samples.length) return null;
    const sorted = samples.slice().sort((a, b) => a - b);
    return +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(2);
  };
  const state = { phase: 'baseline', mode: 'continuous', fps: 0, cpuMs: 0, p95CpuMs: 0, gpuMs: null, drawCalls: 0, triangles: 0, geometries: 0, textures: 0, dpr: renderer.getPixelRatio(), dynamicShadows: true, totalFrames: 0, gpuTimerSupported: !!timer };
  function publish(now = performance.now()) {
    state.fps = ['hidden', 'mobile'].includes(state.mode) ? 0 : Math.round(frames * 1000 / Math.max(1, now - started));
    state.cpuMs = percentile(cpuSamples, .5) || 0;
    state.p95CpuMs = percentile(cpuSamples, .95) || 0;
    if (gpuSamples.length) state.gpuMs = percentile(gpuSamples, .5);
    state.drawCalls = renderer.info.render.calls;
    state.triangles = renderer.info.render.triangles;
    state.geometries = renderer.info.memory.geometries;
    state.textures = renderer.info.memory.textures;
    state.dpr = renderer.getPixelRatio();
    state.dynamicShadows = renderer.shadowMap.autoUpdate;
    state.totalFrames = total;
    world.dataset.renderProfile = JSON.stringify(state);
    started = now; frames = 0; cpuSamples = []; gpuSamples = [];
    return state;
  }
  return {
    state,
    begin() {
      start = performance.now();
      if (timer && total % 8 === 0 && pending.length < 4) {
        query = gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
      }
    },
    end() {
      if (query) { gl.endQuery(timer.TIME_ELAPSED_EXT); pending.push(query); query = null; }
      cpuSamples.push(performance.now() - start); frames++; total++;
      if (timer) {
        const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT);
        while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
          const result = pending.shift();
          if (!disjoint) gpuSamples.push(gl.getQueryParameter(result, gl.QUERY_RESULT) / 1e6);
          gl.deleteQuery(result);
        }
      }
      const cost = performance.now() - start;
      if (performance.now() - started >= 1000) publish();
      return cost;
    },
    publish,
    visibility(hidden) {
      if (hidden) { pausedAt = performance.now(); pausedFrames = total; }
      else if (pausedAt !== null) {
        state.lastHiddenMs = Math.round(performance.now() - pausedAt);
        state.lastHiddenFrameDelta = total - pausedFrames;
        pausedAt = null;
      }
    },
    dispose() { for (const item of pending) gl.deleteQuery(item); }
  };
}
