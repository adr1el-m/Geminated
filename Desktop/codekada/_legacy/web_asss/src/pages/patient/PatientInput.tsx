import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { TriageResult } from "../../types";

type FormState = {
  text: string;
  age: string;
  temperature: string;
  durationDays: string;
};

const initialForm: FormState = {
  text: "",
  age: "",
  temperature: "",
  durationDays: "",
};

const PatientInput = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmed = form.text.trim();
    if (trimmed.length < 5) {
      setError("Please share a bit more detail about your symptoms.");
      return;
    }

    const ageValue = form.age.trim() ? Number(form.age) : undefined;
    const temperatureValue = form.temperature.trim()
      ? Number(form.temperature)
      : undefined;
    const durationValue = form.durationDays.trim()
      ? Number(form.durationDays)
      : undefined;

    const payload: Record<string, unknown> = { text: trimmed };
    if (Number.isFinite(ageValue)) payload.age = ageValue;
    if (Number.isFinite(temperatureValue)) payload.temperature = temperatureValue;
    if (Number.isFinite(durationValue)) payload.durationDays = durationValue;

    setLoading(true);
    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TriageResult | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Triage failed.");
      }

      navigate("/patient/result", { state: { result: data } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Triage failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col gap-6">
        <p className="kicker">Symptom Check</p>
        <h1 className="text-4xl leading-tight text-ink sm:text-5xl">
          Calm, fast triage for Filipino families.
        </h1>
        <p className="text-base text-muted">
          Describe symptoms in English or Taglish. Our AI summarizes urgency and
          next steps, then saves anonymized trends for community health insights.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Urgency clarity",
              detail: "Low, medium, or high risk guidance in seconds.",
            },
            {
              title: "Explainable output",
              detail: "Short rationale so you know why it was flagged.",
            },
            {
              title: "Next step guide",
              detail: "Self-care tips or seek urgent care recommendations.",
            },
            {
              title: "Private by design",
              detail: "No names. Just anonymized symptom patterns.",
            },
          ].map((item) => (
            <div key={item.title} className="glass-card p-4">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-xs text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-semibold text-ink">
              What are you feeling?
            </label>
            <textarea
              className="mt-2 min-h-[140px] w-full rounded-2xl border border-stroke bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Example: Masakit ang lalamunan ko, may lagnat for 2 days, hirap lumunok."
              value={form.text}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, text: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-muted">Age</label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-2xl border border-stroke bg-white/80 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. 32"
                value={form.age}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, age: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">
                Temperature (C)
              </label>
              <input
                type="number"
                step="0.1"
                min={30}
                max={45}
                className="mt-1 w-full rounded-2xl border border-stroke bg-white/80 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. 38.5"
                value={form.temperature}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, temperature: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">
                Duration (days)
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-2xl border border-stroke bg-white/80 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. 2"
                value={form.durationDays}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, durationDays: event.target.value }))
                }
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Triaging..." : "Check urgency"}
          </button>

          <p className="text-xs text-muted">
            This tool is not a medical diagnosis. For emergencies, contact local
            emergency services immediately.
          </p>
        </form>
      </section>
    </div>
  );
};

export default PatientInput;
