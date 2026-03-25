import type { NbaStanding } from "../data/nbaStandings";
import type { NbaGame } from "../data/nbaSchedule";
import { NBA_MATCHUP_PROBS } from "../data/nbaMatchupProbs";
// NBA_PLAYOFF_SCHEDULE imported only for typing; sim uses matchup probs directly

export type Override = "model" | "home" | "away";

export interface TeamSimResult {
  makePlayoffs: number;
  round2: number;
  confFinals: number;
  finals: number;
  champion: number;
  expWins: number;  // projected final win total
}
export type SimResult = Record<number, TeamSimResult>;

// Quick lookup for matchup data
const _matchupByKey = new Map<string, (typeof NBA_MATCHUP_PROBS)[number]>();
for (const m of NBA_MATCHUP_PROBS) {
  _matchupByKey.set(`${m.t1Id}:${m.t2Id}`, m);
}

// Series win prob cache: key = "homeCourtId:awayId"
const _seriesCache = new Map<string, number>();

function _computeSeriesWinProb(homeCourtId: number, awayId: number): number {
  const t1Id = Math.min(homeCourtId, awayId);
  const t2Id = Math.max(homeCourtId, awayId);
  const m = _matchupByKey.get(`${t1Id}:${t2Id}`);
  if (!m) return 0.55;

  const hIsT1 = homeCourtId === t1Id;
  // NBA playoff schedule: games 1,2,5,7 at homeCourt team; 3,4,6 at other team
  const gameIsHome = [true, true, false, false, true, false, true];
  const pGame: number[] = gameIsHome.map((h) => {
    if (h) return hIsT1 ? m.t1WinT1Home : (1 - m.t1WinT2Home);
    else   return hIsT1 ? m.t1WinT2Home : (1 - m.t1WinT1Home);
  });

  // DP: f(wH, wA) = P(home-court team wins series from this state)
  const dp: number[][] = Array.from({ length: 5 }, () => Array(5).fill(-1));
  function f(wH: number, wA: number): number {
    if (wH === 4) return 1;
    if (wA === 4) return 0;
    if (dp[wH][wA] >= 0) return dp[wH][wA];
    const p = pGame[wH + wA];
    dp[wH][wA] = p * f(wH + 1, wA) + (1 - p) * f(wH, wA + 1);
    return dp[wH][wA];
  }
  return f(0, 0);
}

function _getSeriesProb(homeCourtId: number, awayId: number): number {
  const key = `${homeCourtId}:${awayId}`;
  if (!_seriesCache.has(key)) {
    _seriesCache.set(key, _computeSeriesWinProb(homeCourtId, awayId));
  }
  return _seriesCache.get(key)!;
}

// Pre-populate cache at module load
for (const m of NBA_MATCHUP_PROBS) {
  _getSeriesProb(m.t1Id, m.t2Id);
  _getSeriesProb(m.t2Id, m.t1Id);
}

interface _Counts { po: number; r2: number; cf: number; fin: number; champ: number; }

// Game-level win prob from matchup data (no series context)
function _gameProb(homeId: number, awayId: number): number {
  const t1 = Math.min(homeId, awayId), t2 = Math.max(homeId, awayId);
  const m = _matchupByKey.get(`${t1}:${t2}`);
  if (!m) return 0.55;
  return homeId === t1 ? m.t1WinT1Home : (1 - m.t1WinT2Home);
}

// Games 1,2,5,7 → high seed home; 3,4,6 → low seed home
const _HS_HOME = new Set([1, 2, 5, 7]);

// Simulate a series game-by-game, honoring per-game overrides
// seriesId format: "east_r1_1v8" — override keys: "east_r1_1v8_g1" etc.
function _simSeriesGames(
  highSeedId: number,
  lowSeedId: number,
  seriesId: string,
  overrides: Map<string, Override>
): number {
  let hsW = 0, lsW = 0;
  for (let g = 1; g <= 7; g++) {
    if (hsW === 4 || lsW === 4) break;
    const hsHome = _HS_HOME.has(g);
    const homeId = hsHome ? highSeedId : lowSeedId;
    const awayId = hsHome ? lowSeedId : highSeedId;
    const ov = overrides.get(`${seriesId}_g${g}`);
    const homeWins = ov === "home" ? true : ov === "away" ? false : Math.random() < _gameProb(homeId, awayId);
    if (homeWins) { if (hsHome) hsW++; else lsW++; }
    else { if (hsHome) lsW++; else hsW++; }
  }
  return hsW === 4 ? highSeedId : lowSeedId;
}

