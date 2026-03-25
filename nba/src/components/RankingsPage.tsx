import { NBA_SNAPSHOT } from "../data/nbaSnapshot";
import { NBA_STANDINGS } from "../data/nbaStandings";

const standMap = new Map(NBA_STANDINGS.map((s) => [s.teamId, s]));

function bar(v: number, mn: number, mx: number) {
  const w = Math.round(Math.max(0, Math.min(1, (v-mn)/(mx-mn||1))) * 60);
  const c = v >= 0 ? "var(--green)" : "var(--red)";
  return <div className="prob-bar" style={{width:`${w}px`,background:c,opacity:0.65}} />;
}
function sgn(v: number) { return (v >= 0 ? "+" : "") + v.toFixed(1); }
function sgn4(v: number) { return (v >= 0 ? "+" : "") + v.toFixed(3); }

export default function RankingsPage() {
  if (!NBA_SNAPSHOT.length) return <div className="empty-state">No data — run sim_nba.py to generate.</div>;
  const sorted = [...NBA_SNAPSHOT].sort((a,b) => b.avgNetRtg - a.avgNetRtg);
  const [mn, mx] = [Math.min(...sorted.map(t=>t.avgNetRtg)), Math.max(...sorted.map(t=>t.avgNetRtg))];
  const [bmn, bmx] = [Math.min(...sorted.map(t=>t.teamBpm)), Math.max(...sorted.map(t=>t.teamBpm))];
  return (
    <div>
      <div style={{marginBottom:"0.75rem",color:"var(--text2)",fontSize:"0.82rem"}}>
        Season-average stats &middot; r10 = rolling 10-game &middot; BPM = player-weighted roster strength
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="data-table">
          <thead><tr>
            <th className="left">#</th><th className="left">Team</th><th>Conf</th>
            <th>W</th><th>L</th>
            <th title="Avg net rating">NetRtg</th><th title="10-game net rtg">r10 Net</th>
            <th title="Avg off rating">OffRtg</th><th title="Avg def rating">DefRtg</th>
            <th title="Team BPM">BPM</th><th>Elo</th><th>Pts</th>
          </tr></thead>
          <tbody>
            {sorted.map((t,i) => {
              const s = standMap.get(t.teamId);
              return (
                <tr key={t.teamId}>
                  <td className="left" style={{color:"var(--text3)"}}>{i+1}</td>
                  <td className="left">
                    <span style={{fontWeight:600}}>{t.teamAbbr}</span>
                    <span style={{color:"var(--text2)",marginLeft:6,fontSize:"0.78rem"}}>{t.teamName}</span>
                  </td>
                  <td style={{color:"var(--text2)"}}>{s?.conference ?? "—"}</td>
                  <td style={{color:"var(--green)"}}>{s?.wins ?? "—"}</td>
                  <td style={{color:"var(--red)"}}>{s?.losses ?? "—"}</td>
                  <td><div className="prob-bar-cell">{bar(t.avgNetRtg,mn,mx)}<span style={{color:t.avgNetRtg>=0?"var(--green)":"var(--red)"}}>{sgn(t.avgNetRtg)}</span></div></td>
                  <td style={{color:t.roll10NetRtg>=0?"var(--green)":"var(--red)"}}>{sgn(t.roll10NetRtg)}</td>
                  <td>{t.avgOffRtg.toFixed(1)}</td>
                  <td>{t.avgDefRtg.toFixed(1)}</td>
                  <td><div className="prob-bar-cell">{bar(t.teamBpm,bmn,bmx)}<span style={{color:t.teamBpm>=0?"var(--green)":"var(--red)"}}>{sgn4(t.teamBpm)}</span></div></td>
                  <td>{t.eloLast.toFixed(0)}</td>
                  <td>{t.avgPts.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
