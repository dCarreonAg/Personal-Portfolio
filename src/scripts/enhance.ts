/*
 * Panel forms work as plain HTML posts. This script adds two things:
 * - data-confirm on a form or submit button asks before submitting;
 * - forms marked data-enhance are sent in the background and only <main> is
 *   swapped, so ticking a task doesn't reload the page or lose the scroll
 *   position. Any failure falls back to a normal submit.
 */

function restoreFocus(id: string | null) {
  const target = id ? document.getElementById(id) : null;
  (target ?? document.getElementById('main'))?.focus({ preventScroll: true });
}

document.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement;
  const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;

  const question = submitter?.dataset.confirm ?? form.dataset.confirm;
  if (question && !form.dataset.confirmed && !window.confirm(question)) {
    event.preventDefault();
    return;
  }
  if (!form.hasAttribute('data-enhance')) return;

  event.preventDefault();
  if (form.dataset.busy) return;
  form.dataset.busy = '1';

  const focusId = submitter?.id || (document.activeElement as HTMLElement | null)?.id || null;
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form, submitter),
      credentials: 'same-origin',
    });
    // Redirected somewhere else (e.g. the session expired): follow it.
    if (new URL(response.url).pathname !== location.pathname) {
      location.href = response.url;
      return;
    }
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const next = doc.getElementById('main');
    const current = document.getElementById('main');
    if (!next || !current) throw new Error('Unexpected response');
    current.replaceWith(next);
    document.title = doc.title;
    restoreFocus(focusId);
  } catch {
    delete form.dataset.busy;
    form.dataset.confirmed = '1';
    form.removeAttribute('data-enhance');
    form.requestSubmit(submitter);
  }
});
