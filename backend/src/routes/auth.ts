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
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({
        ok: false,
        msg: "Email and password are required",
      });
      return;
    }

    const userRow = await db.select().from(users).where(eq(users.email, email));
    const userData = userRow[0];

    if (!userData) {
      res.status(401).json({
        ok: false,
        msg: "No account found",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, userData.password!);
    if (!isMatch) {
      res.status(401).json({
        ok: false,
        msg: "Invalid password",
      });
      return;
    }

    const token = jwt.sign(
      { id: userData.id, name: userData.name, email: userData.email },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      msg: "Login successfully",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      ok: false,
      msg: "Internal server error",
    });
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  res.clearCookie("auth_token");
  res.json({
    ok: true,
    msg: "Logout successfully",
  });
});

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({
        ok: false,
        msg: "All fields are required",
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        ok: false,
        msg: "Password doesn't match",
      });
      return;
    }

    const userRow = await db.select().from(users).where(eq(users.email, email));

    if (userRow.length > 0) {
      res.status(409).json({
        ok: false,
        msg: "Email already exists",
      });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await db.insert(users).values({
      name: name,
      email: email,
      password: hashedPassword,
      cash: "1000",
      stock: "5",
    }).returning();

    const token = jwt.sign(
      { id: newUser[0].id, name, email }, 
      process.env.JWT_SECRET!, 
      {
        expiresIn: "7d",
      }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      msg: "Account created successfully",
      token: token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      ok: false,
      msg: "Internal server error",
    });
  }
});

export default router;
