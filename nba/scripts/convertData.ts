import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, "..");
const DATA_DIR   = path.join(ROOT, "public", "data");
const SRC_DATA   = path.join(ROOT, "src", "data");

function r2(n: number) { return Math.round(n*100)/100; }
function r4(n: number) { return Math.round(n*10000)/10000; }

// Build abbr/name lookup from snapshot (mc_results may have empty team_abbr)
function _snapshotAbbrMap(): Map<number, {abbr:string; name:string}> {
  const p = path.join(DATA_DIR, "nba_snapshot.xlsx");
  const out = new Map<number, {abbr:string; name:string}>();
  if (!fs.existsSync(p)) return out;
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(XLSX.readFile(p).Sheets[XLSX.readFile(p).SheetNames[0]]);
  for (const r of rows) out.set(Number(r.team_id), {abbr: String(r.team_abbr??""), name: String(r.team_name??"")});
  return out;
}
const _snapMap = _snapshotAbbrMap();
function _abbr(teamId: number, fallback: string) { return _snapMap.get(teamId)?.abbr || fallback; }
function _name(teamId: number, fallback: string) { return _snapMap.get(teamId)?.name || fallback; }

function convertNbaMcResults(): void {
  const p = path.join(DATA_DIR, "nba_mc_results.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_mc_results.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const data = rows.map((r) => ({
    teamId: Number(r.team_id), teamName: _name(Number(r.team_id), String(r.team_name??"")),
    teamAbbr: _abbr(Number(r.team_id), String(r.team_abbr??"")), conference: String(r.conference??""), division: String(r.division??""),
    expWins: Number(r.exp_wins), expWinsExact: Number(r.exp_wins_exact), expSeed: Number(r.exp_seed),
    pMakePlayoffs: Number(r.p_make_playoffs), pRound2: Number(r.p_round2),
    pConfFinals: Number(r.p_conf_finals), pFinals: Number(r.p_finals), pChampion: Number(r.p_champion),
  }));
  fs.writeFileSync(path.join(SRC_DATA,"nbaMcResults.ts"),
    `// Auto-generated from nba_mc_results.xlsx — do not edit manually\nexport interface NbaMcResult { teamId:number; teamName:string; teamAbbr:string; conference:string; division:string; expWins:number; expWinsExact:number; expSeed:number; pMakePlayoffs:number; pRound2:number; pConfFinals:number; pFinals:number; pChampion:number; }\nexport const NBA_MC_RESULTS: NbaMcResult[] = ${JSON.stringify(data)};\n`
  ); console.log(`OK nbaMcResults.ts (${data.length} teams)`);
}

function convertNbaSchedule(): void {
  const p = path.join(DATA_DIR, "nba_schedule_remaining.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_schedule_remaining.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const data = rows.map((r) => {
    const raw = r.game_date; let gameDate = "";
    if (raw instanceof Date) gameDate = raw.toISOString().slice(0,10);
    else if (typeof raw === "number") { const d = XLSX.SSF.parse_date_code(raw); gameDate = `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`; }
    else gameDate = String(raw??"").slice(0,10);
    const pRaw = Number(r.p_home_wins);
    return { gameId:String(r.game_id??""), gameDate, homeTeamId:Number(r.home_team_id), awayTeamId:Number(r.away_team_id),
      homeTeamName:String(r.home_team_name??""), awayTeamName:String(r.away_team_name??""),
      homeTeamAbbr:String(r.home_team_abbr??""), awayTeamAbbr:String(r.away_team_abbr??""),
      pHomeWins: Number.isFinite(pRaw) ? r4(pRaw) : 0.5 };
  });
  fs.writeFileSync(path.join(SRC_DATA,"nbaSchedule.ts"),
    `// Auto-generated from nba_schedule_remaining.xlsx — do not edit manually\nexport interface NbaGame { gameId:string; gameDate:string; homeTeamId:number; awayTeamId:number; homeTeamName:string; awayTeamName:string; homeTeamAbbr:string; awayTeamAbbr:string; pHomeWins:number; }\nexport const NBA_SCHEDULE: NbaGame[] = ${JSON.stringify(data)};\n`
  ); console.log(`OK nbaSchedule.ts (${data.length} games)`);
}

