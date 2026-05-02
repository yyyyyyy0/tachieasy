import { $ } from './dom';
import { state } from './state';
import { clamp } from './util/math';
import {
  applyAspectToDispRect,
  computeDispMeta,
  dispRectToRoi,
  reshapeRoiToAspect,
  roiToDispRect,
  type DispRect,
} from './roi/roi-math';
import type { DispMeta, Mode, RoiHandle } from './types';

const stageEl = (): HTMLElement => $('roiStage');

let dispMeta: DispMeta | null = null;
let roiEl: HTMLDivElement | null = null;

const HANDLES: ReadonlyArray<RoiHandle> = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];

const getAspect = (): { a: number; imgRatio: number } | null => {
  if (!state.aspect || !state.aspectLock) return null;
  const ref = state.images.find((i) => i.id === state.refId);
  let imgRatio = 1;
  if (state.mode === 'ratio' && ref) imgRatio = ref.w / ref.h;
  return { a: state.aspect, imgRatio };
};

const visualAspect = (): number | null => {
  const ag = getAspect();
  if (!ag) return null;
  return ag.a / ag.imgRatio;
};

export const drawStage = (): void => {
  const el = stageEl();
  el.replaceChildren();
  dispMeta = null;
  roiEl = null;
  const ref = state.images.find((i) => i.id === state.refId);
  if (!ref) {
    el.classList.add('empty');
    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span>先に画像を読み込んでください</span>';
    return;
  }
  el.classList.remove('empty');
  dispMeta = computeDispMeta(el.clientWidth, el.clientHeight, ref.w, ref.h);
  const img = document.createElement('img');
  img.src = ref.thumbUrl;
  img.style.left = dispMeta.offX + 'px';
  img.style.top = dispMeta.offY + 'px';
  img.style.width = dispMeta.dispW + 'px';
  img.style.height = dispMeta.dispH + 'px';
  el.appendChild(img);
  roiEl = document.createElement('div');
  roiEl.className = 'roi-rect';
  const v1 = document.createElement('div');
  v1.className = 'v1';
  const v2 = document.createElement('div');
  v2.className = 'v2';
  roiEl.appendChild(v1);
  roiEl.appendChild(v2);
  HANDLES.forEach((p) => {
    const h = document.createElement('div');
    h.className = 'h ' + p;
    h.dataset.handle = p;
    roiEl!.appendChild(h);
  });
  el.appendChild(roiEl);
  layoutRoi();
};

export const layoutRoi = (): void => {
  if (!roiEl || !dispMeta) return;
  const m = dispMeta;
  const r = roiToDispRect(state.roi, state.mode, m);
  roiEl.style.left = m.offX + r.x + 'px';
  roiEl.style.top = m.offY + r.y + 'px';
  roiEl.style.width = r.w + 'px';
  roiEl.style.height = r.h + 'px';
};

const writeRoiFromDisp = (rect: DispRect): void => {
  if (!dispMeta) return;
  state.roi = dispRectToRoi(rect, state.mode, dispMeta);
};

const writeRoiInputs = (): void => {
  const r = state.roi;
  const fmt: (v: number) => string =
    state.mode === 'ratio' ? (v) => v.toFixed(3) : (v) => String(Math.round(v));
  $<HTMLInputElement>('roiX').value = fmt(r.x);
  $<HTMLInputElement>('roiY').value = fmt(r.y);
  $<HTMLInputElement>('roiW').value = fmt(r.w);
  $<HTMLInputElement>('roiH').value = fmt(r.h);
};

export const updateRoiUI = (): void => {
  const step = state.mode === 'abs' ? '1' : '0.001';
  ['roiX', 'roiY', 'roiW', 'roiH'].forEach((id) => {
    $<HTMLInputElement>(id).step = step;
  });
  writeRoiInputs();
};

