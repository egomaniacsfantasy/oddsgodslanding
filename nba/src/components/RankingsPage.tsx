import { NBA_RANKINGS } from "../data/nbaRankings";
import { NBA_SNAPSHOT } from "../data/nbaSnapshot";
import { NBA_STANDINGS } from "../data/nbaStandings";

const snapMap = new Map(NBA_SNAPSHOT.map((t) => [t.teamId, t]));
const standMap = new Map(NBA_STANDINGS.map((s) => [s.teamId, s]));

function bar(v: number, mn: number, mx: number) {
  const w = Math.round(Math.max(0, Math.min(1, (v-mn)/(mx-mn||1))) * 60);
  const c = v >= 0 ? "var(--green)" : "var(--red)";
  return <div className="prob-bar" style={{width:`${w}px`,background:c,opacity:0.65}} />;
}
function sgn(v: number) { return (v >= 0 ? "+" : "") + v.toFixed(1); }
function sgn4(v: number) { return (v >= 0 ? "+" : "") + v.toFixed(3); }

export default function RankingsPage() {
  if (!NBA_RANKINGS.length) return <div className="empty-state">No data — run sim_nba.py to generate.</div>;
  const sorted = [...NBA_RANKINGS].sort((a,b) => a.rank - b.rank);
  const snaps = sorted.map(r => snapMap.get(r.teamId));
  const netVals = snaps.map(t => t?.avgNetRtg ?? 0);
  const bpmVals = snaps.map(t => t?.teamBpm ?? 0);
  const [mn, mx] = [Math.min(...netVals), Math.max(...netVals)];
  const [bmn, bmx] = [Math.min(...bpmVals), Math.max(...bpmVals)];
  return (
    <div>
      <div style={{marginBottom:"0.75rem",color:"var(--text2)",fontSize:"0.82rem"}}>
        Ranked by Markov power score (PageRank-style) &middot; r10 = rolling 10-game &middot; xW% = sim expected win pct
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="data-table">
          <thead><tr>
            <th className="left">#</th><th className="left">Team</th><th>Conf</th>
            <th>W</th><th>L</th>
            <th title="Markov power score">Markov</th>
            <th title="Simulated expected win pct">xW%</th>
            <th title="Avg net rating">NetRtg</th><th title="10-game net rtg">r10 Net</th>
            <th title="Avg off rating">OffRtg</th><th title="Avg def rating">DefRtg</th>
            <th title="Team BPM">BPM</th><th>Elo</th>
          </tr></thead>
          <tbody>
            {sorted.map((r,i) => {
              const t = snapMap.get(r.teamId);
              const s = standMap.get(r.teamId);
              const net = t?.avgNetRtg ?? 0;
              const bpm = t?.teamBpm ?? 0;
              return (
                <tr key={r.teamId}>
                  <td className="left" style={{color:"var(--text3)"}}>{i+1}</td>
                  <td className="left">
                    <span style={{fontWeight:600}}>{r.teamAbbr}</span>
                    <span style={{color:"var(--text2)",marginLeft:6,fontSize:"0.78rem"}}>{r.teamName}</span>
                  </td>
                  <td style={{color:"var(--text2)"}}>{s?.conference ?? "—"}</td>
                  <td style={{color:"var(--green)"}}>{s?.wins ?? "—"}</td>
                  <td style={{color:"var(--red)"}}>{s?.losses ?? "—"}</td>
                  <td style={{color:"var(--accent)",fontWeight:600}}>{r.markovScore.toFixed(4)}</td>
                  <td style={{color:"var(--text2)"}}>{r.expWinPct.toFixed(1)}%</td>
                  <td><div className="prob-bar-cell">{bar(net,mn,mx)}<span style={{color:net>=0?"var(--green)":"var(--red)"}}>{sgn(net)}</span></div></td>
                  <td style={{color:t&&t.roll10NetRtg>=0?"var(--green)":"var(--red)"}}>{t?sgn(t.roll10NetRtg):"—"}</td>
                  <td>{t?t.avgOffRtg.toFixed(1):"—"}</td>
                  <td>{t?t.avgDefRtg.toFixed(1):"—"}</td>
                  <td><div className="prob-bar-cell">{bar(bpm,bmn,bmx)}<span style={{color:bpm>=0?"var(--green)":"var(--red)"}}>{sgn4(bpm)}</span></div></td>
                  <td>{t?t.eloLast.toFixed(0):"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
