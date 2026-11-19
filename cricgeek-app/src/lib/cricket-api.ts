import { Match, Scorecard, Squad, CalendarMatch, Commentary } from "@/types/cricket";
import {
  getSMUpcoming,
  getSMRecentResults,
  getSMCalendarFixtures,
  getSMCommentary,
  getSMFixture,
  getSMLivescores,
  getSMScorecard,
  getSMSquads,
  isSportMonksConfigured,
} from "@/lib/sportmonks";

const API_KEY = process.env.CRICKET_API_KEY || "";
const BASE_URL = process.env.CRICKET_API_BASE_URL || "https://api.cricapi.com/v1";
type CricketApiOptions = {
  fresh?: boolean;
  revalidateSeconds?: number;
};

export type CricketDataSource = "sportmonks" | "mock" | "none";

type MatchDetailBundle = {
  match: Match | null;
  scorecard: Scorecard[] | null;
  commentary: Commentary | null;
  squads: Squad[] | null;
  source: CricketDataSource;
};

interface ApiResponse<T> {
  apikey: string;
  data: T;
  status: string;
  info: {
    hitsToday: number;
    hitsUsed: number;
    hitsLimit: number;
  };
}

async function fetchApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) {
    return null;
  }

  try {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.set("apikey", API_KEY);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const res = await fetch(url.toString(), {
      next: { revalidate: 30 }, // Cache for 30 seconds for live data
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json: ApiResponse<T> = await res.json();

    if (json.status !== "success") {
      console.error(`API returned non-success status`);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

function shouldUseMocks() {
  return !isSportMonksConfigured() && !API_KEY;
}

async function getLegacyLiveMatches(): Promise<Match[] | null> {
  return fetchApi<Match[]>("currentMatches");
}

async function getLegacyMatchInfo(matchId: string): Promise<Match | null> {
  return fetchApi<Match>("match_info", { id: matchId });
}

async function getLegacyMatchScorecard(matchId: string): Promise<Scorecard[] | null> {
  return fetchApi<Scorecard[]>("match_scorecard", { id: matchId });
}

async function getLegacyMatchCommentary(matchId: string): Promise<Commentary | null> {
  return fetchApi<Commentary>("match_bbb", { id: matchId });
}

async function getLegacyMatchSquad(matchId: string): Promise<Squad[] | null> {
  return fetchApi<Squad[]>("match_squad", { id: matchId });
}

async function getLegacyUpcomingMatches(): Promise<CalendarMatch[] | null> {
  return fetchApi<CalendarMatch[]>("matches", { offset: "0" });
}

function calendarMatchToMatch(match: CalendarMatch): Match {
  return {
    id: match.id,
    name: match.name,
    matchType: match.matchType,
    status: match.status,
    venue: match.venue,
    date: match.date,
    dateTimeGMT: match.dateTimeGMT,
    teams: match.teams,
    teamInfo: match.teamInfo,
    score: match.score ?? [],
    series_id: match.series_id,
    matchStarted: match.matchStarted ?? false,
    matchEnded: match.matchEnded ?? false,
  };
}

function dedupeMatches(...lists: Array<Match[] | null | undefined>): Match[] {
  const unique = new Map<string, Match>();

  for (const list of lists) {
    for (const match of list ?? []) {
      if (!unique.has(match.id)) {
        unique.set(match.id, match);
      }
    }
  }

  return [...unique.values()];
}

function sortHubMatches(matches: Match[]): Match[] {
  return [...matches].sort((left, right) => {
    const leftBucket = left.matchStarted && !left.matchEnded ? 0 : !left.matchStarted ? 1 : 2;
    const rightBucket = right.matchStarted && !right.matchEnded ? 0 : !right.matchStarted ? 1 : 2;

    if (leftBucket !== rightBucket) return leftBucket - rightBucket;

    if (leftBucket === 2) {
      return right.dateTimeGMT.localeCompare(left.dateTimeGMT);
    }

    return left.dateTimeGMT.localeCompare(right.dateTimeGMT);
  });
}

// Get current/live matches
export async function getLiveMatches(): Promise<Match[]> {
  const { matches } = await getLiveMatchesWithSource();
  return matches;
}

export async function getLiveMatchesWithSource(): Promise<{
  matches: Match[];
  source: CricketDataSource;
}> {
  const sportMonksMatches = await getSMLivescores();
  if (sportMonksMatches !== null) {
    return { matches: sportMonksMatches, source: "sportmonks" };
  }

  const legacyMatches = await getLegacyLiveMatches();
  if (legacyMatches !== null) {
    return { matches: legacyMatches, source: "none" };
  }

  if (shouldUseMocks()) {
    return { matches: getMockLiveMatches(), source: "mock" };
  }

  return { matches: [], source: "none" };
}

export async function getMatchHubMatches(): Promise<Match[]> {
  const { matches } = await getMatchHubMatchesWithSource();
  return matches;
}

export async function getMatchHubMatchesWithSource(): Promise<{
  matches: Match[];
  source: CricketDataSource;
}> {
  const [sportMonksLive, sportMonksUpcoming, sportMonksRecent] = await Promise.all([
    getSMLivescores(),
    getSMUpcoming(),
    getSMRecentResults(),
  ]);

  if (sportMonksLive !== null || sportMonksUpcoming !== null || sportMonksRecent !== null) {
    return {
      matches: sortHubMatches(dedupeMatches(sportMonksLive, sportMonksUpcoming, sportMonksRecent)),
      source: "sportmonks",
    };
  }

  const [legacyLive, legacyUpcoming] = await Promise.all([
    getLegacyLiveMatches(),
    getLegacyUpcomingMatches(),
  ]);

  if (legacyLive !== null || legacyUpcoming !== null) {
    return {
      matches: sortHubMatches(
        dedupeMatches(legacyLive, legacyUpcoming?.map(calendarMatchToMatch))
      ),
      source: "none",
    };
  }

  if (shouldUseMocks()) {
    return { matches: sortHubMatches(getMockLiveMatches()), source: "mock" };
  }

  return { matches: [], source: "none" };
}

// Get match info by ID
export async function getMatchInfo(
  matchId: string,
  options: CricketApiOptions = {}
): Promise<Match | null> {
  const sportMonksMatch = await getSMFixture(matchId, options);
  if (sportMonksMatch) {
    return sportMonksMatch;
  }

  const legacyMatch = await getLegacyMatchInfo(matchId);
  if (legacyMatch) {
    return legacyMatch;
  }

  return shouldUseMocks() ? getMockMatch(matchId) : null;
}

// Get match scorecard
export async function getMatchScorecard(
  matchId: string,
  options: CricketApiOptions = {}
): Promise<Scorecard[] | null> {
  const sportMonksScorecard = await getSMScorecard(matchId, options);
  if (sportMonksScorecard) {
    return sportMonksScorecard;
  }

  const legacyScorecard = await getLegacyMatchScorecard(matchId);
  if (legacyScorecard) {
    return legacyScorecard;
  }

  return shouldUseMocks() ? getMockScorecard(matchId) : null;
}

// Get match ball-by-ball commentary
export async function getMatchCommentary(
  matchId: string,
  options: CricketApiOptions = {}
): Promise<Commentary | null> {
  const sportMonksCommentary = await getSMCommentary(matchId, options);
  if (sportMonksCommentary) {
    return sportMonksCommentary;
  }

  const legacyCommentary = await getLegacyMatchCommentary(matchId);
  if (legacyCommentary) {
    return legacyCommentary;
  }

  return shouldUseMocks() ? getMockCommentary(matchId) : null;
}

// Get match squads
export async function getMatchSquad(
  matchId: string,
  options: CricketApiOptions = {}
): Promise<Squad[] | null> {
  const sportMonksSquads = await getSMSquads(matchId, options);
  if (sportMonksSquads) {
    return sportMonksSquads;
  }

  const legacySquads = await getLegacyMatchSquad(matchId);
  if (legacySquads) {
    return legacySquads;
  }

  return shouldUseMocks() ? getMockSquads(matchId) : null;
}

// Get upcoming matches (calendar)
export async function getUpcomingMatches(): Promise<CalendarMatch[]> {
  const { matches } = await getUpcomingMatchesWithSource();
  return matches;
}

export async function getUpcomingMatchesWithSource(): Promise<{
  matches: CalendarMatch[];
  source: CricketDataSource;
}> {
  const sportMonksMatches = await getSMCalendarFixtures({ daysBack: 0, daysAhead: 45 });
  if (sportMonksMatches !== null) {
    return { matches: sportMonksMatches, source: "sportmonks" };
  }

  const legacyMatches = await getLegacyUpcomingMatches();
  if (legacyMatches !== null) {
    return { matches: legacyMatches, source: "none" };
  }

  if (shouldUseMocks()) {
    return { matches: getMockCalendarMatches(), source: "mock" };
  }

  return { matches: [], source: "none" };
}

export async function getCalendarMatchesWithSource(): Promise<{
  matches: CalendarMatch[];
  source: CricketDataSource;
}> {
  const sportMonksMatches = await getSMCalendarFixtures({ daysBack: 30, daysAhead: 45 });
  if (sportMonksMatches !== null) {
    return { matches: sportMonksMatches, source: "sportmonks" };
  }

  const legacyMatches = await getLegacyUpcomingMatches();
  if (legacyMatches !== null) {
    return { matches: legacyMatches, source: "none" };
  }

  if (shouldUseMocks()) {
    return { matches: getMockCalendarMatches(), source: "mock" };
  }

  return { matches: [], source: "none" };
}

// Get series list
export async function getSeriesList(): Promise<unknown[]> {
  const data = await fetchApi<unknown[]>("series");
  return data || [];
}

export async function getMatchDetailBundle(
  matchId: string,
  options: CricketApiOptions = {}
): Promise<MatchDetailBundle> {
  const [sportMonksMatch, sportMonksScorecard, sportMonksCommentary, sportMonksSquads] =
    await Promise.all([
      getSMFixture(matchId, options),
      getSMScorecard(matchId, options),
      getSMCommentary(matchId, options),
      getSMSquads(matchId, options),
    ]);

  if (sportMonksMatch || sportMonksScorecard || sportMonksCommentary || sportMonksSquads) {
    return {
      match: sportMonksMatch,
      scorecard: sportMonksScorecard,
      commentary: sportMonksCommentary,
      squads: sportMonksSquads,
      source: "sportmonks",
    };
  }

  const [legacyMatch, legacyScorecard, legacyCommentary, legacySquads] = await Promise.all([
    getLegacyMatchInfo(matchId),
    getLegacyMatchScorecard(matchId),
    getLegacyMatchCommentary(matchId),
    getLegacyMatchSquad(matchId),
  ]);

  if (legacyMatch || legacyScorecard || legacyCommentary || legacySquads) {
    return {
      match: legacyMatch,
      scorecard: legacyScorecard,
      commentary: legacyCommentary,
      squads: legacySquads,
      source: "none",
    };
  }

  if (shouldUseMocks()) {
    const match = getMockMatch(matchId);
    return {
      match,
      scorecard: match ? getMockScorecard(matchId) : null,
      commentary: match ? getMockCommentary(matchId) : null,
      squads: match ? getMockSquads(matchId) : null,
      source: match ? "mock" : "none",
    };
  }

  return {
    match: null,
    scorecard: null,
    commentary: null,
    squads: null,
    source: "none",
  };
}

// ==================== MOCK DATA ====================
// Used when API key is not set or API fails

function getMockLiveMatches(): Match[] {
  return [
    {
      id: "mock-1",
      name: "India vs Australia, 3rd Test",
      matchType: "Test",
      status: "India 287/4 (78.0 ov) - Day 2",
      venue: "Melbourne Cricket Ground, Melbourne",
      date: "2026-02-11",
      dateTimeGMT: "2026-02-11T04:00:00",
      teams: ["India", "Australia"],
      teamInfo: [
        { name: "India", shortname: "IND", img: "/flags/ind.png" },
        { name: "Australia", shortname: "AUS", img: "/flags/aus.png" },
      ],
      score: [
        { r: 287, w: 4, o: 78, inning: "India 1st Innings" },
        { r: 0, w: 0, o: 0, inning: "Australia 1st Innings" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
    {
      id: "mock-2",
      name: "England vs South Africa, 2nd ODI",
      matchType: "ODI",
      status: "England won by 5 wickets",
      venue: "The Oval, London",
      date: "2026-02-11",
      dateTimeGMT: "2026-02-11T10:00:00",
      teams: ["England", "South Africa"],
      teamInfo: [
        { name: "England", shortname: "ENG", img: "/flags/eng.png" },
        { name: "South Africa", shortname: "SA", img: "/flags/sa.png" },
      ],
      score: [
        { r: 312, w: 8, o: 50, inning: "South Africa 1st Innings" },
        { r: 315, w: 5, o: 47.3, inning: "England 1st Innings" },
      ],
      matchStarted: true,
      matchEnded: true,
    },
    {
      id: "mock-3",
      name: "Mumbai Indians vs Chennai Super Kings, IPL 2026",
      matchType: "T20",
      status: "MI 156/3 (16.2 ov) - Live",
      venue: "Wankhede Stadium, Mumbai",
      date: "2026-02-11",
      dateTimeGMT: "2026-02-11T14:00:00",
      teams: ["Mumbai Indians", "Chennai Super Kings"],
      teamInfo: [
        { name: "Mumbai Indians", shortname: "MI", img: "/flags/mi.png" },
        { name: "Chennai Super Kings", shortname: "CSK", img: "/flags/csk.png" },
      ],
      score: [
        { r: 189, w: 6, o: 20, inning: "Chennai Super Kings 1st Innings" },
        { r: 156, w: 3, o: 16.2, inning: "Mumbai Indians 1st Innings" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
    {
      id: "mock-4",
      name: "Pakistan vs New Zealand, 1st T20I",
      matchType: "T20I",
      status: "Starts at 7:00 PM IST",
      venue: "Rawalpindi Cricket Stadium",
      date: "2026-02-12",
      dateTimeGMT: "2026-02-12T13:30:00",
      teams: ["Pakistan", "New Zealand"],
      teamInfo: [
        { name: "Pakistan", shortname: "PAK", img: "/flags/pak.png" },
        { name: "New Zealand", shortname: "NZ", img: "/flags/nz.png" },
      ],
      score: [],
      matchStarted: false,
      matchEnded: false,
    },
    {
      id: "mock-5",
      name: "Sri Lanka vs Bangladesh, 1st ODI",
      matchType: "ODI",
      status: "Bangladesh won by 5 wickets",
      venue: "Pallekele International Cricket Stadium",
      date: "2026-02-10",
      dateTimeGMT: "2026-02-10T10:00:00",
      teams: ["Sri Lanka", "Bangladesh"],
      teamInfo: [
        { name: "Sri Lanka", shortname: "SL", img: "/flags/sl.png" },
        { name: "Bangladesh", shortname: "BAN", img: "/flags/ban.png" },
      ],
      score: [
        { r: 245, w: 7, o: 50, inning: "Sri Lanka 1st Innings" },
        { r: 247, w: 5, o: 48.4, inning: "Bangladesh 1st Innings" },
      ],
      matchStarted: true,
      matchEnded: true,
    },
  ];
}

function getMockMatch(matchId: string): Match | null {
  const matches = getMockLiveMatches();
  return matches.find((m) => m.id === matchId) ?? null;
}

function getMockScorecard(matchId: string): Scorecard[] | null {
  const scorecards: Record<string, Scorecard[]> = {
    "mock-1": [
    {
      inning: "India 1st Innings",
      totalRuns: 287,
      totalWickets: 4,
      totalOvers: 78,
      extras: "b 3, lb 8, w 2, nb 1 (14)",
      batting: [
        { batsman: { id: "1", name: "Rohit Sharma" }, dismissal: "c Smith b Starc", r: 52, b: 78, "4s": 7, "6s": 1, sr: "66.67" },
        { batsman: { id: "2", name: "Yashasvi Jaiswal" }, dismissal: "lbw b Hazlewood", r: 82, b: 134, "4s": 10, "6s": 2, sr: "61.19" },
        { batsman: { id: "3", name: "Shubman Gill" }, dismissal: "c Carey b Lyon", r: 45, b: 89, "4s": 4, "6s": 0, sr: "50.56" },
        { batsman: { id: "4", name: "Virat Kohli" }, dismissal: "c Labuschagne b Starc", r: 34, b: 67, "4s": 3, "6s": 1, sr: "50.75" },
        { batsman: { id: "5", name: "KL Rahul" }, dismissal: "batting", r: 48, b: 71, "4s": 5, "6s": 0, sr: "67.61" },
        { batsman: { id: "6", name: "Ravindra Jadeja" }, dismissal: "batting", r: 12, b: 18, "4s": 1, "6s": 0, sr: "66.67" },
      ],
      bowling: [
        { bowler: { id: "10", name: "Mitchell Starc" }, o: 22, m: 3, r: 74, w: 2, eco: "3.36" },
        { bowler: { id: "11", name: "Josh Hazlewood" }, o: 18, m: 5, r: 51, w: 1, eco: "2.83" },
        { bowler: { id: "12", name: "Pat Cummins" }, o: 16, m: 2, r: 65, w: 0, eco: "4.06" },
        { bowler: { id: "13", name: "Nathan Lyon" }, o: 22, m: 4, r: 86, w: 1, eco: "3.91" },
      ],
    },
    ],
    "mock-2": [
      {
        inning: "South Africa 1st Innings",
        totalRuns: 312,
        totalWickets: 8,
        totalOvers: 50,
        extras: "b 1, lb 6, w 4, nb 1 (12)",
        batting: [
          { batsman: { id: "101", name: "Quinton de Kock" }, dismissal: "c Buttler b Archer", r: 81, b: 75, "4s": 9, "6s": 1, sr: "108.00" },
          { batsman: { id: "102", name: "Reeza Hendricks" }, dismissal: "c Root b Woakes", r: 54, b: 67, "4s": 6, "6s": 0, sr: "80.60" },
          { batsman: { id: "103", name: "Rassie van der Dussen" }, dismissal: "lbw b Rashid", r: 48, b: 52, "4s": 4, "6s": 0, sr: "92.31" },
          { batsman: { id: "104", name: "Aiden Markram" }, dismissal: "c Buttler b Stokes", r: 37, b: 32, "4s": 3, "6s": 1, sr: "115.63" },
          { batsman: { id: "105", name: "Heinrich Klaasen" }, dismissal: "c Bairstow b Archer", r: 29, b: 24, "4s": 2, "6s": 1, sr: "120.83" },
          { batsman: { id: "106", name: "David Miller" }, dismissal: "c Root b Rashid", r: 26, b: 19, "4s": 1, "6s": 1, sr: "136.84" },
          { batsman: { id: "107", name: "Marco Jansen" }, dismissal: "b Wood", r: 12, b: 9, "4s": 1, "6s": 0, sr: "133.33" },
          { batsman: { id: "108", name: "Keshav Maharaj" }, dismissal: "c Stokes b Rashid", r: 6, b: 5, "4s": 0, "6s": 0, sr: "120.00" },
          { batsman: { id: "109", name: "Kagiso Rabada" }, dismissal: "not out", r: 4, b: 6, "4s": 0, "6s": 0, sr: "66.67" },
          { batsman: { id: "110", name: "Anrich Nortje" }, dismissal: "not out", r: 3, b: 4, "4s": 0, "6s": 0, sr: "75.00" },
        ],
        bowling: [
          { bowler: { id: "201", name: "Jofra Archer" }, o: 10, m: 0, r: 54, w: 2, eco: "5.40" },
          { bowler: { id: "202", name: "Mark Wood" }, o: 10, m: 1, r: 61, w: 1, eco: "6.10" },
          { bowler: { id: "203", name: "Adil Rashid" }, o: 10, m: 0, r: 57, w: 3, eco: "5.70" },
          { bowler: { id: "204", name: "Chris Woakes" }, o: 10, m: 1, r: 55, w: 1, eco: "5.50" },
          { bowler: { id: "205", name: "Ben Stokes" }, o: 7, m: 0, r: 48, w: 1, eco: "6.86" },
          { bowler: { id: "206", name: "Moeen Ali" }, o: 3, m: 0, r: 30, w: 0, eco: "10.00" },
        ],
      },
      {
        inning: "England 1st Innings",
        totalRuns: 315,
        totalWickets: 5,
        totalOvers: 47.3,
        extras: "b 2, lb 10, w 2, nb 1 (15)",
        batting: [
          { batsman: { id: "211", name: "Jason Roy" }, dismissal: "c de Kock b Rabada", r: 72, b: 65, "4s": 10, "6s": 2, sr: "110.77" },
          { batsman: { id: "212", name: "Jonny Bairstow" }, dismissal: "c Markram b Nortje", r: 45, b: 39, "4s": 6, "6s": 1, sr: "115.38" },
          { batsman: { id: "213", name: "Joe Root" }, dismissal: "c Klaasen b Jansen", r: 63, b: 70, "4s": 4, "6s": 0, sr: "90.00" },
          { batsman: { id: "214", name: "Ben Stokes" }, dismissal: "c Miller b Markram", r: 58, b: 52, "4s": 5, "6s": 2, sr: "111.54" },
          { batsman: { id: "215", name: "Jos Buttler" }, dismissal: "c de Kock b Miller", r: 35, b: 28, "4s": 3, "6s": 2, sr: "125.00" },
          { batsman: { id: "216", name: "Moeen Ali" }, dismissal: "not out", r: 19, b: 13, "4s": 1, "6s": 1, sr: "146.15" },
          { batsman: { id: "217", name: "Sam Curran" }, dismissal: "not out", r: 8, b: 6, "4s": 1, "6s": 0, sr: "133.33" },
        ],
        bowling: [
          { bowler: { id: "221", name: "Kagiso Rabada" }, o: 10, m: 0, r: 65, w: 1, eco: "6.50" },
          { bowler: { id: "222", name: "Anrich Nortje" }, o: 9, m: 0, r: 57, w: 1, eco: "6.33" },
          { bowler: { id: "223", name: "Marco Jansen" }, o: 9, m: 0, r: 51, w: 1, eco: "5.67" },
          { bowler: { id: "224", name: "Keshav Maharaj" }, o: 8.3, m: 0, r: 44, w: 0, eco: "5.18" },
          { bowler: { id: "225", name: "Aiden Markram" }, o: 7, m: 0, r: 46, w: 1, eco: "6.57" },
          { bowler: { id: "226", name: "David Miller" }, o: 4, m: 0, r: 40, w: 1, eco: "10.00" },
        ],
      },
    ],
    "mock-5": [
      {
        inning: "Sri Lanka 1st Innings",
        totalRuns: 245,
        totalWickets: 7,
        totalOvers: 50,
        extras: "b 1, lb 2, w 4, nb 1 (8)",
        batting: [
          { batsman: { id: "501", name: "Pathum Nissanka" }, dismissal: "c Litton b Taskin", r: 64, b: 75, "4s": 7, "6s": 1, sr: "85.33" },
          { batsman: { id: "502", name: "Kusal Mendis" }, dismissal: "c Shanto b Shoriful", r: 48, b: 55, "4s": 5, "6s": 1, sr: "87.27" },
          { batsman: { id: "503", name: "Charith Asalanka" }, dismissal: "lbw b Mustafizur", r: 39, b: 42, "4s": 3, "6s": 1, sr: "92.86" },
          { batsman: { id: "504", name: "Dhananjaya de Silva" }, dismissal: "c Mushfiqur b Mehidy", r: 27, b: 36, "4s": 2, "6s": 0, sr: "75.00" },
          { batsman: { id: "505", name: "Wanindu Hasaranga" }, dismissal: "c Hridoy b Taskin", r: 24, b: 18, "4s": 1, "6s": 1, sr: "133.33" },
          { batsman: { id: "506", name: "Sadeera Samarawickrama" }, dismissal: "c Litton b Mustafizur", r: 21, b: 27, "4s": 1, "6s": 0, sr: "77.78" },
          { batsman: { id: "507", name: "Dunith Wellalage" }, dismissal: "b Shakib", r: 10, b: 12, "4s": 1, "6s": 0, sr: "83.33" },
          { batsman: { id: "508", name: "Dushmantha Chameera" }, dismissal: "not out", r: 4, b: 5, "4s": 0, "6s": 0, sr: "80.00" },
        ],
        bowling: [
          { bowler: { id: "511", name: "Taskin Ahmed" }, o: 10, m: 0, r: 49, w: 2, eco: "4.90" },
          { bowler: { id: "512", name: "Shoriful Islam" }, o: 10, m: 1, r: 58, w: 1, eco: "5.80" },
          { bowler: { id: "513", name: "Mustafizur Rahman" }, o: 10, m: 0, r: 44, w: 2, eco: "4.40" },
          { bowler: { id: "514", name: "Mehidy Hasan" }, o: 10, m: 0, r: 48, w: 1, eco: "4.80" },
          { bowler: { id: "515", name: "Shakib Al Hasan" }, o: 10, m: 0, r: 43, w: 1, eco: "4.30" },
        ],
      },
      {
        inning: "Bangladesh 1st Innings",
        totalRuns: 247,
        totalWickets: 5,
        totalOvers: 48.4,
        extras: "b 2, lb 5, w 9, nb 1 (17)",
        batting: [
          { batsman: { id: "521", name: "Litton Das" }, dismissal: "c Mendis b Chameera", r: 71, b: 78, "4s": 8, "6s": 1, sr: "91.03" },
          { batsman: { id: "522", name: "Tanzid Hasan" }, dismissal: "c Nissanka b Rajitha", r: 44, b: 50, "4s": 4, "6s": 1, sr: "88.00" },
          { batsman: { id: "523", name: "Najmul Hossain Shanto" }, dismissal: "lbw b Theekshana", r: 36, b: 45, "4s": 3, "6s": 0, sr: "80.00" },
          { batsman: { id: "524", name: "Towhid Hridoy" }, dismissal: "c Asalanka b Hasaranga", r: 51, b: 48, "4s": 4, "6s": 1, sr: "106.25" },
          { batsman: { id: "525", name: "Mushfiqur Rahim" }, dismissal: "c Wellalage b Asalanka", r: 15, b: 20, "4s": 1, "6s": 0, sr: "75.00" },
          { batsman: { id: "526", name: "Mehidy Hasan" }, dismissal: "not out", r: 10, b: 15, "4s": 0, "6s": 0, sr: "66.67" },
          { batsman: { id: "527", name: "Taskin Ahmed" }, dismissal: "not out", r: 3, b: 6, "4s": 0, "6s": 0, sr: "50.00" },
        ],
        bowling: [
          { bowler: { id: "531", name: "Dushmantha Chameera" }, o: 9, m: 0, r: 51, w: 1, eco: "5.67" },
          { bowler: { id: "532", name: "Kasun Rajitha" }, o: 9.4, m: 0, r: 54, w: 1, eco: "5.59" },
          { bowler: { id: "533", name: "Maheesh Theekshana" }, o: 10, m: 0, r: 49, w: 1, eco: "4.90" },
          { bowler: { id: "534", name: "Wanindu Hasaranga" }, o: 10, m: 0, r: 43, w: 1, eco: "4.30" },
          { bowler: { id: "535", name: "Charith Asalanka" }, o: 10, m: 0, r: 43, w: 1, eco: "4.30" },
        ],
      },
    ],
    "mock-3": [
      {
        inning: "Chennai Super Kings 1st Innings",
        totalRuns: 189,
        totalWickets: 6,
        totalOvers: 20,
        extras: "b 2, lb 3, w 8, nb 1 (14)",
        batting: [
          { batsman: { id: "301", name: "Ruturaj Gaikwad" }, dismissal: "c Ishan b Bumrah", r: 72, b: 46, "4s": 8, "6s": 3, sr: "156.52" },
          { batsman: { id: "302", name: "Devon Conway" }, dismissal: "c Rohit b Boult", r: 36, b: 27, "4s": 4, "6s": 1, sr: "133.33" },
          { batsman: { id: "303", name: "Ajinkya Rahane" }, dismissal: "c SKY b Coetzee", r: 18, b: 11, "4s": 2, "6s": 0, sr: "163.64" },
          { batsman: { id: "304", name: "Shivam Dube" }, dismissal: "c Hardik b Madhwal", r: 28, b: 15, "4s": 2, "6s": 2, sr: "186.67" },
          { batsman: { id: "305", name: "Ravindra Jadeja" }, dismissal: "c Tilak b Chawla", r: 8, b: 6, "4s": 0, "6s": 0, sr: "133.33" },
          { batsman: { id: "306", name: "MS Dhoni" }, dismissal: "run out", r: 6, b: 4, "4s": 0, "6s": 0, sr: "150.00" },
          { batsman: { id: "307", name: "Moeen Ali" }, dismissal: "not out", r: 5, b: 3, "4s": 0, "6s": 0, sr: "166.67" },
          { batsman: { id: "308", name: "Deepak Chahar" }, dismissal: "not out", r: 2, b: 3, "4s": 0, "6s": 0, sr: "66.67" },
        ],
        bowling: [
          { bowler: { id: "311", name: "Jasprit Bumrah" }, o: 4, m: 0, r: 28, w: 1, eco: "7.00" },
          { bowler: { id: "312", name: "Trent Boult" }, o: 4, m: 0, r: 37, w: 1, eco: "9.25" },
          { bowler: { id: "313", name: "Gerald Coetzee" }, o: 4, m: 0, r: 41, w: 1, eco: "10.25" },
          { bowler: { id: "314", name: "Akash Madhwal" }, o: 4, m: 0, r: 39, w: 1, eco: "9.75" },
          { bowler: { id: "315", name: "Piyush Chawla" }, o: 2, m: 0, r: 19, w: 1, eco: "9.50" },
          { bowler: { id: "316", name: "Mohammad Nabi" }, o: 2, m: 0, r: 20, w: 0, eco: "10.00" },
        ],
      },
      {
        inning: "Mumbai Indians 1st Innings",
        totalRuns: 156,
        totalWickets: 3,
        totalOvers: 16.2,
        extras: "b 2, lb 4, w 6, nb 1 (13)",
        batting: [
          { batsman: { id: "321", name: "Rohit Sharma" }, dismissal: "c Gaikwad b Chahar", r: 57, b: 38, "4s": 6, "6s": 2, sr: "150.00" },
          { batsman: { id: "322", name: "Ishan Kishan" }, dismissal: "c Conway b Deshpande", r: 40, b: 26, "4s": 4, "6s": 2, sr: "153.85" },
          { batsman: { id: "323", name: "Suryakumar Yadav" }, dismissal: "c Dube b Pathirana", r: 30, b: 17, "4s": 2, "6s": 2, sr: "176.47" },
          { batsman: { id: "324", name: "Tilak Varma" }, dismissal: "batting", r: 12, b: 8, "4s": 1, "6s": 0, sr: "150.00" },
          { batsman: { id: "325", name: "Hardik Pandya" }, dismissal: "batting", r: 4, b: 3, "4s": 0, "6s": 0, sr: "133.33" },
        ],
        bowling: [
          { bowler: { id: "331", name: "Deepak Chahar" }, o: 4, m: 0, r: 34, w: 1, eco: "8.50" },
          { bowler: { id: "332", name: "Tushar Deshpande" }, o: 3.2, m: 0, r: 32, w: 1, eco: "9.60" },
          { bowler: { id: "333", name: "Ravindra Jadeja" }, o: 4, m: 0, r: 30, w: 0, eco: "7.50" },
          { bowler: { id: "334", name: "Matheesha Pathirana" }, o: 3, m: 0, r: 32, w: 1, eco: "10.67" },
          { bowler: { id: "335", name: "Moeen Ali" }, o: 2, m: 0, r: 21, w: 0, eco: "10.50" },
        ],
      },
    ],
  };

  return scorecards[matchId] ?? null;
}

function getMockCommentary(matchId: string): Commentary | null {
  if (matchId !== "mock-1") return null;

  return {
    bbb: [
      { id: "1", over: 78, ball: 0, score: 0, batsman: "KL Rahul", bowler: "Lyon", commentary: "End of over 78. India 287/4. KL Rahul 48*, Jadeja 12*", timestamp: "2026-02-11T09:00:00" },
      { id: "2", over: 77, ball: 6, score: 1, batsman: "Ravindra Jadeja", bowler: "Lyon", commentary: "77.6 Lyon to Jadeja, SINGLE! Pushed to mid-on for a quick single", timestamp: "2026-02-11T08:58:00" },
      { id: "3", over: 77, ball: 5, score: 0, batsman: "Ravindra Jadeja", bowler: "Lyon", commentary: "77.5 Lyon to Jadeja, no run. Defended solidly on the front foot", timestamp: "2026-02-11T08:57:00" },
      { id: "4", over: 77, ball: 4, score: 4, batsman: "Ravindra Jadeja", bowler: "Lyon", commentary: "77.4 Lyon to Jadeja, FOUR! Swept fine, beats the fielder at fine leg!", timestamp: "2026-02-11T08:56:00" },
      { id: "5", over: 77, ball: 3, score: 0, batsman: "KL Rahul", bowler: "Lyon", commentary: "77.3 Lyon to Rahul, no run. Good length ball, defended back", timestamp: "2026-02-11T08:55:00" },
      { id: "6", over: 77, ball: 2, score: 1, batsman: "KL Rahul", bowler: "Lyon", commentary: "77.2 Lyon to Rahul, SINGLE! Worked to square leg for one", timestamp: "2026-02-11T08:54:00" },
      { id: "7", over: 77, ball: 1, score: 0, batsman: "KL Rahul", bowler: "Lyon", commentary: "77.1 Lyon to Rahul, no run. Tossed up, defended to the off side", timestamp: "2026-02-11T08:53:00" },
    ],
  };
}

function getMockSquads(matchId: string): Squad[] | null {
  if (matchId !== "mock-1") return null;

  return [
    {
      teamName: "India",
      shortname: "IND",
      img: "/flags/ind.png",
      players: [
        { id: "1", name: "Rohit Sharma", role: "Batsman", playerImg: "" },
        { id: "2", name: "Yashasvi Jaiswal", role: "Batsman", playerImg: "" },
        { id: "3", name: "Shubman Gill", role: "Batsman", playerImg: "" },
        { id: "4", name: "Virat Kohli", role: "Batsman", playerImg: "" },
        { id: "5", name: "KL Rahul", role: "WK-Batsman", playerImg: "" },
        { id: "6", name: "Ravindra Jadeja", role: "All-rounder", playerImg: "" },
        { id: "7", name: "R Ashwin", role: "Bowler", playerImg: "" },
        { id: "8", name: "Jasprit Bumrah", role: "Bowler", playerImg: "" },
        { id: "9", name: "Mohammed Siraj", role: "Bowler", playerImg: "" },
        { id: "10", name: "Shardul Thakur", role: "All-rounder", playerImg: "" },
        { id: "11", name: "Rishabh Pant", role: "WK-Batsman", playerImg: "" },
      ],
    },
    {
      teamName: "Australia",
      shortname: "AUS",
      img: "/flags/aus.png",
      players: [
        { id: "20", name: "Pat Cummins", role: "Bowler", playerImg: "" },
        { id: "21", name: "Steve Smith", role: "Batsman", playerImg: "" },
        { id: "22", name: "Marnus Labuschagne", role: "Batsman", playerImg: "" },
        { id: "23", name: "Usman Khawaja", role: "Batsman", playerImg: "" },
        { id: "24", name: "Mitchell Starc", role: "Bowler", playerImg: "" },
        { id: "25", name: "Josh Hazlewood", role: "Bowler", playerImg: "" },
        { id: "26", name: "Nathan Lyon", role: "Bowler", playerImg: "" },
        { id: "27", name: "Alex Carey", role: "WK-Batsman", playerImg: "" },
        { id: "28", name: "Travis Head", role: "Batsman", playerImg: "" },
        { id: "29", name: "Cameron Green", role: "All-rounder", playerImg: "" },
        { id: "30", name: "Mitchell Marsh", role: "All-rounder", playerImg: "" },
      ],
    },
  ];
}

function getMockCalendarMatches(): CalendarMatch[] {
  const today = new Date();
  const matches: CalendarMatch[] = [];
  const matchups = [
    { teams: ["India", "Australia"], type: "Test", venue: "MCG, Melbourne" },
    { teams: ["England", "South Africa"], type: "ODI", venue: "The Oval, London" },
    { teams: ["Mumbai Indians", "Chennai Super Kings"], type: "T20", venue: "Wankhede, Mumbai" },
    { teams: ["Pakistan", "New Zealand"], type: "T20I", venue: "Rawalpindi Stadium" },
    { teams: ["West Indies", "Sri Lanka"], type: "ODI", venue: "Sabina Park, Kingston" },
    { teams: ["Bangladesh", "Zimbabwe"], type: "Test", venue: "Dhaka Stadium" },
    { teams: ["Royal Challengers", "Delhi Capitals"], type: "T20", venue: "Chinnaswamy, Bangalore" },
    { teams: ["Kolkata Knight Riders", "Rajasthan Royals"], type: "T20", venue: "Eden Gardens, Kolkata" },
  ];

  for (let i = 0; i < 20; i++) {
    const matchDate = new Date(today);
    matchDate.setDate(today.getDate() + Math.floor(i * 1.5));
    const matchup = matchups[i % matchups.length];
    matches.push({
      id: `cal-${i}`,
      name: `${matchup.teams[0]} vs ${matchup.teams[1]}`,
      matchType: matchup.type,
      date: matchDate.toISOString().split("T")[0],
      dateTimeGMT: matchDate.toISOString(),
      teams: matchup.teams,
      teamInfo: [
        { name: matchup.teams[0], shortname: matchup.teams[0].slice(0, 3).toUpperCase(), img: "" },
        { name: matchup.teams[1], shortname: matchup.teams[1].slice(0, 3).toUpperCase(), img: "" },
      ],
      venue: matchup.venue,
      status: i < 2 ? "Live" : "Upcoming",
    });
  }
  return matches;
}
