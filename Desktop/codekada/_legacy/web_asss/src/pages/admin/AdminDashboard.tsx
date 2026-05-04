import { useEffect, useMemo, useState } from "react";

import type { AdminSummary } from "../../types";

const fallbackSummary: AdminSummary = {
  totalReports: 1248,
  urgencyBreakdown: [
    { level: "low", count: 802 },
    { level: "medium", count: 328 },
    { level: "high", count: 118 },
  ],
  topSymptoms: [
    { label: "fever", count: 212 },
    { label: "cough", count: 176 },
    { label: "sore throat", count: 164 },
    { label: "headache", count: 141 },
    { label: "body pain", count: 118 },
  ],
  trend: [
    { label: "Mon", count: 120 },
    { label: "Tue", count: 148 },
    { label: "Wed", count: 132 },
    { label: "Thu", count: 180 },
    { label: "Fri", count: 165 },
    { label: "Sat", count: 141 },
    { label: "Sun", count: 162 },
  ],
};

const AdminDashboard = () => {
  const [summary, setSummary] = useState<AdminSummary>(fallbackSummary);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch("/api/admin/summary");
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as AdminSummary;
        setSummary(data);
        setIsLive(true);
      } catch (error) {
        setIsLive(false);
      }
    };

    loadSummary();
  }, []);

  const maxTrend = useMemo(
    () => Math.max(...summary.trend.map((item) => item.count), 1),
    [summary.trend],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Facility Dashboard</p>
          <h1 className="text-3xl text-ink sm:text-4xl">
            Community triage insights at a glance.
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isLive
              ? "Live data from the TriagePH database."
              : "Showing preview data until the database is connected."}
          </p>
        </div>
        <div className="panel px-6 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Total reports
          </p>
          <p className="text-3xl font-display text-ink">
            {summary.totalReports}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {summary.urgencyBreakdown.map((item) => (
          <div key={item.level} className="glass-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {item.level} urgency
            </p>
            <p className="mt-2 text-2xl font-display text-ink">{item.count}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Trend spikes</p>
            <p className="text-xs text-muted">Last 7 days</p>
          </div>
          <div className="mt-6 grid gap-3">
            {summary.trend.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-10 text-xs text-muted">{item.label}</span>
                <div className="h-2 flex-1 rounded-full bg-white/70">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(item.count / maxTrend) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-muted">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Top symptoms</p>
            <p className="text-xs text-muted">Most reported</p>
          </div>
          <ul className="mt-4 space-y-3">
            {summary.topSymptoms.length ? (
              summary.topSymptoms.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-stroke bg-white/70 px-4 py-3 text-sm"
                >
                  <span className="text-ink">{item.label}</span>
                  <span className="text-muted">{item.count}</span>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-stroke px-4 py-6 text-center text-sm text-muted">
                No tagged symptoms yet.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
