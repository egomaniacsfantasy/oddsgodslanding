import { useState, useMemo } from "react";
import { NBA_SCHEDULE } from "../data/nbaSchedule";
import { NBA_STANDINGS } from "../data/nbaStandings";
import { runSim, type Override, type SimResult } from "../lib/simulation";

function pFmt(v: number) {
  return v >= 99.5 ? ">99%" : v < 0.1 ? "<0.1%" : v.toFixed(1) + "%";
}
function pBar(val: number) {
  return <div className="prob-bar" style={{ width: `${Math.round(val / 100 * 64)}px` }} />;
}
function seedClass(s: number) { return s <= 6 ? "top6" : s <= 10 ? "playin" : "out"; }

export default function SimPage() {
  const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());
  const [results, setResults] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [teamFilter, setTeamFilter] = useState("");

  const filtered = useMemo(() => {
    if (!teamFilter) return NBA_SCHEDULE;
    const q = teamFilter.toUpperCase();
    return NBA_SCHEDULE.filter(
      (g) => g.homeTeamAbbr.includes(q) || g.awayTeamAbbr.includes(q)
    );
  }, [teamFilter]);

  const overrideCount = useMemo(
    () => [...overrides.values()].filter((v) => v !== "model").length,
    [overrides]
  );

  function setOv(gameId: string, ov: Override) {
    setOverrides((prev) => {
      const next = new Map(prev);
      if (ov === "model") next.delete(gameId);
      else next.set(gameId, ov);
      return next;
    });
  }

  function resetAll() { setOverrides(new Map()); setResults(null); }

  async function handleRun() {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 10));
    const res = runSim(NBA_STANDINGS, NBA_SCHEDULE, overrides, 5000);
    setResults(res);
    setRunning(false);
  }

  if (!NBA_SCHEDULE.length || !NBA_STANDINGS.length) {
    return <div className="empty-state">No data — run sim_nba.py to generate.</div>;
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        <input type="text" placeholder="Filter by team (e.g. LAL)" value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:6,
            color:"var(--text)", fontFamily:"var(--sans)", fontSize:"0.86rem",
            padding:"0.38rem 0.7rem", width:180, outline:"none" }} />
        <span style={{ color:"var(--text3)", fontSize:"0.82rem" }}>
          {overrideCount > 0 ? `${overrideCount} override${overrideCount>1?"s":""}` : "No overrides — using model probs"}
        </span>
        {overrideCount > 0 && (
          <button onClick={resetAll}
            style={{ background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:6,
              color:"var(--text2)", fontFamily:"var(--sans)", fontSize:"0.82rem",
              padding:"0.3rem 0.7rem", cursor:"pointer" }}>
            Reset all
          </button>
        )}
        <button onClick={handleRun} disabled={running}
          style={{ background:running?"var(--bg3)":"var(--accent)", border:"none", borderRadius:6,
            color:running?"var(--text2)":"#000", fontFamily:"var(--sans)", fontSize:"0.88rem",
            fontWeight:700, padding:"0.4rem 1.1rem", cursor:running?"wait":"pointer", marginLeft:"auto" }}>
          {running ? "Simulating..." : "Run Sim (5k)"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:results?"1fr 1fr":"1fr", gap:"1.5rem", alignItems:"start" }}>
        {/* Game picker */}
        <div>
          <div style={{ color:"var(--text2)", fontSize:"0.8rem", marginBottom:"0.4rem" }}>
            Pick each game: use model prob, or force a winner
          </div>
          <div style={{ maxHeight:560, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8 }}>
            {filtered.slice(0, 250).map((g) => {
              const ov = overrides.get(g.gameId) ?? "model";
              const pct = Math.round(g.pHomeWins * 100);
              return (
                <div key={g.gameId} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"0.42rem 0.7rem", borderBottom:"1px solid var(--border)",
                  background:ov!=="model"?"var(--bg3)":undefined,
                }}>
                  <div style={{ fontSize:"0.82rem", flex:1, minWidth:0 }}>
                    <span style={{ fontWeight:600 }}>{g.homeTeamAbbr}</span>
                    <span style={{ color:"var(--text3)", margin:"0 0.3rem", fontSize:"0.75rem" }}>vs</span>
                    <span>{g.awayTeamAbbr}</span>
                    <span style={{ color:"var(--text3)", fontSize:"0.72rem", marginLeft:"0.5rem" }}>
                      {g.gameDate.slice(5).replace("-","/")}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:2, flexShrink:0 }}>
                    {(["home","model","away"] as const).map((o) => {
                      const active = ov === o;
                      const bg = active ? (o==="model"?"var(--accent)":o==="home"?"var(--green)":"var(--red)") : "var(--bg2)";
                      const fg = active ? (o==="model"?"#000":"#fff") : "var(--text2)";
                      return (
                        <button key={o} onClick={() => setOv(g.gameId, o)}
                          style={{ background:bg, border:"1px solid var(--border2)", borderRadius:4,
                            color:fg, fontFamily:"var(--mono)", fontSize:"0.71rem",
                            padding:"0.2rem 0.42rem", cursor:"pointer", fontWeight:active?700:400,
                            minWidth:36, textAlign:"center" }}>
                          {o==="model" ? `${pct}%` : o==="home" ? g.homeTeamAbbr : g.awayTeamAbbr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filtered.length > 250 && (
              <div style={{ padding:"0.5rem 0.7rem", color:"var(--text3)", fontSize:"0.77rem" }}>
                Showing 250 of {filtered.length} — filter by team to narrow
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results ? (
          <div>
            <div style={{ color:"var(--text2)", fontSize:"0.8rem", marginBottom:"0.5rem" }}>
              5,000 simulations &middot; {overrideCount} manual override{overrideCount!==1?"s":""}
            </div>
            {["East","West"].map((conf) => {
              const rows = NBA_STANDINGS
                .filter((s) => s.conference === conf)
                .sort((a, b) => a.seed - b.seed);
              return (
                <div key={conf} className="conf-block">
                  <div className="section-title" style={{ fontSize:"0.88rem", marginBottom:"0.4rem" }}>
                    <span style={{ color:conf==="East"?"var(--blue)":"var(--red)" }}>●</span>{" "}
                    {conf}ern Conference
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table className="data-table">
                      <thead><tr>
                        <th className="left">#</th>
                        <th className="left">Team</th>
                        <th title="P(make playoffs)">PO%</th>
                        <th title="P(round 2)">R2%</th>
                        <th title="P(conf finals)">CF%</th>
                        <th title="P(finals)">Fin%</th>
                        <th title="P(champion)">Champ%</th>
                      </tr></thead>
                      <tbody>
                        {rows.map((s) => {
                          const r = results[s.teamId];
                          return (
                            <tr key={s.teamId}>
                              <td className="left">
                                <span className={`seed-badge ${seedClass(s.seed)}`}>{s.seed}</span>
                              </td>
                              <td className="left" style={{ fontWeight:600 }}>{s.teamAbbr}</td>
                              <td>{r ? <div className="prob-bar-cell">{pBar(r.makePlayoffs)}{pFmt(r.makePlayoffs)}</div> : "—"}</td>
                              <td>{r ? pFmt(r.round2) : "—"}</td>
                              <td>{r ? pFmt(r.confFinals) : "—"}</td>
                              <td>{r ? pFmt(r.finals) : "—"}</td>
                              <td style={{ color:"var(--accent)", fontWeight:600 }}>{r ? pFmt(r.champion) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            color:"var(--text3)", fontSize:"0.85rem", fontFamily:"var(--mono)",
            border:"1px solid var(--border)", borderRadius:8, minHeight:220, gap:"0.5rem", padding:"1rem" }}>
            <div>Set game overrides (optional)</div>
            <div style={{ fontSize:"0.77rem" }}>then click Run Sim to see updated probabilities</div>
          </div>
        )}
      </div>
    </div>
  );
}
