import { $ } from '../dom';
import { state } from '../state';
import {
  defaultPlacement,
  hitTestPlacement,
  movePlacement,
  placementToRect,
  renumberZ,
  resizePlacementFromCorner,
  type Corner,
} from './prop-math';
import { recomposeAll, recomposeCrop } from './prop-compose';
import type { Crop, PropPlacement } from '../types';

interface EditorState {
  cropId: string | null;
  selectedPropPlacement: number; // index into crop.placements
}

const editor: EditorState = {
  cropId: null,
  selectedPropPlacement: -1,
};

let onAfterChange: () => void = () => undefined;

const HANDLE_PX = 12;

const getCrop = (): Crop | null =>
  state.crops.find((c) => c.id === editor.cropId) ?? null;

const propsById = (): Map<string, { w: number; h: number; img: HTMLImageElement }> =>
  new Map(state.props.map((p) => [p.id, p] as const));

const draw = (): void => {
  const crop = getCrop();
  const stage = $<HTMLCanvasElement>('propStage');
  if (!crop) {
    stage.width = 0;
    stage.height = 0;
    return;
  }
  // Fit canvas into modal-friendly preview width; keep aspect of base canvas.
  const targetW = Math.min(crop.baseCanvas.width, 720);
  const scale = targetW / crop.baseCanvas.width;
  stage.width = Math.round(crop.baseCanvas.width * scale);
  stage.height = Math.round(crop.baseCanvas.height * scale);
  const ctx = stage.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, stage.width, stage.height);
  ctx.drawImage(crop.baseCanvas, 0, 0, stage.width, stage.height);
  const map = propsById();
  // Draw enabled placements bottom→top.
  const sorted = crop.placements
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.enabled)
    .sort((a, b) => a.p.z - b.p.z);
  for (const { p } of sorted) {
    const prop = map.get(p.propId);
    if (!prop) continue;
    const r = placementToRect(p, prop, stage.width, stage.height);
    ctx.drawImage(prop.img, r.x, r.y, r.w, r.h);
  }
  // Selection chrome.
  const sel = crop.placements[editor.selectedPropPlacement];
  if (sel && sel.enabled) {
    const prop = map.get(sel.propId);
    if (prop) {
      const r = placementToRect(sel, prop, stage.width, stage.height);
      ctx.save();
      ctx.strokeStyle = '#4f7dff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#4f7dff';
      const corners: Array<{ x: number; y: number }> = [
        { x: r.x, y: r.y },
        { x: r.x + r.w, y: r.y },
        { x: r.x, y: r.y + r.h },
        { x: r.x + r.w, y: r.y + r.h },
      ];
      for (const c of corners) {
        ctx.fillRect(c.x - HANDLE_PX / 2, c.y - HANDLE_PX / 2, HANDLE_PX, HANDLE_PX);
        ctx.strokeRect(c.x - HANDLE_PX / 2, c.y - HANDLE_PX / 2, HANDLE_PX, HANDLE_PX);
      }
      ctx.restore();
    }
  }
};

