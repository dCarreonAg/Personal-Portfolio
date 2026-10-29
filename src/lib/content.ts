/*
 * Content for the public site, read from Supabase with the anonymous client.
 * Row Level Security decides what is visible (e.g. only published projects).
 */
import type { Json, PathEntryRow, PathKind, ProfileRow, ProjectRow } from './database.types';
import { publicSupabase } from './supabase';

export type { PathKind };

export interface RightNowItem {
  title: string;
  detail: string;
}

export interface Profile {
  name: string;
  headline: string;
  bio: string;
  availability: string;
  focus: string;
  rightNow: RightNowItem[];
  email: string;
  github: string;
  linkedin: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  summary: string;
  role: string;
  year: string;
  tools: string[];
  demoUrl: string | null;
  repoUrl: string | null;
  imageUrl: string | null;
  caseStudyMd: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  /** Short line on the typographic cover; falls back to tools. */
  tagline: string | null;
  /** Shown in rosa on the project row. */
  award: string | null;
}

export interface PathEntry {
  id: string;
  kind: PathKind;
  title: string;
  place: string;
  years: string;
  sortOrder: number;
}

export const PATH_KIND_LABEL: Record<PathKind, string> = {
  education: 'Education',
  work: 'Work',
  award: 'Award',
  language: 'Language',
};

function parseRightNow(value: Json): RightNowItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const detail = typeof item.detail === 'string' ? item.detail.trim() : '';
    return title ? [{ title, detail }] : [];
  });
}

const toProfile = (r: ProfileRow): Profile => ({
  name: r.name,
  headline: r.headline,
  bio: r.bio,
  availability: r.availability,
  focus: r.focus,
  rightNow: parseRightNow(r.right_now),
  email: r.email,
  github: r.github,
  linkedin: r.linkedin,
});

const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  summary: r.summary,
  role: r.role,
  year: r.year,
  tools: r.tools,
  demoUrl: r.demo_url,
  repoUrl: r.repo_url,
  imageUrl: r.image_url,
  caseStudyMd: r.case_study_md,
  featured: r.featured,
  published: r.published,
  sortOrder: r.sort_order,
  tagline: r.tagline,
  award: r.award,
});

const toPathEntry = (r: PathEntryRow): PathEntry => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  place: r.place,
  years: r.years,
  sortOrder: r.sort_order,
});

function fail(what: string, error: { message: string }): never {
  throw new Error(`Could not load ${what} from Supabase: ${error.message}`);
}

export async function getProfile(): Promise<Profile> {
  const { data, error } = await publicSupabase.from('profile').select('*').maybeSingle();
  if (error) fail('profile', error);
  if (!data) throw new Error('The profile row is missing. Run supabase/seed.sql.');
  return toProfile(data);
}

export async function getPublishedProjects(): Promise<Project[]> {
  const { data, error } = await publicSupabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .order('sort_order')
    .order('created_at');
  if (error) fail('projects', error);
  return data.map(toProject);
}

export async function getPathEntries(): Promise<PathEntry[]> {
  const { data, error } = await publicSupabase.from('path_entries').select('*').order('sort_order');
  if (error) fail('path entries', error);
  return data.map(toPathEntry);
}

/** Featured project first, then the rest in sort order. */
export function splitFeatured(list: Project[]): { featured: Project | null; others: Project[] } {
  const featured = list.find((p) => p.featured) ?? list[0] ?? null;
  return { featured, others: list.filter((p) => p !== featured) };
}

/** Accepts "github.com/x" or a full URL and returns an absolute https URL. */
export function toUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
