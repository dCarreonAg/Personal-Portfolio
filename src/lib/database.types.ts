/*
 * Types for the tables in supabase/migrations. Same shape as the output of
 * `supabase gen types typescript`; regenerate with that command if you prefer.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type PathKind = 'education' | 'work' | 'award' | 'language';

export type ProfileRow = {
  id: boolean;
  name: string;
  headline: string;
  bio: string;
  availability: string;
  focus: string;
  right_now: Json;
  email: string;
  github: string;
  linkedin: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  role: string;
  year: string;
  tools: string[];
  demo_url: string | null;
  repo_url: string | null;
  image_url: string | null;
  case_study_md: string;
  tagline: string | null;
  award: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PathEntryRow = {
  id: string;
  kind: PathKind;
  title: string;
  place: string;
  years: string;
  sort_order: number;
  updated_at: string;
};

export type PlanPhaseRow = {
  id: string;
  name: string;
  open: boolean;
  sort_order: number;
  updated_at: string;
};

export type PlanTaskRow = {
  id: string;
  phase_id: string;
  text: string;
  done: boolean;
  sort_order: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profile: Table<ProfileRow, 'name'>;
      projects: Table<ProjectRow, 'name' | 'slug'>;
      path_entries: Table<PathEntryRow, 'kind' | 'title'>;
      plan_phases: Table<PlanPhaseRow, 'name'>;
      plan_tasks: Table<PlanTaskRow, 'phase_id' | 'text'>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_owner: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { path_kind: PathKind };
    CompositeTypes: { [_ in never]: never };
  };
};
