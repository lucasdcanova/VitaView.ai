import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
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
  activeProfileId: integer("active_profile_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Profiles schema
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  relationship: text("relationship"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  bloodType: text("blood_type"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  userId: true,
  name: true,
  relationship: true,
  birthDate: true,
  gender: true,
  bloodType: true,
  isDefault: true,
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
  requestingPhysician: text("requesting_physician"),
  originalContent: text("original_content"), // Store the raw text from the exam
});

export const insertExamSchema = createInsertSchema(exams).pick({
  userId: true,
  name: true,
  fileType: true,
  status: true,
  laboratoryName: true,
  examDate: true,
  requestingPhysician: true,
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
  // Nota: Os campos abaixo não existem na tabela real do banco de dados
  // Foram removidos para compatibilidade com o schema real
  // referenceMin: text("reference_min"), 
  // referenceMax: text("reference_max"), 
  // clinical_significance: text("clinical_significance"),
  // category: text("category"),
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).pick({
  userId: true,
  name: true,
  value: true,
  unit: true,
  status: true,
  change: true,
  date: true,
  // Removidos campos que não existem no banco de dados
  // referenceMin: true,
  // referenceMax: true,
  // clinical_significance: true,
  // category: true,
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

// Subscription plans schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  maxProfiles: integer("max_profiles").notNull(),
  maxUploadsPerProfile: integer("max_uploads_per_profile").notNull(), // -1 for unlimited
  price: integer("price").notNull(), // in cents
  interval: varchar("interval", { length: 20 }).notNull().default("month"), // month, year
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  features: json("features"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User subscriptions schema
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, canceled, past_due
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  canceledAt: timestamp("canceled_at"),
  profilesCreated: integer("profiles_created").default(0).notNull(),
  uploadsCount: json("uploads_count").default("{}"), // JSON object storing uploads count per profile
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  description: true,
  maxProfiles: true,
  maxUploadsPerProfile: true,
  price: true,
  interval: true,
  stripePriceId: true,
  features: true,
  isActive: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  planId: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
