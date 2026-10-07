import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getDemoBlogs } from "@/lib/demo-data";
import { upsertExpressionEmbedding } from "@/lib/internal-originality";
import { getPreferenceValues } from "@/lib/personalization";
import { parseBlogTags, serializeBlogTags } from "@/lib/blog-tags";
import { rankExpressionCandidates } from "@/lib/expression-recommendations";

// GET all approved blogs
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageValue = Number.parseInt(searchParams.get("page") || "1", 10);
  const limitValue = Number.parseInt(searchParams.get("limit") || "10", 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 10;
  const tag = searchParams.get("tag");
  const feed = searchParams.get("feed") || "latest";
  const seenSlugs = (searchParams.get("seen") || "").split(",").filter(Boolean).slice(0, 100);
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if ((feed === "saved" || feed === "for-you") && !userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const where: Prisma.BlogWhereInput = {
      status: "approved",
      score: { is: { processingStatus: "completed" } },
      ...(tag ? { tags: { contains: tag } } : {}),
      ...(feed === "saved" && userId ? { saves: { some: { userId } } } : {}),
    };
    const include: Prisma.BlogInclude = {
      author: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true, reactions: true, saves: true } },
      score: {
        select: {
          bqs: true,
          archetypeLabel: true,
          processingStatus: true,
        },
      },
      reactions: userId
        ? { where: { userId }, select: { id: true }, take: 1 }
        : false,
      saves: userId
        ? { where: { userId }, select: { id: true }, take: 1 }
        : false,
    };

    let [blogs, total] = await Promise.all([
      feed === "for-you"
        ? prisma.blog.findMany({
            where,
            include,
            orderBy: { createdAt: "desc" },
            take: 250,
          })
        : prisma.blog.findMany({
            where,
            include,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
      prisma.blog.count({ where }),
    ]);

    if (feed === "for-you" && userId) {
      const [preferences, follows, saved, reacted, ownBlogs] = await Promise.all([
        prisma.userFeedPreference.findUnique({ where: { userId } }),
        prisma.writerFollow.findMany({
          where: { followerId: userId },
          select: { writerId: true },
        }),
        prisma.savedBlog.findMany({
          where: { userId },
          take: 100,
          select: {
            blog: {
              select: { authorId: true, tags: true, mentionedPlayers: true, mentionedTeams: true },
            },
          },
        }),
        prisma.blogReaction.findMany({
          where: { userId },
          take: 100,
          select: {
            blog: {
              select: { authorId: true, tags: true, mentionedPlayers: true, mentionedTeams: true },
            },
          },
        }),
        prisma.blog.findMany({
          where: { authorId: userId, status: "approved" },
          orderBy: { createdAt: "desc" },
          take: 25,
          select: { title: true, tags: true },
        }),
      ]);
      const preferredWriters = getPreferenceValues(preferences?.favoriteWriters);
      const followedWriterIds = [
        ...follows.map((follow) => follow.writerId),
        ...preferredWriters,
      ];
      const interactedBlogs = [...saved, ...reacted].map((item) => item.blog);
      const rankedBlogs = rankExpressionCandidates(blogs, {
        followedWriterIds,
        interactedAuthorIds: interactedBlogs.map((blog) => blog.authorId),
        interactedTags: interactedBlogs.flatMap((blog) => parseBlogTags(blog.tags)),
        favoriteTags: getPreferenceValues(preferences?.favoriteTags),
        favoriteTeams: getPreferenceValues(preferences?.favoriteTeams),
        favoritePlayers: getPreferenceValues(preferences?.favoritePlayers),
        ownExpressionTopics: ownBlogs.flatMap((blog) => [blog.title, ...parseBlogTags(blog.tags)]),
        seenSlugs,
      });
      total = rankedBlogs.length;
      blogs = rankedBlogs.slice((page - 1) * limit, page * limit);
    }

    const responseBlogs = blogs.map((blog) => {
      const { reactions, saves, ...publicBlog } = blog;
      return {
        ...publicBlog,
        reactionCount: blog._count.reactions,
        saveCount: blog._count.saves,
        viewerState: {
          reacted: Array.isArray(reactions) && reactions.length > 0,
          saved: Array.isArray(saves) && saves.length > 0,
        },
      };
    });

    return NextResponse.json({
      blogs: responseBlogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    if (feed === "for-you") {
      const demoBlogs = rankExpressionCandidates(getDemoBlogs(), { seenSlugs });
      const start = (page - 1) * limit;
      const pageBlogs = demoBlogs.slice(start, start + limit);
      return NextResponse.json({
        blogs: pageBlogs.map((blog) => ({
          ...blog,
          reactionCount: blog.runs,
          saveCount: 0,
          viewerState: { reacted: false, saved: false },
        })),
        pagination: {
          page,
          limit,
          total: demoBlogs.length,
          totalPages: Math.ceil(demoBlogs.length / limit),
        },
      });
    }

    if (feed !== "latest") {
      return NextResponse.json({ error: "Unable to load this expressions feed" }, { status: 500 });
    }

    const demoBlogs = getDemoBlogs();
    const start = (page - 1) * limit;
    const pageBlogs = demoBlogs.slice(start, start + limit);

    return NextResponse.json({
      blogs: pageBlogs,
      pagination: {
        page,
        limit,
        total: demoBlogs.length,
        totalPages: Math.ceil(demoBlogs.length / limit),
      },
    });
  }
}

// POST new blog
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string } | undefined;
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { title, content, tags } = await req.json();
    const normalizedTags = serializeBlogTags(typeof tags === "string" ? tags : "");
    const authorId = sessionUser.id;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Word count validation (50-2000 words)
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 50 || wordCount > 2000) {
      return NextResponse.json(
        { error: `Blog must be 50-2000 words. Current: ${wordCount} words` },
        { status: 400 }
      );
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-") +
      "-" +
      Date.now().toString(36);

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        excerpt: content.slice(0, 150) + "...",
        slug,
        tags: normalizedTags,
        authorId,
        status: "approved", // Auto-approve for now; enable moderation later
      },
    });

    try {
      await upsertExpressionEmbedding({ blogId: blog.id, title: blog.title, content: blog.content });
    } catch (embeddingError) {
      console.error("Embedding upsert failed after publish:", embeddingError);
    }

    return NextResponse.json(
      { message: "Expression submitted for review", blog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Blog creation error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error: "Could not create blog because the author profile is not fully initialized.",
            detail: "Foreign key constraint failed while linking author.",
            code: error.code,
            meta: error.meta ?? null,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Database request failed while creating blog.",
          detail: error.message,
          code: error.code,
          meta: error.meta ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create blog",
        detail: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
