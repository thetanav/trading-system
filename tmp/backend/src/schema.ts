import {
  pgTable,
  serial,
  varchar,
  numeric,
  pgEnum,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }),
  cash: numeric("cash"),
  stock: numeric("stock"),
  createdAt: timestamp().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  type: varchar("type", { length: 10 }),
  quantity: numeric("quantity"),
  price: numeric("price"),
  timestamp: timestamp().defaultNow(),
});