function convertNbaStandings(): void {
  const p = path.join(DATA_DIR, "nba_standings.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_standings.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const sn = wb.SheetNames.includes("conference") ? "conference" : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[sn]);
  const data = rows.map((r) => ({
    teamId:Number(r.team_id), teamName:_name(Number(r.team_id),String(r.team_name??"")),
    teamAbbr:_abbr(Number(r.team_id),String(r.team_abbr??"")),
    conference:String(r.conference??""), division:String(r.division??""),
    seed:Number(r.seed), wins:Number(r.wins), losses:Number(r.losses), winPct:r4(Number(r.win_pct)),
    confRecord:String(r.conf_record??""), gamesBack:r.games_back!=null?String(r.games_back):"-",
    streak:String(r.streak??""), clinch:String(r.clinch??""),
    ptDiff:Number.isFinite(Number(r.pt_diff_per_game))?r2(Number(r.pt_diff_per_game)):0,
  }));
  fs.writeFileSync(path.join(SRC_DATA,"nbaStandings.ts"),
    `// Auto-generated from nba_standings.xlsx — do not edit manually\nexport interface NbaStanding { teamId:number; teamName:string; teamAbbr:string; conference:string; division:string; seed:number; wins:number; losses:number; winPct:number; confRecord:string; gamesBack:string; streak:string; clinch:string; ptDiff:number; }\nexport const NBA_STANDINGS: NbaStanding[] = ${JSON.stringify(data)};\n`
  ); console.log(`OK nbaStandings.ts (${data.length} teams)`);
}

function convertNbaSnapshot(): void {
  const p = path.join(DATA_DIR, "nba_snapshot.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_snapshot.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const data = rows.map((r) => ({
    teamId:Number(r.team_id), teamName:String(r.team_name??""), teamAbbr:String(r.team_abbr??""),
    eloLast:r2(Number(r.elo_last)), avgNetRtg:r2(Number(r.avg_net_rtg)),
    avgOffRtg:r2(Number(r.avg_off_rtg)), avgDefRtg:r2(Number(r.avg_def_rtg)),
    roll10NetRtg:r2(Number(r.roll10_net_rtg)), avgPts:r2(Number(r.avg_pts)),
    avgMargin:r2(Number(r.avg_margin)),
    teamBpm:Number.isFinite(Number(r.team_bpm))?r4(Number(r.team_bpm)):0,
  }));
  fs.writeFileSync(path.join(SRC_DATA,"nbaSnapshot.ts"),
    `// Auto-generated from nba_snapshot.xlsx — do not edit manually\nexport interface NbaTeamSnapshot { teamId:number; teamName:string; teamAbbr:string; eloLast:number; avgNetRtg:number; avgOffRtg:number; avgDefRtg:number; roll10NetRtg:number; avgPts:number; avgMargin:number; teamBpm:number; }\nexport const NBA_SNAPSHOT: NbaTeamSnapshot[] = ${JSON.stringify(data)};\nexport const nbaSnapshotByTeamId = new Map(NBA_SNAPSHOT.map((t) => [t.teamId, t]));\n`
  ); console.log(`OK nbaSnapshot.ts (${data.length} teams)`);
}

function convertNbaRankings(): void {
  const p = path.join(DATA_DIR, "nba_rankings.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_rankings.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const data = rows.map((r) => ({
    teamId: Number(r.team_id), teamName: String(r.team_name??""), teamAbbr: String(r.team_abbr??""),
    rank: Number(r.rank), markovScore: r4(Number(r.markov_score)), expWinPct: r2(Number(r.exp_win_pct)),
  }));
  fs.writeFileSync(path.join(SRC_DATA,"nbaRankings.ts"),
    `// Auto-generated from nba_rankings.xlsx — do not edit manually\nexport interface NbaRanking { teamId:number; teamName:string; teamAbbr:string; rank:number; markovScore:number; expWinPct:number; }\nexport const NBA_RANKINGS: NbaRanking[] = ${JSON.stringify(data)};\n`
  ); console.log(`OK nbaRankings.ts (${data.length} teams)`);
}

