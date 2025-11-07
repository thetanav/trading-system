import { Router, Request, Response } from "express";
import { UserOrder } from "../types";
import { redisClient, sendOrderbook } from "../index";
import { db } from "../db";
import { transactions, users } from "../schema";
import { eq, sql } from "drizzle-orm";
import auth from "../middlware/jwt";
import { chart } from "../memory";

const router = Router();

router.get("/echo", auth, (req: Request, res: Response) => {
  res.json({
    ok: true,
    msg: "echo success",
  });
});

// Place a limit order
router.post("/makeorder", auth, async (req: Request, res: Response) => {
  const { side, price, quantity }: UserOrder = req.body;
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.email, req.body.email));
  const userData = userRow[0];
  const userId = userData.id;

  // check for enough balance
  if (side == "bid") {
    if (!userData || Number(userData.cash) < price * quantity) {
      res.json({
        ok: false,
        msg: `⚠️ Not enough cash.`,
      });
      return;
    }
  } else {
    if (!userData || Number(userData.stock) < quantity) {
      res.json({
        ok: false,
        msg: `⚠️ Not enough quantity.`,
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
  const key = side === "bid" ? "orderbook:bids" : "orderbook:asks";
  await redisClient.rPush(key, JSON.stringify(order));

  sendOrderbook();
  res.json({
    ok: true,
    msg: `${
      quantity - remainingQty
    } filled. ${remainingQty} placed in orderbook.`,
  });
});

// it is just an orderbook (deprecated, use /orderbook endpoint instead)
router.get("/depth", async (req: Request, res: Response) => {
  const asks = await redisClient.lRange("orderbook:asks", 0, -1);
  const bids = await redisClient.lRange("orderbook:bids", 0, -1);
  res.json({
    orderbook: {
      asks: asks.map((a: any) => JSON.parse(a)),
      bids: bids.map((b: any) => JSON.parse(b)),
    },
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
    let asks = (await redisClient.lRange("orderbook:asks", 0, -1)).map(
      (a: any) => JSON.parse(a)
    );
    for (let i = asks.length - 1; i >= 0; i--) {
      if (asks[i].userId === userId) continue;
      if (asks[i].price <= price) {
        if (asks[i].quantity > remainingQuantity) {
          asks[i].quantity -= remainingQuantity;
          flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
          // Update ask in Redis
          await redisClient.lSet("orderbook:asks", i, JSON.stringify(asks[i]));
          return 0;
        } else {
          remainingQuantity -= asks[i].quantity;
          flipBalance(asks[i].userId, userId, asks[i].quantity, asks[i].price);
          // Remove ask from Redis
          await redisClient.lRem("orderbook:asks", 1, JSON.stringify(asks[i]));
        }
      }
    }
  } else {
    // Match against bids
    let bids = (await redisClient.lRange("orderbook:bids", 0, -1)).map(
      (b: any) => JSON.parse(b)
    );
    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].userId === userId) continue;
      if (bids[i].price >= price) {
        if (bids[i].quantity > remainingQuantity) {
          bids[i].quantity -= remainingQuantity;
          flipBalance(userId, bids[i].userId, remainingQuantity, bids[i].price);
          // Update bid in Redis
          await redisClient.lSet("orderbook:bids", i, JSON.stringify(bids[i]));
          return 0;
        } else {
          remainingQuantity -= bids[i].quantity;
          flipBalance(userId, bids[i].userId, bids[i].quantity, bids[i].price);
          // Remove bid from Redis
          await redisClient.lRem("orderbook:bids", 1, JSON.stringify(bids[i]));
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
    //@ts-ignore
    user_id: userId1.toString(),
    type: "sell",
    quantity,
    price,
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
    //@ts-ignore
    userIsd: userId2.toString(),
    type: "buy",
    quantity,
    price,
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

router.get("/orderbook", async (req: Request, res: Response) => {
  try {
    const asks = await redisClient.lRange("orderbook:asks", 0, -1);
    const bids = await redisClient.lRange("orderbook:bids", 0, -1);
    res.json({
      ok: true,
      data: {
        asks: asks.map((a) => JSON.parse(a)),
        bids: bids.map((b) => JSON.parse(b)),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch orderbook from Redis" });
  }
});

export default router;
