import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: text("priority", { enum: ["High", "Medium", "Low"] }).notNull(),
  status: text("status", { enum: ["Todo", "In Progress", "Done"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    title: true,
    priority: true,
    status: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(100),
    priority: z.enum(["High", "Medium", "Low"]),
    status: z.enum(["Todo", "In Progress", "Done"]),
  });

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
