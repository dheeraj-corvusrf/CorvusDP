import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Info } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { readDpIntake } from "@/lib/dp-intake";
import {
  TERMS_VERSION,
  PRIVACY_VERSION,
  SIGNUP_ACK_INTRO,
  SIGNUP_ACK_ITEMS,
  SIGNUP_ACK_CONFIRM,
} from "@/lib/legal";
import { Field, inputCls } from "@/components/dp-ui";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — CorvusDP" }] }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string; mode?: "signup"; email?: string; reason?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    mode: search.mode === "signup" ? "signup" : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    reason: typeof search.reason === "string" ? search.reason : undefined,
  }),
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();
  const sp = Route.useSearch();

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let cleaned = sp.redirect ?? "";
  if (base && cleaned.startsWith(`${base}/`)) cleaned = cleaned.slice(base.length);
  const returnTo =
    cleaned && cleaned.startsWith("/") && !cleaned.startsWith("//") ? cleaned : "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">(sp.mode === "signup" ? "signup" : "signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState(sp.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) return setError("Enter your first and last name.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirm) return setError("Passwords don't match.");
      if (!terms) return setError("Please accept the Terms and Privacy Policy.");
    }
    if (!isSupabaseConfigured) {
      return setError("Accounts aren't set up in this deployment yet.");
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: e1 } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim() || null,
              company_name: company.trim() || null,
              session_id: readDpIntake().sessionId,
              terms_version: TERMS_VERSION,
              privacy_version: PRIVACY_VERSION,
            },
          },
        });
        if (e1) throw e1;
        if (!data.session) setCheckEmail(true);
        else nav({ to: returnTo });
      } else {
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) throw e2;
        nav({ to: returnTo });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="container-page py-16 max-w-lg">
        <span className="badge-soft">Almost there</span>
        <h1 className="mt-3 font-serif text-3xl font-semibold">Check your email.</h1>
        <p className="mt-2 text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>. Click it, then sign in.
        </p>
        <button
          onClick={() => {
            setMode("signin");
            setCheckEmail(false);
          }}
          className="btn-primary btn-primary-hover mt-6"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-14 max-w-lg">
      <span className="badge-soft">{mode === "signin" ? "Sign in" : "Create account"}</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold">
        {mode === "signin" ? "Welcome back." : "Create your CorvusDP account."}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {mode === "signin"
          ? "Your projects, permits, roadmap and documents in one place."
          : "Save your analysis and unlock the full permitting report."}
      </p>
      {sp.reason && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {sp.reason.toLowerCase().includes("inactivity") ? (
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          )}
          <span>{sp.reason}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 card-elev grid gap-4 p-6">
        {mode === "signup" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <input
                required
                className={inputCls}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field label="Last name" required>
              <input
                required
                className={inputCls}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>
          </div>
        )}
        {mode === "signup" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone (optional)">
              <input
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Company (optional)">
              <input
                className={inputCls}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Field>
          </div>
        )}
        <Field label="Email" required>
          <input
            required
            type="email"
            autoComplete="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required>
          <input
            required
            type="password"
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {mode === "signin" && (
          <Link
            to="/forgot-password"
            className="-mt-2 justify-self-end text-sm text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
        )}
        {mode === "signup" && (
          <Field label="Confirm password" required>
            <input
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              className={inputCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
        )}
        {mode === "signup" && (
          <div className="grid gap-2 rounded-lg border border-border p-3 text-sm">
            <label className="flex items-start gap-2 font-medium">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-accent underline underline-offset-2">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-accent underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <p className="text-xs text-muted-foreground">{SIGNUP_ACK_INTRO}</p>
            <ul className="grid list-disc gap-1 pl-5 text-xs text-muted-foreground">
              {SIGNUP_ACK_ITEMS.map((i, k) => (
                <li key={k}>{i}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{SIGNUP_ACK_CONFIRM}</p>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={loading || (mode === "signup" && !terms)}
          className="btn-accent disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Agree & create account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need an account? Create one." : "Already have an account? Sign in."}
        </button>
      </form>
    </div>
  );
}
