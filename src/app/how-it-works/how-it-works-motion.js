/**
 * Candidate A motion, scoped to the standalone How It Works body.
 * The frozen thresholds, sequence, and state transitions are preserved.
 */
export function initHowItWorksMotion(root) {
  if (!root || typeof window === 'undefined') return () => {};

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const queryAll = (selector) => Array.from(root.querySelectorAll(selector));
  const query = (selector) => root.querySelector(selector);

  if (reducedMotion) {
    query('#statusPillCreate')?.classList.add('is-ready');
    query('#card-stage-03')?.classList.add('is-approved');
    query('#statusPillRespond')?.classList.add('is-approved');
    query('#clientActionBox')?.classList.add('is-confirmed');
    queryAll('.segment-progress').forEach((progress) => {
      progress.style.transform = 'scaleY(1)';
    });
    return () => {};
  }

  const stages = queryAll('.story-stage, .story-stage-reversed, .narrative-bridge');
  const trackPillYou = query('#trackPillYou');
  const trackPillClient = query('#trackPillClient');
  const statusPillCreate = query('#statusPillCreate');
  const cardStage03 = query('#card-stage-03');
  const statusPillRespond = query('#statusPillRespond');
  const clientActionBox = query('#clientActionBox');

  let currentActiveStage = null;
  let pendingTimers = [];
  let rafScheduled = false;

  function clearPendingTimers() {
    pendingTimers.forEach((id) => window.clearTimeout(id));
    pendingTimers = [];
  }

  function isElementInActiveZone(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight;
    return rect.bottom > vh * 0.15 && rect.top < vh * 0.85;
  }

  function syncState() {
    const vh = window.innerHeight;
    const focusLine = vh * 0.52;
    const nodeRects = stages.map((stage) => {
      const node = stage.querySelector('.node-dot') || stage.querySelector('.pause-indicator');
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { center: rect.top + rect.height / 2, top: rect.top, bottom: rect.bottom };
    });

    let activeIdx = -1;
    for (let i = 0; i < stages.length; i += 1) {
      if (nodeRects[i] && nodeRects[i].center <= focusLine + 8) activeIdx = i;
    }
    if (nodeRects[0] && nodeRects[0].center > focusLine + 80) activeIdx = -1;

    const progressValues = new Array(stages.length).fill(0);
    for (let i = 0; i < stages.length; i += 1) {
      if (activeIdx === -1 || i > activeIdx) {
        progressValues[i] = 0;
      } else if (i < activeIdx) {
        progressValues[i] = 1;
      } else {
        const nextIdx = i + 1;
        if (nextIdx >= stages.length) {
          progressValues[i] = 1;
        } else if (nodeRects[i] && nodeRects[nextIdx]) {
          const currentCenter = nodeRects[i].center;
          const nextCenter = nodeRects[nextIdx].center;
          const span = nextCenter - currentCenter;
          if (span > 0) {
            const rawProgress = (focusLine - currentCenter) / span;
            progressValues[i] = Math.max(0, Math.min(1, rawProgress * 1.05));
          }
        }
      }
    }

    const dominantStage = activeIdx >= 0 ? stages[activeIdx] : null;
    if (dominantStage !== currentActiveStage) {
      currentActiveStage = dominantStage;
      clearPendingTimers();

      stages.forEach((stage, index) => {
        if (index === activeIdx) {
          stage.classList.add('is-active');
          stage.classList.remove('is-complete');
        } else if (activeIdx >= 0 && index < activeIdx) {
          stage.classList.remove('is-active');
          stage.classList.add('is-complete');
        } else {
          stage.classList.remove('is-active');
          stage.classList.remove('is-complete');
        }
      });

      if (dominantStage && trackPillYou && trackPillClient) {
        const owner = dominantStage.getAttribute('data-owner');
        if (owner === 'client') {
          trackPillYou.classList.remove('is-highlighted');
          trackPillClient.classList.add('is-highlighted');
        } else if (owner === 'handoff') {
          trackPillYou.classList.add('is-highlighted');
          trackPillClient.classList.add('is-highlighted');
        } else {
          trackPillYou.classList.add('is-highlighted');
          trackPillClient.classList.remove('is-highlighted');
        }
      }

      if (dominantStage?.id === 'stage-create' && statusPillCreate) {
        const timer = window.setTimeout(() => {
          if (currentActiveStage?.id === 'stage-create' && isElementInActiveZone(dominantStage)) {
            statusPillCreate.classList.add('is-ready');
          }
        }, 260);
        pendingTimers.push(timer);
      }

      if (dominantStage?.id === 'stage-respond' && cardStage03) {
        const timer = window.setTimeout(() => {
          if (currentActiveStage?.id === 'stage-respond' && isElementInActiveZone(dominantStage)) {
            cardStage03.classList.add('is-approved');
            statusPillRespond?.classList.add('is-approved');
            clientActionBox?.classList.add('is-confirmed');
          }
        }, 300);
        pendingTimers.push(timer);
      }
    }

    stages.forEach((stage, index) => {
      const progress = stage.querySelector('.segment-progress');
      if (progress) progress.style.setProperty('--segment-progress', progressValues[index].toFixed(3));
    });
  }

  let disposed = false;
  let resizeFrame = null;
  const onScrollOrResize = () => {
    if (rafScheduled || disposed) return;
    rafScheduled = true;
    resizeFrame = window.requestAnimationFrame(() => {
      rafScheduled = false;
      if (!disposed) syncState();
    });
  };

  window.__corvioz_sync_motion = syncState;
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  syncState();

  return () => {
    disposed = true;
    clearPendingTimers();
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    window.removeEventListener('scroll', onScrollOrResize);
    window.removeEventListener('resize', onScrollOrResize);
    if (window.__corvioz_sync_motion === syncState) delete window.__corvioz_sync_motion;
  };
}
