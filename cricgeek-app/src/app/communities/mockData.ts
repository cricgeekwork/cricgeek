import { LOCAL_USER_IDS } from "@/lib/communities/local-users";

export interface Writer {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  topic: string;
  description: string;
  headId: string;
  followers: number;
  posts: number;
  topWriters: Writer[];
  isTrending: boolean;
}

export interface Post {
  id: string;
  communityId: string;
  communitySlug: string;
  title: string;
  summary: string;
  content?: string[];
  author: string;
  authorId: string;
  date: string;
  category: string;
  readTime: string;
}

export const SAMPLE_COMMUNITIES: Community[] = [
  {
    id: "c1",
    slug: "virat-kohli-fans",
    name: "Virat Kohli Fans",
    topic: "Virat Kohli",
    description: "A community for discussions, statistics, news, and analysis related to Virat Kohli.",
    headId: LOCAL_USER_IDS.rahul,
    followers: 125000,
    posts: 8400,
    topWriters: [{ id: LOCAL_USER_IDS.rahul, name: "Rahul Sharma" }, { id: LOCAL_USER_IDS.anil, name: "Anil Kumar" }],
    isTrending: true,
  },
  {
    id: "c2",
    slug: "indian-cricket-discussion",
    name: "Indian Cricket Discussion",
    topic: "Indian Cricket",
    description: "Follow all Indian national cricket team tours, matches, and news.",
    headId: LOCAL_USER_IDS.priya,
    followers: 350000,
    posts: 21000,
    topWriters: [{ id: LOCAL_USER_IDS.priya, name: "Priya Menon" }, { id: LOCAL_USER_IDS.deepak, name: "Deepak Rao" }],
    isTrending: true,
  },
  {
    id: "c3",
    slug: "ipl-mega-fans",
    name: "IPL Mega Fans",
    topic: "IPL Discussion",
    description: "Everything about the Indian Premier League - auctions, stats, match analysis.",
    headId: LOCAL_USER_IDS.anil,
    followers: 550000,
    posts: 42000,
    topWriters: [{ id: LOCAL_USER_IDS.anil, name: "Cricket Nerd" }, { id: LOCAL_USER_IDS.arjun, name: "T20 Master" }],
    isTrending: true,
  },
  {
    id: "c4",
    slug: "test-cricket-purists",
    name: "Test Cricket Purists",
    topic: "Test Cricket",
    description: "For the love of the longest format. Pitch analysis, swing bowling, and stamina.",
    headId: LOCAL_USER_IDS.kiran,
    followers: 45000,
    posts: 3100,
    topWriters: [{ id: LOCAL_USER_IDS.kiran, name: "Rajanala Krishna Kanth" }],
    isTrending: true,
  },
  {
    id: "c5",
    slug: "womens-cricket-global",
    name: "Women's Cricket Global",
    topic: "Women's Cricket",
    description: "Celebrating WT20, WODI, and Women's test cricket worldwide.",
    headId: LOCAL_USER_IDS.praneeth,
    followers: 28000,
    posts: 1500,
    topWriters: [{ id: "w8", name: "Sarah Taylor Fan" }, { id: LOCAL_USER_IDS.praneeth, name: "Praneeth Malepati" }],
    isTrending: true,
  },
  {
    id: "c6",
    slug: "data-analytics-insights",
    name: "Data & Analytics Insights",
    topic: "Cricket Analytics",
    description: "Deep dive into expected runs, win probability models, and sabermetrics of cricket.",
    headId: LOCAL_USER_IDS.satya,
    followers: 15000,
    posts: 900,
    topWriters: [{ id: LOCAL_USER_IDS.satya, name: "Satya Swaroop" }, { id: "w11", name: "Data Miner" }],
    isTrending: true,
  },
  {
    id: "c7",
    slug: "fantasy-cricket-tips",
    name: "Fantasy Cricket Tips",
    topic: "Fantasy Cricket",
    description: "Team setups, captaincy choices, and weather updates for your fantasy squads.",
    headId: LOCAL_USER_IDS.arjun,
    followers: 89000,
    posts: 6700,
    topWriters: [{ id: "w12", name: "Dream Xi Winner" }],
    isTrending: false,
  },
  {
    id: "c8",
    slug: "rohit-sharma-hitman",
    name: "Rohit Sharma Hitman",
    topic: "Rohit Sharma",
    description: "Dedicated to Rohit Sharma's sublime timing and massive sixes.",
    headId: LOCAL_USER_IDS.deepak,
    followers: 95000,
    posts: 4100,
    topWriters: [{ id: "w13", name: "Mumbai Indians Elite" }],
    isTrending: true,
  },
  {
    id: "c9",
    slug: "world-cup-nostalgia",
    name: "World Cup Nostalgia",
    topic: "World Cup Cricket",
    description: "Reliving the greatest matches across all ODI and T20 World Cups.",
    headId: LOCAL_USER_IDS.kiran,
    followers: 67000,
    posts: 2200,
    topWriters: [{ id: "w14", name: "Cup Historian" }],
    isTrending: true,
  },
  {
    id: "c10",
    slug: "t20-blast",
    name: "T20 Blast",
    topic: "T20 Cricket",
    description: "Short format craze. English blast, BBL, PSL, and CPL discussions.",
    headId: LOCAL_USER_IDS.arjun,
    followers: 55000,
    posts: 3800,
    topWriters: [{ id: "w15", name: "Smit Patel" }],
    isTrending: true,
  }
];

