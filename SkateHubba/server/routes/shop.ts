import { Router } from "express";
import { db } from "../db";
import { products, orders, orderItems, userInventory } from "../../shared/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import type { CartItem, CreateOrderRequest, ShopPaymentIntentRequest } from "../../shared/types";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

// ============================================================================
// GET /api/shop/products - List all products
// ============================================================================
router.get("/products", async (req, res) => {
  try {
    const { category, featured, limit = 50 } = req.query;

    let query = db.select().from(products).where(eq(products.active, true));

    if (category) {
      query = query.where(eq(products.category, category as string));
    }
    if (featured === "true") {
      query = query.where(eq(products.featured, true));
    }

    const items = await query.limit(Number(limit)).orderBy(desc(products.createdAt));

    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

// ============================================================================
// GET /api/shop/products/:id - Get single product
// ============================================================================
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);

    if (!product.length) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, data: product[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, error: "Failed to fetch product" });
  }
});

// ============================================================================
// POST /api/shop/payment-intent - Create payment intent for cart
// ============================================================================
router.post("/payment-intent", async (req, res) => {
  try {
    const { items, email }: ShopPaymentIntentRequest = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Fetch products and calculate total
    const productIds = items.map((item) => item.productId);
    const productsList = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds), eq(products.active, true)));

    const productMap = new Map(productsList.map((p) => [p.id, p]));

    let subtotal = 0;
    const lineItems: Array<{ product: typeof productsList[0]; quantity: number }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productId} not found or unavailable`,
        });
      }
      subtotal += product.price * item.quantity;
      lineItems.push({ product, quantity: item.quantity });
    }

    // Calculate tax and shipping (simplified)
    const tax = Math.round(subtotal * 0.08); // 8% tax
    const shipping = subtotal >= 10000 ? 0 : 999; // Free shipping over $100
    const total = subtotal + tax + shipping;

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
      metadata: {
        email,
        itemCount: items.length.toString(),
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        subtotal,
        tax,
        shipping,
        total,
      },
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ success: false, error: "Failed to create payment" });
  }
});

// ============================================================================
// POST /api/shop/orders - Create order after successful payment
// ============================================================================
router.post("/orders", async (req, res) => {
  try {
    const { items, email, shippingAddress, billingAddress }: CreateOrderRequest = req.body;
    const userId = (req as any).userId; // From auth middleware if available

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: "No items provided" });
    }

    // Fetch products and calculate total
    const productIds = items.map((item) => item.productId);
    const productsList = await db.select().from(products).where(inArray(products.id, productIds));

    const productMap = new Map(productsList.map((p) => [p.id, p]));

    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product) {
        subtotal += product.price * item.quantity;
      }
    }

    const tax = Math.round(subtotal * 0.08);
    const shipping = subtotal >= 10000 ? 0 : 999;
    const total = subtotal + tax + shipping;

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: `SH-${nanoid(10).toUpperCase()}`,
        userId: userId || null,
        email,
        status: "paid",
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress: shippingAddress as any,
        billingAddress: billingAddress as any,
      })
      .returning();

    // Create order items
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product?.price || 0,
        metadata: item.metadata as any,
      };
    });

    await db.insert(orderItems).values(orderItemsData);

    // Add digital items to user inventory
    if (userId) {
      const digitalItems = items.filter((item) => {
        const product = productMap.get(item.productId);
        return product?.isDigital;
      });

      if (digitalItems.length > 0) {
        const inventoryItems = digitalItems.map((item) => {
          const product = productMap.get(item.productId)!;
          return {
            userId,
            productId: item.productId,
            itemType: "product",
            itemName: product.name,
            itemDescription: product.description,
            itemImageUrl: product.imageUrl,
            earnedFrom: "purchase",
          };
        });

        await db.insert(userInventory).values(inventoryItems);
      }
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: "Failed to create order" });
  }
});

// ============================================================================
// GET /api/shop/orders - Get user's orders
// ============================================================================
router.get("/orders", async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    res.json({ success: true, data: userOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

// ============================================================================
// GET /api/shop/orders/:id - Get specific order
// ============================================================================
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const order = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);

    if (!order.length) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Verify ownership
    if (order[0].userId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Get order items with product details
    const items = await db
      .select()
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, Number(id)));

    res.json({
      success: true,
      data: {
        ...order[0],
        items: items.map((i) => ({
          ...i.order_items,
          product: i.products,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});

export default router;
