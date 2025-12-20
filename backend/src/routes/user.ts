import { Hono } from "hono";
import auth from "../middleware/jwt";
import { db } from "../db";
import { transactions, users } from "../schema";
import { eq } from "drizzle-orm";

const router = new Hono<{
  Variables: {
    jwt: any;
  };
}>();

router.get("/", auth, async (c) => {
  const jwt = (c as any).jwt;
  const row = await db
    .select()
    .from(users)
    .where(eq(users.email, jwt.email));
  const user = row[0];
  return c.json({
    cash: user.cash,
    stock: user.stock,
    createdAt: user.createdAt,
    email: user.email,
    name: user.name,
  });
});

router.get("/verify", auth, async (c) => {
  const jwt = (c as any).jwt;
  return c.json({ user: jwt });
});

router.get("/transactions", auth, async (c) => {
  const jwt = (c as any).jwt;
  const row = await db
    .select()
    .from(users)
    .where(eq(users.email, jwt.email));
  const user = row[0];
  const data = await db
    .select()
    .from(transactions)
    .where(eq(transactions.user_id, user.id));
  return c.json(data);
});

router.get("/u/:id", async (c) => {
  const id = c.req.param('id');
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));
  const user = row[0];
  return c.json(user);
});

export default router;
