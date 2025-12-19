import { Router, Request, Response } from "express";
import { redisClient, sendOrderbook } from "../index";
import { db } from "../db";
import { transactions, users } from "../schema";
import { eq, sql } from "drizzle-orm";
import auth from "../middleware/jwt";
import { chart } from "../memory";
import { z } from "zod";

const router = Router();

const makeOrderSchema = z.object({
  side: z.enum(["bid", "ask"]),
  price: z
    .number()
    .refine(
      (val) => Number.isFinite(val) && Math.round(val * 100) === val * 100,
      { message: "Must have at most 2 decimal places" }
    ),
  market: z.boolean().default(false),
  quantity: z.int().positive(),
});

// Place a limit order
router.post("/makeorder", auth, async (req: Request, res: Response) => {
  const { side, price, quantity, market } = await makeOrderSchema.parseAsync(
    req.body
  );

  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.email, req.body.email));
  const userData = userRow[0];
  const userId = userData.id;

  // if market then set price to market price

  // check for enough balance
  if (side == "bid") {
    if (!userData || Number(userData.cash) < price * quantity) {
      res.json({
        ok: false,
        msg: `Not enough cash.`,
      });
      return;
    }
  } else {
    if (!userData || Number(userData.stock) < quantity) {
      res.json({
        ok: false,
        msg: `Not enough quantity.`,
      });
      return;
    }
  }

  // settle order and return remainQuantity which is not settled
  const remainingQty = await fillOrders(side, price, quantity, userId);
  if (remainingQty === 0) {
    res.json({
      ok: true,
      msg: `All quantity of ${quantity} is filled.`,
    });
    sendOrderbook();
    return;
  }

  // Add remaining order to Redis orderbook
  const order = { userId, price, quantity: remainingQty };
  const key = side === "bid" ? "bids" : "asks";
  await redisClient.rPush(key, JSON.stringify(order));

  sendOrderbook();
  res.json({
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
  userId: number
): Promise<number> {
  let remainingQuantity = quantity;
  if (side === "bid") {
    // Match against asks
    let asks = (await redisClient.lRange("asks", 0, -1)).map((a: any) =>
      JSON.parse(a)
    );
    for (let i = asks.length - 1; i >= 0; i--) {
      if (asks[i].userId === userId) continue;
      if (asks[i].price <= price) {
        if (asks[i].quantity > remainingQuantity) {
          asks[i].quantity -= remainingQuantity;
          flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
          // Update ask in Redis
          await redisClient.lSet("asks", i, JSON.stringify(asks[i]));
          return 0;
        } else {
          remainingQuantity -= asks[i].quantity;
          flipBalance(asks[i].userId, userId, asks[i].quantity, asks[i].price);
          // Remove ask from Redis
          await redisClient.lRem("asks", 1, JSON.stringify(asks[i]));
        }
      }
    }
  } else {
    // Match against bids
    let bids = (await redisClient.lRange("bids", 0, -1)).map((b: any) =>
      JSON.parse(b)
    );
    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].userId === userId) continue;
      if (bids[i].price >= price) {
        if (bids[i].quantity > remainingQuantity) {
          bids[i].quantity -= remainingQuantity;
          flipBalance(userId, bids[i].userId, remainingQuantity, bids[i].price);
          // Update bid in Redis
          await redisClient.lSet("bids", i, JSON.stringify(bids[i]));
          return 0;
        } else {
          remainingQuantity -= bids[i].quantity;
          flipBalance(userId, bids[i].userId, bids[i].quantity, bids[i].price);
          // Remove bid from Redis
          await redisClient.lRem("bids", 1, JSON.stringify(bids[i]));
        }
      }
    }
  }
  return remainingQuantity;
}

async function flipBalance(
  userId1: number,
  userId2: number,
  quantity: number,
  price: number
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

router.get("/chart", async (req: Request, res: Response) => {
  res.json(
    chart.slice(-720).map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
  ); // last 12 hours
});

router.get("/depth", async (req: Request, res: Response) => {
  try {
    const asks = await redisClient.lRange("asks", 0, -1);
    const bids = await redisClient.lRange("bids", 0, -1);
    res.json({
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
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch orderbook from Redis" });
  }
});

export default router;
