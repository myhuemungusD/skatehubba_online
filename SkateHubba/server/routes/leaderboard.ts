import { Router } from "express";
import { db } from "../db";
import { users, leaderboardEntries, checkIns, spots, skateGames, gameParticipants } from "../../shared/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import type { LeaderboardFilters, LeaderboardUser, UserStats } from "../../shared/types";

const router = Router();

// ============================================================================
// GET /api/leaderboard - Get leaderboard rankings
// ============================================================================
router.get("/", async (req, res) => {
  try {
    const { type = "global", spotId, limit = 50, offset = 0 } = req.query as unknown as LeaderboardFilters;

    let leaderboard: LeaderboardUser[] = [];

    if (type === "global") {
      // Global all-time leaderboard from users table
      const results = await db
        .select({
          userId: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          totalPoints: users.totalPoints,
          checkInCount: users.checkInCount,
          gamesWon: users.gamesWon,
        })
        .from(users)
        .where(sql`${users.totalPoints} > 0`)
        .orderBy(desc(users.totalPoints))
        .limit(Number(limit))
        .offset(Number(offset));

      leaderboard = results.map((u, idx) => ({
        rank: Number(offset) + idx + 1,
        userId: u.userId,
        username: u.username || "Skater",
        displayName: u.displayName || undefined,
        avatarUrl: u.avatarUrl || undefined,
        totalPoints: u.totalPoints || 0,
        checkInCount: u.checkInCount || 0,
        gamesWon: u.gamesWon || 0,
      }));
    } else if (type === "weekly" || type === "monthly") {
      // Time-based leaderboards
      const now = new Date();
      let startDate: Date;
      
      if (type === "weekly") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Aggregate points from check-ins and games in the time period
      const checkInPoints = await db
        .select({
          userId: checkIns.userId,
          points: sql<number>`SUM(${checkIns.pointsEarned})`.as("points"),
        })
        .from(checkIns)
        .where(gte(checkIns.createdAt, startDate))
        .groupBy(checkIns.userId);

      const gamePoints = await db
        .select({
          winnerId: skateGames.winnerId,
          wins: sql<number>`COUNT(*)`.as("wins"),
        })
        .from(skateGames)
        .where(and(eq(skateGames.status, "completed"), gte(skateGames.completedAt, startDate)))
        .groupBy(skateGames.winnerId);

      // Combine and sort
      const pointsMap = new Map<number, { checkInPoints: number; gamePoints: number }>();

      checkInPoints.forEach((c) => {
        if (c.userId) {
          pointsMap.set(c.userId, { checkInPoints: Number(c.points) || 0, gamePoints: 0 });
        }
      });

      gamePoints.forEach((g) => {
        if (g.winnerId) {
          const existing = pointsMap.get(g.winnerId) || { checkInPoints: 0, gamePoints: 0 };
          existing.gamePoints = (Number(g.wins) || 0) * 50; // 50 points per win
          pointsMap.set(g.winnerId, existing);
        }
      });

      // Get user details and sort
      const userIds = Array.from(pointsMap.keys());
      
      if (userIds.length > 0) {
        const userDetails = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            checkInCount: users.checkInCount,
            gamesWon: users.gamesWon,
          })
          .from(users)
          .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);

        const rankedUsers = userDetails
          .map((u) => {
            const pts = pointsMap.get(u.id) || { checkInPoints: 0, gamePoints: 0 };
            return {
              userId: u.id,
              username: u.username || "Skater",
              displayName: u.displayName || undefined,
              avatarUrl: u.avatarUrl || undefined,
              totalPoints: pts.checkInPoints + pts.gamePoints,
              checkInCount: u.checkInCount || 0,
              gamesWon: u.gamesWon || 0,
            };
          })
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(Number(offset), Number(offset) + Number(limit));

        leaderboard = rankedUsers.map((u, idx) => ({
          rank: Number(offset) + idx + 1,
          ...u,
        }));
      }
    } else if (type === "spot" && spotId) {
      // Spot-specific leaderboard
      const spotCheckIns = await db
        .select({
          userId: checkIns.userId,
          totalPoints: sql<number>`SUM(${checkIns.pointsEarned})`.as("totalPoints"),
          checkInCount: sql<number>`COUNT(*)`.as("checkInCount"),
        })
        .from(checkIns)
        .where(eq(checkIns.spotId, Number(spotId)))
        .groupBy(checkIns.userId)
        .orderBy(desc(sql`SUM(${checkIns.pointsEarned})`))
        .limit(Number(limit))
        .offset(Number(offset));

      // Get user details
      const userIds = spotCheckIns.map((c) => c.userId).filter(Boolean) as number[];
      
      if (userIds.length > 0) {
        const userDetails = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            gamesWon: users.gamesWon,
          })
          .from(users)
          .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);

        const userMap = new Map(userDetails.map((u) => [u.id, u]));

        leaderboard = spotCheckIns.map((c, idx) => {
          const user = userMap.get(c.userId!);
          return {
            rank: Number(offset) + idx + 1,
            userId: c.userId!,
            username: user?.username || "Skater",
            displayName: user?.displayName || undefined,
            avatarUrl: user?.avatarUrl || undefined,
            totalPoints: Number(c.totalPoints) || 0,
            checkInCount: Number(c.checkInCount) || 0,
            gamesWon: user?.gamesWon || 0,
          };
        });
      }
    }

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