const _R1_MATCHUPS = ["1v8", "2v7", "3v6", "4v5"] as const;
const _R1_PAIRS: [number, number][] = [[0,7],[1,6],[2,5],[3,4]];

function _simConf(seeds: number[], counts: Record<number, _Counts>, confKey: string, overrides: Map<string, Override>): number {
  function matchSeries(higher: number, lower: number, sid?: string): number {
    if (sid) return _simSeriesGames(higher, lower, sid, overrides);
    return Math.random() < _getSeriesProb(higher, lower) ? higher : lower;
  }
  function ranked(a: number, b: number): [number, number] {
    return seeds.indexOf(a) <= seeds.indexOf(b) ? [a, b] : [b, a];
  }
  // Round 1 — with game-level overrides
  const r1W = _R1_PAIRS.map(([hi, lo], i) =>
    matchSeries(seeds[hi], seeds[lo], `${confKey}_r1_${_R1_MATCHUPS[i]}`)
  );
  for (const w of r1W) counts[w].r2++;
  // Round 2 — series win prob (teams TBD until R1 done)
  const [s2ah, s2aa] = ranked(r1W[0], r1W[3]);
  const [s2bh, s2ba] = ranked(r1W[1], r1W[2]);
  const cf1 = matchSeries(s2ah, s2aa);
  const cf2 = matchSeries(s2bh, s2ba);
  counts[cf1].cf++; counts[cf2].cf++;
  // Conference Finals
  const [cfh, cfa] = ranked(cf1, cf2);
  const winner = matchSeries(cfh, cfa);
  counts[winner].fin++;
  return winner;
}

export function runSim(
  standings: NbaStanding[],
  schedule: NbaGame[],
  overrides: Map<string, Override>,
  N = 10000
): SimResult {
  const counts: Record<number, _Counts> = {};
  const winsSum: Record<number, number> = {};
  const baseWins: Record<number, number> = {};
  const confMap: Record<number, string> = {};
  const wpMap: Record<number, number> = {};

  for (const s of standings) {
    counts[s.teamId] = { po: 0, r2: 0, cf: 0, fin: 0, champ: 0 };
    winsSum[s.teamId] = 0;
    baseWins[s.teamId] = s.wins;
    confMap[s.teamId] = s.conference;
    wpMap[s.teamId] = s.winPct;
  }

  const eastIds = standings.filter((s) => s.conference === "East").map((s) => s.teamId);
  const westIds = standings.filter((s) => s.conference === "West").map((s) => s.teamId);

  for (let i = 0; i < N; i++) {
    const wins = { ...baseWins };

    for (const g of schedule) {
      const ov = overrides.get(g.gameId);
      const hw = ov === "home" ? true : ov === "away" ? false : Math.random() < g.pHomeWins;
      if (hw) wins[g.homeTeamId]++;
      else wins[g.awayTeamId]++;
    }

    // Accumulate projected win totals
    for (const id of eastIds) winsSum[id] += wins[id];
    for (const id of westIds) winsSum[id] += wins[id];

    function seeds(ids: number[]): number[] {
      return [...ids]
        .sort((a, b) => wins[b] !== wins[a] ? wins[b] - wins[a] : wpMap[b] - wpMap[a])
        .slice(0, 8);
    }

    const east = seeds(eastIds);
    const west = seeds(westIds);
    for (const id of [...east, ...west]) counts[id].po++;

    const ew = _simConf(east, counts, "east", overrides);
    const ww = _simConf(west, counts, "west", overrides);

    const [fh, fa] = wins[ew] >= wins[ww] ? [ew, ww] : [ww, ew];
    const champ = Math.random() < _getSeriesProb(fh, fa) ? fh : fa;
    counts[champ].champ++;
  }

  const out: SimResult = {};
  for (const idStr of Object.keys(counts)) {
    const id = Number(idStr);
    const c = counts[id];
    out[id] = {
      makePlayoffs: (c.po / N) * 100,
      round2:       (c.r2 / N) * 100,
      confFinals:   (c.cf / N) * 100,
      finals:       (c.fin / N) * 100,
      champion:     (c.champ / N) * 100,
      expWins:      Math.round((winsSum[id] / N) * 10) / 10,
    };
  }
  return out;
}