const renderLayerList = (): void => {
  const list = $('propLayers');
  list.replaceChildren();
  const crop = getCrop();
  if (!crop) return;
  const map = propsById();
  // Show top→bottom (z descending).
  const sorted = crop.placements
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.z - a.p.z);
  sorted.forEach(({ p, i }) => {
    const prop = map.get(p.propId);
    if (!prop) return;
    const row = document.createElement('div');
    row.className = 'plitem' + (editor.selectedPropPlacement === i ? ' selected' : '');
    row.draggable = true;
    row.dataset.idx = String(i);

    const grip = document.createElement('span');
    grip.className = 'grip';
    grip.textContent = '⋮⋮';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = p.enabled;
    chk.title = '表示 ON/OFF';
    chk.addEventListener('change', () => {
      const c = getCrop();
      const target = c?.placements[i];
      if (!c || !target) return;
      target.enabled = chk.checked;
      recomposeCrop(c, state.props);
      onAfterChange();
      draw();
      renderLayerList();
    });

    const thumb = document.createElement('img');
    thumb.alt = '';
    thumb.src = (state.props.find((x) => x.id === p.propId)?.thumbUrl) ?? '';
    thumb.className = 'pthumb';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = state.props.find((x) => x.id === p.propId)?.name ?? '?';

    const del = document.createElement('button');
    del.className = 'x';
    del.textContent = '×';
    del.setAttribute('aria-label', '削除');
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const c = getCrop();
      if (!c) return;
      c.placements = renumberZ(
        c.placements
          .filter((_, j) => j !== i)
          .slice()
          .sort((a, b) => a.z - b.z),
      );
      if (editor.selectedPropPlacement === i) editor.selectedPropPlacement = -1;
      recomposeCrop(c, state.props);
      onAfterChange();
      draw();
      renderLayerList();
    });

    row.appendChild(grip);
    row.appendChild(chk);
    row.appendChild(thumb);
    row.appendChild(name);
    row.appendChild(del);
    row.addEventListener('click', () => {
      editor.selectedPropPlacement = i;
      draw();
      renderLayerList();
    });

    // Drag-to-reorder
    row.addEventListener('dragstart', (e) => {
      row.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i));
      }
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      row.classList.add('over');
    });
    row.addEventListener('dragleave', () => row.classList.remove('over'));
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('over');
      const c = getCrop();
      if (!c) return;
      const fromIdx = +(e.dataTransfer?.getData('text/plain') ?? '-1');
      const toIdx = i;
      if (fromIdx < 0 || fromIdx === toIdx) return;
      // Build top→bottom array from z desc, splice, then renumber bottom→top.
      const topToBottom = c.placements.slice().sort((a, b) => b.z - a.z);
      const fromTopIdx = topToBottom.findIndex(
        (pl) => pl === c.placements[fromIdx],
      );
      const toTopIdx = topToBottom.findIndex(
        (pl) => pl === c.placements[toIdx],
      );
      if (fromTopIdx < 0 || toTopIdx < 0) return;
      const [moved] = topToBottom.splice(fromTopIdx, 1);
      if (!moved) return;
      topToBottom.splice(toTopIdx, 0, moved);
      // Renumber: bottom→top = reverse(topToBottom)
      const bottomToTop = topToBottom.slice().reverse();
      c.placements = renumberZ(bottomToTop);
      // Try to preserve selection by identity reference.
      editor.selectedPropPlacement = c.placements.findIndex(
        (pl) => pl === moved,
      );
      recomposeCrop(c, state.props);
      onAfterChange();
      draw();
      renderLayerList();
    });

    list.appendChild(row);
  });

  // Render asset picker
  const picker = $<HTMLSelectElement>('propPicker');
  picker.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = state.props.length ? '＋ 追加する小物を選択…' : '（先に小物アセットを追加）';
  picker.appendChild(empty);
  for (const p of state.props) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    picker.appendChild(opt);
  }
};

interface DragInfo {
  mode: 'move' | 'resize';
  corner: Corner | null;
  start: { x: number; y: number };
  startPlacement: PropPlacement;
  pid: number;
  cropPxScale: number; // stage px -> crop px ratio (= 1 / displayScale)
}

let drag: DragInfo | null = null;

const stageCoord = (e: PointerEvent): { x: number; y: number } => {
  const stage = $<HTMLCanvasElement>('propStage');
  const r = stage.getBoundingClientRect();
  const sx = stage.width / r.width;
  const sy = stage.height / r.height;
  return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
};

const cornerHitTest = (
  point: { x: number; y: number },
  rect: { x: number; y: number; w: number; h: number },
): Corner | null => {
  const corners: Array<{ c: Corner; x: number; y: number }> = [
    { c: 'nw', x: rect.x, y: rect.y },
    { c: 'ne', x: rect.x + rect.w, y: rect.y },
    { c: 'sw', x: rect.x, y: rect.y + rect.h },
    { c: 'se', x: rect.x + rect.w, y: rect.y + rect.h },
  ];
  for (const k of corners) {
    if (
      Math.abs(point.x - k.x) <= HANDLE_PX &&
      Math.abs(point.y - k.y) <= HANDLE_PX
    ) {
      return k.c;
    }
  }
  return null;
};

