import { Router, Request, Response } from "express";
import { db } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { users } from "../schema";
import { eq } from "drizzle-orm";

const router = Router();
dotenv.config();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const userRow = await db.select().from(users).where(eq(users.email, email));
  const userData = userRow[0];

  if (!userData) {
    res.json({
      ok: false,
      msg: "No account found",
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, userData.password!);
  if (!isMatch) {
    res.json({
      ok: false,
      msg: "Invalid password",
    });
    return;
  }

  const token = jwt.sign(
    { name: userData.name, email: userData.email },
    process.env.JWT_SECRET!,
    {
      expiresIn: "24h",
    }
  );

  res.json({
    ok: true,
    msg: "Login successfully",
    token,
  });
});

router.post("/signup", async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.json({
      ok: false,
      msg: "Password doesn't match",
    });
    return;
  }

  const userRow = await db.select().from(users).where(eq(users.email, email));

  if (userRow.length > 0) {
    res.json({
      ok: false,
      msg: "Email already exists",
    });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  await db.insert(users).values({
    name: name,
    email: email,
    password: hashedPassword,
    cash: "1000",
    stock: "5",
  });

  const token = jwt.sign({ name, email }, process.env.JWT_SECRET!, {
    expiresIn: "24h",
  });

  res.json({
    ok: true,
    msg: "Account created successfully",
    token: token,
  });
});

export default router;
