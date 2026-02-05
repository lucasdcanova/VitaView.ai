import { users, exams, examResults, healthMetrics, notifications, profiles, subscriptionPlans, subscriptions, diagnoses, surgeries, evolutions, appointments, doctors, habits, clinics, clinicInvitations, triageRecords, prescriptions, certificates, allergies, examRequests, examProtocols, customMedications, medications, userConsents, auditLogs, tussProcedures, aiConversations, aiMessages, aiUsage } from "@shared/schema";
export type { TriageRecord, InsertTriageRecord } from "@shared/schema";
import type { User, InsertUser, Profile, InsertProfile, Exam, InsertExam, ExamResult, InsertExamResult, HealthMetric, InsertHealthMetric, Notification, InsertNotification, SubscriptionPlan, InsertSubscriptionPlan, Subscription, InsertSubscription, Evolution, InsertEvolution, Appointment, InsertAppointment, Doctor, InsertDoctor, Habit, Clinic, InsertClinic, ClinicInvitation, InsertClinicInvitation, Prescription, InsertPrescription, Certificate, InsertCertificate, ExamRequest, InsertExamRequest, ExamProtocol, InsertExamProtocol, CustomMedication, InsertCustomMedication, TussProcedure, InsertTussProcedure, AIConversation, InsertAIConversation, AIMessage, InsertAIMessage, AIUsage, InsertAIUsage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, asc, and, or, inArray, sql, gt, ne, gte, lte } from "drizzle-orm";
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
  getProfile(id: number, clinicId?: number): Promise<Profile | undefined>;
  getProfilesByUserId(userId: number, clinicId?: number): Promise<Profile[]>;
  updateProfile(id: number, profile: Partial<Profile>): Promise<Profile | undefined>;
  deleteProfile(id: number): Promise<boolean>;
  getDefaultProfileForUser(userId: number): Promise<Profile | undefined>;

  // Bulk import operations
  createProfilesBulk(profiles: Partial<InsertProfile>[]): Promise<Profile[]>;
  findDuplicateProfiles(userId: number, names: string[], cpfs: (string | null)[]): Promise<Profile[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number, clinicId?: number): Promise<Exam | undefined>;
  getExamsByUserId(userId: number, profileId?: number, clinicId?: number): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;

  // Exam results operations
  createExamResult(result: InsertExamResult): Promise<ExamResult>;
  getExamResult(id: number): Promise<ExamResult | undefined>;
  getExamResultByExamId(examId: number): Promise<ExamResult | undefined>;
  updateExamResult(id: number, data: Partial<InsertExamResult>): Promise<ExamResult>;

  // Health metrics operations
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  getHealthMetricsByUserId(userId: number, profileId?: number, clinicId?: number): Promise<HealthMetric[]>;
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
  deleteBlockedAppointmentsByRange(userId: number, startDate: string, endDate: string): Promise<number>;

  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;

  // Analytics operations
  getAnalyticsData(userId: number, range?: string, startDate?: string, endDate?: string): Promise<any>;

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
  getTriagesByAppointmentIds(appointmentIds: number[]): Promise<any[]>;
  updateTriageRecord(id: number, record: Partial<any>): Promise<any | undefined>;
  getTriageHistoryByProfileId(profileId: number): Promise<any[]>;

  // Document operations
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescriptionsByProfileId(profileId: number): Promise<Prescription[]>;
  updatePrescriptionStatus(id: number, status: string): Promise<Prescription | undefined>;

  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificatesByProfileId(profileId: number): Promise<Certificate[]>;
  updateCertificateStatus(id: number, status: string): Promise<Certificate | undefined>;

  // Exam Request operations
  createExamRequest(examRequest: InsertExamRequest): Promise<ExamRequest>;
  getExamRequestsByProfileId(profileId: number): Promise<ExamRequest[]>;
  updateExamRequest(id: number, data: Partial<InsertExamRequest>): Promise<ExamRequest | undefined>;
  updateExamRequestStatus(id: number, status: string): Promise<ExamRequest | undefined>;

  // Exam Protocol operations
  createExamProtocol(protocol: InsertExamProtocol): Promise<ExamProtocol>;
  getExamProtocolsByUserId(userId: number): Promise<ExamProtocol[]>;
  updateExamProtocol(id: number, data: Partial<InsertExamProtocol>): Promise<ExamProtocol | undefined>;
  deleteExamProtocol(id: number): Promise<boolean>;

  // Prescription update
  updatePrescription(id: number, data: Partial<InsertPrescription>): Promise<Prescription | undefined>;

  // Custom Medications operations
  createCustomMedication(medication: InsertCustomMedication): Promise<CustomMedication>;
  getCustomMedicationsByUserId(userId: number): Promise<CustomMedication[]>;
  deleteCustomMedication(id: number): Promise<boolean>;

  // Bug Report operations
  createBugReport(report: any): Promise<any>;
  getBugReports(): Promise<any[]>;
  updateBugReportStatus(id: number, status: string): Promise<any | undefined>;

  // TUSS operations
  createTussProcedure(procedure: InsertTussProcedure): Promise<TussProcedure>;
  searchTussProcedures(query: string, limit?: number): Promise<TussProcedure[]>;

  // AI Conversation operations (Vita Assist)
  createAIConversation(userId: number, profileId?: number, title?: string): Promise<AIConversation>;
  getAIConversationsByUserId(userId: number): Promise<AIConversation[]>;
  getAIConversation(id: number): Promise<AIConversation | undefined>;
  updateAIConversation(id: number, data: Partial<AIConversation>): Promise<AIConversation | undefined>;
  deleteAIConversation(id: number): Promise<boolean>;
  addAIMessage(conversationId: number, role: string, content: string): Promise<AIMessage>;
  getAIMessagesByConversationId(conversationId: number): Promise<AIMessage[]>;

  // AI Usage Tracking operations (Fair Use)
  getAIUsageForDate(userId: number, date: string): Promise<AIUsage | undefined>;
  incrementAIUsage(userId: number, date: string, field: 'aiRequests' | 'aiTokensUsed' | 'transcriptionMinutes' | 'examAnalyses', amount: number): Promise<AIUsage>;
  getMonthlyAIUsage(userId: number, yearMonth: string): Promise<{ aiRequests: number; aiTokensUsed: number; transcriptionMinutes: number; examAnalyses: number }>;
  getAllUsersUsageStats(yearMonth: string): Promise<Array<{ userId: number; username: string; fullName: string | null; planName: string | null; aiRequests: number; transcriptionMinutes: number; examAnalyses: number }>>;

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
  private tussProceduresMap: Map<number, TussProcedure>;
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
  private tussProcedureIdCounter: number = 1;



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
    this.tussProceduresMap = new Map();


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
      specialty: null,
      rqe: null,
      profilePhotoUrl: null,
      addons: []
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
      clinicId: (profile as any).clinicId || null,
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
      deceased: (profile as any).deceased || false,
      deathDate: (profile as any).deathDate || null,
      deathTime: (profile as any).deathTime || null,
      deathCause: (profile as any).deathCause || null,
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

  async getProfile(id: number, clinicId?: number): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (clinicId && profile && (profile as any).clinicId !== clinicId) return undefined;
    return profile;
  }

  async getProfilesByUserId(userId: number, clinicId?: number): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(
      (profile) => profile.userId === userId && (!clinicId || (profile as any).clinicId === clinicId)
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
      clinicId: (exam as any).clinicId || null,
      uploadDate: new Date(),
      originalContent: exam.originalContent || null,
      laboratoryName: exam.laboratoryName || null,
      examDate: exam.examDate || null,
      requestingPhysician: exam.requestingPhysician || null,
      profileId: exam.profileId ?? null,
      filePath: exam.filePath ?? null,
      processingError: (exam as any).processingError || null,
      storageClass: "hot",
      lastAccessedAt: new Date(),
      storageMigratedAt: null,
    };
    this.exams.set(id, newExam);
    return newExam;
  }

  async getExam(id: number, clinicId?: number): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (clinicId && exam && (exam as any).clinicId !== clinicId) return undefined;
    return exam;
  }

  async getExamsByUserId(userId: number, profileId?: number, clinicId?: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(
      (exam) =>
        exam.userId === userId &&
        (!profileId || exam.profileId === profileId) &&
        (!clinicId || (exam as any).clinicId === clinicId)
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

  async updateExamResult(id: number, data: Partial<InsertExamResult>): Promise<ExamResult> {
    const existing = this.examResults.get(id);
    if (!existing) throw new Error("Exam result not found");
    const updated = { ...existing, ...data };
    this.examResults.set(id, updated);
    return updated;
  }

  // Health metrics operations
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const id = this.healthMetricIdCounter++;
    const newMetric: HealthMetric = {
      id,
      name: metric.name,
      value: metric.value,
      userId: metric.userId,
      profileId: metric.profileId ?? null,
      clinicId: (metric as any).clinicId || null, // Added clinicId
      examId: metric.examId || null,
      date: metric.date || new Date(),
      status: metric.status || null,
      unit: metric.unit || null,
      change: metric.change || null,
      referenceMin: metric.referenceMin || null,
      referenceMax: metric.referenceMax || null
    };
    this.healthMetricsMap.set(id, newMetric);
    return newMetric;
  }

  async getHealthMetricsByUserId(userId: number, profileId?: number, clinicId?: number): Promise<HealthMetric[]> {
    return Array.from(this.healthMetricsMap.values())
      .filter((m) =>
        m.userId === userId &&
        (!profileId || m.profileId === profileId) &&
        (!clinicId || (m as any).clinicId === clinicId)
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
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
    const newEvolution: Evolution = {
      ...evolution,
      id,
      createdAt: new Date(),
      date: evolution.date || new Date(),
      profileId: evolution.profileId || null,
      professionalName: evolution.professionalName || null
    };
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
    const newAppointment: Appointment = {
      ...appointment,
      id,
      clinicId: (appointment as any).clinicId || null,
      createdAt: new Date(),
      status: appointment.status || 'scheduled',
      notes: appointment.notes || null,
      profileId: appointment.profileId || null,
      price: appointment.price ?? null,
      duration: appointment.duration || null,
      isAllDay: appointment.isAllDay || null
    };
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
      promoPrice: plan.promoPrice ?? null,
      promoDescription: plan.promoDescription || null,
      trialPeriodDays: plan.trialPeriodDays ?? 0,
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
      uploadsCount: {},
      planId: subscription.planId || null
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
    const newDoctor: Doctor = {
      ...doctor,
      id,
      createdAt: new Date(),
      specialty: doctor.specialty || null,
      isDefault: doctor.isDefault ?? false,
      professionalType: doctor.professionalType || 'doctor'
    };
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

  async getTriagesByAppointmentIds(appointmentIds: number[]): Promise<any[]> {
    return Array.from(this.triageRecordsMap.values()).filter(
      t => appointmentIds.includes(t.appointmentId)
    );
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
      uploadsCount: {},
      planId: subscription.planId || null
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

  async getAnalyticsData(userId: number, range: string = '30d', startDate?: string, endDate?: string): Promise<any> {
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
      pdfPath: p.pdfPath || null,
      profileId: p.profileId || null
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
      pdfPath: c.pdfPath || null,
      city: c.city || null
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

  // Prescription update - MemStorage
  async updatePrescription(id: number, data: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const p = this.prescriptionsMap.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...data, issueDate: data.issueDate || p.issueDate } as Prescription;
    this.prescriptionsMap.set(id, updated);
    return updated;
  }

  // Exam Request operations - MemStorage
  private examRequestsMap: Map<number, ExamRequest> = new Map();
  private examRequestIdCounter: number = 1;

  async createExamRequest(er: InsertExamRequest): Promise<ExamRequest> {
    const id = this.examRequestIdCounter++;
    const newER: ExamRequest = {
      ...er,
      id,
      createdAt: new Date(),
      status: er.status || 'pending',
      issueDate: er.issueDate || new Date(),
      doctorSpecialty: er.doctorSpecialty || null,
      clinicalIndication: er.clinicalIndication || null,
      observations: er.observations || null,
      profileId: er.profileId || null,
      pdfPath: er.pdfPath || null
    };
    this.examRequestsMap.set(id, newER);
    return newER;
  }

  async getExamRequestsByProfileId(profileId: number): Promise<ExamRequest[]> {
    return Array.from(this.examRequestsMap.values())
      .filter(er => er.profileId === profileId)
      .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }

  async updateExamRequest(id: number, data: Partial<InsertExamRequest>): Promise<ExamRequest | undefined> {
    const er = this.examRequestsMap.get(id);
    if (!er) return undefined;
    const updated = { ...er, ...data, issueDate: data.issueDate || er.issueDate } as ExamRequest;
    this.examRequestsMap.set(id, updated);
    return updated;
  }

  async updateExamRequestStatus(id: number, status: string): Promise<ExamRequest | undefined> {
    const er = this.examRequestsMap.get(id);
    if (!er) return undefined;
    const updated = { ...er, status };
    this.examRequestsMap.set(id, updated);
    return updated;
  }

  // ExamProtocol methods for MemStorage
  private examProtocolsMap = new Map<number, ExamProtocol>();
  private examProtocolIdCounter = 1;

  async createExamProtocol(protocol: InsertExamProtocol): Promise<ExamProtocol> {
    const id = this.examProtocolIdCounter++;
    const newProtocol: ExamProtocol = {
      ...protocol,
      id,
      description: protocol.description || null,
      icon: protocol.icon || "FlaskConical",
      color: protocol.color || "blue",
      isDefault: protocol.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.examProtocolsMap.set(id, newProtocol);
    return newProtocol;
  }

  async getExamProtocolsByUserId(userId: number): Promise<ExamProtocol[]> {
    return Array.from(this.examProtocolsMap.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateExamProtocol(id: number, data: Partial<InsertExamProtocol>): Promise<ExamProtocol | undefined> {
    const protocol = this.examProtocolsMap.get(id);
    if (!protocol) return undefined;
    const updated = { ...protocol, ...data, updatedAt: new Date() } as ExamProtocol;
    this.examProtocolsMap.set(id, updated);
    return updated;
  }

  async deleteExamProtocol(id: number): Promise<boolean> {
    return this.examProtocolsMap.delete(id);
  }

  // Custom Medications operations - MemStorage
  private customMedicationsMap = new Map<number, CustomMedication>();
  private customMedicationIdCounter = 1;

  async createCustomMedication(medication: InsertCustomMedication): Promise<CustomMedication> {
    const id = this.customMedicationIdCounter++;
    const newMedication: CustomMedication = {
      id,
      userId: medication.userId,
      name: medication.name,
      format: medication.format || null,
      dosage: medication.dosage || null,
      category: medication.category || null,
      prescriptionType: medication.prescriptionType || 'padrao',
      route: medication.route || 'oral',
      isActive: medication.isActive ?? true,
      createdAt: new Date(),
    };
    this.customMedicationsMap.set(id, newMedication);
    return newMedication;
  }

  async getCustomMedicationsByUserId(userId: number): Promise<CustomMedication[]> {
    return Array.from(this.customMedicationsMap.values())
      .filter(m => m.userId === userId && m.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteCustomMedication(id: number): Promise<boolean> {
    const medication = this.customMedicationsMap.get(id);
    if (!medication) return false;
    medication.isActive = false;
    this.customMedicationsMap.set(id, medication);
    return true;
  }

  // Bug Report operations (MemStorage - in-memory)
  private bugReportsMap: Map<number, any> = new Map();
  private bugReportIdCounter: number = 1;

  async createBugReport(report: any): Promise<any> {
    const id = this.bugReportIdCounter++;
    const newReport = {
      ...report,
      id,
      status: report.status || 'new',
      createdAt: new Date()
    };
    this.bugReportsMap.set(id, newReport);
    return newReport;
  }

  async getBugReports(): Promise<any[]> {
    return Array.from(this.bugReportsMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateBugReportStatus(id: number, status: string): Promise<any | undefined> {
    const report = this.bugReportsMap.get(id);
    if (!report) return undefined;
    report.status = status;
    this.bugReportsMap.set(id, report);
    return report;
  }

  // TUSS operations
  // TUSS operations
  async createTussProcedure(procedure: InsertTussProcedure): Promise<TussProcedure> {
    const id = this.tussProcedureIdCounter++;
    const newP: TussProcedure = {
      ...procedure,
      id,
      createdAt: new Date(),
      code: procedure.code || null,
      category: procedure.category || null,
      type: procedure.type || null,
      description: procedure.description || null,
      isActive: procedure.isActive ?? true
    };
    this.tussProceduresMap.set(id, newP);
    return newP;
  }

  async searchTussProcedures(query: string, limit: number = 20): Promise<TussProcedure[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tussProceduresMap.values())
      .filter(p =>
        p.isActive &&
        (p.name.toLowerCase().includes(lowerQuery) || (p.code && p.code.toLowerCase().includes(lowerQuery)))
      )
      .slice(0, limit);
  }

  // AI Conversation stub methods (Vita Assist) - MemStorage doesn't persist these
  async createAIConversation(userId: number, profileId?: number, title?: string): Promise<AIConversation> {
    throw new Error("AI conversations not supported in MemStorage");
  }
  async getAIConversationsByUserId(userId: number): Promise<AIConversation[]> {
    return [];
  }
  async getAIConversation(id: number): Promise<AIConversation | undefined> {
    return undefined;
  }
  async updateAIConversation(id: number, data: Partial<AIConversation>): Promise<AIConversation | undefined> {
    return undefined;
  }
  async deleteAIConversation(id: number): Promise<boolean> {
    return false;
  }
  async addAIMessage(conversationId: number, role: string, content: string): Promise<AIMessage> {
    throw new Error("AI messages not supported in MemStorage");
  }
  async getAIMessagesByConversationId(conversationId: number): Promise<AIMessage[]> {
    return [];
  }

  async deleteBlockedAppointmentsByRange(userId: number, startDate: string, endDate: string): Promise<number> {
    const deleted = Array.from(this.appointmentsMap.values()).filter(a =>
      a.userId === userId &&
      a.type === 'blocked' &&
      a.date >= startDate &&
      a.date <= endDate
    );

    for (const apt of deleted) {
      this.appointmentsMap.delete(apt.id);
    }
    return deleted.length;
  }

  // AI Usage Tracking - MemStorage (in-memory)
  private aiUsageMap: Map<string, AIUsage> = new Map(); // key: `${userId}-${date}`
  private aiUsageIdCounter: number = 1;

  async getAIUsageForDate(userId: number, date: string): Promise<AIUsage | undefined> {
    return this.aiUsageMap.get(`${userId}-${date}`);
  }

  async incrementAIUsage(userId: number, date: string, field: 'aiRequests' | 'aiTokensUsed' | 'transcriptionMinutes' | 'examAnalyses', amount: number): Promise<AIUsage> {
    const key = `${userId}-${date}`;
    let usage = this.aiUsageMap.get(key);

    if (!usage) {
      usage = {
        id: this.aiUsageIdCounter++,
        userId,
        date,
        aiRequests: 0,
        aiTokensUsed: 0,
        transcriptionMinutes: 0,
        examAnalyses: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    usage[field] += amount;
    usage.updatedAt = new Date();
    this.aiUsageMap.set(key, usage);
    return usage;
  }

  async getMonthlyAIUsage(userId: number, yearMonth: string): Promise<{ aiRequests: number; aiTokensUsed: number; transcriptionMinutes: number; examAnalyses: number }> {
    const totals = { aiRequests: 0, aiTokensUsed: 0, transcriptionMinutes: 0, examAnalyses: 0 };

    for (const [key, usage] of Array.from(this.aiUsageMap.entries())) {
      if (key.startsWith(`${userId}-${yearMonth}`)) {
        totals.aiRequests += usage.aiRequests;
        totals.aiTokensUsed += usage.aiTokensUsed;
        totals.transcriptionMinutes += usage.transcriptionMinutes;
        totals.examAnalyses += usage.examAnalyses;
      }
    }

    return totals;
  }

  async getAllUsersUsageStats(yearMonth: string): Promise<Array<{ userId: number; username: string; fullName: string | null; planName: string | null; aiRequests: number; transcriptionMinutes: number; examAnalyses: number }>> {
    // Simplified for MemStorage - in real DB this would be a proper join
    const userStats = new Map<number, { aiRequests: number; transcriptionMinutes: number; examAnalyses: number }>();

    for (const [key, usage] of Array.from(this.aiUsageMap.entries())) {
      if (key.includes(yearMonth)) {
        const current = userStats.get(usage.userId) || { aiRequests: 0, transcriptionMinutes: 0, examAnalyses: 0 };
        current.aiRequests += usage.aiRequests;
        current.transcriptionMinutes += usage.transcriptionMinutes;
        current.examAnalyses += usage.examAnalyses;
        userStats.set(usage.userId, current);
      }
    }

    const results: Array<{ userId: number; username: string; fullName: string | null; planName: string | null; aiRequests: number; transcriptionMinutes: number; examAnalyses: number }> = [];
    for (const [userId, stats] of Array.from(userStats.entries())) {
      const user = this.users.get(userId);
      if (user) {
        results.push({
          userId,
          username: user.username,
          fullName: user.fullName,
          planName: null,
          ...stats
        });
      }
    }

    return results;
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
      createTableIfMissing: false
    });
    this.setupDefaultSubscriptionPlans();
  }

  private async setupDefaultSubscriptionPlans() {
    try {
      // Ensure columns exist first
      await db.execute(sql`
        ALTER TABLE subscription_plans 
        ADD COLUMN IF NOT EXISTS promo_price INTEGER,
        ADD COLUMN IF NOT EXISTS promo_description TEXT,
        ADD COLUMN IF NOT EXISTS trial_period_days INTEGER DEFAULT 0
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
          features: [
            "Anamnese **Básica**",
            "Limite de **1 prescrição** por dia",
            "Protocolos Clínicos **Básicos**",
            "Envio de **10 uploads** de exames por mês",
            "Agenda para **organização simples**",
            "Gestão de até **20 pacientes**"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        {
          name: "Vita Pro",
          description: "Ideal para profissionais independentes",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 7900,
          interval: "month",
          features: [
            "Anamnese **com IA** e Gravação de Voz",
            "Prescrição **Ilimitada** com Alerta de Interações",
            "Protocolos de Exames **Personalizáveis**",
            "Upload **Ilimitado** de Resultados de Exames",
            "Agendamento **com IA** e Triagem Pré-Consulta",
            "**Gestão de Pacientes Ilimitada**",
            "**Gráficos de Evolução** de Exames"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 30,
          isActive: true
        },
        // Vita Pro Semestral - 10% desconto (79 * 6 * 0.9 = 426.60)
        {
          name: "Vita Pro Semestral",
          description: "Ideal para profissionais independentes - Pague 6 meses",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 42660,
          interval: "6month",
          features: [
            "Anamnese **com IA** e Gravação de Voz",
            "Prescrição **Ilimitada** com Alerta de Interações",
            "Protocolos de Exames **Personalizáveis**",
            "Upload **Ilimitado** de Resultados de Exames",
            "Agendamento **com IA** e Triagem Pré-Consulta",
            "**Gestão de Pacientes Ilimitada**",
            "**Gráficos de Evolução** de Exames",
            "**Economize 10%** no plano semestral"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        // Vita Pro Anual - 20% desconto (79 * 12 * 0.8 = 758.40)
        {
          name: "Vita Pro Anual",
          description: "Ideal para profissionais independentes - Pague 12 meses",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 75840,
          interval: "year",
          features: [
            "Anamnese **com IA** e Gravação de Voz",
            "Prescrição **Ilimitada** com Alerta de Interações",
            "Protocolos de Exames **Personalizáveis**",
            "Upload **Ilimitado** de Resultados de Exames",
            "Agendamento **com IA** e Triagem Pré-Consulta",
            "**Gestão de Pacientes Ilimitada**",
            "**Gráficos de Evolução** de Exames",
            "**Economize 20%** no plano anual"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        {
          name: "Vita Team",
          description: "Gestão completa para clínicas pequenas",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 14900,
          interval: "month",
          features: [
            "Tudo do plano **Vita Pro**",
            "Até **5 profissionais** inclusos",
            "**Conta administradora**",
            "**Gerenciamento de equipe**",
            "Relatórios consolidados da clínica",
            "Personalização de modelos de documentos",
            "Treinamento de onboarding"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 30,
          isActive: true
        },
        // Vita Team Semestral - 10% desconto (149 * 6 * 0.9 = 804.60)
        {
          name: "Vita Team Semestral",
          description: "Gestão completa para clínicas pequenas - Pague 6 meses",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 80460,
          interval: "6month",
          features: [
            "Tudo do plano **Vita Pro**",
            "Até **5 profissionais** inclusos",
            "**Conta administradora**",
            "**Gerenciamento de equipe**",
            "Relatórios consolidados da clínica",
            "Personalização de modelos de documentos",
            "Treinamento de onboarding",
            "**Economize 10%** no plano semestral"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        // Vita Team Anual - 20% desconto (149 * 12 * 0.8 = 1430.40)
        {
          name: "Vita Team Anual",
          description: "Gestão completa para clínicas pequenas - Pague 12 meses",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 143040,
          interval: "year",
          features: [
            "Tudo do plano **Vita Pro**",
            "Até **5 profissionais** inclusos",
            "**Conta administradora**",
            "**Gerenciamento de equipe**",
            "Relatórios consolidados da clínica",
            "Personalização de modelos de documentos",
            "Treinamento de onboarding",
            "**Economize 20%** no plano anual"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        {
          name: "Vita Business",
          description: "Gestão completa para clínicas maiores",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 24900,
          interval: "month",
          features: [
            "Tudo do plano **Vita Team**",
            "**Profissionais ilimitados** (5+)",
            "**Gestão financeira** da clínica",
            "API de integração",
            "Gerente de conta dedicado",
            "SLA de suporte premium",
            "Personalização Whitelabel (logo na área do paciente)"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 30,
          isActive: true
        },
        // Vita Business Semestral - 10% desconto (249 * 6 * 0.9 = 1344.60)
        {
          name: "Vita Business Semestral",
          description: "Gestão completa para clínicas maiores - Pague 6 meses",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 134460,
          interval: "6month",
          features: [
            "Tudo do plano **Vita Team**",
            "**Profissionais ilimitados** (5+)",
            "**Gestão financeira** da clínica",
            "API de integração",
            "Gerente de conta dedicado",
            "SLA de suporte premium",
            "Personalização Whitelabel (logo na área do paciente)",
            "**Economize 10%** no plano semestral"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        // Vita Business Anual - 20% desconto (249 * 12 * 0.8 = 2390.40)
        {
          name: "Vita Business Anual",
          description: "Gestão completa para clínicas maiores - Pague 12 meses",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 239040,
          interval: "year",
          features: [
            "Tudo do plano **Vita Team**",
            "**Profissionais ilimitados** (5+)",
            "**Gestão financeira** da clínica",
            "API de integração",
            "Gerente de conta dedicado",
            "SLA de suporte premium",
            "Personalização Whitelabel (logo na área do paciente)",
            "**Economize 20%** no plano anual"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        },
        {
          name: "Hospitais",
          description: "Solução enterprise para grandes instituições",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 99900,
          interval: "month",
          features: [
            "Infraestrutura dedicada",
            "Integração com sistemas hospitalares (HL7/FHIR)",
            "SSO / Active Directory",
            "Compliance personalizado",
            "Auditoria avançada",
            "Treinamento in-company"
          ],
          promoPrice: null,
          promoDescription: null,
          trialPeriodDays: 0,
          isActive: true
        }
      ];

      // Insert or update plans
      for (const plan of standardPlans) {
        // Check if plan exists (by name, also checking old names to rename them)
        let existingPlan = existingPlans.find(p => p.name === plan.name);

        // Handle renames
        if (!existingPlan) {
          if (plan.name === "Vita Pro") existingPlan = existingPlans.find(p => p.name === "Profissional de Saúde");
          else if (plan.name === "Vita Team") existingPlan = existingPlans.find(p => p.name === "Clínica Multiprofissional");
          else if (plan.name === "Vita Business") existingPlan = existingPlans.find(p => p.name === "Clínica Multiprofissional+");
        }

        if (existingPlan) {
          // Update existing plan
          await db.update(subscriptionPlans)
            .set({
              name: plan.name,
              description: plan.description,
              maxProfiles: plan.maxProfiles,
              maxUploadsPerProfile: plan.maxUploadsPerProfile,
              price: plan.price,
              features: plan.features,
              promoPrice: plan.promoPrice,
              promoDescription: plan.promoDescription,
              trialPeriodDays: plan.trialPeriodDays,
              isActive: plan.isActive
            })
            .where(eq(subscriptionPlans.id, existingPlan.id));
        } else {
          // Create new plan
          await this.createSubscriptionPlan(plan);
        }
      }
    } catch (error) {
      console.error("Error setting up default subscription plans:", error);
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
  async getProfile(id: number, clinicId?: number): Promise<Profile | undefined> {
    let q = db.select().from(profiles).where(eq(profiles.id, id));
    if (clinicId) q = (q as any).where(eq(profiles.clinicId, clinicId));
    const [profile] = await q;
    return profile;
  }
  async getProfilesByUserId(userId: number, clinicId?: number): Promise<Profile[]> {
    let q = db.select().from(profiles).where(eq(profiles.userId, userId));
    if (clinicId) q = (q as any).where(eq(profiles.clinicId, clinicId));
    return await q;
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
  async getExam(id: number, clinicId?: number): Promise<Exam | undefined> {
    let q = db.select().from(exams).where(eq(exams.id, id));
    if (clinicId) q = (q as any).where(eq(exams.clinicId, clinicId));
    const [exam] = await q;
    return exam;
  }
  async getExamsByUserId(userId: number, profileId?: number, clinicId?: number): Promise<Exam[]> {
    let q = db.select().from(exams).where(eq(exams.userId, userId));
    if (profileId) q = (q as any).where(eq(exams.profileId, profileId));
    if (clinicId) q = (q as any).where(eq(exams.clinicId, clinicId));
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

  // TUSS Operations - DatabaseStorage
  async createTussProcedure(procedure: InsertTussProcedure): Promise<TussProcedure> {
    const [newP] = await db.insert(tussProcedures).values(procedure).returning();
    return newP;
  }

  async searchTussProcedures(query: string, limit: number = 20): Promise<TussProcedure[]> {
    return await db.select()
      .from(tussProcedures)
      .where(
        and(
          eq(tussProcedures.isActive, true),
          or(
            sql`${tussProcedures.name} ILIKE ${'%' + query + '%'}`,
            sql`${tussProcedures.code} ILIKE ${'%' + query + '%'}`
          )
        )
      )
      .limit(limit);
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

  async updateExamResult(id: number, data: Partial<InsertExamResult>): Promise<ExamResult> {
    const [updated] = await db.update(examResults)
      .set(data)
      .where(eq(examResults.id, id))
      .returning();
    if (!updated) throw new Error("Exam result not found");
    return updated;
  }

  // Health Metrics
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [newM] = await db.insert(healthMetrics).values(metric).returning();
    return newM;
  }
  async getHealthMetricsByUserId(userId: number, profileId?: number, clinicId?: number): Promise<HealthMetric[]> {
    let q = db.select().from(healthMetrics).where(eq(healthMetrics.userId, userId));
    if (profileId) q = (q as any).where(eq(healthMetrics.profileId, profileId));
    if (clinicId) q = (q as any).where(eq(healthMetrics.clinicId, clinicId));
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
  async deleteUser(id: number): Promise<boolean> {
    console.log(`[STORAGE] Attempting to delete user ${id}`);

    // Pre-check
    const exists = await this.getUser(id);
    if (!exists) {
      console.warn(`[STORAGE] User ${id} not found during delete attempt.`);
      return false;
    }

    // Manually delete all related data to handle Foreign Key constraints
    // 1. Delete data dependent on exams
    const userExams = await db.select().from(exams).where(eq(exams.userId, id));
    const examIds = userExams.map(e => e.id);
    if (examIds.length > 0) {
      await db.delete(examResults).where(inArray(examResults.examId, examIds));
      await db.delete(healthMetrics).where(inArray(healthMetrics.examId, examIds));
    }

    // 2. Delete data dependent on appointments
    const userAppointments = await db.select().from(appointments).where(eq(appointments.userId, id));
    const appointmentIds = userAppointments.map(a => a.id);
    if (appointmentIds.length > 0) {
      await db.delete(triageRecords).where(inArray(triageRecords.appointmentId, appointmentIds));
    }

    // 2.5 Delete triage records performed BY this user (as a doctor)
    await db.delete(triageRecords).where(eq(triageRecords.performedByUserId, id));


    // 3. Delete leaf tables referencing user directly or via profiles
    // Note: Deleting items that reference Profiles before deleting Profiles
    await db.delete(healthMetrics).where(eq(healthMetrics.userId, id));
    await db.delete(exams).where(eq(exams.userId, id));
    await db.delete(appointments).where(eq(appointments.userId, id));
    await db.delete(prescriptions).where(eq(prescriptions.userId, id));
    await db.delete(certificates).where(eq(certificates.userId, id));
    await db.delete(diagnoses).where(eq(diagnoses.userId, id));
    await db.delete(medications).where(eq(medications.userId, id));
    await db.delete(habits).where(eq(habits.userId, id));
    await db.delete(allergies).where(eq(allergies.userId, id));
    await db.delete(doctors).where(eq(doctors.userId, id));
    await db.delete(evolutions).where(eq(evolutions.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(userConsents).where(eq(userConsents.userId, id));
    await db.delete(customMedications).where(eq(customMedications.userId, id));
    await db.delete(surgeries).where(eq(surgeries.userId, id));
    await db.delete(examRequests).where(eq(examRequests.userId, id));
    await db.delete(examProtocols).where(eq(examProtocols.userId, id));

    // 4. Handle subscriptions and clinics
    const userClinics = await db.select().from(clinics).where(eq(clinics.adminUserId, id));
    const clinicIds = userClinics.map(c => c.id);
    if (clinicIds.length > 0) {
      await db.delete(clinicInvitations).where(inArray(clinicInvitations.clinicId, clinicIds));
      await db.delete(clinics).where(inArray(clinics.id, clinicIds));
    }
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));

    // 5. Delete specific user-related logs or anonymize?
    // For now, let's try to delete Audit Logs where this user is the actor or target to free up FK
    await db.delete(auditLogs).where(or(eq(auditLogs.userId, id), eq(auditLogs.targetUserId, id)));

    // 6. Delete Profiles
    await db.delete(profiles).where(eq(profiles.userId, id));

    // 7. Finally delete the user
    console.log(`[STORAGE] Deleting user row ${id}`);
    const res = await db.delete(users).where(eq(users.id, id)).returning();

    // 8. VERIFICATION
    const check = await this.getUser(id);
    if (check) {
      console.error(`[STORAGE] CRITICAL: User ${id} STILL EXISTS after delete! DB delete returned:`, res);
      throw new Error("Failed to delete user - database constraint or silent failure.");
    }

    console.log(`[STORAGE] User ${id} successfully deleted.`);
    return true;
  }

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
  async deleteBlockedAppointmentsByRange(userId: number, startDate: string, endDate: string): Promise<number> {
    const result = await db.delete(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.type, 'blocked'),
          gte(appointments.date, startDate),
          lte(appointments.date, endDate)
        )
      )
      .returning();
    return result.length;
  }

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

  async getTriagesByAppointmentIds(appointmentIds: number[]): Promise<any[]> {
    if (appointmentIds.length === 0) return [];
    return await db.select().from(triageRecords).where(inArray(triageRecords.appointmentId, appointmentIds));
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

  // Prescription update - DatabaseStorage
  async updatePrescription(id: number, data: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [updated] = await db.update(prescriptions)
      .set(data)
      .where(eq(prescriptions.id, id))
      .returning();
    return updated;
  }

  // Exam Request operations - DatabaseStorage
  async createExamRequest(er: InsertExamRequest): Promise<ExamRequest> {
    const [newER] = await db.insert(examRequests).values(er).returning();
    return newER;
  }

  async getExamRequestsByProfileId(profileId: number): Promise<ExamRequest[]> {
    return await db.select().from(examRequests)
      .where(eq(examRequests.profileId, profileId))
      .orderBy(desc(examRequests.issueDate));
  }

  async updateExamRequest(id: number, data: Partial<InsertExamRequest>): Promise<ExamRequest | undefined> {
    const [updated] = await db.update(examRequests)
      .set(data)
      .where(eq(examRequests.id, id))
      .returning();
    return updated;
  }

  async updateExamRequestStatus(id: number, status: string): Promise<ExamRequest | undefined> {
    const [updated] = await db.update(examRequests)
      .set({ status })
      .where(eq(examRequests.id, id))
      .returning();
    return updated;
  }

  // Exam Protocol operations - DatabaseStorage
  async createExamProtocol(protocol: InsertExamProtocol): Promise<ExamProtocol> {
    const [newProtocol] = await db.insert(examProtocols).values(protocol).returning();
    return newProtocol;
  }

  async getExamProtocolsByUserId(userId: number): Promise<ExamProtocol[]> {
    return await db.select().from(examProtocols)
      .where(eq(examProtocols.userId, userId))
      .orderBy(desc(examProtocols.createdAt));
  }

  async updateExamProtocol(id: number, data: Partial<InsertExamProtocol>): Promise<ExamProtocol | undefined> {
    const [updated] = await db.update(examProtocols)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(examProtocols.id, id))
      .returning();
    return updated;
  }

  async deleteExamProtocol(id: number): Promise<boolean> {
    const result = await db.delete(examProtocols).where(eq(examProtocols.id, id));
    return true;
  }

  // Custom Medications operations - DatabaseStorage
  async createCustomMedication(medication: InsertCustomMedication): Promise<CustomMedication> {
    const [newMedication] = await db.insert(customMedications).values(medication).returning();
    return newMedication;
  }

  async getCustomMedicationsByUserId(userId: number): Promise<CustomMedication[]> {
    return await db.select().from(customMedications)
      .where(and(
        eq(customMedications.userId, userId),
        eq(customMedications.isActive, true)
      ))
      .orderBy(asc(customMedications.name));
  }

  async deleteCustomMedication(id: number): Promise<boolean> {
    await db.update(customMedications)
      .set({ isActive: false })
      .where(eq(customMedications.id, id));
    return true;
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

  async getAnalyticsData(userId: number, range: string = '30d', customStartDate?: string, customEndDate?: string): Promise<any> {
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on range
    if (range === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      // customEndDate is used for filtering, current 'now' can be replaced with endDate for more precise filtering if needed
    } else if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);
    else startDate.setDate(now.getDate() - 30); // Default 30d

    const endDate = range === 'custom' && customEndDate ? new Date(customEndDate) : now;

    // All queries are now consolidated into a single Promise.all below for performance

    // 2. Activity Trends (Exams, Patients & Revenue over time)
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Calculate months between startDate and endDate
    const monthsToShow: { year: number; month: number; name: string }[] = [];
    const current = new Date(startDate);
    current.setDate(1); // Start from first day of month

    while (current <= endDate) {
      monthsToShow.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        name: months[current.getMonth()]
      });
      current.setMonth(current.getMonth() + 1);
    }

    // If no months, show at least the month of the start date
    if (monthsToShow.length === 0) {
      monthsToShow.push({
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        name: months[startDate.getMonth()]
      });
    }

    // OPTIMIZED: Run ALL queries in parallel with a single Promise.all
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const [
      userExams,
      examsByMonth,
      patientsByMonth,
      revenueByMonth,
      totalPatientsResult,
      totalExamsResult,
      financialTotals
    ] = await Promise.all([
      // 1. User exams for pie chart
      db.select()
        .from(exams)
        .where(and(
          eq(exams.userId, userId),
          gte(exams.uploadDate, startDate),
          lte(exams.uploadDate, endDate)
        )),

      // 2. Exams aggregated by month/year
      db.select({
        month: sql<number>`EXTRACT(MONTH FROM ${exams.uploadDate})::int`,
        year: sql<number>`EXTRACT(YEAR FROM ${exams.uploadDate})::int`,
        count: sql<number>`count(*)`
      })
        .from(exams)
        .where(and(
          eq(exams.userId, userId),
          gte(exams.uploadDate, startDate),
          lte(exams.uploadDate, endDate)
        ))
        .groupBy(sql`EXTRACT(MONTH FROM ${exams.uploadDate})`, sql`EXTRACT(YEAR FROM ${exams.uploadDate})`),

      // 3. Patients aggregated by month/year
      db.select({
        month: sql<number>`EXTRACT(MONTH FROM ${profiles.createdAt})::int`,
        year: sql<number>`EXTRACT(YEAR FROM ${profiles.createdAt})::int`,
        count: sql<number>`count(*)`
      })
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          gte(profiles.createdAt, startDate),
          lte(profiles.createdAt, endDate)
        ))
        .groupBy(sql`EXTRACT(MONTH FROM ${profiles.createdAt})`, sql`EXTRACT(YEAR FROM ${profiles.createdAt})`),

      // 4. Revenue aggregated by month/year
      db.select({
        month: sql<number>`EXTRACT(MONTH FROM to_date(${appointments.date}, 'YYYY-MM-DD'))::int`,
        year: sql<number>`EXTRACT(YEAR FROM to_date(${appointments.date}, 'YYYY-MM-DD'))::int`,
        total: sql<number>`sum(${appointments.price})`
      })
        .from(appointments)
        .where(and(
          eq(appointments.userId, userId),
          sql`to_date(${appointments.date}, 'YYYY-MM-DD') >= ${startDateStr}`,
          sql`to_date(${appointments.date}, 'YYYY-MM-DD') <= ${endDateStr}`
        ))
        .groupBy(sql`EXTRACT(MONTH FROM to_date(${appointments.date}, 'YYYY-MM-DD'))`, sql`EXTRACT(YEAR FROM to_date(${appointments.date}, 'YYYY-MM-DD'))`),

      // 5. Total patients in period
      db.select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          gte(profiles.createdAt, startDate),
          lte(profiles.createdAt, endDate)
        )),

      // 6. Total exams in period
      db.select({ count: sql<number>`count(*)` })
        .from(exams)
        .where(and(
          eq(exams.userId, userId),
          gte(exams.uploadDate, startDate),
          lte(exams.uploadDate, endDate)
        )),

      // 7. Financial totals
      db.select({
        revenue: sql<number>`sum(${appointments.price})`,
        count: sql<number>`count(*)`
      })
        .from(appointments)
        .where(and(
          eq(appointments.userId, userId),
          sql`to_date(${appointments.date}, 'YYYY-MM-DD') >= ${startDateStr}`,
          sql`to_date(${appointments.date}, 'YYYY-MM-DD') <= ${endDateStr}`
        ))
    ]);

    // Process exam types for pie chart
    const examTypeCount: Record<string, number> = {};
    userExams.forEach(exam => {
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

    // Build activity data from aggregated results
    const activityData = monthsToShow.map(m => {
      const examData = examsByMonth.find(e => e.month === m.month && e.year === m.year);
      const patientData = patientsByMonth.find(p => p.month === m.month && p.year === m.year);
      const revenueData = revenueByMonth.find(r => r.month === m.month && r.year === m.year);

      return {
        name: m.name,
        exames: Number(examData?.count || 0),
        pacientes: Number(patientData?.count || 0),
        faturamento: Number(revenueData?.total || 0) / 100
      };
    });

    // Extract totals
    const totalPatientsInPeriod = totalPatientsResult[0].count;
    const totalExamsInPeriod = totalExamsResult[0].count;
    const totalRevenue = Number(financialTotals[0]?.revenue || 0);
    const payingAppointmentsCount = Number(financialTotals[0]?.count || 0);
    const averageTicket = payingAppointmentsCount > 0 ? Math.round(totalRevenue / payingAppointmentsCount) : 0;

    return {
      examsByType,
      activityData,
      summary: {
        totalPatients: Number(totalPatientsInPeriod),
        totalExams: Number(totalExamsInPeriod),
        mostFrequentExam: examsByType.sort((a, b) => b.value - a.value)[0]?.name || "N/A",
        totalRevenue,
        averageTicket
      }
    };
  }

  // Bug Report operations (DatabaseStorage - PostgreSQL)
  async createBugReport(report: any): Promise<any> {
    const result = await pool.query(
      `INSERT INTO bug_reports (user_id, user_name, user_email, description, page_url, user_agent, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [report.userId || null, report.userName || null, report.userEmail || null, report.description, report.pageUrl || null, report.userAgent || null, report.status || 'new']
    );
    return result.rows[0];
  }

  async getBugReports(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM bug_reports ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async updateBugReportStatus(id: number, status: string): Promise<any | undefined> {
    const result = await pool.query(
      `UPDATE bug_reports SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  // AI Conversation methods (Vita Assist)
  async createAIConversation(userId: number, profileId?: number, title?: string): Promise<AIConversation> {
    const [conversation] = await db.insert(aiConversations)
      .values({
        userId,
        profileId: profileId ?? null,
        title: title ?? null,
      })
      .returning();
    return conversation;
  }

  async getAIConversationsByUserId(userId: number): Promise<AIConversation[]> {
    return await db.select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async getAIConversation(id: number): Promise<AIConversation | undefined> {
    const [conversation] = await db.select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    return conversation;
  }

  async updateAIConversation(id: number, data: Partial<AIConversation>): Promise<AIConversation | undefined> {
    const [updated] = await db.update(aiConversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
    return updated;
  }

  async deleteAIConversation(id: number): Promise<boolean> {
    const result = await db.delete(aiConversations)
      .where(eq(aiConversations.id, id));
    return true;
  }

  async addAIMessage(conversationId: number, role: string, content: string): Promise<AIMessage> {
    const [message] = await db.insert(aiMessages)
      .values({ conversationId, role, content })
      .returning();

    // Update conversation's updatedAt
    await db.update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));

    return message;
  }

  async getAIMessagesByConversationId(conversationId: number): Promise<AIMessage[]> {
    return await db.select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(asc(aiMessages.createdAt));
  }

  // AI Usage Tracking - DatabaseStorage
  async getAIUsageForDate(userId: number, date: string): Promise<AIUsage | undefined> {
    const [usage] = await db.select()
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.date, date)));
    return usage;
  }

  async incrementAIUsage(userId: number, date: string, field: 'aiRequests' | 'aiTokensUsed' | 'transcriptionMinutes' | 'examAnalyses', amount: number): Promise<AIUsage> {
    // Try to get existing record
    const existing = await this.getAIUsageForDate(userId, date);

    if (existing) {
      // Update existing record
      const updateData: Partial<AIUsage> = { updatedAt: new Date() };
      (updateData as any)[field] = existing[field] + amount;

      const [updated] = await db.update(aiUsage)
        .set(updateData)
        .where(and(eq(aiUsage.userId, userId), eq(aiUsage.date, date)))
        .returning();
      return updated;
    } else {
      // Create new record
      const newRecord: any = {
        userId,
        date,
        aiRequests: 0,
        aiTokensUsed: 0,
        transcriptionMinutes: 0,
        examAnalyses: 0
      };
      newRecord[field] = amount;

      const [created] = await db.insert(aiUsage).values(newRecord).returning();
      return created;
    }
  }

  async getMonthlyAIUsage(userId: number, yearMonth: string): Promise<{ aiRequests: number; aiTokensUsed: number; transcriptionMinutes: number; examAnalyses: number }> {
    const results = await db.select({
      aiRequests: sql<number>`COALESCE(SUM(${aiUsage.aiRequests}), 0)`,
      aiTokensUsed: sql<number>`COALESCE(SUM(${aiUsage.aiTokensUsed}), 0)`,
      transcriptionMinutes: sql<number>`COALESCE(SUM(${aiUsage.transcriptionMinutes}), 0)`,
      examAnalyses: sql<number>`COALESCE(SUM(${aiUsage.examAnalyses}), 0)`
    })
      .from(aiUsage)
      .where(and(
        eq(aiUsage.userId, userId),
        sql`${aiUsage.date} LIKE ${yearMonth + '%'}`
      ));

    return results[0] || { aiRequests: 0, aiTokensUsed: 0, transcriptionMinutes: 0, examAnalyses: 0 };
  }

  async getAllUsersUsageStats(yearMonth: string): Promise<Array<{ userId: number; username: string; fullName: string | null; planName: string | null; aiRequests: number; transcriptionMinutes: number; examAnalyses: number }>> {
    const results = await db.select({
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      aiRequests: sql<number>`COALESCE(SUM(${aiUsage.aiRequests}), 0)`,
      transcriptionMinutes: sql<number>`COALESCE(SUM(${aiUsage.transcriptionMinutes}), 0)`,
      examAnalyses: sql<number>`COALESCE(SUM(${aiUsage.examAnalyses}), 0)`
    })
      .from(users)
      .leftJoin(aiUsage, and(
        eq(users.id, aiUsage.userId),
        sql`${aiUsage.date} LIKE ${yearMonth + '%'}`
      ))
      .groupBy(users.id, users.username, users.fullName)
      .orderBy(desc(sql`SUM(${aiUsage.aiRequests})`));

    // Add plan names
    const enrichedResults = await Promise.all(results.map(async (r) => {
      const subscription = await this.getUserSubscription(r.userId);
      let planName = null;
      if (subscription?.planId) {
        const plan = await this.getSubscriptionPlan(subscription.planId);
        planName = plan?.name || null;
      }
      return { ...r, planName };
    }));

    return enrichedResults;
  }
}

// Use DatabaseStorage for production and development with PostgreSQL
// MemStorage is only for testing without a database connection
// IMPORTANT: DatabaseStorage persists data and sessions to PostgreSQL
export const storage: IStorage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();

