/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Session-bound Supabase client; only set on /admin routes. */
    supabase: import('@supabase/supabase-js').SupabaseClient<import('./lib/database.types').Database>;
    /** The signed-in owner, or null. */
    user: import('@supabase/supabase-js').User | null;
  }
}
