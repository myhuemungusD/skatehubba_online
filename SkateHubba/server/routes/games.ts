import { Router } from "express";
import { db } from "../db";
import {
  skateGames,
  gameParticipants,
  gameTurns,
  turnResponses,
  users,
} from "../../shared/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  CreateGameRequest,
  JoinGameRequest,
  SubmitTrickRequest,
  RespondToTrickRequest,
  GameWithParticipants,
} from "../../shared/types";

const router = Router();

// ============================================================================
// GET /api/games - List active/public games
// ============================================================================
router.get("/", async (req, res) => {
  try {
    const { status = "waiting", isPublic = "true" } = req.query;

    let conditions: any[] = [];
    if (status) {
      conditions.push(eq(skateGames.status, status as string));
    }
    if (isPublic === "true") {
      conditions.push(eq(skateGames.isPublic, true));
    }

    const games = await db
      .select()
      .from(skateGames)
      .where(and(...conditions))
      .orderBy(desc(skateGames.createdAt))
      .limit(50);

    // Get participant counts for each game
    const gamesWithCounts = await Promise.all(
      games.map(async (game) => {
        const participants = await db
          .select()
          .from(gameParticipants)
          .where(eq(gameParticipants.gameId, game.id));

        return {
          ...game,
          participantCount: participants.length,
        };
      })
    );

    res.json({ success: true, data: gamesWithCounts });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ success: false, error: "Failed to fetch games" });
  }
});

// ============================================================================
// POST /api/games - Create a new game
// ============================================================================
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { maxPlayers = 2, isPublic = true }: CreateGameRequest = req.body;

    // Generate unique game code
    const gameCode = nanoid(6).toUpperCase();

    const [game] = await db
      .insert(skateGames)
      .values({
        gameCode,
        status: "waiting",
        maxPlayers,
        isPublic,
        createdById: userId,
        currentSetterId: userId, // Creator sets first
      })
      .returning();

    // Add creator as first participant
    await db.insert(gameParticipants).values({
      gameId: game.id,
      userId,
      letters: "",
    });

    res.status(201).json({ success: true, data: game });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ success: false, error: "Failed to create game" });
  }
});

// ============================================================================
// GET /api/games/:code - Get game by code with full details
// ============================================================================
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const game = await db
      .select()
      .from(skateGames)
      .where(eq(skateGames.gameCode, code.toUpperCase()))
      .limit(1);

    if (!game.length) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    // Get participants with user info
    const participants = await db
      .select({
        participant: gameParticipants,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(gameParticipants)
      .innerJoin(users, eq(gameParticipants.userId, users.id))
      .where(eq(gameParticipants.gameId, game[0].id));

    // Get current setter info
    let currentSetter = null;
    if (game[0].currentSetterId) {
      const setter = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, game[0].currentSetterId))
        .limit(1);
      currentSetter = setter[0] || null;
    }

    // Get winner info if game completed
    let winner = null;
    if (game[0].winnerId) {
      const winnerUser = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, game[0].winnerId))
        .limit(1);
      winner = winnerUser[0] || null;
    }

    const gameWithDetails: GameWithParticipants = {
      id: game[0].id,
      gameCode: game[0].gameCode,
      status: game[0].status as "waiting" | "active" | "completed",
      currentRound: game[0].currentRound || 1,
      maxPlayers: game[0].maxPlayers || 2,
      isPublic: game[0].isPublic || true,
      createdAt: game[0].createdAt!,
      participants: participants.map((p) => ({
        userId: p.user.id,
        username: p.user.username || "",
        displayName: p.user.displayName || undefined,
        avatarUrl: p.user.avatarUrl || undefined,
        letters: p.participant.letters || "",
        isEliminated: p.participant.isEliminated || false,
      })),
      currentSetter: currentSetter || undefined,
      winner: winner || undefined,
    };

    res.json({ success: true, data: gameWithDetails });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ success: false, error: "Failed to fetch game" });
  }
});

// ============================================================================
// POST /api/games/:code/join - Join a game
// ============================================================================
router.post("/:code/join", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { code } = req.params;

    const game = await db
      .select()
      .from(skateGames)
      .where(eq(skateGames.gameCode, code.toUpperCase()))
      .limit(1);

    if (!game.length) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    if (game[0].status !== "waiting") {
      return res.status(400).json({ success: false, error: "Game has already started" });
    }

    // Check if already in game
    const existingParticipant = await db
      .select()
      .from(gameParticipants)
      .where(and(eq(gameParticipants.gameId, game[0].id), eq(gameParticipants.userId, userId)))
      .limit(1);

    if (existingParticipant.length) {
      return res.status(400).json({ success: false, error: "Already in this game" });
    }

    // Check if game is full
    const currentParticipants = await db
      .select()
      .from(gameParticipants)
      .where(eq(gameParticipants.gameId, game[0].id));

    if (currentParticipants.length >= (game[0].maxPlayers || 2)) {
      return res.status(400).json({ success: false, error: "Game is full" });
    }

    // Join game
    await db.insert(gameParticipants).values({
      gameId: game[0].id,
      userId,
      letters: "",
    });

    res.json({ success: true, message: "Joined game successfully" });
  } catch (error) {
    console.error("Error joining game:", error);
    res.status(500).json({ success: false, error: "Failed to join game" });
  }
});