function convertNbaMatchupProbs(): void {
  const p = path.join(DATA_DIR, "nba_matchup_probs.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_matchup_probs.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const data = rows.map((r) => ({
    t1Id: Number(r.t1_id), t1Abbr: String(r.t1_abbr??""),
    t2Id: Number(r.t2_id), t2Abbr: String(r.t2_abbr??""),
    t1WinT1Home: r4(Number(r.t1_win_t1home)),
    t1WinT2Home: r4(Number(r.t1_win_t2home)),
    t1WinAvg: r4(Number(r.t1_win_avg)),
  }));
  fs.writeFileSync(path.join(SRC_DATA,"nbaMatchupProbs.ts"),
    `// Auto-generated from nba_matchup_probs.xlsx — do not edit manually\nexport interface NbaMatchup { t1Id:number; t1Abbr:string; t2Id:number; t2Abbr:string; t1WinT1Home:number; t1WinT2Home:number; t1WinAvg:number; }\nexport const NBA_MATCHUP_PROBS: NbaMatchup[] = ${JSON.stringify(data)};\n`
  ); console.log(`OK nbaMatchupProbs.ts (${data.length} matchups)`);
}

function convertNbaPlayoffSchedule(): void {
  const p = path.join(DATA_DIR, "nba_playoff_schedule.xlsx");
  if (!fs.existsSync(p)) { console.warn("nba_playoff_schedule.xlsx not found"); return; }
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const games = rows.map((r) => ({
    seriesId:      String(r["series_id"] ?? ""),
    conf:          String(r["conf"] ?? ""),
    round:         String(r["round"] ?? ""),
    gameNum:       Number(r["game_num"]),
    gameDate:      String(r["game_date"] ?? "").slice(0,10),
    homeTeamId:    Number(r["home_team_id"]),
    homeTeamAbbr:  String(r["home_team_abbr"] ?? ""),
    homeTeamName:  String(r["home_team_name"] ?? ""),
    awayTeamId:    Number(r["away_team_id"]),
    awayTeamAbbr:  String(r["away_team_abbr"] ?? ""),
    awayTeamName:  String(r["away_team_name"] ?? ""),
    pHomeWins:     r4(Number(r["p_home_wins"])),
    hsId:          Number(r["hs_id"]),
    lsId:          Number(r["ls_id"]),
    hsSeed:        Number(r["hs_seed"]),
    lsSeed:        Number(r["ls_seed"]),
  }));
  fs.writeFileSync(path.join(SRC_DATA, "nbaPlayoffSchedule.ts"),
    `// Auto-generated from nba_playoff_schedule.xlsx — do not edit manually\n\nexport interface NbaPlayoffGame {\n  seriesId: string; conf: string; round: string;\n  gameNum: number; gameDate: string;\n  homeTeamId: number; homeTeamAbbr: string; homeTeamName: string;\n  awayTeamId: number; awayTeamAbbr: string; awayTeamName: string;\n  pHomeWins: number;\n  hsId: number; lsId: number; hsSeed: number; lsSeed: number;\n}\n\nexport const NBA_PLAYOFF_SCHEDULE: NbaPlayoffGame[] = ${JSON.stringify(games)};\n`,
    "utf-8"
  );
  console.log(`OK nbaPlayoffSchedule.ts (${games.length} games)`);
}

console.log("Converting NBA xlsx -> TypeScript...");
convertNbaMcResults();
convertNbaSchedule();
convertNbaStandings();
convertNbaSnapshot();
convertNbaRankings();
convertNbaMatchupProbs();
convertNbaPlayoffSchedule();
console.log("Done!");
