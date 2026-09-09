import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMyProfile, updateMyProfile } from "@/lib/profile";
import { Section, Field, inputCls, Loading } from "@/components/dp-ui";

export const Route = createFileRoute("/dashboard/_layout/settings")({
  head: () => ({ meta: [{ title: "Settings — CorvusDP" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", companyName: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({
    email: true,
    sms: false,
    inApp: true,
    weekly: true,
    permitStatus: true,
  });

  useEffect(() => {
    if (!user) return;
    getMyProfile(user.id)
      .then((p) => {
        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          phone: p.phone ?? "",
          companyName: p.companyName ?? "",
        });
        setEmail(p.email);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load profile."))
      .finally(() => setLoading(false));
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaved(false);
    try {
      await updateMyProfile(user.id, form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="grid gap-5">
      <Section title="Profile">
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input
                className={inputCls}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </Field>
            <Field label="Last name">
              <input
                className={inputCls}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Company">
              <input
                className={inputCls}
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Email">
            <input className={inputCls} value={email} disabled />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-accent">Saved.</p>}
          <button className="btn-accent w-fit">Save changes</button>
        </form>
      </Section>

      <Section title="Notification preferences" subtitle="Stored locally in this build.">
        <div className="grid gap-2 text-sm">
          {(
            [
              ["email", "Email"],
              ["sms", "SMS"],
              ["inApp", "In-app notifications"],
              ["weekly", "Weekly project updates"],
              ["permitStatus", "Permit status updates"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}
