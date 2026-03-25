import { NBA_STANDINGS } from "../data/nbaStandings";
import { NBA_MC_RESULTS } from "../data/nbaMcResults";

const mcByTeam = new Map(NBA_MC_RESULTS.map((r) => [r.teamId, r]));

function pBar(val: number) {
  return <div className="prob-bar" style={{ width: `${Math.round(val / 100 * 72)}px` }} />;
}
function pFmt(v: number) {
  return v >= 99.5 ? "99.9%" : v < 0.1 ? "<0.1%" : v.toFixed(1) + "%";
}
function seedClass(s: number) { return s <= 6 ? "top6" : s <= 10 ? "playin" : "out"; }

function ConferenceTable({ conf }: { conf: string }) {
  const rows = NBA_STANDINGS.filter((s) => s.conference === conf).sort((a, b) => a.seed - b.seed);
  if (!rows.length) return <div className="empty-state">No data — run sim_nba.py to generate.</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th className="left">#</th><th className="left">Team</th>
            <th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Conf</th><th>Streak</th>
            <th title="Expected wins">xW</th>
            <th title="P(make playoffs)">PO%</th>
            <th title="P(round 2)">R2%</th>
            <th title="P(conf finals)">CF%</th>
            <th title="P(finals)">Fin%</th>
            <th title="P(champion)">Champ%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const mc = mcByTeam.get(s.teamId);
            return (
              <>
                <tr key={s.teamId}>
                  <td className="left"><span className={`seed-badge ${seedClass(s.seed)}`}>{s.seed}</span></td>
                  <td className="left">
                    <span style={{fontWeight:600}}>{s.teamAbbr}</span>
                    <span style={{color:"var(--text2)",marginLeft:6,fontSize:"0.78rem"}}>{s.teamName}</span>
                  </td>
                  <td style={{color:"var(--green)"}}>{s.wins}</td>
                  <td style={{color:"var(--red)"}}>{s.losses}</td>
                  <td>{s.winPct.toFixed(3)}</td>
                  <td>{s.gamesBack}</td>
                  <td>{s.confRecord}</td>
                  <td style={{color:s.streak.startsWith("W")?"var(--green)":"var(--red)"}}>{s.streak}</td>
                  <td>{mc ? mc.expWinsExact.toFixed(1) : "—"}</td>
                  <td>{mc ? <div className="prob-bar-cell">{pBar(mc.pMakePlayoffs)}{pFmt(mc.pMakePlayoffs)}</div> : "—"}</td>
                  <td>{mc ? pFmt(mc.pRound2) : "—"}</td>
                  <td>{mc ? pFmt(mc.pConfFinals) : "—"}</td>
                  <td>{mc ? pFmt(mc.pFinals) : "—"}</td>
                  <td style={{color:"var(--accent)",fontWeight:600}}>{mc ? pFmt(mc.pChampion) : "—"}</td>
                </tr>
                {s.seed === 6 && (
                  <tr key={`div-${s.teamId}`}>
                    <td colSpan={14} style={{height:2,background:"var(--border2)",padding:0,border:"none"}} />
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StandingsPage() {
  return (
    <div>
      <div style={{marginBottom:"0.5rem",color:"var(--text2)",fontSize:"0.82rem"}}>
        50,000 Monte Carlo simulations &middot; Line separates play-in (7-10) from eliminated
      </div>
      <div className="conf-block">
        <div className="section-title"><span style={{color:"var(--blue)"}}>●</span> Eastern Conference</div>
        <ConferenceTable conf="East" />
      </div>
      <div className="conf-block">
        <div className="section-title"><span style={{color:"var(--red)"}}>●</span> Western Conference</div>
        <ConferenceTable conf="West" />
      </div>
    </div>
  );
}