export const SAMPLE_POSTS: Post[] = [
  {
    id: "p1",
    communityId: "c1",
    communitySlug: "virat-kohli-fans",
    title: "Breaking Down Kohli's Chase Masterclass against Pakistan",
    summary: "An analytical look at how pacing, shot selection, and strike rotation make Virat the greatest chaser in modern cricket.",
    content: [
      "Virat Kohli's run chases are defined by his flawless tempo. In matches where the required run rate climbs above 10, he relies heavily on finding gaps seamlessly rather than premeditated aggression. During his famous knock against Pakistan, observing the wagon wheel reveals an immense concentration of runs taken in the mid-wicket and extra cover regions.",
      "A deeper mathematical breakdown of his innings shows an incredible lack of dot balls during the middle phases. In standard T20 constructs, preserving wickets while ticking the scoreboard ensures fewer panic-induced errors towards the death overs. You can almost trace a predictable pattern: consolidate from over 7 to 14, then exponentially increase the risk profile."
    ],
    author: "Rahul Sharma",
    authorId: LOCAL_USER_IDS.rahul,
    date: "2 days ago",
    category: "Match Analysis",
    readTime: "5 min read",
  },
  {
    id: "p2",
    communityId: "c1",
    communitySlug: "virat-kohli-fans",
    title: "Kohli's Form in Overseas Tests: What Do The Stats Say?",
    summary: "Reflecting on Virat's averages in SENA countries compared to sub-continent tracks over his last 5 years.",
    content: [
      "The true test of a sub-continent batsman is enduring the bouncy tracks down under and the swinging red cherry in England. Looking back at his recent overseas cycles, it's evident that Virat modified his initial trigger movement compared to the historic struggles of 2014.",
      "His bat face remains squarer longer in his defense. This adjustment yielded significant dividends on tracks where lateral movement typically exposes the outside edge. While his absolute numbers might have occasionally dwindled across certain series, the technical maturity on display validates his pedigree."
    ],
    author: "Anil Kumar",
    authorId: LOCAL_USER_IDS.anil,
    date: "4 days ago",
    category: "Career Statistics",
    readTime: "7 min read",
  },
  {
    id: "p3",
    communityId: "c2",
    communitySlug: "indian-cricket-discussion",
    title: "Potential changes in squad for upcoming Border-Gavaskar Trophy",
    summary: "Discussing selections for the middle-order batting roles given recent domestic form and injuries.",
    content: [
      "As we approach the Border-Gavaskar Trophy, the selectors are faced with a conundrum in the middle order. With a string of injuries depleting the usual suspects, an opportunity arises for seasoned domestic performers who have piled up runs continuously in the Ranji Trophy.",
      "Who deserves the nod? Is raw talent better suited against aggressive Aussie fast bowling, or do we need the patience and grit of an experienced campaigner who can leave the ball effectively outside the off stump? I think a balance between youthful aggression and staunch defense will be key to avoiding top-order collapses."
    ],
    author: "Priya Menon",
    authorId: LOCAL_USER_IDS.priya,
    date: "1 day ago",
    category: "Selection & Strategy",
    readTime: "6 min read",
  },
  {
    id: "p4",
    communityId: "c3",
    communitySlug: "ipl-mega-fans",
    title: "How Impact Player rule changed T20 team compositions",
    summary: "Teams are now heavily loading their batting lineup. A deep dive into the 200+ par scores across venues.",
    content: [
      "The introduction of the Impact Player rule has fundamentally altered franchise strategies. Without the absolute need for a three-dimensional all-rounder, franchises are able to essentially play an extra specialist batsman or bowler, meaning batting line-ups stretch all the way down to number 8 or 9.",
      "This structural safety net gives top-order batsmen the license to play hyper-aggressively from ball one. Consequently, what used to be a par score of 170 has casually swelled past 200. Bowlers now operate with reduced margins of error, reinforcing the sentiment that modern T20 is increasingly turning into a batsman's game."
    ],
    author: "T20 Master",
    authorId: LOCAL_USER_IDS.arjun,
    date: "12 hours ago",
    category: "Tournament Rules",
    readTime: "4 min read",
  },
  {
    id: "p5",
    communityId: "c4",
    communitySlug: "test-cricket-purists",
    title: "The Art of Reverse Swing with SG Balls",
    summary: "Explaining the physics behind the old ball hooping, and the fast bowlers who mastered it.",
    content: [
      "Reverse swing remains one of cricket's most captivating phenomena. As an SG ball deteriorates on abrasive surfaces, maintaining one side smooth while letting the other scuff naturally shifts the aerodynamics. When bowled with decent pace, the ball surprisingly swings towards the shiny side in the air.",
      "We've seen legendary bowlers manipulate this effect to run through lower-order batters. The skill requires tremendous pace, a distinctly repeatable release angle, and the wrist position that hides the shiny side until the last possible moment, leaving batsmen guessing about the trajectory."
    ],
    author: "Rajanala Krishna Kanth",
    authorId: LOCAL_USER_IDS.kiran,
    date: "5 days ago",
    category: "Pitch & Conditions",
    readTime: "8 min read",
  },
  {
    id: "p6",
    communityId: "c6",
    communitySlug: "data-analytics-insights",
    title: "Constructing Win Probability Models from Ball-by-Ball Logs",
    summary: "A technical overview of building an expected score matrix via generalized linear mixed models.",
    content: [
      "Modeling cricket is intrinsically difficult due to the sport's high variance and discrete state changes (balls, overs, wickets). To build an accurate expected score matrix, one method is employing Generalized Linear Mixed Models (GLMMs) over extensive ball-by-ball datasets.",
      "By isolating the effects of venue characteristics, bowler quality, and batter historical strike rates against specific ball types (spin vs pace), we can calculate predictive estimates for run accrual. The real-time application of these models drastically influences in-game decisions, giving a probabilistic edge over human intuition."
    ],
    author: "Satya Swaroop",
    authorId: LOCAL_USER_IDS.satya,
    date: "1 week ago",
    category: "Data Science",
    readTime: "12 min read",
  }
];
