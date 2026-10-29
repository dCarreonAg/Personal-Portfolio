import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/client';
import type { Database } from './lib/database.types';

const LOGIN = '/admin/login';

const isAdmin = (path: string) => path === '/admin' || path.startsWith('/admin/');
const isLogin = (path: string) => path.replace(/\/$/, '') === LOGIN;

/*
 * Every /admin request gets a Supabase client bound to the session cookies.
 * Anyone who is not signed in as the owner is sent to the login page.
 * Row Level Security enforces the same rule again in the database.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!isAdmin(pathname)) return next();

  const supabase = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () =>
        parseCookieHeader(context.request.headers.get('cookie') ?? '').map(({ name, value }) => ({
          name,
          value: value ?? '',
        })),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          context.cookies.set(name, value, { ...options, path: options.path ?? '/' });
        }
      },
    },
  });
  context.locals.supabase = supabase;

  // getUser() asks the Auth server, so a forged or revoked cookie fails here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let owner = false;
  if (user) {
    const { data } = await supabase.rpc('is_owner');
    owner = data === true;
    if (!owner) await supabase.auth.signOut();
  }
  context.locals.user = owner ? user : null;

  if (!owner && !isLogin(pathname)) {
    return context.redirect(LOGIN, 303);
  }
  if (owner && isLogin(pathname) && context.request.method === 'GET') {
    return context.redirect('/admin', 303);
  }

  const response = await next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});
