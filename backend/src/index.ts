import http from "http";
import cors from "cors";
import WebSocket from "ws";
import dotenv from "dotenv";
import path from "path";
import { createClient } from "redis";
import authRoutes from "./routes/auth";
import tradeRoutes from "./routes/trade";
import express, { Request, Response } from "express";
import { db } from "./db";
import { transactions, users } from "./schema";
import { eq } from "drizzle-orm";
import auth from "./middlware/jwt";
import { Chart } from "./types";

dotenv.config();
dotenv.config();
export const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// API Routes
app.use("/trade", tradeRoutes);
app.use("/auth", authRoutes);

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err: unknown) => {
    console.error("Redis connection error:", err);
  });

app.get("/users", async (req: Request, res: Response) => {
  const data = await db.select().from(users);
  res.json(data);
});

app.get("/user/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));
  const user = row[0];
  res.json(user);
});

app.get("/me", auth, async (req: Request, res: Response) => {
  const { email } = req.body;
  const row = await db.select().from(users).where(eq(users.email, email));
  const user = row[0];
  res.json(user);
});

app.get("/transactions", auth, async (req: Request, res: Response) => {
  const { email } = req.body;
  const row = await db.select().from(users).where(eq(users.email, email));
  const user = row[0];
  const data = await db
    .select()
    .from(transactions)
    .where(eq(transactions.user_id, user.id));
  res.json(data);
});

// make a good ui
const chart: Chart[] = [
  { price: 100, timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  { price: 102, timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000) },
  { price: 101, timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) },
  { price: 103, timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000) },
  { price: 105, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  { price: 104, timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000) },
  { price: 106, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { price: 108, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { price: 107, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { price: 109, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { price: 110, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { price: 111, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
];

async function updateChart() {
  try {
    const asks = await redisClient.lRange("orderbook:asks", 0, -1);
    const bids = await redisClient.lRange("orderbook:bids", 0, -1);
    if (asks.length !== 0 && bids.length !== 0) {
      const bestAsk = JSON.parse(asks[0]);
      const bestBid = JSON.parse(bids[0]);
      const price = (bestAsk.price + bestBid.price) / 2;
      chart.push({ price, timestamp: new Date() });
      console.log("> added to chart");
    }
  } catch (err) {
    console.error("Failed to update chart:", err);
  }
  setTimeout(() => updateChart(), 5 * 60 * 1000);
}

updateChart();

app.get("/chart", async (req: Request, res: Response) => {
  res.json(
    chart.slice(-144).map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: c.price,
      high: c.price,
      low: c.price,
      close: c.price,
    }))
  ); // last 12 hours
});

app.get("/orderbook", async (req: Request, res: Response) => {
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

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  // console.log("Client connected via WebSocket");
});

// Broadcast orderbook to all clients every second
export async function sendOrderbook() {
  try {
    const asks = await redisClient.lRange("orderbook:asks", 0, -1);
    const bids = await redisClient.lRange("orderbook:bids", 0, -1);
    const message = JSON.stringify({
      type: "orderbook",
      data: {
        asks: asks.map((a) => JSON.parse(a)),
        bids: bids.map((b) => JSON.parse(b)),
      },
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (err: any) {
    console.error("Failed to broadcast orderbook from Redis", err);
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
