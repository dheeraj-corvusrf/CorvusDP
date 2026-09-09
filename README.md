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

Hosted **only** at **https://corvusre.com/corvusdp/**. This repo does **not**
publish its own GitHub Pages site.

The `corvusre.com` custom domain belongs to the **CorvusPT** repo; its deploy
workflow checks out this repo's `dev` branch, runs
`SITE_BASE=/corvusdp/ npm run build`, and drops the output into `site/corvusdp/`
alongside the shared CorvusRE hub. So:

- Merging to **this** repo's `dev` does not deploy anything on its own — it just
  runs [CI](.github/workflows/ci.yml) (tests + the same production build).
- To publish the change, the **CorvusPT** deploy has to run too — push to
  CorvusPT `dev`, or dispatch its "Deploy to GitHub Pages" workflow.

## Branches

| Branch                | Purpose                     |
| --------------------- | --------------------------- |
| `main`                | stable / release            |
| `qa`                  | pre-release verification    |
| `dev`                 | integration; source the CorvusPT deploy builds from |
| `feature-dev-dheeraj` | working branch              |
