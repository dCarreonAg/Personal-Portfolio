/* Small helpers shared by the panel's form handlers. */

export const text = (form: FormData, key: string): string => {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
};

export const checked = (form: FormData, key: string): boolean => form.get(key) === 'on';

/** Lowercase, accent-free, hyphenated: "Beneficio Jóven!" -> "beneficio-joven". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Empty -> null; otherwise must be an http(s) URL. Returns undefined if invalid. */
export function optionalUrl(value: string): string | null | undefined {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const nextSortOrder = (rows: { sort_order: number }[]): number =>
  rows.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1;

export const SAVE_FAILED = 'No se pudo guardar. Intenta de nuevo.';

/** Same page, plus an optional ?ok= flag that the page turns into a status line. */
export function backTo(url: URL, ok?: string): string {
  return ok ? `${url.pathname}?ok=${encodeURIComponent(ok)}` : url.pathname;
}
