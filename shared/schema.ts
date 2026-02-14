import { pgTable, text, serial, integer, boolean, timestamp, jsonb, json, date, doublePrecision, decimal, varchar } from "drizzle-orm/pg-core";
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
  crm: text("crm"), // CRM or professional registration number
  specialty: text("specialty"), // Medical specialty
  rqe: text("rqe"), // RQE - Registro de Qualificação de Especialidade
  profilePhotoUrl: text("profile_photo_url"), // URL/path to user's profile photo
  activeProfileId: integer("active_profile_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  role: text("role").default("user").notNull(), // 'user', 'admin'
  clinicId: integer("clinic_id"), // Reference to clinic (set after clinic creation)
  clinicRole: text("clinic_role"), // 'admin' | 'member'
  preferences: json("preferences"), // Store user preferences like dashboard layout
  addons: json("addons").default("[]"), // Active add-ons: ["transcription_power", "advanced_ai"]
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
  planType: text("plan_type"),
  isDefault: boolean("is_default").default(false),
  clinicId: integer("clinic_id").references(() => clinics.id), // Tenant ID
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Identification
  cpf: text("cpf"),
  rg: text("rg"),
  phone: text("phone"),
  landline: text("landline"),
  email: text("email"),

  // Address
  cep: text("cep"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),

  // Complementary
  guardianName: text("guardian_name"),
  emergencyPhone: text("emergency_phone"),
  profession: text("profession"),
  maritalStatus: text("marital_status"),

  // Administrative
  insuranceCardNumber: text("insurance_card_number"),
  insuranceValidity: text("insurance_validity"),
  insuranceName: text("insurance_name"),
  referralSource: text("referral_source"),
  notes: text("notes"),

  // Death Registration
  deceased: boolean("deceased").default(false),
  deathDate: text("death_date"),
  deathTime: text("death_time"),
  deathCause: text("death_cause"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});

export const insertProfileSchema = createInsertSchema(profiles)
  .pick({
    userId: true,
    name: true,
    birthDate: true,
    gender: true,
    planType: true,
    isDefault: true,
    phone: true,
    // Death fields
    deceased: true,
    deathDate: true,
    deathTime: true,
    deathCause: true,
    clinicId: true,
  })
  .extend({
    relationship: z.string().optional().nullable(),
    bloodType: z.string().optional().nullable(),
    // Identification
    cpf: z.string().optional().nullable(),
    rg: z.string().optional().nullable(),
    landline: z.string().optional().nullable(),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    // Address
    cep: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    number: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
    neighborhood: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    // Complementary
    guardianName: z.string().optional().nullable(),
    emergencyPhone: z.string().optional().nullable(),
    profession: z.string().optional().nullable(),
    maritalStatus: z.string().optional().nullable(),
    // Administrative
    insuranceCardNumber: z.string().optional().nullable(),
    insuranceValidity: z.string().optional().nullable(),
    insuranceName: z.string().optional().nullable(),
    referralSource: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    // Death fields validation
    deceased: z.boolean().optional().default(false),
    deathDate: z.string().optional().nullable(),
    deathTime: z.string().optional().nullable(),
    deathCause: z.string().optional().nullable(),
    clinicId: z.number().int().optional().nullable(),
  });


// Medical exam schema
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clinicId: integer("clinic_id").references(() => clinics.id), // Tenant ID
  profileId: integer("profile_id").references(() => profiles.id),
  name: text("name").notNull(),
  fileType: text("file_type").notNull(), // pdf, jpeg, png
  status: text("status").notNull(), // pending, analyzed
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  laboratoryName: text("laboratory_name"),
  examDate: text("exam_date"),
  requestingPhysician: text("requesting_physician"),
  originalContent: text("original_content"), // Store the raw text from the exam
  filePath: text("file_path"), // Path/Key to the stored file
  processingError: text("processing_error"), // Error message if processing fails

  // Storage Lifecycle
  storageClass: text("storage_class").default("hot").notNull(), // 'hot', 'cold', 'glacier'
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  storageMigratedAt: timestamp("storage_migrated_at"),
});

