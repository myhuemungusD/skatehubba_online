import { pgTable, text, integer, boolean, timestamp, serial, real, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").unique(),
  email: text("email").unique().notNull(),
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  totalPoints: integer("total_points").default(0),
  checkInCount: integer("check_in_count").default(0),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  inventory: many(userInventory),
  orders: many(orders),
  checkIns: many(checkIns),
  gameParticipants: many(gameParticipants),
}));

// ============================================================================
// PRODUCTS (Shop)
// ============================================================================
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // cents
  originalPrice: integer("original_price"), // for sale items
  imageUrl: text("image_url"),
  category: text("category").notNull(), // 'decks', 'wheels', 'trucks', 'bearings', 'apparel', 'accessories'
  subcategory: text("subcategory"),
  brand: text("brand"),
  sku: text("sku").unique(),
  stock: integer("stock").default(0),
  isDigital: boolean("is_digital").default(false), // for digital collectibles
  metadata: jsonb("metadata"), // size variants, colors, etc.
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  inventoryItems: many(userInventory),
}));

// ============================================================================
// ORDERS (Commerce)
// ============================================================================
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  status: text("status").default("pending"), // 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  subtotal: integer("subtotal").notNull(), // cents
  tax: integer("tax").default(0),
  shipping: integer("shipping").default(0),
  total: integer("total").notNull(), // cents
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(), // cents
  metadata: jsonb("metadata"), // size, color selected
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ============================================================================
// USER INVENTORY (Closet)
// ============================================================================
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  itemType: text("item_type").notNull(), // 'product', 'collectible', 'reward'
  itemName: text("item_name").notNull(),
  itemDescription: text("item_description"),
  itemImageUrl: text("item_image_url"),
  rarity: text("rarity"), // 'common', 'uncommon', 'rare', 'epic', 'legendary'
  equipped: boolean("equipped").default(false),
  equippedSlot: text("equipped_slot"), // 'deck', 'wheels', 'trucks', 'avatar'
  earnedFrom: text("earned_from"), // 'purchase', 'check_in', 'skate_game', 'achievement'
  metadata: jsonb("metadata"),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(users, {
    fields: [userInventory.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userInventory.productId],
    references: [products.id],
  }),
}));

// ============================================================================
// SPOTS (Map)
// ============================================================================
export const spots = pgTable("spots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  spotType: text("spot_type"), // 'park', 'street', 'diy', 'plaza', 'indoor'
  difficulty: text("difficulty"), // 'beginner', 'intermediate', 'advanced', 'pro'
  features: jsonb("features"), // ['rail', 'stairs', 'ledge', 'bowl', 'halfpipe']
  imageUrls: jsonb("image_urls"),
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  totalCheckIns: integer("total_check_ins").default(0),
  rating: real("rating"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spotsRelations = relations(spots, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [spots.createdById],
    references: [users.id],
  }),
  checkIns: many(checkIns),
}));

// ============================================================================
// CHECK-INS
// ============================================================================
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  spotId: integer("spot_id").references(() => spots.id).notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  photoUrl: text("photo_url"),
  trickLanded: text("trick_landed"),
  notes: text("notes"),
  verified: boolean("verified").default(false),
  pointsEarned: integer("points_earned").default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
  spot: one(spots, {
    fields: [checkIns.spotId],
    references: [spots.id],
  }),
}));

// ============================================================================
// S.K.A.T.E. GAMES
// ============================================================================
export const skateGames = pgTable("skate_games", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").unique().notNull(),
  status: text("status").default("waiting"), // 'waiting', 'active', 'completed'
  currentRound: integer("current_round").default(1),
  currentSetterId: integer("current_setter_id").references(() => users.id),
  winnerId: integer("winner_id").references(() => users.id),
  maxPlayers: integer("max_players").default(2),
  isPublic: boolean("is_public").default(true),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skateGamesRelations = relations(skateGames, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [skateGames.createdById],
    references: [users.id],
  }),
  currentSetter: one(users, {
    fields: [skateGames.currentSetterId],
    references: [users.id],
  }),
  winner: one(users, {
    fields: [skateGames.winnerId],
    references: [users.id],
  }),
  participants: many(gameParticipants),
  turns: many(gameTurns),
}));

export const gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => skateGames.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  letters: text("letters").default(""), // 'S', 'SK', 'SKA', 'SKAT', 'SKATE'
  isEliminated: boolean("is_eliminated").default(false),
  finalPosition: integer("final_position"), // 1st, 2nd, etc
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(skateGames, {
    fields: [gameParticipants.gameId],
    references: [skateGames.id],
  }),
  user: one(users, {
    fields: [gameParticipants.userId],
    references: [users.id],
  }),
}));

