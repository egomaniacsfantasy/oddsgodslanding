import { useState, useMemo } from "react";
import { NBA_SCHEDULE } from "../data/nbaSchedule";
import { NBA_STANDINGS } from "../data/nbaStandings";

const _confByAbbr = new Map(NBA_STANDINGS.map((s) => [s.teamAbbr, s.conference]));

function probColor(p: number) { return p >= 0.7 ? "var(--green)" : p <= 0.3 ? "var(--red)" : "var(--text)"; }

function groupByDate(games: typeof NBA_SCHEDULE) {
  const m = new Map<string, typeof NBA_SCHEDULE>();
  for (const g of games) { if (!m.has(g.gameDate)) m.set(g.gameDate, []); m.get(g.gameDate)!.push(g); }
  return [...m.entries()].sort(([a],[b]) => a.localeCompare(b));
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {weekday:"short",month:"short",day:"numeric"});
}

export default function SchedulePage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return NBA_SCHEDULE;
    const ql = q.toUpperCase();
    return NBA_SCHEDULE.filter((g) =>
      g.homeTeamAbbr.includes(ql) || g.awayTeamAbbr.includes(ql) ||
      g.homeTeamName.toUpperCase().includes(ql) || g.awayTeamName.toUpperCase().includes(ql)
    );
  }, [q]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  if (!NBA_SCHEDULE.length) return <div className="empty-state">No data — run sim_nba.py to generate.</div>;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1rem"}}>
        <input type="text" placeholder="Filter by team (e.g. BOS)" value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:6,
            color:"var(--text)",fontFamily:"var(--sans)",fontSize:"0.88rem",
            padding:"0.4rem 0.75rem",width:220,outline:"none"}} />
        <span style={{color:"var(--text3)",fontSize:"0.82rem"}}>{filtered.length} games remaining</span>
      </div>
      {grouped.map(([date, games]) => (
        <div key={date} style={{marginBottom:"1.25rem"}}>
          <div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text2)",marginBottom:"0.4rem",
            fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.06em"}}>
            {fmtDate(date)} &middot; {games.length} game{games.length>1?"s":""}
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="data-table">
              <thead><tr>
                <th className="left">Matchup</th>
                <th title="P(home wins)">Home Win%</th>
                <th title="P(away wins)">Away Win%</th>
              </tr></thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.gameId}>
                    <td className="left">
                      <span style={{color:"var(--text2)",fontSize:"0.75rem",marginRight:6}}>@</span>
                      <span style={{fontWeight:600}}>{g.homeTeamAbbr}</span>
                      <span style={{color:"var(--text2)",margin:"0 0.5rem"}}>vs</span>
                      <span>{g.awayTeamAbbr}</span>
                      <span style={{color:"var(--text3)",fontSize:"0.76rem",marginLeft:"0.75rem"}}>
                        {g.homeTeamName} vs {g.awayTeamName}
                      </span>
                    </td>
                    <td style={{color:probColor(g.pHomeWins)}}>{(g.pHomeWins*100).toFixed(1)}%</td>
                    <td style={{color:probColor(1-g.pHomeWins)}}>{((1-g.pHomeWins)*100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
