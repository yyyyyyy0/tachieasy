export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: #${id}`);
  return el as T;
};

export const setMsg = (el: HTMLElement, kind: string, text: string): void => {
  el.replaceChildren();
  const span = document.createElement('span');
  span.className = kind;
  span.textContent = text;
  el.appendChild(span);
};