const readRoiInputs = (changedKey: 'x' | 'y' | 'w' | 'h'): void => {
  const r = {
    x: +$<HTMLInputElement>('roiX').value || 0,
    y: +$<HTMLInputElement>('roiY').value || 0,
    w: +$<HTMLInputElement>('roiW').value || 0,
    h: +$<HTMLInputElement>('roiH').value || 0,
  };
  const target = visualAspect();
  if (target !== null) {
    if (changedKey === 'h') r.w = r.h * target;
    else r.h = r.w / target;
  }
  state.roi = r;
  layoutRoi();
  if (target !== null) writeRoiInputs();
};

interface DragState {
  handle: RoiHandle | 'move';
  start: { x: number; y: number };
  r0: DispRect;
  pid: number;
}

const pointerToImageCoord = (e: PointerEvent): { x: number; y: number } => {
  const m = dispMeta;
  if (!m) return { x: 0, y: 0 };
  const r = stageEl().getBoundingClientRect();
  return {
    x: clamp(e.clientX - r.left - m.offX, 0, m.dispW),
    y: clamp(e.clientY - r.top - m.offY, 0, m.dispH),
  };
};

const bindStage = (): void => {
  const el = stageEl();
  let drag: DragState | null = null;
  el.addEventListener('pointerdown', (e) => {
    if (!roiEl || !dispMeta) return;
    e.preventDefault();
    const m = dispMeta;
    const target = e.target as HTMLElement;
    const handle = (target.dataset?.handle as RoiHandle | undefined) ?? 'move';
    const start = pointerToImageCoord(e);
    const r0: DispRect = {
      x: parseFloat(roiEl.style.left) - m.offX,
      y: parseFloat(roiEl.style.top) - m.offY,
      w: parseFloat(roiEl.style.width),
      h: parseFloat(roiEl.style.height),
    };
    drag = { handle, start, r0, pid: e.pointerId };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || !dispMeta) return;
    const m = dispMeta;
    const p = pointerToImageCoord(e);
    let { x, y, w, h } = drag.r0;
    const dx = p.x - drag.start.x;
    const dy = p.y - drag.start.y;
    const MIN = 8;
    switch (drag.handle) {
      case 'move':
        x = clamp(x + dx, 0, m.dispW - w);
        y = clamp(y + dy, 0, m.dispH - h);
        break;
      case 'nw': {
        const nx = clamp(x + dx, 0, x + w - MIN);
        const ny = clamp(y + dy, 0, y + h - MIN);
        w += x - nx; h += y - ny; x = nx; y = ny;
        break;
      }
      case 'ne': {
        const nw = clamp(w + dx, MIN, m.dispW - x);
        const ny = clamp(y + dy, 0, y + h - MIN);
        h += y - ny; y = ny; w = nw;
        break;
      }
      case 'sw': {
        const nx = clamp(x + dx, 0, x + w - MIN);
        const nh = clamp(h + dy, MIN, m.dispH - y);
        w += x - nx; x = nx; h = nh;
        break;
      }
      case 'se':
        w = clamp(w + dx, MIN, m.dispW - x);
        h = clamp(h + dy, MIN, m.dispH - y);
        break;
      case 'n': {
        const ny = clamp(y + dy, 0, y + h - MIN);
        h += y - ny; y = ny;
        break;
      }
      case 's':
        h = clamp(h + dy, MIN, m.dispH - y);
        break;
      case 'w': {
        const nx = clamp(x + dx, 0, x + w - MIN);
        w += x - nx; x = nx;
        break;
      }
      case 'e':
        w = clamp(w + dx, MIN, m.dispW - x);
        break;
    }
    const aspect = visualAspect();
    const adj =
      aspect === null
        ? { x, y, w, h }
        : applyAspectToDispRect(drag.handle, x, y, w, h, drag.r0, aspect, m.dispW, m.dispH);
    writeRoiFromDisp(adj);
    layoutRoi();
    writeRoiInputs();
  });
  const onUp = (): void => {
    if (drag) {
      try {
        el.releasePointerCapture(drag.pid);
      } catch {
        /* noop */
      }
      drag = null;
    }
  };
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
};

