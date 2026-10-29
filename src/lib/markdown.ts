/*
 * Case study Markdown -> sections of sanitized HTML.
 * Raw HTML in the source is escaped (shown as text, never rendered), and the
 * parser output is filtered through a strict allowlist as a second layer.
 */
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export interface CaseSection {
  /** Plain text; null for content that appears before the first heading. */
  title: string | null;
  html: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'hr', 'strong', 'em', 'del', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'h3', 'h4', 'img'],
  allowedAttributes: {
    a: ['href', 'title', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'decoding'],
    ol: ['start'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  // An image whose src was rejected would render as a broken box.
  exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  transformTags: {
    // Sections are split on ##, so any other top-level heading drops a level.
    h1: 'h3',
    h2: 'h3',
    h5: 'h4',
    h6: 'h4',
    a: (tagName, attribs) => ({
      tagName,
      attribs: /^https?:/i.test(attribs.href ?? '') ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
    }),
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async' } }),
  },
};

export function renderMarkdown(md: string): string {
  return sanitizeHtml(marked.parse(md, { async: false }), SANITIZE);
}

const HEADING = /^##\s+(.+?)\s*#*\s*$/;
const FENCE = /^\s*(```|~~~)/;

/** Splits on level-2 headings (ignoring code fences) and drops empty sections. */
export function caseStudySections(md: string): CaseSection[] {
  const raw: { title: string | null; lines: string[] }[] = [{ title: null, lines: [] }];
  let inFence = false;
  for (const line of md.replace(/\r\n?/g, '\n').split('\n')) {
    if (FENCE.test(line)) inFence = !inFence;
    const m = inFence ? null : HEADING.exec(line);
    if (m) raw.push({ title: m[1], lines: [] });
    else raw[raw.length - 1].lines.push(line);
  }
  return raw
    .map((s) => ({ title: s.title, body: s.lines.join('\n').trim() }))
    .filter((s) => s.body)
    .map((s) => ({ title: s.title, html: renderMarkdown(s.body) }));
}
