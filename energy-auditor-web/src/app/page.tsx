"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { generateAuditData, RATE_PER_KWH, type ApplianceRecord } from "@/lib/data";

const fmt = (n: number, d = 2) => n.toFixed(d);
const inr = (n: number) => `₹${fmt(n)}`;
const pct = (v: number, max: number) => Math.min(100, (v / max) * 100);

function useCounter(target: number, dur = 900) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur]);
  return val;
}

/* ═══ NAV ═══ */
const TABS = [
  { id: "overview",  label: "Dashboard" },
  { id: "ranking",   label: "Energy Usage" },
  { id: "recommend", label: "Audits" },
  { id: "search",    label: "Search" },
  { id: "daily",     label: "Analytics" },
];

function Sidebar({ active, setActive, open, close }: {
  active: string; setActive: (s: string) => void; open: boolean; close: () => void;
}) {
  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={close}/>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">EnergyAudit</div>
          <div className="sidebar-brand-sub">Operational View</div>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((t) => (
            <button key={t.id} id={`nav-${t.id}`}
              className={`nav-item ${active === t.id ? "active" : ""}`}
              onClick={() => { setActive(t.id); close(); }}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom" />
      </aside>
    </>
  );
}

/* ═══ STATS ═══ */
function Stats({ data }: { data: ReturnType<typeof generateAuditData> }) {
  const kwh = useCounter(data.totalMonthlyKwh);
  const cost = useCounter(data.totalMonthlyCost);
  const saving = useCounter(data.potentialSaving);
  const eff = Math.round(100 - (data.replacementCandidates.length / data.appliances.length) * 100);

  return (
    <div className="stats-row">
      <div className="stat-card anim-up d1">
        <div className="stat-card-label">Total Consumption</div>
        <div className="stat-card-value">{fmt(kwh, 1)} <span>kWh</span></div>
        <div className="stat-card-sub">30-day period</div>
      </div>
      <div className="stat-card anim-up d2">
        <div className="stat-card-label">Monthly Bill</div>
        <div className="stat-card-value">{inr(cost)}</div>
        <div className="stat-card-sub">@ {inr(RATE_PER_KWH)}/kWh</div>
      </div>
      <div className="stat-card anim-up d3">
        <div className="stat-card-label">Flagged</div>
        <div className="stat-card-value">{data.replacementCandidates.length} <span>of {data.appliances.length}</span></div>
        <div className="stat-card-sub">Above 75th percentile</div>
      </div>
      <div className="stat-card anim-up d4">
        <div className="stat-card-label">Efficiency Score</div>
        <div className="stat-card-value">{eff} <span>/100</span></div>
        <div className="stat-card-bar">
          <div className="stat-card-bar-fill anim-fill" style={{ width: `${eff}%` }}/>
        </div>
      </div>
    </div>
  );
}

/* ═══ OVERVIEW ═══ */
function OverviewTab({ data }: { data: ReturnType<typeof generateAuditData> }) {
  const maxKwh = Math.max(...data.appliances.map((a) => a.monthlyTotal));
  const top4 = data.sortedByConsumption.slice(0, 4);
  const topName = data.sortedByConsumption[0].info.name;

  return (
    <>
      <div className="content-row">
        <div className="card anim-up d2">
          <div className="card-head">
            <div>
              <h3>Top Consumers</h3>
              <div className="card-head-sub">Appliance level breakdown for current period</div>
            </div>
            <button className="card-link">View All</button>
          </div>
          {top4.map((a, i) => (
            <div key={a.info.id} className={`appliance-row anim-up d${i + 2}`}>
              <div className="appliance-icon">{String(a.rank!).padStart(2, "0")}</div>
              <div className="appliance-info">
                <div className="appliance-name">{a.info.name}</div>
                <div className="appliance-bar-track">
                  <div className="appliance-bar-fill anim-fill" style={{ width: `${pct(a.monthlyTotal, maxKwh)}%`, animationDelay: `${i * 0.1 + 0.2}s` }}/>
                </div>
              </div>
              <div className="appliance-value">{fmt(a.monthlyTotal)} <span className="appliance-value-unit">kWh</span></div>
            </div>
          ))}
        </div>

        <div className="anim-up d3">
          <div className="side-card alert">
            <h3>Anomaly Detected</h3>
            <p>Unusual spike in consumption detected in <strong>{topName}</strong> during peak hours. Consider scheduling maintenance.</p>
            <button className="side-card-btn">Investigate</button>
          </div>
          <div className="side-card">
            <h3>Savings Potential</h3>
            <p><strong>{data.replacementCandidates.length}</strong> appliances exceed the {fmt(data.percentileThreshold)} kWh threshold. Replacing them could save <strong>{inr(data.potentialSaving)}/month</strong>.</p>
          </div>
        </div>
      </div>

      <div className="card anim-up d4">
        <div className="card-head">
          <h3>All Appliances</h3>
          <span className="badge">{data.appliances.length} Tracked</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Appliance</th><th>Wattage</th><th>30-Day kWh</th><th style={{width:140}}>Usage</th><th className="r">Monthly Cost</th></tr></thead>
            <tbody>
              {data.appliances.map((a) => {
                const p = pct(a.monthlyTotal, maxKwh);
                return (
                  <tr key={a.info.id}>
                    <td><strong style={{ fontWeight: 600, fontSize: "0.82rem" }}>{a.info.name}</strong></td>
                    <td className="mono" style={{ color: "var(--gray-500)" }}>{a.info.wattage}W</td>
                    <td className="mono">{fmt(a.monthlyTotal)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div className="appliance-bar-track" style={{ flex: 1, maxWidth: 100 }}>
                          <div className="appliance-bar-fill" style={{ width: `${p}%` }}/>
                        </div>
                        <span style={{ fontSize: "0.65rem", color: "var(--gray-500)", width: 24 }}>{Math.round(p)}%</span>
                      </div>
                    </td>
                    <td className="r mono" style={{ fontWeight: 700 }}>{inr(a.monthlyCost)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr>
              <td colSpan={4}><strong style={{ fontSize: "0.72rem", color: "var(--gray-500)", letterSpacing: "0.08em" }}>TOTAL</strong></td>
              <td className="r mono" style={{ fontWeight: 900 }}>{inr(data.totalMonthlyCost)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

/* ═══ RANKING ═══ */
function RankingTab({ sorted }: { sorted: ApplianceRecord[] }) {
  const maxKwh = sorted[0]?.monthlyTotal ?? 1;
  return (
    <div className="card anim-up">
      <div className="card-head">
        <div><h3>Consumption Ranking</h3><div className="card-head-sub">Bubble Sort — highest to lowest</div></div>
        <span className="badge badge-dark">Descending</span>
      </div>
      {sorted.map((a, i) => {
        const p = pct(a.monthlyTotal, maxKwh);
        const rc = a.rank === 1 ? "rank-1" : a.rank === 2 ? "rank-2" : a.rank === 3 ? "rank-3" : "rank-n";
        return (
          <div key={a.info.id} className={`rank-row anim-r d${Math.min(i + 1, 8)}`}>
            <div className={`rank-num ${rc}`}>{a.rank}</div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.85rem" }}>{a.info.name}</span>
            <div className="appliance-bar-track" style={{ width: 100 }}>
              <div className="appliance-bar-fill anim-fill" style={{ width: `${p}%`, animationDelay: `${i * 0.04}s` }}/>
            </div>
            <span className="mono" style={{ width: 70, textAlign: "right", fontSize: "0.8rem" }}>{fmt(a.monthlyTotal)}</span>
            <span className="mono" style={{ width: 70, textAlign: "right", fontWeight: 700 }}>{inr(a.monthlyCost)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ RECOMMENDATIONS ═══ */
function RecommendTab({ data }: { data: ReturnType<typeof generateAuditData> }) {
  const { replacementCandidates: cands, percentileThreshold: thr, potentialSaving, appliances } = data;
  const safe = appliances.filter((a) => !cands.includes(a));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="card anim-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderLeft: "3px solid var(--black)" }}>
        <div>
          <h3>{cands.length} Appliances Flagged</h3>
          <p style={{ fontSize: "0.82rem", marginTop: "0.15rem" }}>Threshold: {fmt(thr)} kWh/month (75th percentile)</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gray-500)" }}>Potential Savings</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{inr(potentialSaving)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className="card anim-up d1">
          <div className="card-head"><h3>Replace These</h3></div>
          {cands.map((a, i) => {
            const ov = (a.monthlyTotal - thr) * RATE_PER_KWH;
            return (
              <div key={a.info.id} className={`warn-item anim-r d${i + 1}`}>
                <div className="appliance-icon" style={{ fontSize: "0.65rem" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{a.info.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--gray-500)", marginTop: "0.05rem" }}>
                    {fmt(a.monthlyTotal)} kWh — overage: {inr(ov)}/mo
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card anim-up d2">
          <div className="card-head"><h3>Efficient Range</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
            {safe.map((a, i) => (
              <div key={a.info.id} className={`safe-item anim-up d${Math.min(i + 1, 8)}`}>
                <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>{a.info.name}</span>
                <span className="mono" style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gray-500)" }}>{fmt(a.monthlyTotal)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ SEARCH ═══ */
function SearchTab({ appliances }: { appliances: ApplianceRecord[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return [];
    return appliances.filter((a) => a.info.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, appliances]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="card anim-up">
        <div className="card-head"><h3>Search Appliances</h3><span className="badge">Linear Search</span></div>
        <div className="search-box">
          <input id="search-input" type="text" placeholder='Type a name, e.g. "fan" or "air conditioner"' value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"/>
        </div>
        {q && <p style={{ marginTop: "0.4rem", fontSize: "0.78rem" }}>{results.length ? `${results.length} result${results.length > 1 ? "s" : ""}` : "No match"}</p>}
      </div>
      {results.map((a, i) => (
        <div key={a.info.id} className={`card anim-up d${i + 1}`}>
          <h2 style={{ marginBottom: "0.15rem" }}>{a.info.name}</h2>
          <p style={{ fontSize: "0.78rem", marginBottom: "1rem" }}>ID #{a.info.id} — {a.info.wattage}W rated</p>
          <div className="mini-stats" style={{ marginBottom: "1rem" }}>
            {[
              { l: "Wattage", v: `${a.info.wattage}W` },
              { l: "Monthly kWh", v: fmt(a.monthlyTotal) },
              { l: "Monthly Cost", v: inr(a.monthlyCost) },
              { l: "Avg Daily", v: `${fmt(a.info.avgDailyKwh)} kWh` },
            ].map((s) => (
              <div key={s.l} className="mini-stat">
                <div className="mini-stat-label">{s.l}</div>
                <div className="mini-stat-value">{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gray-500)", marginBottom: "0.4rem" }}>30-Day Usage</div>
          <div className="bars">
            {a.dailyKwh.map((v, d) => {
              const mx = Math.max(...a.dailyKwh);
              return <div key={d} className="bar-col anim-grow" style={{ height: `${pct(v, mx)}%`, opacity: 0.55, animationDelay: `${d * 0.018}s` }} title={`Day ${d + 1}: ${fmt(v, 4)} kWh`}/>;
            })}
          </div>
          <div className="bars-labels"><span>Day 1</span><span>Day 30</span></div>
        </div>
      ))}
      {!q && (
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <p style={{ fontSize: "0.88rem", color: "var(--gray-400)" }}>Start typing to search across 15 appliances</p>
        </div>
      )}
    </div>
  );
}

/* ═══ DAILY ═══ */
function DailyTab({ data }: { data: ReturnType<typeof generateAuditData> }) {
  const max = Math.max(...data.dailyTotals);
  const min = Math.min(...data.dailyTotals);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="mini-stats anim-up">
        {[
          { l: "Daily Avg", v: `${fmt(data.dailyAvg, 3)} kWh` },
          { l: "Peak Day", v: `Day ${data.peakDay}` },
          { l: "Lowest Day", v: `Day ${data.lowestDay}` },
          { l: "Std Deviation", v: fmt(data.stdDev, 4) },
        ].map((s) => (
          <div key={s.l} className="mini-stat"><div className="mini-stat-label">{s.l}</div><div className="mini-stat-value">{s.v}</div></div>
        ))}
      </div>
      <div className="card anim-up d2">
        <div className="card-head"><h3>30-Day Household Consumption</h3></div>
        <div className="bars" style={{ height: 140 }}>
          {data.dailyTotals.map((v, i) => {
            const h = pct(v, max);
            const cls = v === max ? "peak" : v === min ? "low" : "";
            return <div key={i} className={`bar-col ${cls} anim-grow`} style={{ height: `${h}%`, opacity: v === max || v === min ? 1 : 0.5, animationDelay: `${i * 0.02}s` }} title={`Day ${i + 1}: ${fmt(v, 4)} kWh`}/>;
          })}
        </div>
        <div className="bars-labels"><span>Day 1</span><span>Day 30</span></div>
      </div>
      <div className="card anim-up d3">
        <div className="card-head"><h3>Day-by-Day Log</h3></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Day</th><th>kWh</th><th>Cost</th><th>vs Avg</th><th style={{width:90}}>Bar</th></tr></thead>
            <tbody>{data.dailyTotals.map((v, i) => {
              const diff = v - data.dailyAvg;
              return (
                <tr key={i} style={v === max ? { fontWeight: 700 } : v === min ? { color: "var(--gray-400)" } : {}}>
                  <td className="mono" style={{ color: "var(--gray-500)" }}>Day {i + 1}</td>
                  <td className="mono">{fmt(v, 4)}</td>
                  <td className="mono">{inr(v * RATE_PER_KWH)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{diff > 0 ? "+" : ""}{fmt(diff, 4)}</td>
                  <td><div className="appliance-bar-track"><div className="appliance-bar-fill" style={{ width: `${pct(v, max)}%` }}/></div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══ ROOT ═══ */
export default function Home() {
  const data = useMemo(() => generateAuditData(), []);
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const titles: Record<string, string> = { overview: "Dashboard", ranking: "Energy Usage", recommend: "Audits", search: "Search", daily: "Analytics" };

  return (
    <div className="app">
      <Sidebar active={tab} setActive={setTab} open={sideOpen} close={() => setSideOpen(false)}/>
      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="hamburger" onClick={() => setSideOpen(true)}>&#9776;</button>
            <span className="topbar-title">{titles[tab]}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-meta">PLDP 2025-26</span>
            <div className="topbar-avatar">ZK</div>
          </div>
        </header>
        <div className="page">
          <Stats data={data}/>
          <div key={tab}>
            {tab === "overview" && <OverviewTab data={data}/>}
            {tab === "ranking" && <RankingTab sorted={data.sortedByConsumption}/>}
            {tab === "recommend" && <RecommendTab data={data}/>}
            {tab === "search" && <SearchTab appliances={data.appliances}/>}
            {tab === "daily" && <DailyTab data={data}/>}
          </div>
        </div>
        <footer className="footer" />
      </div>
    </div>
  );
}