// ============================================================================
// POST /api/games/:code/start - Start the game
// ============================================================================
router.post("/:code/start", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { code } = req.params;

    const game = await db
      .select()
      .from(skateGames)
      .where(eq(skateGames.gameCode, code.toUpperCase()))
      .limit(1);

    if (!game.length) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    if (game[0].createdById !== userId) {
      return res.status(403).json({ success: false, error: "Only the host can start the game" });
    }

    if (game[0].status !== "waiting") {
      return res.status(400).json({ success: false, error: "Game has already started" });
    }

    // Check minimum players
    const participants = await db
      .select()
      .from(gameParticipants)
      .where(eq(gameParticipants.gameId, game[0].id));

    if (participants.length < 2) {
      return res.status(400).json({ success: false, error: "Need at least 2 players to start" });
    }

    // Start game
    const [updatedGame] = await db
      .update(skateGames)
      .set({
        status: "active",
        startedAt: new Date(),
        currentRound: 1,
      })
      .where(eq(skateGames.id, game[0].id))
      .returning();

    // Create first turn
    await db.insert(gameTurns).values({
      gameId: game[0].id,
      roundNumber: 1,
      setterId: game[0].currentSetterId!,
      status: "setting",
    });

    res.json({ success: true, data: updatedGame });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ success: false, error: "Failed to start game" });
  }
});

// ============================================================================
// POST /api/games/:code/trick - Submit a trick (setter)
// ============================================================================
router.post("/:code/trick", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { code } = req.params;
    const { trickName, videoUrl }: SubmitTrickRequest = req.body;

    const game = await db
      .select()
      .from(skateGames)
      .where(eq(skateGames.gameCode, code.toUpperCase()))
      .limit(1);

    if (!game.length) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    if (game[0].currentSetterId !== userId) {
      return res.status(403).json({ success: false, error: "It's not your turn to set" });
    }

    // Get current turn
    const currentTurn = await db
      .select()
      .from(gameTurns)
      .where(
        and(
          eq(gameTurns.gameId, game[0].id),
          eq(gameTurns.roundNumber, game[0].currentRound || 1),
          eq(gameTurns.status, "setting")
        )
      )
      .limit(1);

    if (!currentTurn.length) {
      return res.status(400).json({ success: false, error: "No active turn to set trick" });
    }

    // Update turn with trick
    const [updatedTurn] = await db
      .update(gameTurns)
      .set({
        trickName,
        trickVideoUrl: videoUrl,
        status: "responding",
      })
      .where(eq(gameTurns.id, currentTurn[0].id))
      .returning();

    res.json({ success: true, data: updatedTurn });
  } catch (error) {
    console.error("Error submitting trick:", error);
    res.status(500).json({ success: false, error: "Failed to submit trick" });
  }
});

