const root = document.documentElement;

for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  });
}