const switchMode = (m: Mode): void => {
  if (state.mode === m) return;
  const ref = state.images.find((i) => i.id === state.refId);
  if (ref) {
    if (m === 'abs') {
      state.roi = {
        x: Math.round(state.roi.x * ref.w),
        y: Math.round(state.roi.y * ref.h),
        w: Math.round(state.roi.w * ref.w),
        h: Math.round(state.roi.h * ref.h),
      };
    } else {
      state.roi = {
        x: state.roi.x / ref.w,
        y: state.roi.y / ref.h,
        w: state.roi.w / ref.w,
        h: state.roi.h / ref.h,
      };
    }
  }
  state.mode = m;
  $('modeRatio').classList.toggle('on', m === 'ratio');
  $('modeAbs').classList.toggle('on', m === 'abs');
  updateRoiUI();
  layoutRoi();
};

const reshapeRoiUsingAspect = (): void => {
  const ag = getAspect();
  if (!ag) return;
  const ref = state.images.find((i) => i.id === state.refId);
  if (!ref) return;
  state.roi = reshapeRoiToAspect(state.roi, state.mode, ref.w, ref.h, ag.a);
  layoutRoi();
  writeRoiInputs();
};

export const setAspect = (value: string, fromButton: boolean): void => {
  if (value === '' || value == null) {
    state.aspect = null;
    if (fromButton) state.aspectLock = false;
  } else {
    state.aspect = parseFloat(value);
    if (fromButton) state.aspectLock = true;
  }
  document.querySelectorAll<HTMLButtonElement>('#aspectSeg button').forEach((b) => {
    b.classList.toggle('on', (b.dataset.aspect ?? '') === (value ?? ''));
  });
  $<HTMLInputElement>('aspectLock').checked = state.aspectLock;
  if (state.aspect && state.aspectLock) reshapeRoiUsingAspect();
};

export const setRef = (id: string): void => {
  state.refId = id;
};

export const initRoi = (): void => {
  bindStage();
  (['roiX', 'roiY', 'roiW', 'roiH'] as const).forEach((id) =>
    $<HTMLInputElement>(id).addEventListener('input', () =>
      readRoiInputs(id.slice(3).toLowerCase() as 'x' | 'y' | 'w' | 'h'),
    ),
  );
  $('modeRatio').addEventListener('click', () => switchMode('ratio'));
  $('modeAbs').addEventListener('click', () => switchMode('abs'));
  $('presetBust').addEventListener('click', () => {
    const ref = state.images.find((i) => i.id === state.refId);
    if (!ref) {
      state.roi = { x: 0.2, y: 0.03, w: 0.6, h: 0.6 };
    } else {
      const side = Math.min(ref.w * 0.7, ref.h * 0.5);
      const xPx = (ref.w - side) / 2;
      const yPx = ref.h * 0.03;
      if (state.mode === 'ratio') {
        state.roi = { x: xPx / ref.w, y: yPx / ref.h, w: side / ref.w, h: side / ref.h };
      } else {
        state.roi = {
          x: Math.round(xPx),
          y: Math.round(yPx),
          w: Math.round(side),
          h: Math.round(side),
        };
      }
    }
    setAspect('1', true);
    layoutRoi();
    writeRoiInputs();
  });
  $('presetReset').addEventListener('click', () => {
    const ref = state.images.find((i) => i.id === state.refId);
    if (state.mode === 'ratio' || !ref) state.roi = { x: 0, y: 0, w: 1, h: 1 };
    else state.roi = { x: 0, y: 0, w: ref.w, h: ref.h };
    layoutRoi();
    writeRoiInputs();
  });
  document.querySelectorAll<HTMLButtonElement>('#aspectSeg button').forEach((b) => {
    b.addEventListener('click', () => setAspect(b.dataset.aspect ?? '', true));
  });
  $<HTMLInputElement>('aspectLock').addEventListener('change', () => {
    state.aspectLock = $<HTMLInputElement>('aspectLock').checked;
    if (state.aspect && state.aspectLock) reshapeRoiUsingAspect();
  });
  window.addEventListener('resize', drawStage);
};