// ============================================================================
// GET /api/leaderboard/user/:id - Get specific user's stats and rank
// ============================================================================
router.get("/user/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Calculate global rank
    const rankResult = await db
      .select({
        rank: sql<number>`(
          SELECT COUNT(*) + 1 FROM users 
          WHERE total_points > ${user[0].totalPoints || 0}
        )`.as("rank"),
      })
      .from(users)
      .limit(1);

    // Get favorite spot (most check-ins)
    const favoriteSpotResult = await db
      .select({
        spotId: checkIns.spotId,
        spotName: spots.name,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(checkIns)
      .innerJoin(spots, eq(checkIns.spotId, spots.id))
      .where(eq(checkIns.userId, userId))
      .groupBy(checkIns.spotId, spots.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(1);

    // Get last check-in
    const lastCheckIn = await db
      .select({ createdAt: checkIns.createdAt })
      .from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.createdAt))
      .limit(1);

    const stats: UserStats = {
      userId: user[0].id,
      username: user[0].username || "Skater",
      displayName: user[0].displayName || undefined,
      avatarUrl: user[0].avatarUrl || undefined,
      rank: Number(rankResult[0]?.rank) || 0,
      totalPoints: user[0].totalPoints || 0,
      checkInCount: user[0].checkInCount || 0,
      gamesPlayed: user[0].gamesPlayed || 0,
      gamesWon: user[0].gamesWon || 0,
      favoriteSpot: favoriteSpotResult[0]?.spotName || undefined,
      lastCheckIn: lastCheckIn[0]?.createdAt || undefined,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user stats" });
  }
});

// ============================================================================
// GET /api/leaderboard/me - Get current user's stats (authenticated)
// ============================================================================
router.get("/me", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    // Redirect to user-specific endpoint
    req.params.id = userId.toString();
    return router.handle(req, res, () => {});
  } catch (error) {
    console.error("Error fetching my stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// ============================================================================
// GET /api/leaderboard/top-spots - Get spots with most check-ins
// ============================================================================
router.get("/top-spots", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topSpots = await db
      .select({
        id: spots.id,
        name: spots.name,
        city: spots.city,
        state: spots.state,
        spotType: spots.spotType,
        totalCheckIns: spots.totalCheckIns,
        rating: spots.rating,
        imageUrls: spots.imageUrls,
      })
      .from(spots)
      .where(eq(spots.active, true))
      .orderBy(desc(spots.totalCheckIns))
      .limit(Number(limit));

    res.json({ success: true, data: topSpots });
  } catch (error) {
    console.error("Error fetching top spots:", error);
    res.status(500).json({ success: false, error: "Failed to fetch top spots" });
  }
});

// ============================================================================
// GET /api/leaderboard/recent-activity - Get recent check-ins and game results
// ============================================================================
router.get("/recent-activity", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Recent check-ins
    const recentCheckIns = await db
      .select({
        type: sql<string>`'check_in'`.as("type"),
        timestamp: checkIns.createdAt,
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        spotName: spots.name,
        spotCity: spots.city,
        pointsEarned: checkIns.pointsEarned,
        trickLanded: checkIns.trickLanded,
      })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .innerJoin(spots, eq(checkIns.spotId, spots.id))
      .orderBy(desc(checkIns.createdAt))
      .limit(Number(limit));

    // Recent game completions
    const recentGames = await db
      .select({
        type: sql<string>`'game_win'`.as("type"),
        timestamp: skateGames.completedAt,
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        gameCode: skateGames.gameCode,
      })
      .from(skateGames)
      .innerJoin(users, eq(skateGames.winnerId, users.id))
      .where(eq(skateGames.status, "completed"))
      .orderBy(desc(skateGames.completedAt))
      .limit(Number(limit));

    // Combine and sort by timestamp
    const activity = [
      ...recentCheckIns.map((c) => ({
        type: "check_in" as const,
        timestamp: c.timestamp,
        user: {
          id: c.userId,
          username: c.username,
          displayName: c.displayName,
          avatarUrl: c.avatarUrl,
        },
        details: {
          spotName: c.spotName,
          spotCity: c.spotCity,
          pointsEarned: c.pointsEarned,
          trickLanded: c.trickLanded,
        },
      })),
      ...recentGames.map((g) => ({
        type: "game_win" as const,
        timestamp: g.timestamp,
        user: {
          id: g.userId,
          username: g.username,
          displayName: g.displayName,
          avatarUrl: g.avatarUrl,
        },
        details: {
          gameCode: g.gameCode,
          pointsEarned: 50,
        },
      })),
    ]
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, Number(limit));

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
});

export default router;
