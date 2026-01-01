import { Router } from "express";
import { db } from "../db";
import { spots, checkIns, users } from "../../shared/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import type { CreateSpotRequest, CheckInRequest, SpotFilters } from "../../shared/types";

const router = Router();

// ============================================================================
// GET /api/spots - List all spots
// ============================================================================
router.get("/", async (req, res) => {
  try {
    const { spotType, difficulty, city, verified, nearLat, nearLng, radiusKm } =
      req.query as unknown as SpotFilters;

    let conditions: any[] = [eq(spots.active, true)];

    if (spotType) {
      conditions.push(eq(spots.spotType, spotType));
    }
    if (difficulty) {
      conditions.push(eq(spots.difficulty, difficulty));
    }
    if (city) {
      conditions.push(eq(spots.city, city));
    }
    if (verified === true) {
      conditions.push(eq(spots.verified, true));
    }

    let query = db.select().from(spots).where(and(...conditions));

    // If geo-search is requested, use Haversine formula approximation
    if (nearLat && nearLng && radiusKm) {
      const lat = Number(nearLat);
      const lng = Number(nearLng);
      const radius = Number(radiusKm);
      
      // Simple bounding box filter (approximate)
      const latDelta = radius / 111; // ~111km per degree
      const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      conditions.push(
        sql`${spots.latitude} BETWEEN ${lat - latDelta} AND ${lat + latDelta}`
      );
      conditions.push(
        sql`${spots.longitude} BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`
      );
      
      query = db.select().from(spots).where(and(...conditions));
    }

    const results = await query.orderBy(desc(spots.totalCheckIns)).limit(100);

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching spots:", error);
    res.status(500).json({ success: false, error: "Failed to fetch spots" });
  }
});

// ============================================================================
// GET /api/spots/:id - Get single spot with details
// ============================================================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const spot = await db.select().from(spots).where(eq(spots.id, Number(id))).limit(1);

    if (!spot.length) {
      return res.status(404).json({ success: false, error: "Spot not found" });
    }

    // Get recent check-ins for this spot
    const recentCheckIns = await db
      .select({
        checkIn: checkIns,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .where(eq(checkIns.spotId, Number(id)))
      .orderBy(desc(checkIns.createdAt))
      .limit(20);

    res.json({
      success: true,
      data: {
        ...spot[0],
        recentCheckIns: recentCheckIns.map((c) => ({
          ...c.checkIn,
          user: c.user,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching spot:", error);
    res.status(500).json({ success: false, error: "Failed to fetch spot" });
  }
});

// ============================================================================
// POST /api/spots - Create a new spot
// ============================================================================
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const spotData: CreateSpotRequest = req.body;

    const [newSpot] = await db
      .insert(spots)
      .values({
        name: spotData.name,
        description: spotData.description,
        latitude: spotData.latitude,
        longitude: spotData.longitude,
        address: spotData.address,
        city: spotData.city,
        state: spotData.state,
        country: spotData.country,
        spotType: spotData.spotType,
        difficulty: spotData.difficulty,
        features: spotData.features as any,
        createdById: userId,
        verified: false, // New spots start unverified
      })
      .returning();

    res.status(201).json({ success: true, data: newSpot });
  } catch (error) {
    console.error("Error creating spot:", error);
    res.status(500).json({ success: false, error: "Failed to create spot" });
  }
});

// ============================================================================
// POST /api/spots/:id/check-in - Check in at a spot
// ============================================================================
router.post("/:id/check-in", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const spotId = Number(req.params.id);
    const checkInData: CheckInRequest = req.body;

    // Verify spot exists
    const spot = await db.select().from(spots).where(eq(spots.id, spotId)).limit(1);
    if (!spot.length) {
      return res.status(404).json({ success: false, error: "Spot not found" });
    }

    // Calculate points (bonus for trick, photo, etc.)
    let points = 10; // Base points
    if (checkInData.trickLanded) points += 5;
    if (checkInData.photoUrl) points += 5;

    // Create check-in
    const [newCheckIn] = await db
      .insert(checkIns)
      .values({
        userId,
        spotId,
        latitude: checkInData.latitude,
        longitude: checkInData.longitude,
        photoUrl: checkInData.photoUrl,
        trickLanded: checkInData.trickLanded,
        notes: checkInData.notes,
        pointsEarned: points,
      })
      .returning();

    // Update spot check-in count
    await db
      .update(spots)
      .set({ totalCheckIns: sql`${spots.totalCheckIns} + 1` })
      .where(eq(spots.id, spotId));

    // Update user stats
    await db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${points}`,
        checkInCount: sql`${users.checkInCount} + 1`,
      })
      .where(eq(users.id, userId));

    res.status(201).json({ success: true, data: newCheckIn, pointsEarned: points });
  } catch (error) {
    console.error("Error checking in:", error);
    res.status(500).json({ success: false, error: "Failed to check in" });
  }
});

// ============================================================================
// GET /api/spots/:id/check-ins - Get check-ins for a spot
// ============================================================================
router.get("/:id/check-ins", async (req, res) => {
  try {
    const spotId = Number(req.params.id);
    const { limit = 50, offset = 0 } = req.query;

    const spotCheckIns = await db
      .select({
        checkIn: checkIns,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .where(eq(checkIns.spotId, spotId))
      .orderBy(desc(checkIns.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: spotCheckIns.map((c) => ({
        ...c.checkIn,
        user: c.user,
      })),
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ success: false, error: "Failed to fetch check-ins" });
  }
});

// ============================================================================
// GET /api/spots/cities - Get list of cities with spots
// ============================================================================
router.get("/meta/cities", async (req, res) => {
  try {
    const cities = await db
      .selectDistinct({ city: spots.city, state: spots.state, country: spots.country })
      .from(spots)
      .where(and(eq(spots.active, true), sql`${spots.city} IS NOT NULL`))
      .orderBy(asc(spots.city));

    res.json({ success: true, data: cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ success: false, error: "Failed to fetch cities" });
  }
});

export default router;