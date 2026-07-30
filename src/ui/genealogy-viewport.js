/** 族谱画布 — 单指/指针平移，滚轮与双指缩放 */

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.5;

export function initGenealogyViewport(viewportEl, innerEl) {
  if (!viewportEl || !innerEl) return null;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  const activePointers = new Map();

  function applyTransform() {
    innerEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function isInteractiveTarget(el) {
    return Boolean(
      el?.closest?.('.genealogy-id-btn, .genealogy-detail-popover, button, a, input, select, textarea')
    );
  }

  function pointerCount() {
    return activePointers.size;
  }

  function pinchDistance() {
    if (activePointers.size < 2) return 0;
    const pts = [...activePointers.values()];
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }

  function onPointerDown(e) {
    if (isInteractiveTarget(e.target)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointerCount() === 1) {
      panning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panOriginX = tx;
      panOriginY = ty;
      viewportEl.setPointerCapture(e.pointerId);
    } else if (pointerCount() === 2) {
      panning = false;
      pinchStartDist = pinchDistance();
      pinchStartScale = scale;
    }
  }

  function onPointerMove(e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointerCount() >= 2 && pinchStartDist > 0) {
      const dist = pinchDistance();
      if (dist > 0) {
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale * (dist / pinchStartDist)));
        applyTransform();
      }
      return;
    }

    if (!panning) return;
    tx = panOriginX + (e.clientX - panStartX);
    ty = panOriginY + (e.clientY - panStartY);
    applyTransform();
  }

  function onPointerUp(e) {
    activePointers.delete(e.pointerId);
    if (pointerCount() === 0) {
      panning = false;
      pinchStartDist = 0;
    } else if (pointerCount() === 1) {
      const remaining = [...activePointers.values()][0];
      panStartX = remaining.x;
      panStartY = remaining.y;
      panOriginX = tx;
      panOriginY = ty;
      panning = true;
      pinchStartDist = 0;
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    applyTransform();
  }

  viewportEl.addEventListener('pointerdown', onPointerDown);
  viewportEl.addEventListener('pointermove', onPointerMove);
  viewportEl.addEventListener('pointerup', onPointerUp);
  viewportEl.addEventListener('pointercancel', onPointerUp);
  viewportEl.addEventListener('wheel', onWheel, { passive: false });

  applyTransform();

  return {
    reset() {
      scale = 1;
      tx = 0;
      ty = 0;
      applyTransform();
    },
  };
}