export const gameTurns = pgTable("game_turns", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => skateGames.id).notNull(),
  roundNumber: integer("round_number").notNull(),
  setterId: integer("setter_id").references(() => users.id).notNull(),
  trickName: text("trick_name"),
  trickVideoUrl: text("trick_video_url"),
  status: text("status").default("setting"), // 'setting', 'responding', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameTurnsRelations = relations(gameTurns, ({ one, many }) => ({
  game: one(skateGames, {
    fields: [gameTurns.gameId],
    references: [skateGames.id],
  }),
  setter: one(users, {
    fields: [gameTurns.setterId],
    references: [users.id],
  }),
  responses: many(turnResponses),
}));

export const turnResponses = pgTable("turn_responses", {
  id: serial("id").primaryKey(),
  turnId: integer("turn_id").references(() => gameTurns.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoUrl: text("video_url"),
  landed: boolean("landed"),
  judgedAt: timestamp("judged_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const turnResponsesRelations = relations(turnResponses, ({ one }) => ({
  turn: one(gameTurns, {
    fields: [turnResponses.turnId],
    references: [gameTurns.id],
  }),
  user: one(users, {
    fields: [turnResponses.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// LEADERBOARD (cached/aggregated data)
// ============================================================================
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  leaderboardType: text("leaderboard_type").notNull(), // 'global', 'weekly', 'monthly', 'spot'
  spotId: integer("spot_id").references(() => spots.id), // for spot-specific leaderboards
  totalPoints: integer("total_points").default(0),
  checkInPoints: integer("check_in_points").default(0),
  gamePoints: integer("game_points").default(0),
  achievementPoints: integer("achievement_points").default(0),
  rank: integer("rank"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id],
  }),
  spot: one(spots, {
    fields: [leaderboardEntries.spotId],
    references: [spots.id],
  }),
}));

// ============================================================================
// TUTORIAL PROGRESS (existing from feature map)
// ============================================================================
export const tutorialSteps = pgTable("tutorial_steps", {
  id: serial("id").primaryKey(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  category: text("category"), // 'basics', 'tricks', 'safety'
  createdAt: timestamp("created_at").defaultNow(),
});

export const tutorialProgress = pgTable("tutorial_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stepId: integer("step_id").references(() => tutorialSteps.id).notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// DONATIONS (existing from feature map)
// ============================================================================
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  displayName: text("display_name"),
  amount: integer("amount").notNull(), // cents
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// FEEDBACK (existing from feature map)
// ============================================================================
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  category: text("category"), // 'bug', 'feature', 'general'
  message: text("message").notNull(),
  status: text("status").default("new"), // 'new', 'reviewed', 'resolved'
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// EMAIL SUBSCRIBERS (existing from feature map)
// ============================================================================
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  source: text("source"), // 'landing', 'checkout', 'popup'
  subscribed: boolean("subscribed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// Users
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Products
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type Product = z.infer<typeof selectProductSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Orders
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export type Order = z.infer<typeof selectOrderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// User Inventory
export const insertUserInventorySchema = createInsertSchema(userInventory);
export const selectUserInventorySchema = createSelectSchema(userInventory);
export type UserInventoryItem = z.infer<typeof selectUserInventorySchema>;
export type InsertUserInventoryItem = z.infer<typeof insertUserInventorySchema>;

// Spots
export const insertSpotSchema = createInsertSchema(spots);
export const selectSpotSchema = createSelectSchema(spots);
export type Spot = z.infer<typeof selectSpotSchema>;
export type InsertSpot = z.infer<typeof insertSpotSchema>;

// Check-ins
export const insertCheckInSchema = createInsertSchema(checkIns);
export const selectCheckInSchema = createSelectSchema(checkIns);
export type CheckIn = z.infer<typeof selectCheckInSchema>;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

// SKATE Games
export const insertSkateGameSchema = createInsertSchema(skateGames);
export const selectSkateGameSchema = createSelectSchema(skateGames);
export type SkateGame = z.infer<typeof selectSkateGameSchema>;
export type InsertSkateGame = z.infer<typeof insertSkateGameSchema>;

// Game Participants
export const insertGameParticipantSchema = createInsertSchema(gameParticipants);
export const selectGameParticipantSchema = createSelectSchema(gameParticipants);
export type GameParticipant = z.infer<typeof selectGameParticipantSchema>;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;

// Leaderboard
export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries);
export const selectLeaderboardEntrySchema = createSelectSchema(leaderboardEntries);
export type LeaderboardEntry = z.infer<typeof selectLeaderboardEntrySchema>;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;

// Donations
export const insertDonationSchema = createInsertSchema(donations);
export const selectDonationSchema = createSelectSchema(donations);
export type Donation = z.infer<typeof selectDonationSchema>;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
