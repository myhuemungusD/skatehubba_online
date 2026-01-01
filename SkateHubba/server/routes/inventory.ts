import { Router } from "express";
import { db } from "../db";
import { userInventory, products } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { EquipItemRequest, InventoryFilters } from "../../shared/types";

const router = Router();

// ============================================================================
// GET /api/inventory - Get user's inventory (closet)
// ============================================================================
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { itemType, rarity, equipped } = req.query as unknown as InventoryFilters;

    let conditions: any[] = [eq(userInventory.userId, userId)];

    if (itemType) {
      conditions.push(eq(userInventory.itemType, itemType));
    }
    if (rarity) {
      conditions.push(eq(userInventory.rarity, rarity));
    }
    if (equipped !== undefined) {
      conditions.push(eq(userInventory.equipped, equipped === true));
    }

    const items = await db
      .select()
      .from(userInventory)
      .leftJoin(products, eq(userInventory.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(userInventory.acquiredAt));

    const formattedItems = items.map((item) => ({
      ...item.user_inventory,
      product: item.products,
    }));

    res.json({ success: true, data: formattedItems });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ success: false, error: "Failed to fetch inventory" });
  }
});

// ============================================================================
// GET /api/inventory/equipped - Get currently equipped items
// ============================================================================
router.get("/equipped", async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const equippedItems = await db
      .select()
      .from(userInventory)
      .leftJoin(products, eq(userInventory.productId, products.id))
      .where(and(eq(userInventory.userId, userId), eq(userInventory.equipped, true)));

    // Format as a map of slot -> item
    const equipped: Record<string, any> = {};
    equippedItems.forEach((item) => {
      if (item.user_inventory.equippedSlot) {
        equipped[item.user_inventory.equippedSlot] = {
          ...item.user_inventory,
          product: item.products,
        };
      }
    });

    res.json({ success: true, data: equipped });
  } catch (error) {
    console.error("Error fetching equipped items:", error);
    res.status(500).json({ success: false, error: "Failed to fetch equipped items" });
  }
});

// ============================================================================
// POST /api/inventory/:id/equip - Equip or unequip an item
// ============================================================================
router.post("/:id/equip", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const itemId = Number(req.params.id);
    const { slot }: EquipItemRequest = req.body;

    // Verify item belongs to user
    const item = await db
      .select()
      .from(userInventory)
      .where(and(eq(userInventory.id, itemId), eq(userInventory.userId, userId)))
      .limit(1);

    if (!item.length) {
      return res.status(404).json({ success: false, error: "Item not found in your inventory" });
    }

    // If unequipping (slot is null)
    if (slot === null) {
      await db
        .update(userInventory)
        .set({ equipped: false, equippedSlot: null })
        .where(eq(userInventory.id, itemId));

      return res.json({ success: true, message: "Item unequipped" });
    }

    // Unequip any item currently in that slot
    await db
      .update(userInventory)
      .set({ equipped: false, equippedSlot: null })
      .where(and(eq(userInventory.userId, userId), eq(userInventory.equippedSlot, slot)));

    // Equip the new item
    const [updatedItem] = await db
      .update(userInventory)
      .set({ equipped: true, equippedSlot: slot })
      .where(eq(userInventory.id, itemId))
      .returning();

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("Error equipping item:", error);
    res.status(500).json({ success: false, error: "Failed to equip item" });
  }
});

// ============================================================================
// GET /api/inventory/:id - Get single inventory item
// ============================================================================
router.get("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const itemId = Number(req.params.id);

    const item = await db
      .select()
      .from(userInventory)
      .leftJoin(products, eq(userInventory.productId, products.id))
      .where(and(eq(userInventory.id, itemId), eq(userInventory.userId, userId)))
      .limit(1);

    if (!item.length) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    res.json({
      success: true,
      data: {
        ...item[0].user_inventory,
        product: item[0].products,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ success: false, error: "Failed to fetch item" });
  }
});

// ============================================================================
// GET /api/inventory/stats - Get inventory statistics
// ============================================================================
router.get("/meta/stats", async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const items = await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId));

    const stats = {
      totalItems: items.length,
      equippedCount: items.filter((i) => i.equipped).length,
      byRarity: items.reduce((acc, item) => {
        const rarity = item.rarity || "common";
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: items.reduce((acc, item) => {
        acc[item.itemType] = (acc[item.itemType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

export default router;