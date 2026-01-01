import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

// Route imports
import shopRoutes from "./routes/shop";
import inventoryRoutes from "./routes/inventory";
import spotsRoutes from "./routes/spots";
import gamesRoutes from "./routes/games";
import leaderboardRoutes from "./routes/leaderboard";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================
if (!getApps().length) {
  try {
    const adminKey = process.env.FIREBASE_ADMIN_KEY;
    if (adminKey) {
      const serviceAccount = JSON.parse(adminKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin initialized");
    } else {
      console.warn("FIREBASE_ADMIN_KEY not set - auth will be disabled");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["https://js.stripe.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? process.env.ALLOWED_ORIGINS?.split(",") || ["https://skatehubba.com"]
      : true,
    credentials: true,
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later" },
});
app.use("/api/", apiLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(
    pinoHttp({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    })
  );
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      // No auth header - proceed without user (public routes)
      return next();
    }

    const token = authHeader.split("Bearer ")[1];
    
    if (!token) {
      return next();
    }

    // Verify Firebase token
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach user info to request
      (req as any).firebaseUid = decodedToken.uid;
      (req as any).userEmail = decodedToken.email;
      
      // Get internal user ID from database
      const { db } = await import("./db");
      const { users } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, decodedToken.uid))
        .limit(1);
      
      if (user.length) {
        (req as any).userId = user[0].id;
      } else {
        // Auto-create user if doesn't exist
        const [newUser] = await db
          .insert(users)
          .values({
            firebaseUid: decodedToken.uid,
            email: decodedToken.email || "",
            displayName: decodedToken.name,
            avatarUrl: decodedToken.picture,
          })
          .returning({ id: users.id });
        
        (req as any).userId = newUser.id;
      }
    } catch (authError) {
      console.error("Token verification failed:", authError);
      // Continue without auth for public routes
    }
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next();
  }
};

// Apply auth middleware to all API routes
app.use("/api", authenticateUser);

// ============================================================================
// API ROUTES
// ============================================================================
app.use("/api/shop", shopRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/spots", spotsRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// ============================================================================
// USER ROUTES (inline for simplicity)
// ============================================================================
app.get("/api/user/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    res.json({ success: true, data: user[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

app.patch("/api/user/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    
    const { username, displayName, bio, avatarUrl } = req.body;
    
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db
      .update(users)
      .set({
        username: username || undefined,
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// ============================================================================
// SERVER START
// ============================================================================
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🛹 SkateHubba API server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   API: http://localhost:${PORT}/api`);
  });
}

export default app;
