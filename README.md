# CorvusDP.ai — Design & Permit

AI-assisted permitting, entitlement and design for real estate development
projects. One of the five doors of [CorvusRE](https://corvusre.com).

## Built with

- TanStack Start · TypeScript · React 19
- Tailwind CSS v4 · shadcn/ui
- Supabase (auth + Postgres)

## Development

Requires Node.js 20+.

```sh
npm i
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev            # http://localhost:8082
```

Without Supabase credentials the marketing pages and the anonymous
permitting/design analysis flow still work (results are held in the browser
session); sign-up, saved projects and the dashboard need a configured Supabase
project — run `supabase/schema.sql` once in the SQL editor of a fresh project.

## Tests

```sh
npm run test     # Vitest — pure permitting/zoning/fee/timeline logic
```

## Supabase

CorvusDP uses its **own** Supabase project — never share a database with another
CorvusRE app. Create a fresh project, run [supabase/schema.sql](supabase/schema.sql)
once in its SQL editor, then set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
(locally in `.env`, in CI as repo **Variables**). To grant yourself admin, set
`is_admin = true` on your row in `public.profiles`.

## Deployment

Live at **https://dheeraj-corvusrf.github.io/CorvusDP/** (GitHub Pages, source =
GitHub Actions).

Pushing to `dev` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):
tests → build (`SITE_BASE=/CorvusDP/`, every route prerendered to HTML, no
server) → `404.html` SPA fallback → `actions/deploy-pages`.

One-time repo setup: **Settings → Pages → Source → GitHub Actions**, and add repo
**Variables** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (CorvusDP's own
project). Moving to a custom domain / root later: set repo Variable `SITE_BASE`
to `/` and add `PAGES_CNAME`.

## Branches

| Branch                | Purpose                     |
| --------------------- | --------------------------- |
| `main`                | stable / release            |
| `qa`                  | pre-release verification    |
| `dev`                 | integration; deploy trigger |
| `feature-dev-dheeraj` | working branch              |
