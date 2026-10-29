import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/client';
import type { Database } from './database.types';

/**
 * Anonymous client for the public site. It only ever sees what Row Level
 * Security allows the public to read. The panel gets its own per-request,
 * cookie-based client in step 4.
 */
export const publicSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
