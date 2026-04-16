"use client";

import { useMemo, useState } from "react";
import { generateAuditData, RATE_PER_KWH, type ApplianceRecord } from "@/lib/data";

// ─── tiny helpers ──────────────────────────────────────────
const fmt  = (n: number, d = 2)  => n.toFixed(d);
const inr  = (n: number)         => `₹${fmt(n)}`;
const pct  = (val: number, max: number) => Math.min(100, (val / max) * 100);

function barColor(pctVal: number): string {
  if (pctVal > 75) return "linear-gradient(90deg,#ef4444,#f97316)";
  if (pctVal > 45) return "linear-gradient(90deg,#f59e0b,#fbbf24)";
  return "linear-gradient(90deg,#10b981,#34d399)";
}
function rankClass(rank: number): string {
  if (rank === 1) return "rank-1";
  if (rank === 2) return "rank-2";
  if (rank === 3) return "rank-3";
  return "rank-n";
}

// ─── Sub-components ────────────────────────────────────────

function NavBar({ activeTab, setActiveTab }: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const tabs = [
    { id: "overview",  label: "Overview"       },
    { id: "ranking",   label: "Rankings"       },
    { id: "recommend", label: "Recommendations"},
    { id: "search",    label: "Search"         },
    { id: "daily",     label: "Daily Stats"    },
  ];
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="nav-logo">
          <div className="nav-logo-icon">⚡</div>
          <div>
            <div className="nav-logo-text">EnergyAudit</div>
            <div className="nav-logo-sub">Group 63 · Project 110</div>
          </div>
        </div>
        <div className="nav-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`nav-${t.id}`}
              className={`btn btn-ghost ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Hero({ totalKwh, totalCost, rate }: {
  totalKwh: number;
  totalCost: number;
  rate: number;
}) {
  return (
    <section className="hero animate-fadeup">
      <div className="hero-eyebrow">⚡ Smart Home Energy Management</div>
      <h1>
        Know where your <span className="gradient">electricity bill</span> goes
      </h1>
      <p>
        Tracking 15 appliances over 30 days · Rate: {inr(rate)}/kWh ·
        Monthly total: <strong style={{ color: "var(--text)" }}>{inr(totalCost)}</strong>
      </p>
    </section>
  );
}

function StatsGrid({ data }: { data: ReturnType<typeof generateAuditData> }) {
  const stats = [
    {
      label: "Total Monthly kWh",
      value: fmt(data.totalMonthlyKwh),
      sub: "30-day consumption",
      color: "var(--blue)",
    },
    {
      label: "Monthly Bill",
      value: inr(data.totalMonthlyCost),
      sub: `@ ₹${RATE_PER_KWH}/kWh`,
      color: "var(--amber)",
    },
    {
      label: "Appliances Flagged",
      value: String(data.replacementCandidates.length),
      sub: "above 75th percentile",
      color: "var(--red)",
    },
    {
      label: "Potential Saving",
      value: inr(data.potentialSaving),
      sub: "by replacing flagged units",
      color: "var(--green)",
    },
    {
      label: "Avg Daily Usage",
      value: fmt(data.dailyAvg, 3),
      sub: "kWh per appliance/day",
      color: "var(--purple)",
    },
    {
      label: "75th % Threshold",
      value: fmt(data.percentileThreshold),
      sub: "kWh/month cutoff",
      color: "var(--blue)",
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div key={s.label} className="stat-chip">
          <span className="label">{s.label}</span>
          <span className="value" style={{ color: s.color }}>{s.value}</span>
          <span className="sub">{s.sub}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewTable({ appliances, maxKwh }: {
  appliances: ApplianceRecord[];
  maxKwh: number;
}) {
  return (
    <div className="card animate-fadeup">
      <div className="section-header">
        <div className="section-title">
          <span>📋</span>
          <h3>All Appliances</h3>
        </div>
        <span className="badge badge-blue">{appliances.length} appliances</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Appliance</th>
              <th>Wattage</th>
              <th>30-Day kWh</th>
              <th>Consumption</th>
              <th className="right">Monthly Cost</th>
            </tr>
          </thead>
          <tbody>
            {appliances.map((a) => {
              const p = pct(a.monthlyTotal, maxKwh);
              return (
                <tr key={a.info.id}>
                  <td>
                    <span style={{ marginRight: "0.5rem" }}>{a.info.icon}</span>
                    <strong style={{ fontSize: "0.9rem" }}>{a.info.name}</strong>
                  </td>
                  <td className="mono" style={{ color: "var(--text-muted)" }}>
                    {a.info.wattage}W
                  </td>
                  <td className="mono">{fmt(a.monthlyTotal)} kWh</td>
                  <td style={{ width: "180px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${p}%`, background: barColor(p) }}
                        />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", width: "32px" }}>
                        {Math.round(p)}%
                      </span>
                    </div>
                  </td>
                  <td className="right mono" style={{ fontWeight: 600 }}>
                    {inr(a.monthlyCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                <span style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>
                  TOTAL
                </span>
              </td>
              <td />
              <td className="right mono" style={{ fontWeight: 700, color: "var(--amber)" }}>
                {inr(appliances.reduce((s, a) => s + a.monthlyCost, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function RankingView({ sorted }: { sorted: ApplianceRecord[] }) {
  const maxKwh = sorted[0]?.monthlyTotal ?? 1;
  return (
    <div className="card animate-fadeup">
      <div className="section-header">
        <div className="section-title">
          <span>🏆</span>
          <h3>Consumption Ranking</h3>
        </div>
        <span className="badge badge-purple">Bubble Sort — highest first</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {sorted.map((a) => {
          const p = pct(a.monthlyTotal, maxKwh);
          return (
            <div
              key={a.info.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-card-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div className={`rank-badge ${rankClass(a.rank!)}`}>{a.rank}</div>
              <span style={{ fontSize: "1.2rem" }}>{a.info.icon}</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: "0.9rem" }}>
                {a.info.name}
              </span>
              <div className="progress-bar" style={{ width: "120px" }}>
                <div
                  className="progress-fill"
                  style={{ width: `${p}%`, background: barColor(p) }}
                />
              </div>
              <span className="mono" style={{ width: "70px", textAlign: "right", fontSize: "0.85rem" }}>
                {fmt(a.monthlyTotal)} kWh
              </span>
              <span
                className="mono"
                style={{ width: "75px", textAlign: "right", fontWeight: 700, color: "var(--amber)", fontSize: "0.85rem" }}
              >
                {inr(a.monthlyCost)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationsView({
  candidates,
  threshold,
  potentialSaving,
  all,
}: {
  candidates: ApplianceRecord[];
  threshold: number;
  potentialSaving: number;
  all: ApplianceRecord[];
}) {
  const safe = all.filter((a) => !candidates.includes(a));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} className="animate-fadeup">
      {/* summary banner */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(245,158,11,0.08))",
          border: "1px solid rgba(239,68,68,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h3 style={{ color: "var(--red)" }}>⚠ {candidates.length} appliances flagged</h3>
          <p style={{ marginTop: "0.3rem", fontSize: "0.85rem" }}>
            75th percentile threshold: <strong style={{ color: "var(--text)" }}>{fmt(threshold)} kWh/month</strong>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Potential monthly saving
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--green)" }}>
            {inr(potentialSaving)}
          </div>
        </div>
      </div>

      {/* flagged */}
      <div className="card">
        <h3 style={{ marginBottom: "1rem", color: "var(--red)" }}>🔴 Replace These</h3>
        {candidates.map((a) => {
          const overage = (a.monthlyTotal - threshold) * RATE_PER_KWH;
          return (
            <div key={a.info.id} className="warning-card">
              <div className="warning-icon">{a.info.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="warning-name">{a.info.name}</div>
                <div className="warning-detail">
                  {fmt(a.monthlyTotal)} kWh/month · {inr(a.monthlyCost)}/month ·
                  Overage cost: <strong style={{ color: "var(--red)" }}>{inr(overage)}/month</strong>
                </div>
              </div>
              <span className="badge badge-red">High</span>
            </div>
          );
        })}
      </div>

      {/* safe */}
      <div className="card">
        <h3 style={{ marginBottom: "1rem", color: "var(--green)" }}>✅ Within Efficient Range</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.6rem" }}>
          {safe.map((a) => (
            <div
              key={a.info.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "var(--radius-sm)",
                background: "var(--green-dim)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <span>{a.info.icon}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{a.info.name}</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--green)" }}>
                {fmt(a.monthlyTotal)} kWh
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchView({ appliances }: { appliances: ApplianceRecord[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return appliances.filter(
      (a) => a.info.name.toLowerCase().includes(q) || a.info.id.toString().includes(q)
    );
  }, [query, appliances]);

  return (
    <div className="animate-fadeup" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card">
        <h3 style={{ marginBottom: "0.75rem" }}>🔍 Linear Search by Name</h3>
        <input
          id="search-input"
          className="input"
          type="text"
          placeholder='Type appliance name e.g. "Air Conditioner" or "fan"…'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
            {results.length > 0
              ? `${results.length} result${results.length > 1 ? "s" : ""} found`
              : "No match found"}
          </p>
        )}
      </div>

      {results.map((a) => (
        <div key={a.info.id} className="card animate-fadeup">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "2.5rem" }}>{a.info.icon}</span>
            <div>
              <h2>{a.info.name}</h2>
              <p style={{ fontSize: "0.8rem" }}>Appliance ID: #{a.info.id}</p>
            </div>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
            {[
              { label: "Wattage",        value: `${a.info.wattage}W`, color: "var(--purple)" },
              { label: "Monthly kWh",    value: `${fmt(a.monthlyTotal)} kWh`, color: "var(--blue)" },
              { label: "Monthly Cost",   value: inr(a.monthlyCost),   color: "var(--amber)" },
              { label: "Avg Daily kWh",  value: `${fmt(a.info.avgDailyKwh)} kWh`, color: "var(--green)" },
            ].map((s) => (
              <div key={s.label} className="stat-chip">
                <span className="label">{s.label}</span>
                <span className="value" style={{ color: s.color, fontSize: "1.2rem" }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              30-Day Usage Breakdown
            </h3>
            <div className="day-bars">
              {a.dailyKwh.map((v, i) => {
                const maxDay = Math.max(...a.dailyKwh);
                const h = pct(v, maxDay);
                return (
                  <div
                    key={i}
                    className="day-bar"
                    style={{ height: `${h}%` }}
                    title={`Day ${i + 1}: ${fmt(v, 4)} kWh`}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-faint)", marginTop: "0.25rem" }}>
              <span>Day 1</span><span>Day 30</span>
            </div>
          </div>
        </div>
      ))}

      {!query && (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-faint)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔍</div>
          <p>Start typing to search across 15 appliances</p>
        </div>
      )}
    </div>
  );
}

function DailyStats({ data }: { data: ReturnType<typeof generateAuditData> }) {
  const max = Math.max(...data.dailyTotals);
  const min = Math.min(...data.dailyTotals);

  return (
    <div className="animate-fadeup" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="stats-grid">
        {[
          { label: "Daily Avg",    value: `${fmt(data.dailyAvg, 4)} kWh`, color: "var(--blue)"   },
          { label: "Peak Day",     value: `Day ${data.peakDay}`,           color: "var(--red)"    },
          { label: "Lowest Day",   value: `Day ${data.lowestDay}`,         color: "var(--green)"  },
          { label: "Std Deviation",value: `${fmt(data.stdDev, 4)} kWh`,   color: "var(--purple)" },
        ].map((s) => (
          <div key={s.label} className="stat-chip">
            <span className="label">{s.label}</span>
            <span className="value" style={{ color: s.color, fontSize: "1.3rem" }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>📊 30-Day Household Consumption</h3>
        <div className="day-bars" style={{ height: "140px" }}>
          {data.dailyTotals.map((v, i) => {
            const h = pct(v, max);
            const isPeak  = v === max;
            const isLow   = v === min;
            return (
              <div
                key={i}
                className={`day-bar ${isPeak ? "peak" : isLow ? "low" : ""}`}
                style={{ height: `${h}%` }}
                title={`Day ${i + 1}: ${fmt(v, 4)} kWh`}
              />
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.68rem",
            color: "var(--text-faint)",
            marginTop: "0.3rem",
          }}
        >
          <span>Day 1</span>
          <span style={{ color: "var(--green)" }}>🟢 Lowest</span>
          <span style={{ color: "var(--red)" }}>🔴 Peak</span>
          <span>Day 30</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>📋 Day-by-Day Log</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Total kWh</th>
                <th>Daily Cost</th>
                <th>vs Average</th>
                <th>Bar</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyTotals.map((v, i) => {
                const diff  = v - data.dailyAvg;
                const color = diff > 0 ? "var(--red)" : "var(--green)";
                return (
                  <tr key={i} style={v === max ? { background:"rgba(239,68,68,0.05)" } : v === min ? { background:"rgba(16,185,129,0.05)" } : {}}>
                    <td className="mono" style={{ color: "var(--text-muted)" }}>Day {i + 1}</td>
                    <td className="mono">{fmt(v, 4)}</td>
                    <td className="mono">{inr(v * RATE_PER_KWH)}</td>
                    <td className="mono" style={{ color }}>
                      {diff > 0 ? "+" : ""}{fmt(diff, 4)}
                    </td>
                    <td style={{ width: "100px" }}>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct(v, max)}%`, background: barColor(pct(v, max)) }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Root page ─────────────────────────────────────────────
export default function Home() {
  const data = useMemo(() => generateAuditData(), []);
  const [activeTab, setActiveTab] = useState("overview");

  const maxKwh = Math.max(...data.appliances.map((a) => a.monthlyTotal));

  return (
    <>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Mobile tab bar */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "0.4rem",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
        className="mobile-tabs"
      >
        {["overview","ranking","recommend","search","daily"].map((t) => (
          <button
            key={t}
            id={`mob-nav-${t}`}
            className={`btn btn-ghost ${activeTab === t ? "active" : ""}`}
            style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}
            onClick={() => setActiveTab(t)}
          >
            {{
              overview:"📋 Overview",
              ranking:"🏆 Rankings",
              recommend:"⚠ Recommend",
              search:"🔍 Search",
              daily:"📊 Daily",
            }[t]}
          </button>
        ))}
      </div>

      <main className="container">
        <Hero
          totalKwh={data.totalMonthlyKwh}
          totalCost={data.totalMonthlyCost}
          rate={RATE_PER_KWH}
        />

        <StatsGrid data={data} />

        <div className="section">
          {activeTab === "overview"  && (
            <OverviewTable appliances={data.appliances} maxKwh={maxKwh} />
          )}
          {activeTab === "ranking"   && (
            <RankingView sorted={data.sortedByConsumption} />
          )}
          {activeTab === "recommend" && (
            <RecommendationsView
              candidates={data.replacementCandidates}
              threshold={data.percentileThreshold}
              potentialSaving={data.potentialSaving}
              all={data.appliances}
            />
          )}
          {activeTab === "search"    && (
            <SearchView appliances={data.appliances} />
          )}
          {activeTab === "daily"     && (
            <DailyStats data={data} />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            EnergyAudit · Project 110 · Div C Group 63 ·
            Python for Logic Development & Programming · 2025-26
          </p>
          <p style={{ marginTop: "0.3rem" }}>
            Khan Zaid · Omkar Mhaske · Tanvi Bajrang Waghmare
          </p>
        </div>
      </footer>
    </>
  );
}
