# dcarreon.com

Portfolio of Diego Carreón: a public site (Astro) with content stored in Supabase, plus a private admin panel at `/admin`.

## Stack

- Astro + TypeScript, rendered on request with the Vercel adapter (public pages are cached on the CDN for 60 s)
- Supabase: Postgres with Row Level Security, email + password auth (one account), Storage for project images
- Case study Markdown is parsed with `marked` and filtered with `sanitize-html` (raw HTML is never rendered)

## Supabase setup (once)

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Sign In / Providers**: keep Email enabled and turn **off** "Allow new users to sign up".
3. **Authentication → Users → Add user → Create new user**: your email and a strong password, with "Auto Confirm User" checked.
4. **SQL Editor**: paste and run, in this order:
   [`supabase/migrations/20261029000000_init.sql`](supabase/migrations/20261029000000_init.sql),
   [`supabase/migrations/20261030000000_admin.sql`](supabase/migrations/20261030000000_admin.sql),
   then [`supabase/seed.sql`](supabase/seed.sql).
   The seed links the user from step 3 as the owner (by email; change it in the file if yours differs).
   Check it worked: `select * from private.owner;` should return one row.
5. **Project Settings → API Keys**: copy the project URL and the publishable key (the legacy `anon` key also works).

## Run locally

```sh
cp .env.example .env   # then paste the two values from step 5
npm install
npm run dev            # http://localhost:4321
```

## Deploy to Vercel

### 1. Push the code

Vercel deploys from GitHub. `.env` is git-ignored, so the keys never reach the repo.

### 2. Create the Vercel project

1. [vercel.com/new](https://vercel.com/new) → import `A01747352/Personal-Portfolio`.
2. Framework preset: **Astro** (detected automatically). Keep the default build command (`npm run build`) and output settings; the `@astrojs/vercel` adapter produces the output.
3. Node.js version comes from `package.json` (`engines.node: 24.x`).

### 3. Environment variables

In **Settings → Environment Variables**, add both for **Production** and **Preview**:

| Name | Value | Where to find it |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase → Project Settings → API |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (or the legacy `anon` key) | Supabase → Project Settings → API Keys |

Both are public by design (Row Level Security protects the data). Never add the `service_role` / secret key: the site doesn't need it.
They are baked in at build time, so **redeploy after changing them**.

### 4. Check the deployment

On the `*.vercel.app` URL:

- Home shows your profile, the two clocks, projects and path.
- `/work/the-nook` renders; `/work/does-not-exist` shows the 404 page.
- `/admin` sends you to the login; after logging in, edit something on Perfil and see it on the home page within about a minute (CDN cache).

### 5. Point dcarreon.com to Vercel

The domain currently points to GitHub Pages.

1. Vercel → **Settings → Domains**: add `dcarreon.com` and `www.dcarreon.com`, and set `www` to redirect to `dcarreon.com`.
2. At your DNS provider, **remove the GitHub Pages records** (A records `185.199.108.153`–`185.199.111.153`, any AAAA records, and a `www` CNAME to `a01747352.github.io`).
3. Add the records Vercel shows on the Domains page (usually an `A` record for `@` and a `CNAME` for `www`). Use Vercel's values, since they can be project-specific.
4. Wait for Vercel to show both domains as valid; HTTPS is issued automatically.
5. GitHub → repo **Settings → Pages**: unpublish the site, then delete the `CNAME` file from the repo.

### 6. Supabase settings for production

- **Authentication → URL Configuration**: set Site URL to `https://dcarreon.com` (used in auth emails such as password resets).
- **Authentication → Sign In / Providers**: confirm "Allow new users to sign up" is still **off**.
- Free Supabase projects **pause after a week without activity**, and the site will then fail to load content. Open the dashboard to restore it, or upgrade the project if the site must always be up.

## Who can do what (Row Level Security)

| Table | Public | Owner |
|---|---|---|
| `profile`, `path_entries` | read | read, write |
| `projects` | read where `published` | read all, write |
| `plan_phases`, `plan_tasks` | none | read, write |
| Storage `project-images` | read (public URLs) | upload, replace, delete |

The owner is the single user listed in `private.owner`, a table the API does not expose.
