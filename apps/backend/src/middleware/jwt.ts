import { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET!;

const auth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, 'auth_token');
  
  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const decoded = jwt.verify(token, secretKey) as any;
    (c as any).jwt = decoded;
    await next();
  } catch (error) {
    return c.json({ message: "Unauthorized" }, 401);
  }
};

export default auth;
