import { Link, useLocation, useNavigate } from "react-router-dom";

import type { TriageResult } from "../../types";

const urgencyStyles: Record<
  TriageResult["urgency"],
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  medium: {
    label: "Medium",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  high: {
    label: "High",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

const PatientResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { result?: TriageResult } | null;
  const result = state?.result;

  if (!result) {
    return (
      <div className="panel flex flex-col gap-4 p-8 text-center">
        <h2 className="text-2xl text-ink">No triage data yet</h2>
        <p className="text-sm text-muted">
          Run a symptom check first to see recommendations.
        </p>
        <button
          type="button"
          className="mx-auto rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white"
          onClick={() => navigate("/patient")}
        >
          Start a check
        </button>
      </div>
    );
  }

  const urgencyMeta = urgencyStyles[result.urgency];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="panel flex flex-col gap-6 p-8">
        <div>
          <p className="kicker">Triage Result</p>
          <h1 className="text-3xl text-ink sm:text-4xl">
            Your urgency level is {urgencyMeta.label}.
          </h1>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${urgencyMeta.className}`}
        >
          {urgencyMeta.label} urgency
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Why this level?</p>
          <p className="mt-2 text-sm text-muted">{result.context}</p>
        </div>
        {result.symptomTags?.length ? (
          <div>
            <p className="text-sm font-semibold text-ink">Key symptoms</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.symptomTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-stroke bg-white/70 px-3 py-1 text-xs text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel flex flex-col gap-6 p-8">
        <div>
          <p className="text-sm font-semibold text-ink">Next steps</p>
          <p className="text-xs text-muted">
            Follow the guidance below and seek professional care if symptoms
            worsen.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {result.recommendation.map((step) => (
            <li
              key={step}
              className="rounded-2xl border border-stroke bg-white/70 px-4 py-3 text-sm text-ink"
            >
              {step}
            </li>
          ))}
        </ul>
        <Link
          to="/patient"
          className="rounded-2xl border border-stroke px-4 py-2 text-center text-sm font-semibold text-ink"
        >
          Run another check
        </Link>
      </section>
    </div>
  );
};

export default PatientResult;
