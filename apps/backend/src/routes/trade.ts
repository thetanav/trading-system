import { Hono } from "hono";
import { redisClient, sendOrderbook } from "../index";
import { db } from "../db";
import { transactions, users } from "../schema";
import { eq, sql } from "drizzle-orm";
import auth from "../middleware/jwt";
import { chart } from "../memory";
import { z } from "zod";

const router = new Hono();

const makeOrderSchema = z.object({
  side: z.enum(["bid", "ask"]),
  price: z
    .number()
    .refine(
      (val) => Number.isFinite(val) && Math.round(val * 100) === val * 100,
      { message: "Must have at most 2 decimal places" },
    ),
  market: z.boolean().default(false),
  quantity: z.int().positive(),
});

// Place a limit order
router.post("/makeorder", auth, async (c) => {
  const { side, price, quantity, market } = await makeOrderSchema.parseAsync(
    await c.req.json(),
  );

  const jwt = (c as any).jwt;
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.email, jwt.email));
  const userData = userRow[0];
  const userId = userData.id;

  if (market) {
    if (side === "bid") {
      const asks = (await redisClient.lRange("asks", 0, -1)).map((a: any) =>
        JSON.parse(a),
      );
      if (asks.length === 0) {
        return c.json({
          ok: false,
          msg: `No asks available for market order.`,
        });
      }
      const minAskPrice = Math.min(...asks.map((a) => a.price));
      if (!userData || Number(userData.cash) < minAskPrice * quantity) {
        return c.json({
          ok: false,
          msg: `Not enough cash for market order.`,
        });
      }
    } else {
      const bids = (await redisClient.lRange("bids", 0, -1)).map((b: any) =>
        JSON.parse(b),
      );
      if (bids.length === 0) {
        return c.json({
          ok: false,
          msg: `No bids available for market order.`,
        });
      }
      const maxBidPrice = Math.max(...bids.map((b) => b.price));
      if (!userData || Number(userData.stock) < quantity) {
        return c.json({
          ok: false,
          msg: `Not enough quantity for market order.`,
        });
      }
    }
  } else {
    if (side == "bid") {
      if (!userData || Number(userData.cash) < price * quantity) {
        return c.json({
          ok: false,
          msg: `Not enough cash.`,
        });
      }
    } else {
      if (!userData || Number(userData.stock) < quantity) {
        return c.json({
          ok: false,
          msg: `Not enough quantity.`,
        });
      }
    }
  }

  const remainingQty = await fillOrders(side, price, quantity, userId, market);
  if (remainingQty === 0) {
    return c.json({
      ok: true,
      msg: `All quantity of ${quantity} is filled.`,
    });
  }

  if (market) {
    return c.json({
      ok: false,
      msg: `Market order partially filled. ${quantity - remainingQty} filled.`,
    });
  }

  const orderId = `${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`;
  const order = { orderId, userId, price, quantity: remainingQty };
  const key = side === "bid" ? "bids" : "asks";
  await redisClient.rPush(key, JSON.stringify(order));

  sendOrderbook();
  return c.json({
    ok: true,
    msg: `${
      quantity - remainingQty
    } filled. ${remainingQty} placed in orderbook.`,
  });
});

async function fillOrders(
  side: string,
  price: number,
  quantity: number,
  userId: number,
  market: boolean = false,
): Promise<number> {
  let remainingQuantity = quantity;
  if (side === "bid") {
    let asks = (await redisClient.lRange("asks", 0, -1)).map((a: any) =>
      JSON.parse(a),
    );
    const minAskPrice =
      asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : 0;

    for (let i = asks.length - 1; i >= 0; i--) {
      if (asks[i].userId === userId) continue;
      const shouldMatch = market ? true : asks[i].price <= price;
      if (shouldMatch) {
        if (asks[i].quantity > remainingQuantity) {
          asks[i].quantity -= remainingQuantity;
          flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
          await redisClient.lSet("asks", i, JSON.stringify(asks[i]));
          return 0;
        } else {
          remainingQuantity -= asks[i].quantity;
          flipBalance(asks[i].userId, userId, asks[i].quantity, asks[i].price);
          await redisClient.lRem("asks", 1, JSON.stringify(asks[i]));
        }
      }
    }
    return remainingQuantity;
  } else {
    let bids = (await redisClient.lRange("bids", 0, -1)).map((b: any) =>
      JSON.parse(b),
    );
    const maxBidPrice =
      bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : 0;

    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].userId === userId) continue;
      const shouldMatch = market ? true : bids[i].price >= price;
      if (shouldMatch) {
        if (bids[i].quantity > remainingQuantity) {
          bids[i].quantity -= remainingQuantity;
          flipBalance(userId, bids[i].userId, remainingQuantity, bids[i].price);
          await redisClient.lSet("bids", i, JSON.stringify(bids[i]));
          return 0;
        } else {
          remainingQuantity -= bids[i].quantity;
          flipBalance(userId, bids[i].userId, bids[i].quantity, bids[i].price);
          await redisClient.lRem("bids", 1, JSON.stringify(bids[i]));
        }
      }
    }
    return remainingQuantity;
  }
}

