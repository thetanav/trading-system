import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET!;

export default function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.body.jwt = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
