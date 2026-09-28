export type LocalDemoUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  articleCount: number;
  totalViews: number;
  followerCount: number;
  communities: string[];
  recentBlogs: {
    id: string;
    title: string;
    slug: string;
    views: number;
    runs: number;
    createdAt: string;
    score: { bqs: number } | null;
  }[];
};

export const LOCAL_USER_IDS = {
  rahul: "u-rahul-sharma",
  praneeth: "u-praneeth-malepati",
  anil: "u-anil-kumar",
  priya: "u-priya-menon",
  satya: "u-satya-swaroop",
  deepak: "u-deepak-rao",
  arjun: "u-arjun-reddy",
  kiran: "u-kiran-kumar",
} as const;

export const LOCAL_DEMO_USERS: LocalDemoUser[] = [
  {
    id: LOCAL_USER_IDS.rahul,
    name: "Rahul Sharma",
    username: "rahul.sharma",
    email: "rahul.sharma@cricgeek.demo",
    bio: "Match analyst covering chase construction, shot selection, and Virat Kohli's big-game temperament.",
    articleCount: 18,
    totalViews: 21450,
    followerCount: 1280,
    communities: ["Virat Kohli Fans"],
    recentBlogs: [
      {
        id: "p1",
        title: "Breaking Down Kohli's Chase Masterclass against Pakistan",
        slug: "/communities/virat-kohli-fans/posts/p1",
        views: 4820,
        runs: 24,
        createdAt: "2026-09-19T00:00:00.000Z",
        score: { bqs: 91 },
      },
      {
        id: "rahul-article-2",
        title: "Why Kohli still owns the 140-plus chase",
        slug: "/blog/write",
        views: 2210,
        runs: 11,
        createdAt: "2026-09-10T00:00:00.000Z",
        score: { bqs: 86 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.praneeth,
    name: "Praneeth Malepati",
    username: "praneeth.malepati",
    email: "praneeth.malepati@cricgeek.demo",
    bio: "Independent cricket writer focused on batting evolution, women's cricket, and accessible match breakdowns.",
    articleCount: 12,
    totalViews: 8420,
    followerCount: 640,
    communities: ["Women's Cricket Global"],
    recentBlogs: [
      {
        id: "praneeth-article-1",
        title: "How Virat Kohli's batting has evolved",
        slug: "/blog/write",
        views: 1980,
        runs: 14,
        createdAt: "2026-09-12T00:00:00.000Z",
        score: { bqs: 88 },
      },
      {
        id: "praneeth-article-2",
        title: "What WT20 finishers can teach men's T20 sides",
        slug: "/blog/write",
        views: 1240,
        runs: 9,
        createdAt: "2026-08-28T00:00:00.000Z",
        score: { bqs: 82 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.anil,
    name: "Anil Kumar",
    username: "anil.kumar",
    email: "anil.kumar@cricgeek.demo",
    bio: "Stats-first writer tracking overseas Test form, IPL compositions, and selection puzzles.",
    articleCount: 15,
    totalViews: 16320,
    followerCount: 910,
    communities: ["IPL Mega Fans", "Virat Kohli Fans"],
    recentBlogs: [
      {
        id: "p2",
        title: "Kohli's Form in Overseas Tests: What Do The Stats Say?",
        slug: "/communities/virat-kohli-fans/posts/p2",
        views: 3610,
        runs: 18,
        createdAt: "2026-09-17T00:00:00.000Z",
        score: { bqs: 89 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.priya,
    name: "Priya Menon",
    username: "priya.menon",
    email: "priya.menon@cricgeek.demo",
    bio: "National-team correspondent covering squad balance, domestic form, and series strategy.",
    articleCount: 21,
    totalViews: 19840,
    followerCount: 1540,
    communities: ["Indian Cricket Discussion"],
    recentBlogs: [
      {
        id: "p3",
        title: "Potential changes in squad for upcoming Border-Gavaskar Trophy",
        slug: "/communities/indian-cricket-discussion/posts/p3",
        views: 2740,
        runs: 16,
        createdAt: "2026-09-20T00:00:00.000Z",
        score: { bqs: 87 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.satya,
    name: "Satya Swaroop",
    username: "satya.swaroop",
    email: "satya.swaroop@cricgeek.demo",
    bio: "Builds win-probability models and expected-run matrices from ball-by-ball cricket logs.",
    articleCount: 9,
    totalViews: 11200,
    followerCount: 720,
    communities: ["Data & Analytics Insights"],
    recentBlogs: [
      {
        id: "p6",
        title: "Constructing Win Probability Models from Ball-by-Ball Logs",
        slug: "/communities/data-analytics-insights/posts/p6",
        views: 1880,
        runs: 21,
        createdAt: "2026-09-14T00:00:00.000Z",
        score: { bqs: 93 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.deepak,
    name: "Deepak Rao",
    username: "deepak.rao",
    email: "deepak.rao@cricgeek.demo",
    bio: "Franchise cricket writer covering Rohit Sharma, IPL auctions, and powerplay tactics.",
    articleCount: 11,
    totalViews: 9050,
    followerCount: 530,
    communities: ["Rohit Sharma Hitman", "Indian Cricket Discussion"],
    recentBlogs: [
      {
        id: "deepak-article-1",
        title: "The Hitman's pull shot is still a match-up problem",
        slug: "/blog/write",
        views: 860,
        runs: 8,
        createdAt: "2026-09-08T00:00:00.000Z",
        score: { bqs: 80 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.arjun,
    name: "Arjun Reddy",
    username: "arjun.reddy",
    email: "arjun.reddy@cricgeek.demo",
    bio: "Fantasy and T20 specialist writing about captaincy calls, death overs, and short-format matchups.",
    articleCount: 8,
    totalViews: 6740,
    followerCount: 410,
    communities: ["Fantasy Cricket Tips"],
    recentBlogs: [
      {
        id: "arjun-article-1",
        title: "Captaincy levers that actually move fantasy points",
        slug: "/blog/write",
        views: 540,
        runs: 6,
        createdAt: "2026-09-05T00:00:00.000Z",
        score: { bqs: 78 },
      },
    ],
  },
  {
    id: LOCAL_USER_IDS.kiran,
    name: "Kiran Kumar",
    username: "kiran.kumar",
    email: "kiran.kumar@cricgeek.demo",
    bio: "Test cricket purist writing about reverse swing, red-ball patience, and long-format craft.",
    articleCount: 10,
    totalViews: 7340,
    followerCount: 390,
    communities: ["Test Cricket Purists"],
    recentBlogs: [
      {
        id: "p5",
        title: "The Art of Reverse Swing with SG Balls",
        slug: "/communities/test-cricket-purists/posts/p5",
        views: 1120,
        runs: 13,
        createdAt: "2026-09-16T00:00:00.000Z",
        score: { bqs: 90 },
      },
    ],
  },
];

export function getLocalDemoUser(userId: string) {
  return LOCAL_DEMO_USERS.find((user) => user.id === userId) ?? null;
}

export function getLocalDemoUsers() {
  return LOCAL_DEMO_USERS;
}

export function getLocalWriterProfile(userId: string) {
  const user = getLocalDemoUser(userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    avatar: null,
    bio: user.bio,
    role: "user",
    createdAt: "2026-01-15T00:00:00.000Z",
    stats: {
      followerCount: user.followerCount,
      blogCount: user.articleCount,
    },
    viewerState: { followsWriter: false },
    profile: {
      averageBQS: 84,
      totalBlogs: user.articleCount,
      totalViews: user.totalViews,
      totalRuns: Math.round(user.totalViews / 40),
      archetype: "analyst",
      writerTitle: user.username.toUpperCase(),
      level: Math.max(1, Math.floor(user.articleCount / 3)),
      xp: (user.articleCount * 12) % 100,
      bestBQS: 91,
      featuredCount: 1,
      streak: 2,
      bcs: 80,
      statAccuracy: 77,
    },
    dna: {
      analyst: 70,
      fan: 40,
      storyteller: 52,
      debater: 48,
    },
    badges: [
      {
        badge: "first_blood",
        title: "First Blood",
        description: "Published your first expression",
        tier: "bronze",
        earnedAt: "2026-02-01T00:00:00.000Z",
      },
    ],
    achievements: [
      {
        achievement: "first_blog",
        title: "First Expression",
        description: "Published your first expression",
        milestone: 1,
        earnedAt: "2026-02-01T00:00:00.000Z",
      },
    ],
    recentBlogs: user.recentBlogs,
    communities: user.communities,
  };
}