// ============================================================================
// POST /api/games/:code/respond - Respond to a trick
// ============================================================================
router.post("/:code/respond", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { code } = req.params;
    const { turnId, landed, videoUrl }: RespondToTrickRequest = req.body;

    const game = await db
      .select()
      .from(skateGames)
      .where(eq(skateGames.gameCode, code.toUpperCase()))
      .limit(1);

    if (!game.length) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    // Verify user is participant but not the setter
    const participant = await db
      .select()
      .from(gameParticipants)
      .where(and(eq(gameParticipants.gameId, game[0].id), eq(gameParticipants.userId, userId)))
      .limit(1);

    if (!participant.length) {
      return res.status(403).json({ success: false, error: "You're not in this game" });
    }

    if (participant[0].isEliminated) {
      return res.status(400).json({ success: false, error: "You've been eliminated" });
    }

    // Record response
    const [response] = await db
      .insert(turnResponses)
      .values({
        turnId,
        userId,
        landed,
        videoUrl,
        judgedAt: new Date(),
      })
      .returning();

    // If didn't land, add a letter
    if (!landed) {
      const letters = "SKATE";
      const currentLetters = participant[0].letters || "";
      const newLetters = currentLetters + letters[currentLetters.length];

      const isEliminated = newLetters === "SKATE";

      await db
        .update(gameParticipants)
        .set({
          letters: newLetters,
          isEliminated,
          finalPosition: isEliminated
            ? (
                await db
                  .select()
                  .from(gameParticipants)
                  .where(
                    and(eq(gameParticipants.gameId, game[0].id), eq(gameParticipants.isEliminated, true))
                  )
              ).length + 1
            : null,
        })
        .where(eq(gameParticipants.id, participant[0].id));
    }

    // Check if round is complete (all non-eliminated players responded)
    const activePlayers = await db
      .select()
      .from(gameParticipants)
      .where(
        and(
          eq(gameParticipants.gameId, game[0].id),
          eq(gameParticipants.isEliminated, false),
          ne(gameParticipants.userId, game[0].currentSetterId!)
        )
      );

    const responses = await db
      .select()
      .from(turnResponses)
      .where(eq(turnResponses.turnId, turnId));

    if (responses.length >= activePlayers.length) {
      // Round complete - move to next round or end game
      await db.update(gameTurns).set({ status: "completed" }).where(eq(gameTurns.id, turnId));

      // Check if only one player remaining
      const remainingPlayers = await db
        .select()
        .from(gameParticipants)
        .where(and(eq(gameParticipants.gameId, game[0].id), eq(gameParticipants.isEliminated, false)));

      if (remainingPlayers.length === 1) {
        // Game over - we have a winner!
        const winnerId = remainingPlayers[0].userId;

        await db
          .update(skateGames)
          .set({
            status: "completed",
            winnerId,
            completedAt: new Date(),
          })
          .where(eq(skateGames.id, game[0].id));

        // Award points to winner
        await db
          .update(users)
          .set({
            gamesWon: sql`${users.gamesWon} + 1`,
            gamesPlayed: sql`${users.gamesPlayed} + 1`,
            totalPoints: sql`${users.totalPoints} + 50`,
          })
          .where(eq(users.id, winnerId));

        // Update other players' games played
        await db
          .update(users)
          .set({ gamesPlayed: sql`${users.gamesPlayed} + 1` })
          .where(
            sql`${users.id} IN (
              SELECT user_id FROM game_participants 
              WHERE game_id = ${game[0].id} AND user_id != ${winnerId}
            )`
          );

        return res.json({
          success: true,
          data: response,
          gameOver: true,
          winnerId,
        });
      }

      // Next round - rotate setter
      const currentSetterIndex = remainingPlayers.findIndex(
        (p) => p.userId === game[0].currentSetterId
      );
      const nextSetterIndex = (currentSetterIndex + 1) % remainingPlayers.length;
      const nextSetterId = remainingPlayers[nextSetterIndex].userId;

      await db
        .update(skateGames)
        .set({
          currentRound: sql`${skateGames.currentRound} + 1`,
          currentSetterId: nextSetterId,
        })
        .where(eq(skateGames.id, game[0].id));

      // Create new turn
      await db.insert(gameTurns).values({
        gameId: game[0].id,
        roundNumber: (game[0].currentRound || 1) + 1,
        setterId: nextSetterId,
        status: "setting",
      });
    }

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error responding to trick:", error);
    res.status(500).json({ success: false, error: "Failed to respond" });
  }
});

// ============================================================================
// GET /api/games/:code/turns - Get all turns for a game
// ============================================================================
router.get("/:code/turns", async (req, res) => {
  try {
    const { code } = req.params;

    const game = await db
      .select()
      .from(skateGames)
      .where(eq(skateGames.gameCode, code.toUpperCase()))
      .limit(1);

    if (!game.length) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    const turns = await db
      .select({
        turn: gameTurns,
        setter: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
        },
      })
      .from(gameTurns)
      .innerJoin(users, eq(gameTurns.setterId, users.id))
      .where(eq(gameTurns.gameId, game[0].id))
      .orderBy(gameTurns.roundNumber);

    // Get responses for each turn
    const turnsWithResponses = await Promise.all(
      turns.map(async (t) => {
        const responses = await db
          .select({
            response: turnResponses,
            user: {
              id: users.id,
              username: users.username,
              displayName: users.displayName,
            },
          })
          .from(turnResponses)
          .innerJoin(users, eq(turnResponses.userId, users.id))
          .where(eq(turnResponses.turnId, t.turn.id));

        return {
          ...t.turn,
          setter: t.setter,
          responses: responses.map((r) => ({
            ...r.response,
            user: r.user,
          })),
        };
      })
    );

    res.json({ success: true, data: turnsWithResponses });
  } catch (error) {
    console.error("Error fetching turns:", error);
    res.status(500).json({ success: false, error: "Failed to fetch turns" });
  }
});

// ============================================================================
// GET /api/games/user/history - Get user's game history
// ============================================================================
router.get("/user/history", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { limit = 20, offset = 0 } = req.query;

    const userGames = await db
      .select({
        game: skateGames,
        participant: gameParticipants,
      })
      .from(gameParticipants)
      .innerJoin(skateGames, eq(gameParticipants.gameId, skateGames.id))
      .where(eq(gameParticipants.userId, userId))
      .orderBy(desc(skateGames.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: userGames.map((g) => ({
        ...g.game,
        userResult: {
          letters: g.participant.letters,
          isEliminated: g.participant.isEliminated,
          finalPosition: g.participant.finalPosition,
          won: g.game.winnerId === userId,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching game history:", error);
    res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

export default router;