const bindStage = (): void => {
  const stage = $<HTMLCanvasElement>('propStage');
  stage.addEventListener('pointerdown', (e) => {
    const crop = getCrop();
    if (!crop) return;
    e.preventDefault();
    const p = stageCoord(e);
    const map = propsById();
    const sel = crop.placements[editor.selectedPropPlacement];
    let mode: 'move' | 'resize' = 'move';
    let corner: Corner | null = null;
    let startPlacement: PropPlacement | null = null;
    let placementIdx = editor.selectedPropPlacement;
    if (sel && sel.enabled) {
      const prop = map.get(sel.propId);
      if (prop) {
        const r = placementToRect(sel, prop, stage.width, stage.height);
        const c = cornerHitTest(p, r);
        if (c) {
          mode = 'resize';
          corner = c;
          startPlacement = sel;
        }
      }
    }
    if (!startPlacement) {
      const idx = hitTestPlacement(
        p,
        crop.placements,
        new Map([...map].map(([k, v]) => [k, { w: v.w, h: v.h }] as const)),
        stage.width,
        stage.height,
      );
      if (idx >= 0) {
        placementIdx = idx;
        editor.selectedPropPlacement = idx;
        startPlacement = crop.placements[idx]!;
        renderLayerList();
      }
    }
    if (!startPlacement) return;
    drag = {
      mode,
      corner,
      start: p,
      startPlacement: { ...startPlacement },
      pid: e.pointerId,
      cropPxScale: 1,
    };
    void placementIdx;
    stage.setPointerCapture(e.pointerId);
    draw();
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const crop = getCrop();
    if (!crop) return;
    const idx = editor.selectedPropPlacement;
    const placement = crop.placements[idx];
    if (!placement) return;
    const p = stageCoord(e);
    const map = propsById();
    const prop = map.get(placement.propId);
    if (!prop) return;
    if (drag.mode === 'move') {
      const dx = p.x - drag.start.x;
      const dy = p.y - drag.start.y;
      const updated = movePlacement(
        drag.startPlacement,
        dx,
        dy,
        stage.width,
        stage.height,
      );
      Object.assign(placement, updated);
    } else if (drag.mode === 'resize' && drag.corner) {
      const updated = resizePlacementFromCorner(
        drag.startPlacement,
        drag.corner,
        p,
        prop,
        stage.width,
        stage.height,
      );
      Object.assign(placement, updated);
    }
    // Skip toDataURL during drag — it's a heavy PNG encode per frame.
    // The thumbnail is refreshed once on pointerup.
    recomposeCrop(crop, state.props, { updateUrl: false });
    draw();
  });

  const onUp = (): void => {
    if (drag) {
      try {
        stage.releasePointerCapture(drag.pid);
      } catch {
        /* noop */
      }
      drag = null;
      const crop = getCrop();
      if (crop) recomposeCrop(crop, state.props);
      onAfterChange();
    }
  };
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
};

const closeEditor = (): void => {
  $('propEditModal').removeAttribute('open');
  editor.cropId = null;
  editor.selectedPropPlacement = -1;
};

export const openPropEditor = (cropId: string): void => {
  const crop = state.crops.find((c) => c.id === cropId);
  if (!crop) return;
  editor.cropId = cropId;
  editor.selectedPropPlacement = -1;
  $('propEditModal').setAttribute('open', '');
  draw();
  renderLayerList();
};

export const initPropEditModal = (deps: { onAfterChange: () => void }): void => {
  onAfterChange = deps.onAfterChange;
  bindStage();
  $('propEditClose').addEventListener('click', closeEditor);
  const modal = $('propEditModal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeEditor();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.hasAttribute('open')) closeEditor();
  });

  $<HTMLSelectElement>('propPicker').addEventListener('change', (e) => {
    const sel = e.target as HTMLSelectElement;
    const propId = sel.value;
    sel.value = '';
    if (!propId) return;
    const crop = getCrop();
    if (!crop) return;
    const placement = defaultPlacement(propId, crop.placements);
    crop.placements.push(placement);
    editor.selectedPropPlacement = crop.placements.length - 1;
    recomposeCrop(crop, state.props);
    onAfterChange();
    draw();
    renderLayerList();
  });

  $('propApplyAll').addEventListener('click', () => {
    const src = getCrop();
    if (!src) return;
    if (!src.placements.length) {
      window.alert('適用する配置がありません。');
      return;
    }
    const cloned = JSON.parse(JSON.stringify(src.placements)) as PropPlacement[];
    for (const c of state.crops) {
      if (c.id === src.id) continue;
      c.placements = JSON.parse(JSON.stringify(cloned)) as PropPlacement[];
    }
    recomposeAll(state.crops, state.props);
    onAfterChange();
    draw();
  });

  window.addEventListener('resize', () => {
    if (editor.cropId) draw();
  });
};
