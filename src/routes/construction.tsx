import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, inputCls, Section } from "@/components/dp-ui";
import { supabase } from "@/lib/supabase";
import { readDpIntake } from "@/lib/dp-intake";

export const Route = createFileRoute("/construction")({
  head: () => ({ meta: [{ title: "Construction — CorvusDP" }] }),
  component: Construction,
});

function Construction() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    address: "",
    build: "New Construction",
    size: "",
    floors: "",
    structure: "Not sure",
    hasDrawings: "In progress",
    hasPermits: "Not started",
    budget: "",
    completion: "",
    email: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const intake = readDpIntake();
    try {
      await supabase.from("leads").insert({
        session_id: intake.sessionId,
        track: "construction",
        email: form.email || null,
        property: { address: form.address },
        project: form,
        intent_score: 3,
      });
    } catch {
      /* non-blocking */
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="container-page py-16 max-w-2xl">
        <span className="badge-soft">Received</span>
        <h1 className="mt-3 font-serif text-3xl font-semibold">Thanks — we have your project.</h1>
        <p className="mt-2 text-muted-foreground">
          The CorvusDP construction workspace is in build. We'll reach out with next steps and a
          detailed readiness plan.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-12 max-w-2xl">
      <span className="badge-soft">Construction</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold">Tell us about the build.</h1>
      <p className="mt-2 text-muted-foreground">
        Detailed construction tooling is coming next. Share the basics and we'll follow up.
      </p>
      <form onSubmit={submit} className="mt-6">
        <Section title="Project basics">
          <div className="grid gap-4">
            <Field label="Property address">
              <input
                className={inputCls}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="What are you building?">
                <select
                  className={inputCls}
                  value={form.build}
                  onChange={(e) => setForm({ ...form, build: e.target.value })}
                >
                  {["New Construction", "Addition", "Renovation / Remodeling"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Structure type">
                <select
                  className={inputCls}
                  value={form.structure}
                  onChange={(e) => setForm({ ...form, structure: e.target.value })}
                >
                  {["Concrete", "Steel", "Wood", "Not sure"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Approx. building size (sf)">
                <input
                  className={inputCls}
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </Field>
              <Field label="Number of floors">
                <input
                  className={inputCls}
                  value={form.floors}
                  onChange={(e) => setForm({ ...form, floors: e.target.value })}
                />
              </Field>
              <Field label="Design drawings?">
                <select
                  className={inputCls}
                  value={form.hasDrawings}
                  onChange={(e) => setForm({ ...form, hasDrawings: e.target.value })}
                >
                  {["Yes", "No", "In progress"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Permits?">
                <select
                  className={inputCls}
                  value={form.hasPermits}
                  onChange={(e) => setForm({ ...form, hasPermits: e.target.value })}
                >
                  {["Yes", "No", "Not started"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Budget range">
                <input
                  className={inputCls}
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </Field>
              <Field label="Target completion">
                <input
                  className={inputCls}
                  placeholder="e.g. 8–12 months"
                  value={form.completion}
                  onChange={(e) => setForm({ ...form, completion: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Email" required>
              <input
                type="email"
                required
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <button className="btn-accent mt-5">Send project details</button>
        </Section>
      </form>
    </div>
  );
}
