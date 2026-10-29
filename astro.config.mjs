// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://dcarreon.com',
  // Pages render on request so edits made in the panel show up without a
  // redeploy; public pages set a short CDN cache (see src/lib/cache.ts).
  output: 'server',
  adapter: vercel(),
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'client', access: 'public', url: true }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({ context: 'client', access: 'public' }),
    },
  },
});
