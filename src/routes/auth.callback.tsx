import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing you in… — CorvusDP" }] }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AuthCallback,
});

// OAuth (Google) redirects back here after Supabase's own /auth/v1/callback.
// AuthProvider (mounted at the root) picks the session out of the URL on load
// and flips `user`; this page just waits for that and forwards to wherever the
// sign-in flow wanted to land — kept off the guarded routes so the dashboard
// guard can't bounce the request back to /sign-in before the session settles.
function AuthCallback() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let target = redirect ?? "/dashboard";
  if (base && target.startsWith(`${base}/`)) target = target.slice(base.length);
  if (!target.startsWith("/") || target.startsWith("//")) target = "/dashboard";

  useEffect(() => {
    if (user) nav({ to: target, replace: true });
  }, [user, nav, target]);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (!loading && !user && timedOut) {
    return (
      <div className="container-page py-20 max-w-md text-center">
        <h1 className="font-serif text-2xl font-semibold">Sign-in didn't complete</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't establish a session from the sign-in redirect. Please try again.
        </p>
        <Link to="/sign-in" className="btn-accent mt-6 inline-flex">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-20 max-w-md text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="mt-4 text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
