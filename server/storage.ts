import { users, exams, examResults, healthMetrics, notifications, profiles, subscriptionPlans, subscriptions, diagnoses, surgeries, evolutions, appointments, doctors, habits, clinics, clinicInvitations, triageRecords, prescriptions, certificates, allergies } from "@shared/schema";
export type { TriageRecord, InsertTriageRecord } from "@shared/schema";
import type { User, InsertUser, Profile, InsertProfile, Exam, InsertExam, ExamResult, InsertExamResult, HealthMetric, InsertHealthMetric, Notification, InsertNotification, SubscriptionPlan, InsertSubscriptionPlan, Subscription, InsertSubscription, Evolution, InsertEvolution, Appointment, InsertAppointment, Doctor, InsertDoctor, Habit, Clinic, InsertClinic, ClinicInvitation, InsertClinicInvitation, Prescription, InsertPrescription, Certificate, InsertCertificate } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, asc, and, or, inArray, sql, gt, ne } from "drizzle-orm";
import logger from "./logger";

// Fix for type issues - use any to bypass complex type definitions
type SessionStore = any;

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Profile operations
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: number): Promise<Profile | undefined>;
  getProfilesByUserId(userId: number): Promise<Profile[]>;
  updateProfile(id: number, profile: Partial<Profile>): Promise<Profile | undefined>;
  deleteProfile(id: number): Promise<boolean>;
  getDefaultProfileForUser(userId: number): Promise<Profile | undefined>;

  // Bulk import operations
  createProfilesBulk(profiles: Partial<InsertProfile>[]): Promise<Profile[]>;
  findDuplicateProfiles(userId: number, names: string[], cpfs: (string | null)[]): Promise<Profile[]>;

  // Exam operations
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByUserId(userId: number, profileId?: number): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;

  // Exam results operations
  createExamResult(result: InsertExamResult): Promise<ExamResult>;
  getExamResult(id: number): Promise<ExamResult | undefined>;
  getExamResultByExamId(examId: number): Promise<ExamResult | undefined>;

  // Health metrics operations
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  getHealthMetricsByUserId(userId: number, profileId?: number): Promise<HealthMetric[]>;
  getLatestHealthMetrics(userId: number, limit: number, profileId?: number): Promise<HealthMetric[]>;
  deleteHealthMetric(id: number): Promise<boolean>;
  deleteAllHealthMetricsByUserId(userId: number, profileId?: number): Promise<number>;
  deleteHealthMetricsByExamId(examId: number): Promise<number>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;

  // Diagnosis operations
  createDiagnosis(diagnosis: any): Promise<any>;
  getDiagnosis(id: number): Promise<any | undefined>;
  getDiagnosesByUserId(userId: number): Promise<any[]>;
  updateDiagnosis(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteDiagnosis(id: number): Promise<boolean>;

  // Surgery operations
  createSurgery(surgery: any): Promise<any>;
  getSurgery(id: number): Promise<any | undefined>;
  getSurgeriesByUserId(userId: number): Promise<any[]>;
  updateSurgery(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteSurgery(id: number): Promise<boolean>;

  // Evolution operations
  createEvolution(evolution: InsertEvolution): Promise<Evolution>;
  getEvolution(id: number): Promise<Evolution | undefined>;
  getEvolutionsByUserId(userId: number): Promise<Evolution[]>;
  getEvolutionsByProfileId(userId: number, profileId: number): Promise<Evolution[]>;
  deleteEvolution(id: number): Promise<boolean>;

  // Habit operations
  createHabit(habit: any): Promise<any>;
  getHabit(id: number): Promise<any | undefined>;
  getHabitsByUserId(userId: number): Promise<any[]>;
  updateHabit(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteHabit(id: number): Promise<boolean>;

  // Allergies operations
  createAllergy(allergy: any): Promise<any>;
  getAllergy(id: number): Promise<any | undefined>;
  getAllergiesByUserId(userId: number): Promise<any[]>;
  getAllergiesByProfileId(profileId: number): Promise<any[]>;
  updateAllergy(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteAllergy(id: number): Promise<boolean>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByUserId(userId: number): Promise<Appointment[]>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;

  // Analytics operations
  getAnalyticsData(userId: number, range?: string): Promise<any>;

  // Notification operations
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getRecentAbnormalMetrics(since: Date): Promise<HealthMetric[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createUserSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateUserSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
  cancelUserSubscription(id: number): Promise<Subscription | undefined>;
  incrementProfileCount(subscriptionId: number): Promise<number>;
  incrementUploadCount(subscriptionId: number, profileId: number): Promise<number>;
  canCreateProfile(userId: number): Promise<boolean>;
  canUploadExam(userId: number, profileId: number): Promise<boolean>;
  getAllSubscriptionsByStripeId(stripeSubscriptionId: string): Promise<Subscription[]>;
  updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;

  // Doctor Dashboard
  getDoctorDashboardStats(userId: number): Promise<{
    totalPatients: number;
    patientsNeedingCheckup: number;
    patientsList: { id: number; name: string; lastExamDate: Date | null }[];
  }>;

  // Doctor operations
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorsByUserId(userId: number): Promise<Doctor[]>;
  updateDoctor(id: number, data: Partial<Doctor>): Promise<Doctor | undefined>;
  deleteDoctor(id: number): Promise<boolean>;
  getDefaultDoctorForUser(userId: number): Promise<Doctor | undefined>;
  setDefaultDoctor(userId: number, doctorId: number): Promise<boolean>;

  // Clinic operations
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  getClinic(id: number): Promise<Clinic | undefined>;
  getClinicByAdminId(userId: number): Promise<Clinic | undefined>;
  updateClinic(id: number, data: Partial<Clinic>): Promise<Clinic | undefined>;
  addClinicMember(clinicId: number, userId: number): Promise<boolean>;
  removeClinicMember(clinicId: number, userId: number): Promise<boolean>;
  getClinicMembers(clinicId: number): Promise<User[]>;

  // Clinic invitation operations
  createClinicInvitation(invitation: InsertClinicInvitation): Promise<ClinicInvitation>;
  getClinicInvitation(id: number): Promise<ClinicInvitation | undefined>;
  getClinicInvitationByToken(token: string): Promise<ClinicInvitation | undefined>;
  updateClinicInvitation(id: number, data: Partial<ClinicInvitation>): Promise<ClinicInvitation | undefined>;
  getClinicInvitations(clinicId: number): Promise<ClinicInvitation[]>;

  // Triage operations
  createTriageRecord(record: any): Promise<any>;
  getTriageByAppointmentId(appointmentId: number): Promise<any | null>;
  updateTriageRecord(id: number, record: Partial<any>): Promise<any | undefined>;
  getTriageHistoryByProfileId(profileId: number): Promise<any[]>;

  // Document operations
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescriptionsByProfileId(profileId: number): Promise<Prescription[]>;
  updatePrescriptionStatus(id: number, status: string): Promise<Prescription | undefined>;

  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificatesByProfileId(profileId: number): Promise<Certificate[]>;
  updateCertificateStatus(id: number, status: string): Promise<Certificate | undefined>;

  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<number, Profile>;
  private exams: Map<number, Exam>;
  private examResults: Map<number, ExamResult>;
  private healthMetricsMap: Map<number, HealthMetric>;
  private notificationsMap: Map<number, Notification>;
  private subscriptionPlansMap: Map<number, SubscriptionPlan>;
  private subscriptionsMap: Map<number, Subscription>;
  private diagnosesMap: Map<number, any>;
  private surgeriesMap: Map<number, any>;
  private evolutionsMap: Map<number, Evolution>;
  private appointmentsMap: Map<number, Appointment>;
  private habitsMap: Map<number, any>;
  private doctorsMap: Map<number, Doctor>;
  private clinicsMap: Map<number, Clinic>;
  private clinicInvitationsMap: Map<number, ClinicInvitation>;
  private triageRecordsMap: Map<number, any>;
  private prescriptionsMap: Map<number, Prescription>;
  private certificatesMap: Map<number, Certificate>;
  private allergiesMap: Map<number, any>;
  sessionStore: SessionStore;

  private userIdCounter: number = 1;
  private profileIdCounter: number = 1;
  private examIdCounter: number = 1;
  private examResultIdCounter: number = 1;
  private healthMetricIdCounter: number = 1;
  private notificationIdCounter: number = 1;
  private subscriptionPlanIdCounter: number = 1;
  private subscriptionIdCounter: number = 1;
  private diagnosisIdCounter: number = 1;
  private surgeryIdCounter: number = 1;
  private evolutionIdCounter: number = 1;
  private appointmentIdCounter: number = 1;
  private habitIdCounter: number = 1;
  private doctorIdCounter: number = 1;
  private clinicIdCounter: number = 1;
  private clinicInvitationIdCounter: number = 1;
  private triageIdCounter: number = 1;
  private prescriptionIdCounter: number = 1;
  private certificateIdCounter: number = 1;
  private allergyIdCounter: number = 1;


  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.exams = new Map();
    this.examResults = new Map();
    this.healthMetricsMap = new Map();
    this.notificationsMap = new Map();

    this.subscriptionPlansMap = new Map();
    this.subscriptionsMap = new Map();
    this.diagnosesMap = new Map();
    this.surgeriesMap = new Map();
    this.evolutionsMap = new Map();
    this.appointmentsMap = new Map();
    this.habitsMap = new Map();
    this.doctorsMap = new Map();
    this.clinicsMap = new Map();
    this.clinicInvitationsMap = new Map();
    this.clinicInvitationsMap = new Map();
    this.triageRecordsMap = new Map();
    this.prescriptionsMap = new Map();
    this.certificatesMap = new Map();
    this.allergiesMap = new Map();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add subscription plans
    this._createDefaultSubscriptionPlans();
  }

  private async _createDefaultSubscriptionPlans() {
    // Plano Gratuito
    await this.createSubscriptionPlan({
      name: "Gratuito",
      description: "Ideal para começar e organizar sua rotina",
      maxProfiles: 20,
      maxUploadsPerProfile: 10,
      price: 0,
      interval: "month",
      features: ["Limite de 20 pacientes", "10 uploads por paciente", "Análise de 1 página por upload", "Agenda básica"],
      isActive: true
    });

    // Plano Profissional de Saúde
    await this.createSubscriptionPlan({
      name: "Profissional de Saúde",
      description: "Ideal para médicos e terapeutas em carreira solo",
      maxProfiles: -1,
      maxUploadsPerProfile: -1,
      price: 9900, // R$ 99,00
      interval: "month",
      features: ["Pacientes ilimitados", "Extrações por IA ilimitadas", "Prontuário inteligente completo", "Agenda inteligente com lembretes", "Suporte prioritário via WhatsApp"],
      isActive: true
    });

    // Plano Clínica Multiprofissional (até 5 profissionais)
    await this.createSubscriptionPlan({
      name: "Clínica Multiprofissional",
      description: "Gestão completa para clínicas pequenas",
      maxProfiles: -1,
      maxUploadsPerProfile: -1,
      price: 29900, // R$ 299,00
      interval: "month",
      features: ["Tudo do plano Profissional", "Até 5 profissionais inclusos", "Conta administradora", "Gerenciamento de equipe", "Relatórios consolidados"],
      isActive: true
    });

    // Plano Clínica Multiprofissional+ (5+ profissionais)
    await this.createSubscriptionPlan({
      name: "Clínica Multiprofissional+",
      description: "Gestão completa para clínicas maiores",
      maxProfiles: -1,
      maxUploadsPerProfile: -1,
      price: 49900, // R$ 499,00
      interval: "month",
      features: ["Tudo do plano Profissional", "Profissionais ilimitados (5+)", "Conta administradora", "Gerenciamento de equipe avançado", "Relatórios consolidados", "Suporte prioritário"],
      isActive: true
    });

    // Plano Hospitais
    await this.createSubscriptionPlan({
      name: "Hospitais",
      description: "Solução enterprise para grandes instituições",
      maxProfiles: -1,
      maxUploadsPerProfile: -1,
      price: 99900, // R$ 999,00
      interval: "month",
      features: ["Profissionais ilimitados", "Integração HL7/FHIR", "Análise de dados populacional", "Gestor de conta dedicado", "SLA de suporte 24/7"],
      isActive: true
    });
  }

  // Notification Helpers - MemStorage
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return Array.from(this.appointmentsMap.values()).filter(a => a.date === date);
  }

  async getRecentAbnormalMetrics(since: Date): Promise<HealthMetric[]> {
    return Array.from(this.healthMetricsMap.values()).filter(m =>
      new Date(m.date) > since && m.status !== 'normal'
    );
  }



  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      id,
      username: user.username,
      password: user.password,
      fullName: user.fullName || null,
      email: user.email || null,
      createdAt: new Date(),
      birthDate: null,
      gender: null,
      phoneNumber: null,
      address: null,
      activeProfileId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      role: (user as any).role || "user",
      clinicId: null,
      clinicRole: null,
      preferences: null,
      crm: null,
      specialty: null
    };
    this.users.set(id, newUser);

    return this.users.get(id)!;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Profile operations
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = this.profileIdCounter++;
    const newProfile: Profile = {
      id,
      userId: profile.userId,
      name: profile.name,
      relationship: profile.relationship || null,
      birthDate: profile.birthDate || null,
      gender: profile.gender || null,
      bloodType: profile.bloodType || null,
      planType: profile.planType || null,
      isDefault: profile.isDefault || false,
      createdAt: new Date(),
      cpf: (profile as any).cpf || null,
      rg: (profile as any).rg || null,
      phone: (profile as any).phone || null,
      landline: (profile as any).landline || null,
      email: (profile as any).email || null,
      cep: (profile as any).cep || null,
      street: (profile as any).street || null,
      number: (profile as any).number || null,
      complement: (profile as any).complement || null,
      neighborhood: (profile as any).neighborhood || null,
      city: (profile as any).city || null,
      state: (profile as any).state || null,
      guardianName: (profile as any).guardianName || null,
      emergencyPhone: (profile as any).emergencyPhone || null,
      profession: (profile as any).profession || null,
      maritalStatus: (profile as any).maritalStatus || null,
      insuranceCardNumber: (profile as any).insuranceCardNumber || null,
      insuranceValidity: (profile as any).insuranceValidity || null,
      insuranceName: (profile as any).insuranceName || null,
      referralSource: (profile as any).referralSource || null,
      notes: (profile as any).notes || null,
    };

    // If this is set as default, unset default on other profiles
    if (newProfile.isDefault) {
      const userProfiles = await this.getProfilesByUserId(profile.userId);
      for (const p of userProfiles) {
        if (p.isDefault) {
          await this.updateProfile(p.id, { isDefault: false });
        }
      }
    }

    this.profiles.set(id, newProfile);
    return newProfile;
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async getProfilesByUserId(userId: number): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(
      (profile) => profile.userId === userId
    );
  }

  async updateProfile(id: number, profileData: Partial<Profile>): Promise<Profile | undefined> {
    const profile = await this.getProfile(id);
    if (!profile) return undefined;

    // If setting this as default, unset other defaults
    if (profileData.isDefault) {
      const userProfiles = await this.getProfilesByUserId(profile.userId);
      for (const p of userProfiles) {
        if (p.id !== id && p.isDefault) {
          p.isDefault = false;
          this.profiles.set(p.id, p);
        }
      }
    }

    const updatedProfile = { ...profile, ...profileData };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteProfile(id: number): Promise<boolean> {
    const profile = await this.getProfile(id);
    if (!profile) return false;

    // Don't delete the default profile
    if (profile.isDefault) return false;

    return this.profiles.delete(id);
  }

  async getDefaultProfileForUser(userId: number): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.userId === userId && profile.isDefault
    );
  }

  // Bulk import operations
  async createProfilesBulk(profiles: Partial<InsertProfile>[]): Promise<Profile[]> {
    const createdProfiles: Profile[] = [];
    for (const profileData of profiles) {
      try {
        if (!profileData.userId || !profileData.name) continue;
        const profile = await this.createProfile(profileData as InsertProfile);
        createdProfiles.push(profile);
      } catch (error) {
        logger.error('Error creating profile in bulk:', error);
      }
    }
    return createdProfiles;
  }

  async findDuplicateProfiles(userId: number, names: string[], cpfs: (string | null)[]): Promise<Profile[]> {
    const userProfiles = await this.getProfilesByUserId(userId);
    const duplicates: Profile[] = [];

    for (const profile of userProfiles) {
      if (profile.cpf && cpfs.includes(profile.cpf)) {
        duplicates.push(profile);
        continue;
      }

      const profileNameLower = profile.name.toLowerCase().trim();
      for (const name of names) {
        const nameLower = name.toLowerCase().trim();
        if (profileNameLower === nameLower) {
          duplicates.push(profile);
          break;
        }
      }
    }

    return duplicates;
  }

  // Exam operations
  async createExam(exam: InsertExam): Promise<Exam> {
    const id = this.examIdCounter++;
    const newExam: Exam = {
      ...exam,
      id,
      uploadDate: new Date(),
      originalContent: exam.originalContent || null,
      laboratoryName: exam.laboratoryName || null,
      examDate: exam.examDate || null,
      requestingPhysician: exam.requestingPhysician || null,
      profileId: exam.profileId ?? null,
      filePath: exam.filePath ?? null,
      processingError: (exam as any).processingError || null,
    };
    this.exams.set(id, newExam);
    return newExam;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByUserId(userId: number, profileId?: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(
      (exam) => exam.userId === userId && (!profileId || exam.profileId === profileId)
    );
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const exam = await this.getExam(id);
    if (!exam) return undefined;
    const updatedExam = { ...exam, ...examData };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    return this.exams.delete(id);
  }

  // Exam results operations
  async createExamResult(result: InsertExamResult): Promise<ExamResult> {
    const id = this.examResultIdCounter++;
    const newResult: ExamResult = {
      id,
      examId: result.examId,
      analysisDate: new Date(),
      summary: result.summary || null,
      detailedAnalysis: result.detailedAnalysis || null,
      recommendations: result.recommendations || null,
      healthMetrics: result.healthMetrics || null,
      aiProvider: result.aiProvider
    };
    this.examResults.set(id, newResult);
    return newResult;
  }

  async getExamResult(id: number): Promise<ExamResult | undefined> {
    return this.examResults.get(id);
  }

  async getExamResultByExamId(examId: number): Promise<ExamResult | undefined> {
    return Array.from(this.examResults.values()).find(
      (result) => result.examId === examId
    );
  }

  // Health metrics operations
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const id = this.healthMetricIdCounter++;
    const newMetric: HealthMetric = {
      id,
      name: metric.name,
      value: metric.value,
      userId: metric.userId,
      examId: metric.examId || null,
      date: metric.date || new Date(),
      status: metric.status || null,
      unit: metric.unit || null,
      change: metric.change || null,
      profileId: metric.profileId ?? null,
      referenceMin: metric.referenceMin || null,
      referenceMax: metric.referenceMax || null
    };
    this.healthMetricsMap.set(id, newMetric);
    return newMetric;
  }

  async getHealthMetricsByUserId(userId: number, profileId?: number): Promise<HealthMetric[]> {
    return Array.from(this.healthMetricsMap.values()).filter(
      (metric) => metric.userId === userId && (!profileId || metric.profileId === profileId)
    );
  }

  async getLatestHealthMetrics(userId: number, limit: number, profileId?: number): Promise<HealthMetric[]> {
    const userMetrics = await this.getHealthMetricsByUserId(userId, profileId);
    const metricsByName = new Map<string, HealthMetric>();
    for (const metric of userMetrics) {
      const existingMetric = metricsByName.get(metric.name);
      if (!existingMetric || metric.date > existingMetric.date) {
        metricsByName.set(metric.name, metric);
      }
    }
    return Array.from(metricsByName.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async deleteHealthMetric(id: number): Promise<boolean> {
    return this.healthMetricsMap.delete(id);
  }

  async deleteAllHealthMetricsByUserId(userId: number, profileId?: number): Promise<number> {
    const metrics = await this.getHealthMetricsByUserId(userId, profileId);
    let count = 0;
    for (const metric of metrics) {
      if (await this.deleteHealthMetric(metric.id)) count++;
    }
    return count;
  }

  async deleteHealthMetricsByExamId(examId: number): Promise<number> {
    const metrics = Array.from(this.healthMetricsMap.values()).filter(m => m.examId === examId);
    let count = 0;
    for (const metric of metrics) {
      if (this.healthMetricsMap.delete(metric.id)) count++;
    }
    return count;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = {
      id,
      date: new Date(),
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      read: notification.read || false
    };
    this.notificationsMap.set(id, newNotification);
    return newNotification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return undefined;
    const updatedNotification = { ...notification, read: true };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    Array.from(this.notificationsMap.entries()).forEach(([id, notification]) => {
      if (notification.userId === userId && !notification.read) {
        this.notificationsMap.set(id, { ...notification, read: true });
      }
    });
  }

  // Diagnosis operations
  async createDiagnosis(diagnosis: any): Promise<any> {
    const id = this.diagnosisIdCounter++;
    const newDiagnosis = { ...diagnosis, id };
    this.diagnosesMap.set(id, newDiagnosis);
    return newDiagnosis;
  }

  async getDiagnosis(id: number): Promise<any | undefined> {
    return this.diagnosesMap.get(id);
  }

  async getDiagnosesByUserId(userId: number): Promise<any[]> {
    return Array.from(this.diagnosesMap.values()).filter(d => d.userId === userId);
  }

  async updateDiagnosis(id: number, data: Partial<any>): Promise<any | undefined> {
    const diagnosis = await this.getDiagnosis(id);
    if (!diagnosis) return undefined;
    const updated = { ...diagnosis, ...data };
    this.diagnosesMap.set(id, updated);
    return updated;
  }

  async deleteDiagnosis(id: number): Promise<boolean> {
    return this.diagnosesMap.delete(id);
  }

  // Surgery operations
  async createSurgery(surgery: any): Promise<any> {
    const id = this.surgeryIdCounter++;
    const newSurgery = { ...surgery, id };
    this.surgeriesMap.set(id, newSurgery);
    return newSurgery;
  }

  async getSurgery(id: number): Promise<any | undefined> {
    return this.surgeriesMap.get(id);
  }

  async getSurgeriesByUserId(userId: number): Promise<any[]> {
    return Array.from(this.surgeriesMap.values()).filter(s => s.userId === userId);
  }

  async updateSurgery(id: number, data: Partial<any>): Promise<any | undefined> {
    const surgery = await this.getSurgery(id);
    if (!surgery) return undefined;
    const updated = { ...surgery, ...data };
    this.surgeriesMap.set(id, updated);
    return updated;
  }

  async deleteSurgery(id: number): Promise<boolean> {
    return this.surgeriesMap.delete(id);
  }

  // Evolution operations
  async createEvolution(evolution: InsertEvolution): Promise<Evolution> {
    const id = this.evolutionIdCounter++;
    const newEvolution: Evolution = { ...evolution, id, createdAt: new Date(), date: evolution.date || new Date() };
    this.evolutionsMap.set(id, newEvolution);
    return newEvolution;
  }

  async getEvolution(id: number): Promise<Evolution | undefined> {
    return this.evolutionsMap.get(id);
  }

  async getEvolutionsByUserId(userId: number): Promise<Evolution[]> {
    return Array.from(this.evolutionsMap.values()).filter(e => e.userId === userId);
  }

  async getEvolutionsByProfileId(userId: number, profileId: number): Promise<Evolution[]> {
    return Array.from(this.evolutionsMap.values()).filter(e => e.userId === userId && e.profileId === profileId);
  }

  async deleteEvolution(id: number): Promise<boolean> {
    return this.evolutionsMap.delete(id);
  }

  // Habit operations
  async createHabit(habit: any): Promise<any> {
    const id = this.habitIdCounter++;
    const newHabit = { ...habit, id, createdAt: new Date() };
    this.habitsMap.set(id, newHabit);
    return newHabit;
  }

  async getHabit(id: number): Promise<any | undefined> {
    return this.habitsMap.get(id);
  }

  async getHabitsByUserId(userId: number): Promise<any[]> {
    return Array.from(this.habitsMap.values()).filter(h => h.userId === userId);
  }

  async updateHabit(id: number, data: Partial<any>): Promise<any | undefined> {
    const habit = await this.getHabit(id);
    if (!habit) return undefined;
    const updated = { ...habit, ...data };
    this.habitsMap.set(id, updated);
    return updated;
  }

  async deleteHabit(id: number): Promise<boolean> {
    return this.habitsMap.delete(id);
  }

  // Allergies
  async createAllergy(a: any): Promise<any> {
    const id = this.allergyIdCounter++;
    const newA = { ...a, id, createdAt: new Date() };
    this.allergiesMap.set(id, newA);
    return newA;
  }
  async getAllergy(id: number): Promise<any | undefined> {
    return this.allergiesMap.get(id);
  }
  async getAllergiesByUserId(userId: number): Promise<any[]> {
    return Array.from(this.allergiesMap.values()).filter(a => a.userId === userId);
  }
  async getAllergiesByProfileId(profileId: number): Promise<any[]> {
    return Array.from(this.allergiesMap.values()).filter(a => a.profileId === profileId);
  }
  async updateAllergy(id: number, data: Partial<any>): Promise<any | undefined> {
    const a = await this.getAllergy(id);
    if (!a) return undefined;
    const updated = { ...a, ...data };
    this.allergiesMap.set(id, updated);
    return updated;
  }
  async deleteAllergy(id: number): Promise<boolean> {
    return this.allergiesMap.delete(id);
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const newAppointment: Appointment = { ...appointment, id, createdAt: new Date() };
    this.appointmentsMap.set(id, newAppointment);
    return newAppointment;
  }

  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointmentsMap.values()).filter(app => app.userId === userId);
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointmentsMap.get(id);
    if (!appointment) return undefined;
    const updated = { ...appointment, ...appointmentData };
    this.appointmentsMap.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointmentsMap.delete(id);
  }

  // Subscription operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanIdCounter++;
    const newPlan: SubscriptionPlan = {
      ...plan,
      id,
      interval: plan.interval || "month",
      stripePriceId: plan.stripePriceId || null,
      features: plan.features || null,
      isActive: plan.isActive ?? true,
      createdAt: new Date()
    };
    this.subscriptionPlansMap.set(id, newPlan);
    return newPlan;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlansMap.values()).filter(plan => plan.isActive);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlansMap.get(id);
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values()).find(sub => sub.userId === userId && sub.status === "active");
  }

  async createUserSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const newSubscription: Subscription = {
      ...subscription,
      id,
      status: subscription.status || "active",
      currentPeriodStart: subscription.currentPeriodStart || now,
      currentPeriodEnd: subscription.currentPeriodEnd || periodEnd,
      stripeCustomerId: subscription.stripeCustomerId || null,
      stripeSubscriptionId: subscription.stripeSubscriptionId || null,
      createdAt: now,
      canceledAt: null,
      profilesCreated: 0,
      uploadsCount: {}
    };
    this.subscriptionsMap.set(id, newSubscription);
    return newSubscription;
  }

  async updateUserSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) return undefined;
    const updated = { ...subscription, ...data };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async cancelUserSubscription(id: number): Promise<Subscription | undefined> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) return undefined;
    const updated = { ...subscription, status: "canceled", canceledAt: new Date() };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async incrementProfileCount(subscriptionId: number): Promise<number> {
    const subscription = this.subscriptionsMap.get(subscriptionId);
    if (!subscription) return 0;
    subscription.profilesCreated++;
    return subscription.profilesCreated;
  }

  async incrementUploadCount(subscriptionId: number, profileId: number): Promise<number> {
    const subscription = this.subscriptionsMap.get(subscriptionId);
    if (!subscription) return 0;
    const profileIdStr = profileId.toString();
    const uploadsCount = subscription.uploadsCount as Record<string, number>;
    uploadsCount[profileIdStr] = (uploadsCount[profileIdStr] || 0) + 1;
    return uploadsCount[profileIdStr];
  }

  async canCreateProfile(userId: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;
    if (!subscription.planId) return false;
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (!plan) return false;
    if (plan.maxProfiles === -1) return true;
    return subscription.profilesCreated < plan.maxProfiles;
  }

  async canUploadExam(userId: number, profileId: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;
    if (!subscription.planId) return false;
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (!plan) return false;
    if (plan.maxUploadsPerProfile === -1) return true;
    const profileIdStr = profileId.toString();
    const uploadsCount = subscription.uploadsCount as Record<string, number>;
    return (uploadsCount[profileIdStr] || 0) < plan.maxUploadsPerProfile;
  }

  async getAllSubscriptionsByStripeId(stripeSubscriptionId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptionsMap.values()).filter(s => s.stripeSubscriptionId === stripeSubscriptionId);
  }

  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const plan = this.subscriptionPlansMap.get(id);
    if (!plan) return undefined;
    const updated = { ...plan, ...data };
    this.subscriptionPlansMap.set(id, updated);
    return updated;
  }

  async getDoctorDashboardStats(userId: number): Promise<{
    totalPatients: number;
    patientsNeedingCheckup: number;
    patientsList: { id: number; name: string; lastExamDate: Date | null }[];
  }> {
    const userProfiles = await this.getProfilesByUserId(userId);
    const totalPatients = userProfiles.length;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const patientsList = await Promise.all(userProfiles.map(async (profile) => {
      const profileExams = await this.getExamsByUserId(userId, profile.id);
      let lastExamDate: Date | null = null;
      if (profileExams.length > 0) {
        const dates = profileExams
          .map(e => e.examDate ? new Date(e.examDate).getTime() : new Date(e.uploadDate).getTime())
          .filter(t => !isNaN(t));
        if (dates.length > 0) lastExamDate = new Date(Math.max(...dates));
      }
      return { id: profile.id, name: profile.name, lastExamDate };
    }));

    const needingCheckup = patientsList.filter(p => !p.lastExamDate || p.lastExamDate < oneYearAgo);

    return {
      totalPatients,
      patientsNeedingCheckup: needingCheckup.length,
      patientsList: needingCheckup
    };
  }

  // Doctor operations
  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorIdCounter++;
    const newDoctor: Doctor = { ...doctor, id, createdAt: new Date() };
    this.doctorsMap.set(id, newDoctor);
    return newDoctor;
  }

  async getDoctor(id: number): Promise<Doctor | undefined> { return this.doctorsMap.get(id); }
  async getDoctorsByUserId(userId: number): Promise<Doctor[]> {
    return Array.from(this.doctorsMap.values()).filter(d => d.userId === userId);
  }

  async updateDoctor(id: number, data: Partial<Doctor>): Promise<Doctor | undefined> {
    const doctor = this.doctorsMap.get(id);
    if (!doctor) return undefined;
    const updated = { ...doctor, ...data };
    this.doctorsMap.set(id, updated);
    return updated;
  }

  async deleteDoctor(id: number): Promise<boolean> { return this.doctorsMap.delete(id); }

  async getDefaultDoctorForUser(userId: number): Promise<Doctor | undefined> {
    return Array.from(this.doctorsMap.values()).find(d => d.userId === userId && d.isDefault);
  }

  async setDefaultDoctor(userId: number, doctorId: number): Promise<boolean> {
    const doctors = await this.getDoctorsByUserId(userId);
    for (const d of doctors) {
      d.isDefault = (d.id === doctorId);
      this.doctorsMap.set(d.id, d);
    }
    return true;
  }

  // Clinic operations
  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const id = this.clinicIdCounter++;
    const newClinic: Clinic = {
      id,
      name: clinic.name,
      adminUserId: clinic.adminUserId,
      subscriptionId: clinic.subscriptionId || null,
      maxProfessionals: clinic.maxProfessionals || 5,
      createdAt: new Date()
    };
    this.clinicsMap.set(id, newClinic);

    // Update admin user to reference this clinic
    const adminUser = await this.getUser(clinic.adminUserId);
    if (adminUser) {
      await this.updateUser(clinic.adminUserId, { clinicId: id, clinicRole: 'admin' });
    }
    return newClinic;
  }

  async getClinic(id: number): Promise<Clinic | undefined> {
    return this.clinicsMap.get(id);
  }

  async getClinicByAdminId(userId: number): Promise<Clinic | undefined> {
    return Array.from(this.clinicsMap.values()).find(c => c.adminUserId === userId);
  }

  async updateClinic(id: number, data: Partial<Clinic>): Promise<Clinic | undefined> {
    const clinic = this.clinicsMap.get(id);
    if (!clinic) return undefined;
    const updated = { ...clinic, ...data };
    this.clinicsMap.set(id, updated);
    return updated;
  }

  async addClinicMember(clinicId: number, userId: number): Promise<boolean> {
    const clinic = await this.getClinic(clinicId);
    if (!clinic) return false;

    const members = await this.getClinicMembers(clinicId);
    if (members.length >= clinic.maxProfessionals) return false;

    const user = await this.getUser(userId);
    if (!user) return false;

    await this.updateUser(userId, { clinicId, clinicRole: 'member' });
    return true;
  }

  async removeClinicMember(clinicId: number, userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.clinicId !== clinicId) return false;
    if (user.clinicRole === 'admin') return false; // Can't remove admin

    await this.updateUser(userId, { clinicId: null, clinicRole: null });
    return true;
  }

  async getClinicMembers(clinicId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.clinicId === clinicId);
  }

  // Clinic invitation operations
  async createClinicInvitation(invitation: InsertClinicInvitation): Promise<ClinicInvitation> {
    const id = this.clinicInvitationIdCounter++;
    const newInvitation: ClinicInvitation = {
      id,
      clinicId: invitation.clinicId,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status || 'pending',
      createdAt: new Date(),
      expiresAt: invitation.expiresAt
    };
    this.clinicInvitationsMap.set(id, newInvitation);
    return newInvitation;
  }

  async getClinicInvitation(id: number): Promise<ClinicInvitation | undefined> {
    return this.clinicInvitationsMap.get(id);
  }

  async getClinicInvitationByToken(token: string): Promise<ClinicInvitation | undefined> {
    return Array.from(this.clinicInvitationsMap.values()).find(i => i.token === token);
  }

  async updateClinicInvitation(id: number, data: Partial<ClinicInvitation>): Promise<ClinicInvitation | undefined> {
    const invitation = this.clinicInvitationsMap.get(id);
    if (!invitation) return undefined;
    const updated = { ...invitation, ...data };
    this.clinicInvitationsMap.set(id, updated);
    return updated;
  }

  async getClinicInvitations(clinicId: number): Promise<ClinicInvitation[]> {
    return Array.from(this.clinicInvitationsMap.values()).filter(i => i.clinicId === clinicId);
  }

  // Triage operations
  async createTriageRecord(record: any): Promise<any> {
    const id = this.triageIdCounter++;
    const newRecord = {
      ...record,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.triageRecordsMap.set(id, newRecord);
    return newRecord;
  }

  async getTriageByAppointmentId(appointmentId: number): Promise<any | null> {
    const triage = Array.from(this.triageRecordsMap.values()).find(
      t => t.appointmentId === appointmentId
    );
    return triage || null;
  }

  async updateTriageRecord(id: number, record: Partial<any>): Promise<any | undefined> {
    const existing = this.triageRecordsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...record, updatedAt: new Date() };
    this.triageRecordsMap.set(id, updated);
    return updated;
  }

  async getTriageHistoryByProfileId(profileId: number): Promise<any[]> {
    return Array.from(this.triageRecordsMap.values())
      .filter(t => t.profileId === profileId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: new Date(),
      stripeCustomerId: subscription.stripeCustomerId || null,
      stripeSubscriptionId: subscription.stripeSubscriptionId || null,
      status: subscription.status || 'active',
      canceledAt: null,
      profilesCreated: 0,
      uploadsCount: {}
    };
    this.subscriptionsMap.set(id, newSubscription);
    return newSubscription;
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values()).find(s => s.userId === userId);
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const sub = this.subscriptionsMap.get(id);
    if (!sub) return undefined;
    const updated = { ...sub, ...data };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async getAnalyticsData(userId: number, range: string = '30d'): Promise<any> {
    return {
      examsByType: [],
      activityData: [],
      summary: {
        totalPatients: 0,
        totalExams: 0,
        mostFrequentExam: "N/A"
      }
    };
  }


  // Document operations - MemStorage
  async createPrescription(p: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const newP: Prescription = {
      ...p,
      id,
      createdAt: new Date(),
      status: p.status || 'active',
      issueDate: p.issueDate || new Date(),
      doctorSpecialty: p.doctorSpecialty || null,
      observations: p.observations || null,
      pdfPath: p.pdfPath || null
    };
    this.prescriptionsMap.set(id, newP);
    return newP;
  }
  async getPrescriptionsByProfileId(profileId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptionsMap.values())
      .filter(p => p.profileId === profileId)
      .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }
  async updatePrescriptionStatus(id: number, status: string): Promise<Prescription | undefined> {
    const p = this.prescriptionsMap.get(id);
    if (!p) return undefined;
    const updated = { ...p, status };
    this.prescriptionsMap.set(id, updated);
    return updated;
  }

  async createCertificate(c: InsertCertificate): Promise<Certificate> {
    const id = this.certificateIdCounter++;
    const newC: Certificate = {
      ...c,
      id,
      createdAt: new Date(),
      status: c.status || 'active',
      issueDate: c.issueDate || new Date(),
      patientDoc: c.patientDoc || null,
      daysOff: c.daysOff || null,
      cid: c.cid || null,
      startTime: c.startTime || null,
      endTime: c.endTime || null,
      customText: c.customText || null,
      pdfPath: c.pdfPath || null
    };
    this.certificatesMap.set(id, newC);
    return newC;
  }
  async getCertificatesByProfileId(profileId: number): Promise<Certificate[]> {
    return Array.from(this.certificatesMap.values())
      .filter(c => c.profileId === profileId)
      .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }
  async updateCertificateStatus(id: number, status: string): Promise<Certificate | undefined> {
    const c = this.certificatesMap.get(id);
    if (!c) return undefined;
    const updated = { ...c, status };
    this.certificatesMap.set(id, updated);
    return updated;
  }

}

