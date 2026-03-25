import { useState, useMemo, useEffect, useRef } from "react";
import { NBA_SCHEDULE } from "../data/nbaSchedule";
import { NBA_STANDINGS } from "../data/nbaStandings";
import { NBA_MC_RESULTS } from "../data/nbaMcResults";
import { NBA_PLAYOFF_SCHEDULE } from "../data/nbaPlayoffSchedule";
import { runSim, type Override, type SimResult } from "../lib/simulation";

const _abbrById = new Map(NBA_MC_RESULTS.map((t) => [t.teamId, t.teamAbbr]));

function pFmt(v: number) {
  return v >= 99.5 ? ">99%" : v < 0.1 ? "<0.1%" : v.toFixed(1) + "%";
}
function pBar(val: number) {
  return <div className="prob-bar" style={{ width: `${Math.round(val / 100 * 60)}px` }} />;
}
function seedClass(s: number) { return s <= 6 ? "top6" : s <= 10 ? "playin" : "out"; }

export default function SimPage() {
  const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());
  const [results, setResults] = useState<SimResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [teamFilter, setTeamFilter] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rerun 10k simulations whenever overrides change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUpdating(true);
    timerRef.current = setTimeout(() => {
      const res = runSim(NBA_STANDINGS, NBA_SCHEDULE, overrides, 10000);
      setResults(res);
      setUpdating(false);
    }, 30); // short debounce so UI can show "Updating..." before blocking
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [overrides]);

  const filteredReg = useMemo(() => {
    if (!teamFilter) return NBA_SCHEDULE;
    const q = teamFilter.toUpperCase();
    return NBA_SCHEDULE.filter(
      (g) => g.homeTeamAbbr.includes(q) || g.awayTeamAbbr.includes(q)
    );
  }, [teamFilter]);

  // Playoff games grouped by series
  const filteredPO = useMemo(() => {
    if (!teamFilter) return NBA_PLAYOFF_SCHEDULE;
    const q = teamFilter.toUpperCase();
    return NBA_PLAYOFF_SCHEDULE.filter(
      (g) => g.homeTeamAbbr.includes(q) || g.awayTeamAbbr.includes(q)
    );
  }, [teamFilter]);

  const poSeriesIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const g of filteredPO) { if (!seen.has(g.seriesId)) { seen.add(g.seriesId); out.push(g.seriesId); } }
    return out;
  }, [filteredPO]);

  const overrideCount = useMemo(
    () => [...overrides.values()].length,
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

  function resetAll() { setOverrides(new Map()); }

  if (!NBA_SCHEDULE.length || !NBA_STANDINGS.length) {
    return <div className="empty-state">No data — run sim_nba.py to generate.</div>;
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem", flexWrap:"wrap" }}>
        <input type="text" placeholder="Filter games by team" value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:6,
            color:"var(--text)", fontFamily:"var(--sans)", fontSize:"0.86rem",
            padding:"0.38rem 0.7rem", width:200, outline:"none" }} />
        <span style={{ color:"var(--text3)", fontSize:"0.82rem", fontFamily:"var(--mono)" }}>
          {overrideCount > 0
            ? `${overrideCount} override${overrideCount>1?"s":""} set`
            : "No overrides — showing model probabilities"}
        </span>
        {overrideCount > 0 && (
          <button onClick={resetAll}
            style={{ background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:6,
              color:"var(--text2)", fontFamily:"var(--sans)", fontSize:"0.82rem",
              padding:"0.3rem 0.7rem", cursor:"pointer" }}>
            Reset all
          </button>
        )}
        <span style={{
          marginLeft:"auto", fontSize:"0.78rem", fontFamily:"var(--mono)",
          color: updating ? "var(--accent)" : "var(--text3)",
        }}>
          {updating ? "Updating..." : "10,000 simulations"}
        </span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(280px,1fr) minmax(360px,1.4fr)", gap:"1.25rem", alignItems:"start" }}>
        {/* ── Game picker ── */}
        <div>
          <div style={{ color:"var(--text2)", fontSize:"0.78rem", marginBottom:"0.4rem" }}>
            Select a forced outcome for any game — probabilities update instantly
          </div>
            <div style={{ maxHeight:620, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8 }}>
            {/* Regular season games */}
            {filteredReg.length > 0 && (
              <div style={{ padding:"0.35rem 0.65rem", background:"var(--bg3)", borderBottom:"1px solid var(--border)",
                fontSize:"0.72rem", color:"var(--text2)", fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>
                Regular Season · {filteredReg.length} games remaining
              </div>
            )}
            {filteredReg.slice(0, 250).map((g) => {
              const ov = overrides.get(g.gameId) ?? "model";
              const pct = Math.round(g.pHomeWins * 100);
              return (
                <div key={g.gameId} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"0.4rem 0.65rem", borderBottom:"1px solid var(--border)",
                  background: ov !== "model" ? "rgba(255,255,255,0.03)" : undefined,
                }}>
                  <div style={{ fontSize:"0.81rem", flex:1, minWidth:0 }}>
                    <span style={{ fontWeight:600 }}>{g.homeTeamAbbr}</span>
                    <span style={{ color:"var(--text3)", margin:"0 0.25rem", fontSize:"0.72rem" }}>vs</span>
                    <span>{g.awayTeamAbbr}</span>
                    <span style={{ color:"var(--text3)", fontSize:"0.7rem", marginLeft:"0.45rem" }}>
                      {g.gameDate.slice(5).replace("-","/")}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:2, flexShrink:0 }}>
                    {(["home","model","away"] as const).map((o) => {
                      const active = ov === o;
                      const accentBg = o === "home" ? "var(--green)" : o === "away" ? "var(--red)" : "var(--accent)";
                      return (
                        <button key={o} onClick={() => setOv(g.gameId, o)}
                          style={{ background: active ? accentBg : "var(--bg2)",
                            border: `1px solid ${active ? accentBg : "var(--border2)"}`,
                            borderRadius:4, color: active ? (o==="model"?"#000":"#fff") : "var(--text3)",
                            fontFamily:"var(--mono)", fontSize:"0.7rem",
                            padding:"0.18rem 0.4rem", cursor:"pointer",
                            fontWeight:active?700:400, minWidth:34, textAlign:"center" }}>
                          {o==="model" ? `${pct}%` : o==="home" ? g.homeTeamAbbr : g.awayTeamAbbr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filteredReg.length > 250 && (
              <div style={{ padding:"0.45rem 0.65rem", color:"var(--text3)", fontSize:"0.75rem" }}>
                Showing 250 of {filteredReg.length} — filter by team above
              </div>
            )}
            {/* Playoff games */}
            {filteredPO.length > 0 && (
              <div style={{ padding:"0.35rem 0.65rem", background:"var(--bg3)", borderBottom:"1px solid var(--border)",
                fontSize:"0.72rem", color:"var(--accent)", fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>
                Playoffs · {poSeriesIds.length} series
              </div>
            )}
            {poSeriesIds.map((sid) => {
              const games = filteredPO.filter(g => g.seriesId === sid);
              if (!games.length) return null;
              const g0 = games[0];
              const seriesLabel = `${g0.conf} ${g0.round} · ${g0.hsSeed} vs ${g0.lsSeed} · `
                + `${g0.hsId === g0.homeTeamId ? g0.homeTeamAbbr : g0.awayTeamAbbr} `
                + `vs ${g0.hsId === g0.homeTeamId ? g0.awayTeamAbbr : g0.homeTeamAbbr}`;
              return (
                <div key={sid}>
                  <div style={{ padding:"0.3rem 0.65rem", background:"rgba(240,180,40,0.05)",
                    borderBottom:"1px solid var(--border)", fontSize:"0.72rem", color:"var(--text2)" }}>
                    {seriesLabel}
                  </div>
                  {games.map((g) => {
                    const ovKey = `${g.seriesId}_g${g.gameNum}`;
                    const ov = overrides.get(ovKey) ?? "model";
                    const pct = Math.round(g.pHomeWins * 100);
                    return (
                      <div key={ovKey} style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"0.38rem 0.65rem", borderBottom:"1px solid var(--border)",
                        background: ov !== "model" ? "rgba(255,255,255,0.03)" : undefined,
                      }}>
                        <div style={{ fontSize:"0.81rem", flex:1, minWidth:0 }}>
                          <span style={{ color:"var(--text3)", fontSize:"0.7rem", marginRight:"0.4rem" }}>G{g.gameNum}</span>
                          <span style={{ fontWeight:600 }}>{g.homeTeamAbbr}</span>
                          <span style={{ color:"var(--text3)", margin:"0 0.25rem", fontSize:"0.72rem" }}>vs</span>
                          <span>{g.awayTeamAbbr}</span>
                          <span style={{ color:"var(--text3)", fontSize:"0.7rem", marginLeft:"0.45rem" }}>
                            {g.gameDate.slice(5).replace("-","/")}
                          </span>
                        </div>
                        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
                          {(["home","model","away"] as const).map((o) => {
                            const active = ov === o;
                            const accentBg = o === "home" ? "var(--green)" : o === "away" ? "var(--red)" : "var(--accent)";
                            return (
                              <button key={o} onClick={() => setOv(ovKey, o)}
                                style={{ background: active ? accentBg : "var(--bg2)",
                                  border: `1px solid ${active ? accentBg : "var(--border2)"}`,
                                  borderRadius:4, color: active ? (o==="model"?"#000":"#fff") : "var(--text3)",
                                  fontFamily:"var(--mono)", fontSize:"0.7rem",
                                  padding:"0.18rem 0.4rem", cursor:"pointer",
                                  fontWeight:active?700:400, minWidth:34, textAlign:"center" }}>
                                {o==="model" ? `${pct}%` : o==="home" ? g.homeTeamAbbr : g.awayTeamAbbr}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ opacity: updating ? 0.55 : 1, transition:"opacity 0.15s" }}>
          {["East","West"].map((conf) => {
            const rows = results
              ? NBA_STANDINGS
                  .filter((s) => s.conference === conf)
                  .map((s) => ({ s, r: results[s.teamId] }))
                  .sort((a, b) => (b.r?.expWins ?? 0) - (a.r?.expWins ?? 0))  // sort by projected wins
              : NBA_STANDINGS
                  .filter((s) => s.conference === conf)
                  .sort((a, b) => a.seed - b.seed)
                  .map((s) => ({ s, r: undefined as SimResult[number] | undefined }));
            return (
              <div key={conf} className="conf-block">
                <div className="section-title" style={{ fontSize:"0.88rem", marginBottom:"0.4rem" }}>
                  <span style={{ color:conf==="East"?"var(--blue)":"var(--red)" }}>●</span>{" "}
                  {conf}ern Conference
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table className="data-table">
                    <thead><tr>
                      <th className="left">Team</th>
                      <th title="Current W-L">W-L</th>
                      <th title="Projected final wins">xW</th>
                      <th title="P(make playoffs)">PO%</th>
                      <th title="P(round 2)">R2%</th>
                      <th title="P(conf finals)">CF%</th>
                      <th title="P(finals)">Fin%</th>
                      <th title="P(champion)" style={{ color:"var(--accent)" }}>Champ</th>
                    </tr></thead>
                    <tbody>
                      {rows.map(({ s, r }, idx) => (
                        <tr key={s.teamId}>
                          <td className="left" style={{ minWidth:110 }}>
                            <span className={`seed-badge ${seedClass(s.seed)}`}>{s.seed}</span>
                            <span style={{ fontWeight:700, color:"#e8e8e8" }}>{_abbrById.get(s.teamId) ?? s.teamAbbr}</span>
                          </td>
                          <td style={{ color:"var(--text2)" }}>
                            <span style={{ color:"var(--green)" }}>{s.wins}</span>-<span style={{ color:"var(--red)" }}>{s.losses}</span>
                          </td>
                          <td style={{ color:"var(--text)" }}>{r ? r.expWins.toFixed(1) : "—"}</td>
                          <td>{r ? <div className="prob-bar-cell">{pBar(r.makePlayoffs)}{pFmt(r.makePlayoffs)}</div> : "—"}</td>
                          <td>{r ? pFmt(r.round2) : "—"}</td>
                          <td>{r ? pFmt(r.confFinals) : "—"}</td>
                          <td>{r ? pFmt(r.finals) : "—"}</td>
                          <td style={{ color:"var(--accent)", fontWeight:600 }}>{r ? pFmt(r.champion) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