async function flipBalance(
  userId1: number,
  userId2: number,
  quantity: number,
  price: number,
) {
  // Atomically update user1 (seller): decrease stock, increase cash
  await db
    .update(users)
    .set({
      stock: sql`${users.stock} - ${quantity}`,
      cash: sql`${users.cash} + ${quantity * price}`,
    })
    .where(eq(users.id, Number(userId1)));
  // Make record in transaction history
  await db.insert(transactions).values({
    user_id: Number(userId1),
    type: "sell",
    quantity: quantity.toString(),
    price: price.toString(),
  });

  // Atomically update user2 (buyer): increase stock, decrease cash
  await db
    .update(users)
    .set({
      stock: sql`${users.stock} + ${quantity}`,
      cash: sql`${users.cash} - ${quantity * price}`,
    })
    .where(eq(users.id, Number(userId2)));
  // Make record in transaction history
  await db.insert(transactions).values({
    user_id: Number(userId2),
    type: "buy",
    quantity: quantity.toString(),
    price: price.toString(),
  });
}

router.get("/chart", async (c) => {
  return c.json(
    chart.slice(-720).map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })),
  ); // last 12 hours
});

router.get("/depth", async (c) => {
  try {
    const asks = await redisClient.lRange("asks", 0, -1);
    const bids = await redisClient.lRange("bids", 0, -1);
    return c.json({
      ok: true,
      data: {
        asks: asks.map((a) => {
          const parsed = JSON.parse(a);
          return { price: parsed.price, quantity: parsed.quantity };
        }),
        bids: bids.map((b) => {
          const parsed = JSON.parse(b);
          return { price: parsed.price, quantity: parsed.quantity };
        }),
      },
    });
  } catch (err) {
    return c.json(
      { ok: false, error: "Failed to fetch orderbook from Redis" },
      500,
    );
  }
});

router.get("/myorders", auth, async (c) => {
  const jwt = (c as any).jwt;
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.email, jwt.email));
  const userId = userRow[0].id;

  try {
    const asks = (await redisClient.lRange("asks", 0, -1))
      .map((a) => JSON.parse(a))
      .filter((a) => a.userId === userId);
    const bids = (await redisClient.lRange("bids", 0, -1))
      .map((b) => JSON.parse(b))
      .filter((b) => b.userId === userId);

    return c.json({
      ok: true,
      data: {
        asks: asks.map((a) => ({
          orderId: a.orderId,
          price: a.price,
          quantity: a.quantity,
        })),
        bids: bids.map((b) => ({
          orderId: b.orderId,
          price: b.price,
          quantity: b.quantity,
        })),
      },
    });
  } catch (err) {
    return c.json({ ok: false, error: "Failed to fetch orders" }, 500);
  }
});

router.post("/cancelorder", auth, async (c) => {
  const { orderId, side } = await c.req.json();
  const jwt = (c as any).jwt;
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.email, jwt.email));
  const userId = userRow[0].id;

  try {
    const key = side === "bid" ? "bids" : "asks";
    const orders = await redisClient.lRange(key, 0, -1);

    for (const order of orders) {
      const parsed = JSON.parse(order);
      if (parsed.orderId === orderId && parsed.userId === userId) {
        await redisClient.lRem(key, 1, order);
        sendOrderbook();
        return c.json({
          ok: true,
          msg: "Order cancelled successfully.",
        });
      }
    }

    return c.json({
      ok: false,
      msg: "Order not found or you don't have permission.",
    });
  } catch (err) {
    return c.json({ ok: false, error: "Failed to cancel order" }, 500);
  }
});

export default router;