export const insertExamSchema = createInsertSchema(exams)
  .pick({
    userId: true,
    name: true,
    fileType: true,
    status: true,
    laboratoryName: true,
    examDate: true,
    requestingPhysician: true,
    originalContent: true,
    filePath: true,
    clinicId: true,
  })
  .extend({
    profileId: z.number().int().optional().nullable()
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
  aiProvider: text("ai_provider").notNull(), // openai provider identifier
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
  profileId: integer("profile_id").references(() => profiles.id),
  clinicId: integer("clinic_id"), // Tenant ID
  examId: integer("exam_id"), // vinculação com o exame específico
  name: text("name").notNull(), // colesterol, glicemia, etc
  value: text("value").notNull(),
  unit: text("unit"), // mg/dL, etc
  status: text("status"), // normal, atenção, alto
  change: text("change"), // +2, -3, etc (change from previous)
  date: timestamp("date").defaultNow().notNull(),
  referenceMin: text("reference_min"),
  referenceMax: text("reference_max"),
  // clinical_significance: text("clinical_significance"),
  // category: text("category"),
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics)
  .pick({
    userId: true,
    profileId: true,
    clinicId: true,
    examId: true,
    name: true,
    value: true,
    unit: true,
    status: true,
    change: true,
    date: true,
    referenceMin: true,
    referenceMax: true,
    // clinical_significance: true,
    // category: true,
  })
  .extend({
    profileId: z.number().int().optional().nullable()
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

// Diagnoses schema
export const diagnoses = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id), // Link to patient profile
  cidCode: text("cid_code").notNull(), // Código CID-10
  diagnosisDate: text("diagnosis_date").notNull(),
  status: text("status"), // ativo, em_tratamento, resolvido, cronico
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiagnosisSchema = createInsertSchema(diagnoses).pick({
  userId: true,
  profileId: true,
  cidCode: true,
  diagnosisDate: true,
  status: true,
  notes: true,
});

// Medications schema
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  format: text("format").notNull(), // comprimido, xarope, cápsula, etc.
  dosage: text("dosage").notNull(), // ex: 500, 10, etc. (valor numérico)
  dosageUnit: text("dosage_unit").default("mg"), // mg, g, ml, mcg, UI, etc.
  frequency: text("frequency").notNull(), // ex: 1x ao dia, 2x ao dia, etc.
  doseAmount: integer("dose_amount").default(1), // Quantidade por dose (ex: 2 comprimidos)
  prescriptionType: text("prescription_type").default("padrao"), // padrao, especial, A, B1, B2, C
  quantity: text("quantity"), // ex: 60 comprimidos
  administrationRoute: text("administration_route").default("oral"), // oral, sublingual, injetavel, topico, etc.
  notes: text("notes"),
  startDate: text("start_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicationSchema = createInsertSchema(medications).pick({
  userId: true,
  name: true,
  format: true,
  dosage: true,
  dosageUnit: true,
  frequency: true,
  quantity: true,
  administrationRoute: true,
  notes: true,
  startDate: true,
  isActive: true,
});

// Custom Medications schema (user-defined medications for quick access)
export const customMedications = pgTable("custom_medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  format: text("format"), // comprimido, xarope, cápsula, etc.
  dosage: text("dosage"), // ex: 500mg
  category: text("category"), // categoria do medicamento
  prescriptionType: text("prescription_type").default("padrao"), // padrao, C1, B1, etc.
  route: text("route").default("oral"), // via de administração
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomMedicationSchema = createInsertSchema(customMedications).pick({
  userId: true,
  name: true,
  format: true,
  dosage: true,
  category: true,
  prescriptionType: true,
  route: true,
  isActive: true,
});

// Allergies schema
export const allergies = pgTable("allergies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id), // Link to patient profile
  allergen: text("allergen").notNull(), // Nome do medicamento ou substância
  allergenType: text("allergen_type").notNull().default("medication"), // medication, food, environment
  reaction: text("reaction"), // Tipo de reação alérgica
  severity: text("severity"), // leve, moderada, grave
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAllergySchema = createInsertSchema(allergies).pick({
  userId: true,
  profileId: true,
  allergen: true,
  allergenType: true,
  reaction: true,
  severity: true,
  notes: true,
});

// Surgeries schema
export const surgeries = pgTable("surgeries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  procedureName: text("procedure_name").notNull(),
  hospitalName: text("hospital_name"),
  surgeonName: text("surgeon_name"),
  surgeryDate: text("surgery_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSurgerySchema = createInsertSchema(surgeries).pick({
  userId: true,
  procedureName: true,
  hospitalName: true,
  surgeonName: true,
  surgeryDate: true,
  notes: true,
});

// Evolutions schema
export const evolutions = pgTable("evolutions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id), // Link to patient profile
  text: text("text").notNull(),
  professionalName: text("professional_name"), // Name of the professional who created this evolution
  date: timestamp("date").defaultNow().notNull(),
  isSigned: boolean("is_signed").default(false).notNull(),
  signatureHash: text("signature_hash"), // SHA-256 hash of the content
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEvolutionSchema = createInsertSchema(evolutions).pick({
  userId: true,
  profileId: true,
  text: true,
  professionalName: true,
  date: true,
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
  promoPrice: integer("promo_price"), // in cents
  promoDescription: text("promo_description"),
  trialPeriodDays: integer("trial_period_days").default(0), // Number of trial days
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

// Clinics schema for multi-professional subscriptions
export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  maxProfessionals: integer("max_professionals").notNull().default(5),
  maxSecretaries: integer("max_secretaries").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clinic invitations schema
export const clinicInvitations = pgTable("clinic_invitations", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("member"), // 'admin', 'member', 'secretary'
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'expired'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertClinicSchema = createInsertSchema(clinics).pick({
  name: true,
  adminUserId: true,
  subscriptionId: true,
  maxProfessionals: true,
  maxSecretaries: true,
});

export const insertClinicInvitationSchema = createInsertSchema(clinicInvitations).pick({
  clinicId: true,
  email: true,
  token: true,
  role: true,
  status: true,
  expiresAt: true,
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
  promoPrice: true,
  promoDescription: true,
  trialPeriodDays: true,
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

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;

export type ClinicInvitation = typeof clinicInvitations.$inferSelect;
export type InsertClinicInvitation = z.infer<typeof insertClinicInvitationSchema>;

export type Evolution = typeof evolutions.$inferSelect;
export type InsertEvolution = z.infer<typeof insertEvolutionSchema>;

// Appointments schema

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clinicId: integer("clinic_id"), // Tenant context
  profileId: integer("profile_id").references(() => profiles.id), // Link to patient profile
  patientName: text("patient_name").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:mm
  type: text("type").notNull(), // consulta, retorno, exames, urgencia, procedimento
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  price: integer("price"), // Price in cents (BRL)
  duration: integer("duration").default(30), // Duration in minutes
  isAllDay: boolean("is_all_day").default(false),
  isTelemedicine: boolean("is_telemedicine").default(false),
  meetingLink: text("meeting_link"), // Google Meet / Zoom link
  notes: text("notes"),
  checkedInAt: timestamp("checked_in_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  userId: true,
  clinicId: true,
  profileId: true,
  patientName: true,
  date: true,
  time: true,
  type: true,
  status: true,
  price: true,
  duration: true,
  isAllDay: true,
  isTelemedicine: true,
  meetingLink: true,
  notes: true,
  checkedInAt: true,
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Habits schema
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id),
  habitType: text("habit_type").notNull(), // etilismo, tabagismo, udi
  status: text("status").notNull(), // nunca, ex, ativo
  frequency: text("frequency"), // diariamente, socialmente, etc.
  quantity: text("quantity"), // quantidade aproximada
  startDate: text("start_date"), // quando começou o hábito
  endDate: text("end_date"), // quando parou (para ex-usuários)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  userId: true,
  habitType: true,
  status: true,
  frequency: true,
  quantity: true,
  startDate: true,
  endDate: true,
  notes: true,
}).extend({
  profileId: z.number().int().optional().nullable()
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

// Prescriptions schema
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id), // Link to patient profile
  doctorName: text("doctor_name").notNull(),
  doctorCrm: text("doctor_crm").notNull(),
  doctorSpecialty: text("doctor_specialty"),
  medications: json("medications").notNull(), // Array de medication IDs e detalhes
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  validUntil: timestamp("valid_until").notNull(),
  observations: text("observations"),
  pdfPath: text("pdf_path"), // Caminho do PDF gerado
  status: text("status").default("active").notNull(), // active, cancelled
  isSigned: boolean("is_signed").default(false).notNull(),
  signatureHash: text("signature_hash"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions, {
  issueDate: z.coerce.date(),
  validUntil: z.coerce.date(),
}).pick({
  userId: true,
  profileId: true,
  doctorName: true,
  doctorCrm: true,
  doctorSpecialty: true,
  medications: true,
  issueDate: true,
  validUntil: true,
  observations: true,
  pdfPath: true,
  status: true,
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

// Certificates schema
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  doctorName: text("doctor_name").notNull(),
  doctorCrm: text("doctor_crm").notNull(),
  patientName: text("patient_name").notNull(),
  patientDoc: text("patient_doc"),
  type: text("type").notNull(), // afastamento, comparecimento, acompanhamento, aptidao
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  daysOff: text("days_off"),
  cid: text("cid"),
  city: text("city"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  customText: text("custom_text"),
  status: text("status").default("active").notNull(),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCertificateSchema = createInsertSchema(certificates, {
  issueDate: z.coerce.date(),
}).pick({
  userId: true,
  profileId: true,
  doctorName: true,
  doctorCrm: true,
  patientName: true,
  patientDoc: true,
  type: true,
  issueDate: true,
  daysOff: true,
  cid: true,
  city: true,
  startTime: true,
  endTime: true,
  customText: true,
  status: true,
  pdfPath: true,
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

// Certificate Templates schema
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).pick({
  userId: true,
  title: true,
  content: true,
});

export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;

// Doctors schema
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  crm: text("crm").notNull(),
  specialty: text("specialty"),
  professionalType: text("professional_type").default("doctor").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDoctorSchema = createInsertSchema(doctors).pick({
  userId: true,
  name: true,
  crm: true,
  specialty: true,
  professionalType: true,
  isDefault: true,
});


export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

// Triage records schema
export const triageRecords = pgTable("triage_records", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  profileId: integer("profile_id").references(() => profiles.id),
  performedByUserId: integer("performed_by_user_id").notNull().references(() => users.id),
  performedByName: text("performed_by_name").notNull(),

  // Anamnese
  chiefComplaint: text("chief_complaint").notNull(),
  currentIllnessHistory: text("current_illness_history"),
  painScale: integer("pain_scale"),

  // Sinais vitais
  systolicBp: integer("systolic_bp"),
  diastolicBp: integer("diastolic_bp"),
  heartRate: integer("heart_rate"),
  respiratoryRate: integer("respiratory_rate"),
  temperature: text("temperature"),
  oxygenSaturation: integer("oxygen_saturation"),
  bloodGlucose: integer("blood_glucose"),
  weight: text("weight"),
  height: integer("height"),

  // Manchester
  manchesterPriority: text("manchester_priority").notNull(),
  manchesterDiscriminator: text("manchester_discriminator"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTriageRecordSchema = createInsertSchema(triageRecords).pick({
  appointmentId: true,
  profileId: true,
  performedByUserId: true,
  performedByName: true,
  chiefComplaint: true,
  currentIllnessHistory: true,
  painScale: true,
  systolicBp: true,
  diastolicBp: true,
  heartRate: true,
  respiratoryRate: true,
  temperature: true,
  oxygenSaturation: true,
  bloodGlucose: true,
  weight: true,
  height: true,
  manchesterPriority: true,
  manchesterDiscriminator: true,
  notes: true,
}).extend({
  painScale: z.number().int().min(0).max(10).optional().nullable(),
  oxygenSaturation: z.number().int().min(0).max(100).optional().nullable(),
  manchesterPriority: z.enum(['emergent', 'very_urgent', 'urgent', 'standard', 'non_urgent']),
});

export type TriageRecord = typeof triageRecords.$inferSelect;
export type InsertTriageRecord = z.infer<typeof insertTriageRecordSchema>;

// ========================================
// HIPAA/LGPD COMPLIANCE TABLES
// ========================================

// TUSS / Exam Database schema
export const tussProcedures = pgTable("tuss_procedures", {
  id: serial("id").primaryKey(),
  code: text("code").unique(), // TUSS code (can be custom if starting with "CUST-")
  name: text("name").notNull(),
  category: text("category"), // Hematologia, Radiologia, etc.
  type: text("type"), // laboratorial, imagem, etc. (mapped from TUSS groups)
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTussProcedureSchema = createInsertSchema(tussProcedures).pick({
  code: true,
  name: true,
  category: true,
  type: true,
  description: true,
  isActive: true,
});

export type TussProcedure = typeof tussProcedures.$inferSelect;
export type InsertTussProcedure = z.infer<typeof insertTussProcedureSchema>;

// User Consents - LGPD Art. 8
export const userConsents = pgTable("user_consents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  consentType: text("consent_type").notNull(), // 'data_processing', 'health_data', 'marketing', 'third_party_sharing'
  granted: boolean("granted").notNull(),
  purpose: text("purpose").notNull(), // Specific purpose of consent
  legalBasis: text("legal_basis").notNull(), // 'consent', 'legitimate_interest', 'legal_obligation', 'health_protection'
  version: text("version").notNull(), // Version of the privacy policy
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  expiresAt: timestamp("expires_at"), // Optional expiry for time-limited consents
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserConsentSchema = createInsertSchema(userConsents).pick({
  userId: true,
  consentType: true,
  granted: true,
  purpose: true,
  legalBasis: true,
  version: true,
  ipAddress: true,
  userAgent: true,
});

export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = z.infer<typeof insertUserConsentSchema>;


// Storage Logs - Audit trail for storage policies
export const storageLogs = pgTable("storage_logs", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  previousClass: text("previous_class").notNull(),
  newClass: text("new_class").notNull(),
  reason: text("reason").notNull(), // 'auto_policy', 'manual_admin'
  migratedAt: timestamp("migrated_at").defaultNow().notNull(),
  fileSize: integer("file_size"), // in bytes, for cost calculation
  costSavingsEstimate: text("cost_savings_estimate"), // optional text for reporting
});

export const insertStorageLogSchema = createInsertSchema(storageLogs).pick({
  examId: true,
  previousClass: true,
  newClass: true,
  reason: true,
  fileSize: true,
  costSavingsEstimate: true
});

export type StorageLog = typeof storageLogs.$inferSelect;
export type InsertStorageLog = z.infer<typeof insertStorageLogSchema>;


// Audit Logs - HIPAA §164.312(b), LGPD Art. 37
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null for anonymous/system actions
  clinicId: integer("clinic_id").references(() => clinics.id), // Tenant Context
  targetUserId: integer("target_user_id").references(() => users.id), // User whose data was accessed
  action: text("action").notNull(), // 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT'
  resourceType: text("resource_type").notNull(), // 'exam', 'profile', 'prescription', 'diagnosis', etc.
  resourceId: integer("resource_id"), // ID of the affected resource
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  requestMethod: text("request_method"), // 'GET', 'POST', 'PUT', 'DELETE'
  requestPath: text("request_path"),
  statusCode: integer("status_code"), // HTTP status code
  oldValue: json("old_value"), // Previous state (for updates/deletes)
  newValue: json("new_value"), // New state (for creates/updates) - REDACTED for sensitive fields
  accessReason: text("access_reason"), // 'treatment', 'payment', 'operations', 'patient_request'
  severity: text("severity").default("INFO"), // 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  complianceFlags: json("compliance_flags"), // { hipaa: true, lgpd: true }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  clinicId: true,
  targetUserId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  ipAddress: true,
  userAgent: true,
  sessionId: true,
  requestMethod: true,
  requestPath: true,
  statusCode: true,
  oldValue: true,
  newValue: true,
  accessReason: true,
  severity: true,
  complianceFlags: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Data Deletion Requests - LGPD Art. 18
export const dataDeletionRequests = pgTable("data_deletion_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // 'full_deletion', 'partial_deletion', 'anonymization'
  reason: text("reason"), // Optional reason provided by user
  dataCategories: json("data_categories"), // Array of categories to delete
  status: text("status").default("pending").notNull(), // 'pending', 'in_progress', 'completed', 'rejected', 'cancelled'
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"), // If legal retention required
  legalRetentionUntil: timestamp("legal_retention_until"), // If data must be retained
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDataDeletionRequestSchema = createInsertSchema(dataDeletionRequests).pick({
  userId: true,
  requestType: true,
  reason: true,
  dataCategories: true,
  ipAddress: true,
  userAgent: true,
});

export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;
export type InsertDataDeletionRequest = z.infer<typeof insertDataDeletionRequestSchema>;

// Data Processing Records - LGPD Art. 37
export const dataProcessingRecords = pgTable("data_processing_records", {
  id: serial("id").primaryKey(),
  processingId: text("processing_id").notNull().unique(), // UUID for reference
  dataCategory: text("data_category").notNull(), // 'health_data', 'personal_data', 'financial_data'
  purpose: text("purpose").notNull(), // Purpose of processing
  legalBasis: text("legal_basis").notNull(), // Legal basis for processing
  dataController: text("data_controller").default("VitaView.ai").notNull(),
  dataProcessor: text("data_processor"), // Third-party processor if applicable
  retentionPeriod: text("retention_period").notNull(), // e.g., '7 years', '20 years'
  securityMeasures: json("security_measures"), // Array of security measures
  internationalTransfer: boolean("international_transfer").default(false),
  transferSafeguards: text("transfer_safeguards"), // If international transfer
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDataProcessingRecordSchema = createInsertSchema(dataProcessingRecords).pick({
  processingId: true,
  dataCategory: true,
  purpose: true,
  legalBasis: true,
  dataProcessor: true,
  retentionPeriod: true,
  securityMeasures: true,
  internationalTransfer: true,
  transferSafeguards: true,
  isActive: true,
});

export type DataProcessingRecord = typeof dataProcessingRecords.$inferSelect;
export type InsertDataProcessingRecord = z.infer<typeof insertDataProcessingRecordSchema>;

// Security Incidents - LGPD Art. 48, HIPAA Breach Notification
export const securityIncidents = pgTable("security_incidents", {
  id: serial("id").primaryKey(),
  incidentId: text("incident_id").notNull().unique(), // UUID for reference
  incidentType: text("incident_type").notNull(), // 'data_breach', 'unauthorized_access', 'malware', 'phishing'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  affectedUsersCount: integer("affected_users_count"),
  affectedDataTypes: json("affected_data_types"), // Array of affected data types
  description: text("description").notNull(),
  discoveredAt: timestamp("discovered_at").notNull(),
  containedAt: timestamp("contained_at"),
  resolvedAt: timestamp("resolved_at"),
  reportedToAuthority: boolean("reported_to_authority").default(false),
  reportedToAuthorityAt: timestamp("reported_to_authority_at"),
  usersNotified: boolean("users_notified").default(false),
  usersNotifiedAt: timestamp("users_notified_at"),
  rootCause: text("root_cause"),
  remediationSteps: json("remediation_steps"),
  preventiveMeasures: json("preventive_measures"),
  investigatedBy: integer("investigated_by").references(() => users.id),
  status: text("status").default("investigating").notNull(), // 'investigating', 'contained', 'resolved', 'closed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSecurityIncidentSchema = createInsertSchema(securityIncidents).pick({
  incidentId: true,
  incidentType: true,
  severity: true,
  affectedUsersCount: true,
  affectedDataTypes: true,
  description: true,
  discoveredAt: true,
});

export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type InsertSecurityIncident = z.infer<typeof insertSecurityIncidentSchema>;

// Team Members schema - Gerenciamento de equipe (secretários, médicos, contadores)
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id), // Médico dono da conta
  email: text("email").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'secretary' | 'doctor' | 'accountant'
  phone: text("phone"),
  isActive: boolean("is_active").default(true).notNull(),

  // Permissões específicas
  canViewAgenda: boolean("can_view_agenda").default(true).notNull(),
  canEditAgenda: boolean("can_edit_agenda").default(false).notNull(),
  canViewPatients: boolean("can_view_patients").default(false).notNull(),
  canEditPatients: boolean("can_edit_patients").default(false).notNull(),
  canViewFinancials: boolean("can_view_financials").default(false).notNull(),
  canViewReports: boolean("can_view_reports").default(false).notNull(),
  canManageExams: boolean("can_manage_exams").default(false).notNull(),

  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  ownerId: true,
  email: true,
  password: true,
  name: true,
  role: true,
  phone: true,
}).extend({
  isActive: z.boolean().optional(),
  canViewAgenda: z.boolean().optional(),
  canEditAgenda: z.boolean().optional(),
  canViewPatients: z.boolean().optional(),
  canEditPatients: z.boolean().optional(),
  canViewFinancials: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canManageExams: z.boolean().optional(),
});

export const updateTeamMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['secretary', 'doctor', 'accountant']).optional(),
  isActive: z.boolean().optional(),
  canViewAgenda: z.boolean().optional(),
  canEditAgenda: z.boolean().optional(),
  canViewPatients: z.boolean().optional(),
  canEditPatients: z.boolean().optional(),
  canViewFinancials: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canManageExams: z.boolean().optional(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;

// Enum de roles para uso no frontend
export const TEAM_ROLES = {
  secretary: {
    label: 'Secretário(a)',
    description: 'Acesso ao agendamento e cadastro de pacientes',
    defaultPermissions: {
      canViewAgenda: true,
      canEditAgenda: true,
      canViewPatients: true,
      canEditPatients: true,
      canViewFinancials: false,
      canViewReports: false,
      canManageExams: false,
    }
  },
  doctor: {
    label: 'Médico(a)',
    description: 'Acesso completo ao atendimento de pacientes',
    defaultPermissions: {
      canViewAgenda: true,
      canEditAgenda: true,
      canViewPatients: true,
      canEditPatients: true,
      canViewFinancials: false,
      canViewReports: true,
      canManageExams: true,
    }
  },
  accountant: {
    label: 'Contador(a)',
    description: 'Acesso aos relatórios financeiros',
    defaultPermissions: {
      canViewAgenda: false,
      canEditAgenda: false,
      canViewPatients: false,
      canEditPatients: false,
      canViewFinancials: true,
      canViewReports: true,
      canManageExams: false,
    }
  }
} as const;

// Exam Requests schema - Solicitação de exames laboratoriais e de imagem
export const examRequests = pgTable("exam_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id), // Link to patient profile
  doctorName: text("doctor_name").notNull(),
  doctorCrm: text("doctor_crm").notNull(),
  doctorSpecialty: text("doctor_specialty"),
  exams: json("exams").notNull(), // Array de exames solicitados [{name, type, notes}]
  clinicalIndication: text("clinical_indication"), // Indicação clínica
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  observations: text("observations"),
  pdfPath: text("pdf_path"),
  status: text("status").default("pending").notNull(), // pending, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExamRequestSchema = createInsertSchema(examRequests, {
  issueDate: z.coerce.date(),
}).pick({
  userId: true,
  profileId: true,
  doctorName: true,
  doctorCrm: true,
  doctorSpecialty: true,
  exams: true,
  clinicalIndication: true,
  issueDate: true,
  observations: true,
  pdfPath: true,
  status: true,
});

export type ExamRequest = typeof examRequests.$inferSelect;
export type InsertExamRequest = z.infer<typeof insertExamRequestSchema>;

// Custom Exam Protocols schema - Protocolos de exames personalizados por médico
export const examProtocols = pgTable("exam_protocols", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("FlaskConical"), // Lucide icon name
  color: text("color").default("blue"), // Tailwind color name
  exams: json("exams").notNull(), // Array de exames [{name, type}]
  isDefault: boolean("is_default").default(false), // Se é protocolo padrão do sistema
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExamProtocolSchema = createInsertSchema(examProtocols).pick({
  userId: true,
  name: true,
  description: true,
  icon: true,
  color: true,
  exams: true,
  isDefault: true,
});

export type ExamProtocol = typeof examProtocols.$inferSelect;
export type InsertExamProtocol = z.infer<typeof insertExamProtocolSchema>;

export type CustomMedication = typeof customMedications.$inferSelect;
export type InsertCustomMedication = z.infer<typeof insertCustomMedicationSchema>;

// Bug Reports schema - User-submitted bug reports
export const bugReports = pgTable("bug_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name"),
  userEmail: text("user_email"),
  description: text("description").notNull(),
  pageUrl: text("page_url"),
  userAgent: text("user_agent"),
  status: text("status").default("new").notNull(), // 'new', 'seen', 'resolved'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBugReportSchema = createInsertSchema(bugReports).pick({
  userId: true,
  userName: true,
  userEmail: true,
  description: true,
  pageUrl: true,
  userAgent: true,
  status: true,
});

export type BugReport = typeof bugReports.$inferSelect;
export type InsertBugReport = z.infer<typeof insertBugReportSchema>;

// AI Conversations schema - VitaConsult chat threads
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").references(() => profiles.id), // Optional patient context
  title: text("title"), // Auto-generated from first message
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAIConversationSchema = createInsertSchema(aiConversations).pick({
  userId: true,
  profileId: true,
  title: true,
});

export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;

// AI Messages schema - Individual messages in VitaConsult conversations
export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAIMessageSchema = createInsertSchema(aiMessages).pick({
  conversationId: true,
  role: true,
  content: true,
});

export type AIMessage = typeof aiMessages.$inferSelect;
export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;

// AI Usage Tracking schema - Fair use limits
export const aiUsage = pgTable("ai_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format for daily tracking

  // Daily counters
  aiRequests: integer("ai_requests").default(0).notNull(),
  aiTokensUsed: integer("ai_tokens_used").default(0).notNull(),
  transcriptionMinutes: integer("transcription_minutes").default(0).notNull(),
  examAnalyses: integer("exam_analyses").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAIUsageSchema = createInsertSchema(aiUsage).pick({
  userId: true,
  date: true,
  aiRequests: true,
  aiTokensUsed: true,
  transcriptionMinutes: true,
  examAnalyses: true,
});

export type AIUsage = typeof aiUsage.$inferSelect;
export type InsertAIUsage = z.infer<typeof insertAIUsageSchema>;

// AI Cache schema
export const aiCache = pgTable("ai_cache", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(), // SHA-256 (prompt + model + params)
  prompt: text("prompt"), // Optional for debug/audit
  response: json("response").notNull(),
  model: text("model").notNull(),
  complexity: text("complexity"), // simple, medium, complex
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  hitCount: integer("hit_count").default(0).notNull()
});

export const insertAICacheSchema = createInsertSchema(aiCache).pick({
  hash: true,
  prompt: true,
  response: true,
  model: true,
  complexity: true,
  expiresAt: true
});

// Types for AI Cache
export type AICache = typeof aiCache.$inferSelect;
export type InsertAICache = z.infer<typeof insertAICacheSchema>;

// Fair Use Limits by Plan
export const FAIR_USE_LIMITS = {
  free: {
    aiRequestsPerMonth: 50,
    tokensPerRequest: 4000,
    transcriptionMinutesPerMonth: 15, // Reduced from 30
    examAnalysesPerMonth: 10,
  },
  paid: {
    aiRequestsPerMonth: 5000,
    tokensPerRequest: 8000,
    transcriptionMinutesPerMonth: 500,
    examAnalysesPerMonth: 500,
  },
  addon_transcription: {
    transcriptionMinutesPerMonth: -1, // unlimited
  },
  addon_advanced_ai: {
    aiRequestsPerMonth: -1, // unlimited
    tokensPerRequest: 16000,
  },
} as const;

// --- Support Automation Schema ---

// Knowledge Base Articles (with Vector Support via JSONB for now)
export const supportArticles = pgTable("support_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown allowed
  category: text("category").notNull(), // 'billing', 'clinical', 'technical', etc.
  embedding: json("embedding"), // Vector representation (array of numbers)
  clinicId: integer("clinic_id"), // Optional: for private clinic articles
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupportArticleSchema = createInsertSchema(supportArticles).pick({
  title: true,
  content: true,
  category: true,
  clinicId: true,
  isPublic: true,
});

export type SupportArticle = typeof supportArticles.$inferSelect;
export type InsertSupportArticle = z.infer<typeof insertSupportArticleSchema>;

// AI Cost Logs for Audit & Governance
export const aiCostLogs = pgTable("ai_cost_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  clinicId: integer("clinic_id").references(() => clinics.id), // Tenant Context
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).notNull(),
  taskType: text("task_type").notNull(), // 'chat', 'analysis', 'transcription'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clinicId: integer("clinic_id").references(() => clinics.id), // Context is important
  subject: text("subject").notNull(),
  status: text("status").default("open").notNull(), // 'open', 'in_progress', 'closed', 'bot_resolved'
  priority: text("priority").default("medium").notNull(), // 'low', 'medium', 'high', 'critical'
  source: text("source").default("web").notNull(), // 'bot', 'web', 'email'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  clinicId: true,
  subject: true,
  status: true,
  priority: true,
  source: true,
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Ticket Messages
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  senderType: text("sender_type").notNull(), // 'user', 'bot', 'agent'
  senderId: integer("sender_id"), // User ID or Agent ID (null for bot)
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).pick({
  ticketId: true,
  senderType: true,
  senderId: true,
  content: true,
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// Specialty Templates (Automated Onboarding)
export const specialtyTemplates = pgTable("specialty_templates", {
  id: serial("id").primaryKey(),
  specialty: text("specialty").notNull().unique(), // e.g., 'cardiology', 'dermatology'
  config: json("config").notNull(), // Stores default favs, anamnesis fields, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSpecialtyTemplateSchema = createInsertSchema(specialtyTemplates).pick({
  specialty: true,
  config: true,
});

export type SpecialtyTemplate = typeof specialtyTemplates.$inferSelect;
export type InsertSpecialtyTemplate = z.infer<typeof insertSpecialtyTemplateSchema>;
