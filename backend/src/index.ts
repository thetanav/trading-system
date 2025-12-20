import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "redis";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import tradeRoutes from "./routes/trade";
import express, { Request, Response } from "express";
import { updateChart } from "./utils/chart";
import { chart } from "./memory";
import cookieParser from "cookie-parser";

dotenv.config();

export const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

const clients = new Set<{
  res: express.Response;
}>();

// API Routes
app.use("/trade", tradeRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

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

updateChart(chart, redisClient);

app.get("/ping", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

// app.get("/sse/orderbook", (req: Request, res: Response) => {
//   res.set({
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//     Connection: "keep-alive",
//   });

//   res.flushHeaders();

//   const client = { res };
//   clients.add(client);

//   req.on("close", () => {
//     clients.delete(client);
//   });
// });

export async function sendOrderbook() {
  try {
    const asks = await redisClient.lRange("asks", 0, -1);
    const bids = await redisClient.lRange("bids", 0, -1);
    const orderbook = JSON.stringify({
      type: "orderbook",
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
    for (const client of clients) {
      client.res.write(`event: orderbook\n`);
      client.res.write(`data: ${JSON.stringify(orderbook)}\n\n`);
    }
  } catch (err: any) {
    console.error("Failed to broadcast orderbook from Redis", err);
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
