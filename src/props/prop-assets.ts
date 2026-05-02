import { $ } from '../dom';
import { state, newId } from '../state';
import { defaultPlacement } from './prop-math';
import { recomposeAll } from './prop-compose';
import type { PropAsset } from '../types';

export interface PropAssetsDeps {
  /** Called after crops have been recomposed, to refresh thumbnails. */
  onRecomposed: () => void;
}

const addPropFile = (file: File): Promise<PropAsset | null> =>
  new Promise<PropAsset | null>((res) => {
    if (!file.type.startsWith('image/')) return res(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      res({
        id: newId(),
        name: file.name,
        img,
        thumbUrl: url,
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      res(null);
    };
    img.src = url;
  });

export const initPropAssets = (deps: PropAssetsDeps): void => {
  const fileInput = $<HTMLInputElement>('propFile');
  fileInput.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files ?? []);
    for (const f of files) {
      const asset = await addPropFile(f);
      if (asset) state.props.push(asset);
    }
    target.value = '';
    renderPropList(deps);
  });

  $('clearProps').addEventListener('click', () => {
    if (!state.props.length) return;
    if (!window.confirm('小物アセットを全削除します。よろしいですか？')) return;
    state.props.forEach((p) => URL.revokeObjectURL(p.thumbUrl));
    state.props = [];
    // Drop placements that referenced removed props.
    for (const c of state.crops) {
      c.placements = c.placements.filter(() => false);
    }
    recomposeAll(state.crops, state.props);
    renderPropList(deps);
    deps.onRecomposed();
  });

  renderPropList(deps);
};

export const renderPropList = (deps: PropAssetsDeps): void => {
  const list = $('propList');
  list.replaceChildren();
  state.props.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'pitem';
    el.dataset.id = p.id;

    const img = document.createElement('img');
    img.alt = '';
    img.src = p.thumbUrl;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = p.name;

    const addAll = document.createElement('button');
    addAll.type = 'button';
    addAll.className = 'icon-only';
    addAll.textContent = '全クロップへ';
    addAll.title = 'この小物を全クロップに追加';
    addAll.addEventListener('click', () => {
      for (const c of state.crops) {
        const exists = c.placements.some((pl) => pl.propId === p.id);
        if (!exists) c.placements.push(defaultPlacement(p.id, c.placements));
      }
      recomposeAll(state.crops, state.props);
      deps.onRecomposed();
    });

    const del = document.createElement('button');
    del.className = 'x';
    del.textContent = '×';
    del.setAttribute('aria-label', '削除');
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      URL.revokeObjectURL(p.thumbUrl);
      state.props = state.props.filter((x) => x.id !== p.id);
      for (const c of state.crops) {
        c.placements = c.placements.filter((pl) => pl.propId !== p.id);
      }
      recomposeAll(state.crops, state.props);
      renderPropList(deps);
      deps.onRecomposed();
    });

    el.appendChild(img);
    el.appendChild(name);
    el.appendChild(addAll);
    el.appendChild(del);
    list.appendChild(el);
  });
  $('propCount').textContent = state.props.length
    ? `${state.props.length} 個のアセット`
    : 'PNG をアップロード';
};
