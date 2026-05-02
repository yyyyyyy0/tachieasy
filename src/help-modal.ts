import { $ } from './dom';

export const initHelpModal = (): void => {
  const helpModal = $('helpModal');
  const open = (): void => helpModal.setAttribute('open', '');
  const close = (): void => helpModal.removeAttribute('open');
  $('helpBtn').addEventListener('click', open);
  $('helpClose').addEventListener('click', close);
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
};
