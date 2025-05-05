import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});

// Medical exam schema
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  fileType: text("file_type").notNull(), // pdf, jpeg, png
  status: text("status").notNull(), // pending, analyzed
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  laboratoryName: text("laboratory_name"),
  examDate: text("exam_date"),
  // Campo requestingPhysician removido porque não existe no banco de dados
  originalContent: text("original_content"), // Store the raw text from the exam
});

export const insertExamSchema = createInsertSchema(exams).pick({
  userId: true,
  name: true,
  fileType: true,
  status: true,
  laboratoryName: true,
  examDate: true,
  originalContent: true
});

// Analysis results schema
export const examResults = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  analysisDate: timestamp("analysis_date").defaultNow().notNull(),
  summary: text("summary"),
  detailedAnalysis: text("detailed_analysis"),
  recommendations: text("recommendations"),
  healthMetrics: json("health_metrics"), // Store metrics as JSON
  aiProvider: text("ai_provider").notNull(), // gemini, openai
});

export const insertExamResultSchema = createInsertSchema(examResults).pick({
  examId: true,
  summary: true,
  detailedAnalysis: true,
  recommendations: true,
  healthMetrics: true,
  aiProvider: true,
});

// Health metrics schema
export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(), // colesterol, glicemia, etc
  value: text("value").notNull(),
  unit: text("unit"), // mg/dL, etc
  status: text("status"), // normal, atenção, alto
  change: text("change"), // +2, -3, etc (change from previous)
  date: timestamp("date").defaultNow().notNull(),
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).pick({
  userId: true,
  name: true,
  value: true,
  unit: true,
  status: true,
  change: true,
  date: true,
});

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  read: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
