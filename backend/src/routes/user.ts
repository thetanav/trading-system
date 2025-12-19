import { Request, Response, Router } from "express";
import auth from "../middlware/jwt";
import { db } from "../db";
import { transactions, users } from "../schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", auth, async (req: Request, res: Response) => {
  const { email } = req.body;
  const row = await db.select().from(users).where(eq(users.email, email));
  const user = row[0];
  res.json(user);
});

router.get("/verify", auth, async (req: Request, res: Response) => {
  res.json({ user: req.body.jwt });
});

router.get("/transactions", auth, async (req: Request, res: Response) => {
  const { email } = req.body;
  const row = await db.select().from(users).where(eq(users.email, email));
  const user = row[0];
  const data = await db
    .select()
    .from(transactions)
    .where(eq(transactions.user_id, user.id));
  res.json(data);
});

router.get("/u/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));
  const user = row[0];
  res.json(user);
});

export default router;