export class DatabaseStorage implements IStorage {

  // Notification Helpers - DatabaseStorage
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.date, date));
  }

  async getRecentAbnormalMetrics(since: Date): Promise<HealthMetric[]> {
    return await db.select().from(healthMetrics).where(
      and(
        gt(healthMetrics.date, since),
        ne(healthMetrics.status, 'normal')
      )
    );
  }


  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    this.setupDefaultSubscriptionPlans();
  }

  private async setupDefaultSubscriptionPlans() {
    try {
      // Ensure columns exist first
      await db.execute(sql`
        ALTER TABLE subscription_plans 
        ADD COLUMN IF NOT EXISTS promo_price INTEGER,
        ADD COLUMN IF NOT EXISTS promo_description TEXT
      `);

      const existingPlans = await this.getSubscriptionPlans();
      const standardPlans = [
        {
          name: "Gratuito",
          description: "Ideal para começar e organizar sua rotina",
          maxProfiles: 20,
          maxUploadsPerProfile: 10,
          price: 0,
          interval: "month",
          features: ["Limite de 20 pacientes", "10 uploads por paciente", "Análise de 1 página por upload", "Agenda básica"],
          promoPrice: null,
          promoDescription: null,
          isActive: true
        },
        {
          name: "Profissional de Saúde",
          description: "Ideal para médicos e terapeutas em carreira solo",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 9900,
          interval: "month",
          features: ["Pacientes ilimitados", "Extrações por IA ilimitadas", "Prontuário inteligente completo", "Agenda inteligente com lembretes", "Suporte prioritário via WhatsApp"],
          promoPrice: 4900,
          promoDescription: "no 1º mês",
          isActive: true
        },
        {
          name: "Clínica Multiprofissional",
          description: "Gestão completa para clínicas pequenas",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 29900,
          interval: "month",
          features: ["Tudo do plano Profissional", "Até 5 profissionais inclusos", "Conta administradora", "Gerenciamento de equipe", "Relatórios consolidados"],
          promoPrice: null,
          promoDescription: null,
          isActive: true
        },
        {
          name: "Clínica Multiprofissional+",
          description: "Gestão completa para clínicas maiores",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 49900,
          interval: "month",
          features: ["Tudo do plano Profissional", "Profissionais ilimitados (5+)", "Conta administradora", "Gerenciamento de equipe avançado", "Relatórios consolidados", "Suporte prioritário"],
          promoPrice: null,
          promoDescription: null,
          isActive: true
        },
        {
          name: "Hospitais",
          description: "Solução enterprise para grandes instituições",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 99900,
          interval: "month",
          features: ["Profissionais ilimitados", "Integração HL7/FHIR", "Análise de dados populacional", "Gestor de conta dedicado", "SLA de suporte 24/7"],
          promoPrice: null,
          promoDescription: null,
          isActive: true
        }
      ];

      for (const std of standardPlans) {
        const existing = existingPlans.find(p => p.name === std.name);
        if (existing) {
          await db.update(subscriptionPlans).set(std).where(eq(subscriptionPlans.id, existing.id));
        } else {
          await this.createSubscriptionPlan(std as InsertSubscriptionPlan);
        }
      }
    } catch (error) {
      console.error("Error setting up subscription plans:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  // Profile operations
  async createProfile(profile: InsertProfile): Promise<Profile> {
    if (profile.isDefault) await db.update(profiles).set({ isDefault: false }).where(eq(profiles.userId, profile.userId));
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }
  async getProfilesByUserId(userId: number): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.userId, userId));
  }
  async updateProfile(id: number, profile: Partial<Profile>): Promise<Profile | undefined> {
    if (profile.isDefault) {
      const p = await this.getProfile(id);
      if (p) await db.update(profiles).set({ isDefault: false }).where(eq(profiles.userId, p.userId));
    }
    const [updated] = await db.update(profiles).set(profile).where(eq(profiles.id, id)).returning();
    return updated;
  }
  async deleteProfile(id: number): Promise<boolean> {
    const p = await this.getProfile(id);
    if (!p || p.isDefault) return false;
    await db.delete(profiles).where(eq(profiles.id, id));
    return true;
  }
  async getDefaultProfileForUser(userId: number): Promise<Profile | undefined> {
    const [p] = await db.select().from(profiles).where(and(eq(profiles.userId, userId), eq(profiles.isDefault, true)));
    return p;
  }

  // Bulk / Duplicates
  async createProfilesBulk(profilesInput: Partial<InsertProfile>[]): Promise<Profile[]> {
    const created: Profile[] = [];
    for (const p of profilesInput) {
      const [newP] = await db.insert(profiles).values(p as any).returning();
      created.push(newP);
    }
    return created;
  }
  async findDuplicateProfiles(userId: number, names: string[], cpfs: (string | null)[]): Promise<Profile[]> {
    const userProfiles = await this.getProfilesByUserId(userId);
    return userProfiles.filter(p => (p.cpf && cpfs.includes(p.cpf)) || names.some(n => n.toLowerCase().trim() === p.name.toLowerCase().trim()));
  }

  // Exam operations
  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }
  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }
  async getExamsByUserId(userId: number, profileId?: number): Promise<Exam[]> {
    let q = db.select().from(exams).where(eq(exams.userId, userId));
    if (profileId) q = (q as any).where(eq(exams.profileId, profileId));
    return await q;
  }
  async updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined> {
    const [updated] = await db.update(exams).set(exam).where(eq(exams.id, id)).returning();
    return updated;
  }
  async deleteExam(id: number): Promise<boolean> {
    const exists = await this.getExam(id);
    if (!exists) return false;
    await db.delete(exams).where(eq(exams.id, id));
    return true;
  }

  // Exam results
  async createExamResult(result: InsertExamResult): Promise<ExamResult> {
    const [newR] = await db.insert(examResults).values(result).returning();
    return newR;
  }
  async getExamResult(id: number): Promise<ExamResult | undefined> {
    const [r] = await db.select().from(examResults).where(eq(examResults.id, id));
    return r;
  }
  async getExamResultByExamId(examId: number): Promise<ExamResult | undefined> {
    const [r] = await db.select()
      .from(examResults)
      .where(eq(examResults.examId, examId))
      .orderBy(desc(examResults.id));
    return r;
  }

  // Health Metrics
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [newM] = await db.insert(healthMetrics).values(metric).returning();
    return newM;
  }
  async getHealthMetricsByUserId(userId: number, profileId?: number): Promise<HealthMetric[]> {
    let q = db.select().from(healthMetrics).where(eq(healthMetrics.userId, userId));
    if (profileId) q = (q as any).where(eq(healthMetrics.profileId, profileId));
    return await q;
  }
  async getLatestHealthMetrics(userId: number, limit: number, profileId?: number): Promise<HealthMetric[]> {
    const metrics = await this.getHealthMetricsByUserId(userId, profileId);
    const latest = new Map<string, HealthMetric>();
    for (const m of metrics) {
      const ex = latest.get(m.name);
      if (!ex || m.date > ex.date) latest.set(m.name, m);
    }
    return Array.from(latest.values()).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }
  async deleteHealthMetric(id: number): Promise<boolean> {
    await db.delete(healthMetrics).where(eq(healthMetrics.id, id));
    return true;
  }
  async deleteAllHealthMetricsByUserId(userId: number, profileId?: number): Promise<number> {
    const where = profileId ? and(eq(healthMetrics.userId, userId), eq(healthMetrics.profileId, profileId)) : eq(healthMetrics.userId, userId);
    const res = await db.delete(healthMetrics).where(where);
    return res.rowCount || 0;
  }
  async deleteHealthMetricsByExamId(examId: number): Promise<number> {
    const res = await db.delete(healthMetrics).where(eq(healthMetrics.examId, examId));
    return res.rowCount || 0;
  }

  // Notifications
  async createNotification(n: InsertNotification): Promise<Notification> {
    const [newN] = await db.insert(notifications).values(n).returning();
    return newN;
  }
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.date));
  }
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  // Diagnoses
  async createDiagnosis(d: any): Promise<any> {
    const [newD] = await db.insert(diagnoses).values(d).returning();
    return newD;
  }
  async getDiagnosis(id: number): Promise<any | undefined> {
    const [d] = await db.select().from(diagnoses).where(eq(diagnoses.id, id));
    return d;
  }
  async getDiagnosesByUserId(userId: number): Promise<any[]> {
    return await db.select().from(diagnoses).where(eq(diagnoses.userId, userId)).orderBy(desc(diagnoses.diagnosisDate));
  }
  async updateDiagnosis(id: number, data: Partial<any>): Promise<any | undefined> {
    const [updated] = await db.update(diagnoses).set(data).where(eq(diagnoses.id, id)).returning();
    return updated;
  }
  async deleteDiagnosis(id: number): Promise<boolean> {
    await db.delete(diagnoses).where(eq(diagnoses.id, id));
    return true;
  }

  // Surgeries
  async createSurgery(s: any): Promise<any> {
    const [newS] = await db.insert(surgeries).values(s).returning();
    return newS;
  }
  async getSurgery(id: number): Promise<any | undefined> {
    const [s] = await db.select().from(surgeries).where(eq(surgeries.id, id));
    return s;
  }
  async getSurgeriesByUserId(userId: number): Promise<any[]> {
    return await db.select().from(surgeries).where(eq(surgeries.userId, userId)).orderBy(desc(surgeries.surgeryDate));
  }
  async updateSurgery(id: number, data: Partial<any>): Promise<any | undefined> {
    const [updated] = await db.update(surgeries).set(data).where(eq(surgeries.id, id)).returning();
    return updated;
  }
  async deleteSurgery(id: number): Promise<boolean> {
    await db.delete(surgeries).where(eq(surgeries.id, id));
    return true;
  }

  // Evolutions
  async createEvolution(e: InsertEvolution): Promise<Evolution> {
    const [newE] = await db.insert(evolutions).values(e).returning();
    return newE;
  }
  async getEvolution(id: number): Promise<Evolution | undefined> {
    const [e] = await db.select().from(evolutions).where(eq(evolutions.id, id));
    return e;
  }
  async getEvolutionsByUserId(userId: number): Promise<Evolution[]> {
    return await db.select().from(evolutions).where(eq(evolutions.userId, userId)).orderBy(desc(evolutions.date));
  }
  async getEvolutionsByProfileId(userId: number, profileId: number): Promise<Evolution[]> {
    return await db.select().from(evolutions).where(and(eq(evolutions.userId, userId), eq(evolutions.profileId, profileId))).orderBy(desc(evolutions.date));
  }
  async deleteEvolution(id: number): Promise<boolean> {
    await db.delete(evolutions).where(eq(evolutions.id, id));
    return true;
  }

  // Habits
  async createHabit(h: any): Promise<any> {
    const [newH] = await db.insert(habits).values(h).returning();
    return newH;
  }
  async getHabit(id: number): Promise<any | undefined> {
    const [h] = await db.select().from(habits).where(eq(habits.id, id));
    return h;
  }
  async getHabitsByUserId(userId: number): Promise<any[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }
  async updateHabit(id: number, data: Partial<any>): Promise<any | undefined> {
    const [updated] = await db.update(habits).set(data).where(eq(habits.id, id)).returning();
    return updated;
  }
  async deleteHabit(id: number): Promise<boolean> {
    await db.delete(habits).where(eq(habits.id, id));
    return true;
  }

  // Allergies
  async createAllergy(a: any): Promise<any> {
    const [newA] = await db.insert(allergies).values(a).returning();
    return newA;
  }
  async getAllergy(id: number): Promise<any | undefined> {
    const [a] = await db.select().from(allergies).where(eq(allergies.id, id));
    return a;
  }
  async getAllergiesByUserId(userId: number): Promise<any[]> {
    return await db.select().from(allergies).where(eq(allergies.userId, userId));
  }
  async getAllergiesByProfileId(profileId: number): Promise<any[]> {
    return await db.select().from(allergies).where(eq(allergies.profileId, profileId));
  }
  async updateAllergy(id: number, data: Partial<any>): Promise<any | undefined> {
    const [updated] = await db.update(allergies).set(data).where(eq(allergies.id, id)).returning();
    return updated;
  }
  async deleteAllergy(id: number): Promise<boolean> {
    await db.delete(allergies).where(eq(allergies.id, id));
    return true;
  }

  // Admin
  async getAllUsers(): Promise<User[]> { return await db.select().from(users); }
  async deleteUser(id: number): Promise<boolean> { await db.delete(users).where(eq(users.id, id)); return true; }

  // Appointments
  async createAppointment(a: InsertAppointment): Promise<Appointment> {
    const [newA] = await db.insert(appointments).values(a).returning();
    return newA;
  }
  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(asc(appointments.date), asc(appointments.time));
  }
  async updateAppointment(id: number, a: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updated] = await db.update(appointments).set(a).where(eq(appointments.id, id)).returning();
    return updated;
  }
  async deleteAppointment(id: number): Promise<boolean> { await db.delete(appointments).where(eq(appointments.id, id)); return true; }

  // Subscriptions
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(asc(subscriptionPlans.price));
  }
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [p] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return p;
  }
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [s] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
    return s;
  }
  async createUserSubscription(s: InsertSubscription): Promise<Subscription> {
    const [newS] = await db.insert(subscriptions).values(s).returning();
    return newS;
  }
  async updateUserSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
    return updated;
  }
  async cancelUserSubscription(id: number): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions).set({ status: "canceled", canceledAt: new Date() }).where(eq(subscriptions.id, id)).returning();
    return updated;
  }
  async incrementProfileCount(subscriptionId: number): Promise<number> {
    const s = await this.getSubscriptionById(subscriptionId);
    if (!s) return 0;
    const count = (s.profilesCreated || 0) + 1;
    await db.update(subscriptions).set({ profilesCreated: count }).where(eq(subscriptions.id, subscriptionId));
    return count;
  }
  async incrementUploadCount(subscriptionId: number, profileId: number): Promise<number> {
    const s = await this.getSubscriptionById(subscriptionId);
    if (!s) return 0;
    const counts = (s.uploadsCount as Record<string, number>) || {};
    counts[profileId.toString()] = (counts[profileId.toString()] || 0) + 1;
    await db.update(subscriptions).set({ uploadsCount: counts }).where(eq(subscriptions.id, subscriptionId));
    return counts[profileId.toString()];
  }
  async canCreateProfile(userId: number): Promise<boolean> {
    const s = await this.getUserSubscription(userId);
    if (!s || !s.planId) return false;
    const p = await this.getSubscriptionPlan(s.planId);
    if (!p || p.maxProfiles === -1) return true;
    return (s.profilesCreated || 0) < p.maxProfiles;
  }
  async canUploadExam(userId: number, profileId: number): Promise<boolean> {
    const s = await this.getUserSubscription(userId);
    if (!s || !s.planId) return false;
    const p = await this.getSubscriptionPlan(s.planId);
    if (!p || p.maxUploadsPerProfile === -1) return true;
    const counts = (s.uploadsCount as Record<string, number>) || {};
    return (counts[profileId.toString()] || 0) < p.maxUploadsPerProfile;
  }
  async getAllSubscriptionsByStripeId(stripeSubscriptionId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }
  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updated] = await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id)).returning();
    return updated;
  }
  async createSubscriptionPlan(p: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newP] = await db.insert(subscriptionPlans).values(p).returning();
    return newP;
  }
  private async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const [s] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return s;
  }

  // Dashboard Stats
  async getDoctorDashboardStats(userId: number): Promise<{
    totalPatients: number;
    patientsNeedingCheckup: number;
    patientsList: { id: number; name: string; lastExamDate: Date | null }[];
  }> {
    const userProfiles = await this.getProfilesByUserId(userId);
    const totalPatients = userProfiles.length;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const patientsList = await Promise.all(userProfiles.map(async (profile) => {
      const profileExams = await this.getExamsByUserId(userId, profile.id);
      let lastExamDate: Date | null = null;
      if (profileExams.length > 0) {
        const dates = profileExams
          .map(e => e.examDate ? new Date(e.examDate).getTime() : (e.uploadDate ? new Date(e.uploadDate).getTime() : 0))
          .filter(t => t > 0 && !isNaN(t));
        if (dates.length > 0) lastExamDate = new Date(Math.max(...dates));
      }
      return { id: profile.id, name: profile.name, lastExamDate };
    }));

    const needingCheckup = patientsList.filter(p => !p.lastExamDate || p.lastExamDate < oneYearAgo);

    return {
      totalPatients,
      patientsNeedingCheckup: needingCheckup.length,
      patientsList: needingCheckup
    };
  }

  // Doctors
  async createDoctor(d: InsertDoctor): Promise<Doctor> {
    const [newD] = await db.insert(doctors).values(d).returning();
    return newD;
  }
  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [d] = await db.select().from(doctors).where(eq(doctors.id, id));
    return d;
  }
  async getDoctorsByUserId(userId: number): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.userId, userId));
  }
  async updateDoctor(id: number, data: Partial<Doctor>): Promise<Doctor | undefined> {
    const [updated] = await db.update(doctors).set(data).where(eq(doctors.id, id)).returning();
    return updated;
  }
  async deleteDoctor(id: number): Promise<boolean> {
    await db.delete(doctors).where(eq(doctors.id, id));
    return true;
  }
  async getDefaultDoctorForUser(userId: number): Promise<Doctor | undefined> {
    const [d] = await db.select().from(doctors).where(and(eq(doctors.userId, userId), eq(doctors.isDefault, true)));
    return d;
  }
  async setDefaultDoctor(userId: number, doctorId: number): Promise<boolean> {
    await db.update(doctors).set({ isDefault: false }).where(eq(doctors.userId, userId));
    await db.update(doctors).set({ isDefault: true }).where(eq(doctors.id, doctorId));
    return true;
  }

  // Clinic operations
  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const [newClinic] = await db.insert(clinics).values(clinic).returning();
    // Update admin user to reference this clinic
    await db.update(users).set({ clinicId: newClinic.id, clinicRole: 'admin' }).where(eq(users.id, clinic.adminUserId));
    return newClinic;
  }

  async getClinic(id: number): Promise<Clinic | undefined> {
    const [c] = await db.select().from(clinics).where(eq(clinics.id, id));
    return c;
  }

  async getClinicByAdminId(userId: number): Promise<Clinic | undefined> {
    const [c] = await db.select().from(clinics).where(eq(clinics.adminUserId, userId));
    return c;
  }

  async updateClinic(id: number, data: Partial<Clinic>): Promise<Clinic | undefined> {
    const [updated] = await db.update(clinics).set(data).where(eq(clinics.id, id)).returning();
    return updated;
  }

  async addClinicMember(clinicId: number, userId: number): Promise<boolean> {
    const clinic = await this.getClinic(clinicId);
    if (!clinic) return false;

    const members = await this.getClinicMembers(clinicId);
    if (members.length >= clinic.maxProfessionals) return false;

    await db.update(users).set({ clinicId, clinicRole: 'member' }).where(eq(users.id, userId));
    return true;
  }

  async removeClinicMember(clinicId: number, userId: number): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.clinicId !== clinicId) return false;
    if (user.clinicRole === 'admin') return false;

    await db.update(users).set({ clinicId: null, clinicRole: null }).where(eq(users.id, userId));
    return true;
  }

  async getClinicMembers(clinicId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.clinicId, clinicId));
  }

  // Clinic invitation operations
  async createClinicInvitation(invitation: InsertClinicInvitation): Promise<ClinicInvitation> {
    const [newInvitation] = await db.insert(clinicInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getClinicInvitation(id: number): Promise<ClinicInvitation | undefined> {
    const [i] = await db.select().from(clinicInvitations).where(eq(clinicInvitations.id, id));
    return i;
  }

  async getClinicInvitationByToken(token: string): Promise<ClinicInvitation | undefined> {
    const [i] = await db.select().from(clinicInvitations).where(eq(clinicInvitations.token, token));
    return i;
  }

  async updateClinicInvitation(id: number, data: Partial<ClinicInvitation>): Promise<ClinicInvitation | undefined> {
    const [updated] = await db.update(clinicInvitations).set(data).where(eq(clinicInvitations.id, id)).returning();
    return updated;
  }

  async getClinicInvitations(clinicId: number): Promise<ClinicInvitation[]> {
    return await db.select().from(clinicInvitations).where(eq(clinicInvitations.clinicId, clinicId));
  }

  // Triage operations
  async createTriageRecord(record: any): Promise<any> {
    const [newRecord] = await db.insert(triageRecords).values(record).returning();
    return newRecord;
  }

  async getTriageByAppointmentId(appointmentId: number): Promise<any | null> {
    const [triage] = await db.select().from(triageRecords).where(eq(triageRecords.appointmentId, appointmentId));
    return triage || null;
  }

  async updateTriageRecord(id: number, record: Partial<any>): Promise<any | undefined> {
    const [updated] = await db.update(triageRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(triageRecords.id, id))
      .returning();
    return updated;
  }

  async getTriageHistoryByProfileId(profileId: number): Promise<any[]> {
    return await db.select()
      .from(triageRecords)
      .where(eq(triageRecords.profileId, profileId))
      .orderBy(desc(triageRecords.createdAt));
  }

  // Document operations - DatabaseStorage
  async createPrescription(p: InsertPrescription): Promise<Prescription> {
    const [newP] = await db.insert(prescriptions).values(p).returning();
    return newP;
  }
  async getPrescriptionsByProfileId(profileId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(eq(prescriptions.profileId, profileId))
      .orderBy(desc(prescriptions.issueDate));
  }
  async updatePrescriptionStatus(id: number, status: string): Promise<Prescription | undefined> {
    const [updated] = await db.update(prescriptions)
      .set({ status })
      .where(eq(prescriptions.id, id))
      .returning();
    return updated;
  }

  async createCertificate(c: InsertCertificate): Promise<Certificate> {
    const [newC] = await db.insert(certificates).values(c).returning();
    return newC;
  }
  async getCertificatesByProfileId(profileId: number): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(eq(certificates.profileId, profileId))
      .orderBy(desc(certificates.issueDate));
  }
  async updateCertificateStatus(id: number, status: string): Promise<Certificate | undefined> {
    const [updated] = await db.update(certificates)
      .set({ status })
      .where(eq(certificates.id, id))
      .returning();
    return updated;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
    return updated;
  }

  async getAnalyticsData(userId: number, range: string = '30d'): Promise<any> {
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on range
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);
    else startDate.setDate(now.getDate() - 30); // Default 30d

    // 1. Exam Counts by Type (for Pie Chart)
    const userExams = await db.select()
      .from(exams)
      .where(and(
        eq(exams.userId, userId),
        sql`${exams.uploadDate} >= ${startDate.toISOString()}`
      ));

    const examTypeCount: Record<string, number> = {};
    userExams.forEach(exam => {
      // Try to parse original content to get type, or use a default
      let type = "Outros";
      try {
        if (exam.originalContent) {
          const content = JSON.parse(exam.originalContent);
          if (content.examType) type = content.examType;
        }
      } catch (e) { }

      examTypeCount[type] = (examTypeCount[type] || 0) + 1;
    });

    const examsByType = Object.entries(examTypeCount).map(([name, value]) => ({ name, value }));

    // 2. Activity Trends (Exams, Patients & Revenue over time)
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const activityData: any[] = [];

    // Simple aggregation for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      // Count exams
      const examsInMonth = await db.select({ count: sql<number>`count(*)` })
        .from(exams)
        .where(and(
          eq(exams.userId, userId),
          sql`EXTRACT(MONTH FROM ${exams.uploadDate}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${exams.uploadDate}) = ${year}`
        ));

      // Count new patients
      const patientsInMonth = await db.select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          sql`EXTRACT(MONTH FROM ${profiles.createdAt}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${profiles.createdAt}) = ${year}`
        ));

      // Calculate revenue
      // appointments.date is text YYYY-MM-DD
      const revenueInMonth = await db.select({ total: sql<number>`sum(${appointments.price})` })
        .from(appointments)
        .where(and(
          eq(appointments.userId, userId),
          sql`extract(month from to_date(${appointments.date}, 'YYYY-MM-DD')) = ${month}`,
          sql`extract(year from to_date(${appointments.date}, 'YYYY-MM-DD')) = ${year}`
        ));

      activityData.push({
        name: monthName,
        exames: Number(examsInMonth[0].count),
        pacientes: Number(patientsInMonth[0].count),
        faturamento: Number(revenueInMonth[0]?.total || 0) / 100 // Convert cents to real currency unit if needed, usually kept in cents for frontend formatting but here keeping consistent with request
      });
    }

    // 3. Totals
    const totalPatients = (await db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.userId, userId)))[0].count;
    const totalExams = (await db.select({ count: sql<number>`count(*)` }).from(exams).where(eq(exams.userId, userId)))[0].count;

    // Financial Totals based on range
    const financialTotals = await db.select({
      revenue: sql<number>`sum(${appointments.price})`,
      count: sql<number>`count(*)`
    })
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        sql`to_date(${appointments.date}, 'YYYY-MM-DD') >= ${startDate.toISOString().split('T')[0]}`
      ));

    const totalRevenue = Number(financialTotals[0]?.revenue || 0);
    const payingAppointmentsCount = Number(financialTotals[0]?.count || 0);
    const averageTicket = payingAppointmentsCount > 0 ? Math.round(totalRevenue / payingAppointmentsCount) : 0;

    return {
      examsByType,
      activityData,
      summary: {
        totalPatients: Number(totalPatients),
        totalExams: Number(totalExams),
        mostFrequentExam: examsByType.sort((a, b) => b.value - a.value)[0]?.name || "N/A",
        totalRevenue,
        averageTicket
      }
    };
  }
}

// Use DatabaseStorage for production and development with PostgreSQL
// MemStorage is only for testing without a database connection
// IMPORTANT: DatabaseStorage persists data and sessions to PostgreSQL
export const storage: IStorage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();

