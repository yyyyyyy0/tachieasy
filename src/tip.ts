export const initTip = (): void => {
  const tipEl = document.createElement('div');
  tipEl.className = 'tip';
  document.body.appendChild(tipEl);

  const showTip = (target: Element): void => {
    const t = target.getAttribute('data-tip');
    if (!t) return;
    tipEl.textContent = t;
    tipEl.setAttribute('data-show', '');
    const r = target.getBoundingClientRect();
    const tw = tipEl.offsetWidth;
    const th = tipEl.offsetHeight;
    const M = 6;
    const E = 6;
    let top = r.bottom + M;
    if (top + th > window.innerHeight - E) top = Math.max(E, r.top - th - M);
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(E, Math.min(window.innerWidth - tw - E, left));
    tipEl.style.top = top + 'px';
    tipEl.style.left = left + 'px';
  };
  const hideTip = (): void => {
    tipEl.removeAttribute('data-show');
  };
  document.addEventListener('mouseover', (e) => {
    const t = (e.target as Element | null)?.closest?.('[data-tip]');
    if (t) showTip(t);
  });
  document.addEventListener('mouseout', hideTip);
  document.addEventListener('focusin', (e) => {
    const t = e.target as Element | null;
    if (t?.matches?.('[data-tip]')) showTip(t);
  });
  document.addEventListener('focusout', hideTip);
};
