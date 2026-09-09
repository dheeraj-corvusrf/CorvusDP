// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// CorvusDP deploys at the root of its GitHub Pages site (base "/"). SITE_BASE is
// left as an override hook, but note: the current TanStack Start prerender
// crawler cannot resolve routes under a non-root base with the static
// (`nitro: false`) handler — a non-root base produces zero prerendered HTML. If
// CorvusDP ever needs to live under `corvusre.com/corvusdp/`, put a
// path-rewrite / reverse proxy in front rather than setting a non-root base
// here, until that upstream issue is fixed.
const base = process.env.SITE_BASE || "/";

export default defineConfig({
  // Local dev/preview run on 8082 (CorvusPT owns 8080/8081 in this workspace).
  vite: {
    base,
    server: { port: 8082, strictPort: true },
    preview: { port: 8082, strictPort: true },
  },
  tanstackStart: {
    server: { entry: "server" },
    // GitHub Pages only serves static files, so every route is prerendered to
    // HTML at build time instead of relying on a live SSR server.
    prerender: { enabled: true, crawlLinks: true },
    router: { basepath: base },
  },
  // GitHub Pages can't run server code; disable the Nitro server build entirely
  // so `vite build` emits a purely static site.
  nitro: false,
});
