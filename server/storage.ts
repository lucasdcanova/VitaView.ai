import { users, exams, examResults, healthMetrics, notifications, profiles, subscriptionPlans, subscriptions } from "@shared/schema";
import type { User, InsertUser, Profile, InsertProfile, Exam, InsertExam, ExamResult, InsertExamResult, HealthMetric, InsertHealthMetric, Notification, InsertNotification, SubscriptionPlan, InsertSubscriptionPlan, Subscription, InsertSubscription } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, asc } from "drizzle-orm";

// Fix for type issues - use any to bypass complex type definitions
type SessionStore = any;

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Profile operations
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: number): Promise<Profile | undefined>;
  getProfilesByUserId(userId: number): Promise<Profile[]>;
  updateProfile(id: number, profile: Partial<Profile>): Promise<Profile | undefined>;
  deleteProfile(id: number): Promise<boolean>;
  getDefaultProfileForUser(userId: number): Promise<Profile | undefined>;
  
  // Exam operations
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByUserId(userId: number): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Exam results operations
  createExamResult(result: InsertExamResult): Promise<ExamResult>;
  getExamResult(id: number): Promise<ExamResult | undefined>;
  getExamResultByExamId(examId: number): Promise<ExamResult | undefined>;
  
  // Health metrics operations
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  getHealthMetricsByUserId(userId: number): Promise<HealthMetric[]>;
  getLatestHealthMetrics(userId: number, limit: number): Promise<HealthMetric[]>;
  deleteHealthMetric(id: number): Promise<boolean>;
  deleteAllHealthMetricsByUserId(userId: number): Promise<number>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
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
  sessionStore: SessionStore;
  
  private userIdCounter: number = 1;
  private profileIdCounter: number = 1;
  private examIdCounter: number = 1;
  private examResultIdCounter: number = 1;
  private healthMetricIdCounter: number = 1;
  private notificationIdCounter: number = 1;
  private subscriptionPlanIdCounter: number = 1;
  private subscriptionIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.exams = new Map();
    this.examResults = new Map();
    this.healthMetricsMap = new Map();
    this.notificationsMap = new Map();
    this.subscriptionPlansMap = new Map();
    this.subscriptionsMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add a sample user for development
    this.createUser({
      username: "demo",
      password: "password",
      fullName: "Demo User",
      email: "demo@example.com"
    });
    
    // Add subscription plans
    this._createDefaultSubscriptionPlans();
  }
  
  private async _createDefaultSubscriptionPlans() {
    // Plano Gratuito
    await this.createSubscriptionPlan({
      name: "Gratuito",
      description: "Ideal para testes e uso esporádico",
      maxProfiles: 1,
      maxUploadsPerProfile: 1,
      price: 0,
      interval: "month",
      features: ["1 perfil", "1 upload por perfil", "Análise de 1 página por PDF"],
      isActive: true
    });
    
    // Plano Individual
    await this.createSubscriptionPlan({
      name: "Individual",
      description: "Perfeito para uso pessoal",
      maxProfiles: 1,
      maxUploadsPerProfile: -1, // ilimitado
      price: 2900, // R$ 29,00
      interval: "month",
      features: ["1 perfil", "Uploads ilimitados", "Análises ilimitadas", "Suporte ao cliente"],
      isActive: true
    });
    
    // Plano Familiar
    await this.createSubscriptionPlan({
      name: "Familiar",
      description: "Excelente para acompanhar a saúde de toda família",
      maxProfiles: 5,
      maxUploadsPerProfile: -1, // ilimitado
      price: 4900, // R$ 49,00
      interval: "month",
      features: ["5 perfis", "Uploads ilimitados por perfil", "Análises ilimitadas", "Suporte ao cliente prioritário"],
      isActive: true
    });
    
    // Plano Consultório Médico
    await this.createSubscriptionPlan({
      name: "Consultório Médico",
      description: "Ideal para médicos e pequenas clínicas",
      maxProfiles: 100,
      maxUploadsPerProfile: -1, // ilimitado
      price: 14900, // R$ 149,00
      interval: "month",
      features: ["100 perfis", "Uploads ilimitados por perfil", "Análises ilimitadas", "Suporte dedicado", "Relatórios avançados"],
      isActive: true
    });
    
    // Plano Hospitalar/Plano de Saúde
    await this.createSubscriptionPlan({
      name: "Hospitalar/Plano de Saúde",
      description: "Solução completa para hospitais e planos de saúde",
      maxProfiles: -1, // ilimitado
      maxUploadsPerProfile: -1, // ilimitado
      price: 49900, // R$ 499,00
      interval: "month",
      features: ["Perfis ilimitados", "Uploads ilimitados por perfil", "Análises ilimitadas", "Suporte premium 24/7", "Relatórios avançados", "APIs de integração"],
      isActive: true
    });
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
      stripeSubscriptionId: null
    };
    this.users.set(id, newUser);
    
    // Create a default profile for the new user
    const defaultProfile = await this.createProfile({
      userId: id,
      name: user.fullName || "Perfil Principal",
      relationship: "Próprio",
      birthDate: null,
      gender: null,
      bloodType: null,
      isDefault: true
    });
    
    // Set the default profile as the active profile
    await this.updateUser(id, { activeProfileId: defaultProfile.id });
    
    return this.users.get(id)!;
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
      isDefault: profile.isDefault || false,
      createdAt: new Date()
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
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
      requestingPhysician: exam.requestingPhysician || null
    };
    this.exams.set(id, newExam);
    return newExam;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByUserId(userId: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(
      (exam) => exam.userId === userId
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
      date: metric.date || new Date(),
      status: metric.status || null,
      unit: metric.unit || null,
      change: metric.change || null
      // Removidos campos que não existem no banco de dados real
      // referenceMin, referenceMax, clinical_significance, category
    };
    this.healthMetricsMap.set(id, newMetric);
    return newMetric;
  }

  async getHealthMetricsByUserId(userId: number): Promise<HealthMetric[]> {
    return Array.from(this.healthMetricsMap.values()).filter(
      (metric) => metric.userId === userId
    );
  }

  async getLatestHealthMetrics(userId: number, limit: number): Promise<HealthMetric[]> {
    const userMetrics = await this.getHealthMetricsByUserId(userId);
    
    // Group by name to get latest of each type
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
  
  async deleteAllHealthMetricsByUserId(userId: number): Promise<number> {
    const metrics = await this.getHealthMetricsByUserId(userId);
    let count = 0;
    
    for (const metric of metrics) {
      if (await this.deleteHealthMetric(metric.id)) {
        count++;
      }
    }
    
    return count;
  }
  
  async deleteExamResult(id: number): Promise<boolean> {
    return this.examResults.delete(id);
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
  
  // Subscription plans operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanIdCounter++;
    const newPlan: SubscriptionPlan = {
      id,
      name: plan.name,
      description: plan.description,
      maxProfiles: plan.maxProfiles,
      maxUploadsPerProfile: plan.maxUploadsPerProfile,
      price: plan.price,
      interval: plan.interval || "month",
      stripePriceId: plan.stripePriceId || null,
      features: plan.features || null,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      createdAt: new Date()
    };
    
    this.subscriptionPlansMap.set(id, newPlan);
    return newPlan;
  }
  
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlansMap.values())
      .filter(plan => plan.isActive)
      .sort((a, b) => a.price - b.price);
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlansMap.get(id);
  }
  
  // User subscriptions operations
  async createUserSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const now = new Date();
    
    // Define period end (1 month from now by default)
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    const newSubscription: Subscription = {
      id,
      userId: subscription.userId,
      planId: subscription.planId,
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
  
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values())
      .find(sub => sub.userId === userId && sub.status === "active");
  }
  
  async updateUserSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...data };
    this.subscriptionsMap.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  async cancelUserSubscription(id: number): Promise<Subscription | undefined> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { 
      ...subscription, 
      status: "canceled",
      canceledAt: new Date()
    };
    
    this.subscriptionsMap.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  async incrementProfileCount(subscriptionId: number): Promise<number> {
    const subscription = this.subscriptionsMap.get(subscriptionId);
    if (!subscription) return 0;
    
    const updatedSubscription = { 
      ...subscription, 
      profilesCreated: subscription.profilesCreated + 1 
    };
    
    this.subscriptionsMap.set(subscriptionId, updatedSubscription);
    return updatedSubscription.profilesCreated;
  }
  
  async incrementUploadCount(subscriptionId: number, profileId: number): Promise<number> {
    const subscription = this.subscriptionsMap.get(subscriptionId);
    if (!subscription) return 0;
    
    const profileIdStr = profileId.toString();
    const uploadsCount = { ...subscription.uploadsCount };
    
    // Initialize count for profile if not exists
    if (!uploadsCount[profileIdStr]) {
      uploadsCount[profileIdStr] = 0;
    }
    
    // Increment upload count
    uploadsCount[profileIdStr]++;
    
    const updatedSubscription = { ...subscription, uploadsCount };
    this.subscriptionsMap.set(subscriptionId, updatedSubscription);
    
    return uploadsCount[profileIdStr];
  }
  
  async canCreateProfile(userId: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;
    
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (!plan) return false;
    
    // Unlimited profiles
    if (plan.maxProfiles === -1) return true;
    
    // Check profile count against limit
    return subscription.profilesCreated < plan.maxProfiles;
  }
  
  async canUploadExam(userId: number, profileId: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;
    
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (!plan) return false;
    
    // Unlimited uploads
    if (plan.maxUploadsPerProfile === -1) return true;
    
    // Check upload count for profile against limit
    const profileIdStr = profileId.toString();
    const profileUploads = subscription.uploadsCount[profileIdStr] || 0;
    
    return profileUploads < plan.maxUploadsPerProfile;
  }
  
  async getAllSubscriptionsByStripeId(stripeSubscriptionId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptionsMap.values()).filter(
      subscription => subscription.stripeSubscriptionId === stripeSubscriptionId
    );
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
    
    // Ensure subscription plans exist
    this.setupDefaultSubscriptionPlans();
  }
  
  private async setupDefaultSubscriptionPlans() {
    try {
      // Check if plans already exist
      const existingPlans = await this.getSubscriptionPlans();
      
      if (existingPlans.length === 0) {
        console.log("Creating default subscription plans...");
        
        // Plano Gratuito
        await this.createSubscriptionPlan({
          name: "Gratuito",
          description: "Ideal para testes e uso esporádico",
          maxProfiles: 1,
          maxUploadsPerProfile: 1,
          price: 0,
          interval: "month",
          features: ["1 perfil", "1 upload por perfil", "Análise de 1 página por PDF"],
          isActive: true
        });
        
        // Plano Individual
        await this.createSubscriptionPlan({
          name: "Individual",
          description: "Perfeito para uso pessoal",
          maxProfiles: 1,
          maxUploadsPerProfile: -1,
          price: 2900,
          interval: "month",
          features: ["1 perfil", "Uploads ilimitados", "Análises ilimitadas", "Suporte ao cliente"],
          isActive: true
        });
        
        // Plano Familiar
        await this.createSubscriptionPlan({
          name: "Familiar",
          description: "Excelente para acompanhar a saúde de toda família",
          maxProfiles: 5,
          maxUploadsPerProfile: -1,
          price: 4900,
          interval: "month",
          features: ["5 perfis", "Uploads ilimitados por perfil", "Análises ilimitadas", "Suporte ao cliente prioritário"],
          isActive: true
        });
        
        // Plano Consultório Médico
        await this.createSubscriptionPlan({
          name: "Consultório Médico",
          description: "Ideal para médicos e pequenas clínicas",
          maxProfiles: 100,
          maxUploadsPerProfile: -1,
          price: 14900,
          interval: "month",
          features: ["100 perfis", "Uploads ilimitados por perfil", "Análises ilimitadas", "Suporte dedicado", "Relatórios avançados"],
          isActive: true
        });
        
        // Plano Hospitalar/Plano de Saúde
        await this.createSubscriptionPlan({
          name: "Hospitalar/Plano de Saúde",
          description: "Solução completa para hospitais e planos de saúde",
          maxProfiles: -1,
          maxUploadsPerProfile: -1,
          price: 49900,
          interval: "month",
          features: ["Perfis ilimitados", "Uploads ilimitados por perfil", "Análises ilimitadas", "Suporte premium 24/7", "Relatórios avançados", "APIs de integração"],
          isActive: true
        });
      }
    } catch (error) {
      console.error("Error setting up subscription plans:", error);
    }
  }
  
  // Profile operations
  async createProfile(profile: InsertProfile): Promise<Profile> {
    // If this is set as default, unset default on other profiles
    if (profile.isDefault) {
      await db
        .update(profiles)
        .set({ isDefault: false })
        .where(eq(profiles.userId, profile.userId))
        .execute();
    }
    
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }
  
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }
  
  async getProfilesByUserId(userId: number): Promise<Profile[]> {
    return db.select().from(profiles).where(eq(profiles.userId, userId));
  }
  
  async updateProfile(id: number, profileData: Partial<Profile>): Promise<Profile | undefined> {
    // If setting this as default, unset other defaults
    if (profileData.isDefault) {
      const profile = await this.getProfile(id);
      if (profile) {
        await db
          .update(profiles)
          .set({ isDefault: false })
          .where(eq(profiles.userId, profile.userId))
          .execute();
      }
    }
    
    const [updatedProfile] = await db
      .update(profiles)
      .set(profileData)
      .where(eq(profiles.id, id))
      .returning();
      
    return updatedProfile;
  }
  
  async deleteProfile(id: number): Promise<boolean> {
    const profile = await this.getProfile(id);
    if (!profile) return false;
    
    // Don't delete the default profile
    if (profile.isDefault) return false;
    
    await db.delete(profiles).where(eq(profiles.id, id));
    return true;
  }
  
  async getDefaultProfileForUser(userId: number): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .where(eq(profiles.isDefault, true));
      
    return profile;
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

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(userId, { 
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId
    });
  }

  // Exam operations
  async createExam(exam: InsertExam): Promise<Exam> {
    // Garantir valores default e remover propriedades que não existem no schema
    const examWithDefaults = {
      ...exam,
      originalContent: exam.originalContent || "",
      requestingPhysician: exam.requestingPhysician || null
    };
    const [newExam] = await db.insert(exams).values(examWithDefaults).returning();
    return newExam;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByUserId(userId: number): Promise<Exam[]> {
    // Tentativa alternativa para evitar erros de coluna
    try {
      // Primeiro verificar se a tabela existe e tem registros
      const queryText = `
        SELECT 
          id, 
          user_id as "userId", 
          name, 
          file_type as "fileType", 
          status, 
          upload_date as "uploadDate", 
          laboratory_name as "laboratoryName", 
          exam_date as "examDate",
          requesting_physician as "requestingPhysician",
          COALESCE(original_content, '') as "originalContent"
        FROM exams 
        WHERE user_id = $1
      `;
      
      // Usar query SQL direta para maior controle e permitir COALESCE
      const { rows } = await pool.query(queryText, [userId]);
      
      // Se o COALESCE não funcionar devido à ausência das colunas, os erros serão capturados
      return rows.map(row => {
        // Garantir que as datas são objetos Date
        if (row.uploadDate && typeof row.uploadDate === 'string') {
          row.uploadDate = new Date(row.uploadDate);
        }
        return row as unknown as Exam;
      });
    } catch (error) {
      console.error("Erro ao buscar exames via SQL:", error);
      
      // Fallback para método alternativo se o SQL direto falhar
      try {
        console.log("Tentando método alternativo com projeção segura...");
        
        // Selecionar todas as colunas incluindo a nova
        const results = await db.select({
          id: exams.id,
          userId: exams.userId,
          name: exams.name,
          fileType: exams.fileType,
          status: exams.status,
          uploadDate: exams.uploadDate,
          laboratoryName: exams.laboratoryName,
          examDate: exams.examDate,
          requestingPhysician: exams.requestingPhysician,
        }).from(exams).where(eq(exams.userId, userId));
        
        // Adaptar ao tipo completo - incluindo campos que podem faltar
        return results.map(exam => {
          return {
            ...exam,
            originalContent: null,
            requestingPhysician: null
          } as Exam;
        });
      } catch (fallbackError) {
        console.error("Erro no método alternativo:", fallbackError);
        // Se tudo falhar, retornar lista vazia
        return [];
      }
    }
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const [updatedExam] = await db
      .update(exams)
      .set(examData)
      .where(eq(exams.id, id))
      .returning();
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    // First check if the exam exists
    const examExists = await this.getExam(id);
    if (!examExists) return false;
    
    // Delete the exam - we don't need to check the result since we already confirmed it exists
    await db.delete(exams).where(eq(exams.id, id));
    return true;
  }

  // Exam results operations
  async createExamResult(result: InsertExamResult): Promise<ExamResult> {
    const [newResult] = await db.insert(examResults).values(result).returning();
    return newResult;
  }

  async getExamResult(id: number): Promise<ExamResult | undefined> {
    const [result] = await db.select().from(examResults).where(eq(examResults.id, id));
    return result;
  }

  async getExamResultByExamId(examId: number): Promise<ExamResult | undefined> {
    const [result] = await db.select().from(examResults).where(eq(examResults.examId, examId));
    return result;
  }

  // Health metrics operations
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    try {
      // Filtrar apenas as colunas que existem na tabela
      const filteredMetric = {
        userId: metric.userId,
        name: metric.name,
        value: metric.value,
        unit: metric.unit || null,
        status: metric.status || null,
        change: metric.change || null,
        date: metric.date || new Date()
      };
      
      const [newMetric] = await db.insert(healthMetrics).values(filteredMetric).returning();
      
      // O schema já foi atualizado, então podemos retornar diretamente
      return newMetric;
    } catch (error) {
      console.error("Erro ao criar métrica de saúde:", error);
      // Criar um objeto simulado com os dados de entrada como fallback
      return {
        id: -1, // ID fictício para indicar que não foi salvo
        userId: metric.userId,
        name: metric.name,
        value: metric.value,
        unit: metric.unit || null,
        status: metric.status || null,
        change: metric.change || null,
        date: metric.date || new Date()
      };
    }
  }

  async getHealthMetricsByUserId(userId: number): Promise<HealthMetric[]> {
    try {
      // Usar consulta SQL direta para lidar com colunas que podem estar faltando
      const queryText = `
        SELECT 
          id, 
          user_id as "userId", 
          name, 
          value, 
          unit, 
          status, 
          change, 
          date
        FROM health_metrics 
        WHERE user_id = $1
      `;
      
      // Usar query SQL direta para ter mais controle
      const { rows } = await pool.query(queryText, [userId]);
      
      // Converter as datas para objetos Date
      return rows.map(row => {
        if (row.date && typeof row.date === 'string') {
          row.date = new Date(row.date);
        }
        return row as unknown as HealthMetric;
      });
    } catch (error) {
      console.error("Erro ao buscar métricas de saúde:", error);
      return []; // Retornar array vazio em caso de erro
    }
  }

  async getLatestHealthMetrics(userId: number, limit: number): Promise<HealthMetric[]> {
    // Get all metrics for the user
    const userMetrics = await this.getHealthMetricsByUserId(userId);
    
    // Group by name to get latest of each type
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
    try {
      const result = await db.delete(healthMetrics).where(eq(healthMetrics.id, id));
      // Se ao menos uma linha for afetada, consideramos sucesso
      return result && result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Erro ao excluir métrica de saúde com ID ${id}:`, error);
      return false;
    }
  }
  
  async deleteAllHealthMetricsByUserId(userId: number): Promise<number> {
    try {
      console.log(`[DeleteAllHealthMetrics] Excluindo todas as métricas para o usuário ${userId}`);
      const result = await db.delete(healthMetrics).where(eq(healthMetrics.userId, userId));
      return result && result.rowCount ? result.rowCount : 0;
    } catch (error) {
      console.error(`Erro ao excluir métricas de saúde do usuário ${userId}:`, error);
      return 0;
    }
  }
  
  async deleteExamResult(id: number): Promise<boolean> {
    try {
      const result = await db.delete(examResults).where(eq(examResults.id, id));
      return result && result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Erro ao excluir resultado de exame com ID ${id}:`, error);
      return false;
    }
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.date));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
  
  // Subscription plans operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(asc(subscriptionPlans.price));
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      return [];
    }
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    try {
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id));
      return plan;
    } catch (error) {
      console.error(`Error fetching subscription plan ${id}:`, error);
      return undefined;
    }
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    try {
      const [newPlan] = await db
        .insert(subscriptionPlans)
        .values({
          ...plan,
          createdAt: new Date()
        })
        .returning();
      return newPlan;
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  }
  
  // User subscriptions operations
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .where(eq(subscriptions.status, "active"));
      return subscription;
    } catch (error) {
      console.error(`Error fetching subscription for user ${userId}:`, error);
      return undefined;
    }
  }
  
  async createUserSubscription(subscription: InsertSubscription): Promise<Subscription> {
    try {
      const now = new Date();
      
      // Define period end date (1 month from now by default)
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          ...subscription,
          status: subscription.status || "active",
          currentPeriodStart: subscription.currentPeriodStart || now,
          currentPeriodEnd: subscription.currentPeriodEnd || periodEnd,
          createdAt: now,
          profilesCreated: 0,
          uploadsCount: {} as any
        })
        .returning();
      
      return newSubscription;
    } catch (error) {
      console.error("Error creating user subscription:", error);
      throw error;
    }
  }
  
  async updateUserSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    try {
      const [updatedSubscription] = await db
        .update(subscriptions)
        .set(data)
        .where(eq(subscriptions.id, id))
        .returning();
      
      return updatedSubscription;
    } catch (error) {
      console.error(`Error updating subscription ${id}:`, error);
      return undefined;
    }
  }
  
  async cancelUserSubscription(id: number): Promise<Subscription | undefined> {
    try {
      const [canceledSubscription] = await db
        .update(subscriptions)
        .set({
          status: "canceled",
          canceledAt: new Date()
        })
        .where(eq(subscriptions.id, id))
        .returning();
      
      return canceledSubscription;
    } catch (error) {
      console.error(`Error canceling subscription ${id}:`, error);
      return undefined;
    }
  }
  
  async incrementProfileCount(subscriptionId: number): Promise<number> {
    try {
      // Get current subscription
      const subscription = await this.getSubscriptionById(subscriptionId);
      if (!subscription) return 0;
      
      // Increment profile count
      const profilesCreated = (subscription.profilesCreated || 0) + 1;
      
      // Update subscription
      await db
        .update(subscriptions)
        .set({ profilesCreated })
        .where(eq(subscriptions.id, subscriptionId));
      
      return profilesCreated;
    } catch (error) {
      console.error(`Error incrementing profile count for subscription ${subscriptionId}:`, error);
      return 0;
    }
  }
  
  async incrementUploadCount(subscriptionId: number, profileId: number): Promise<number> {
    try {
      // Get current subscription
      const subscription = await this.getSubscriptionById(subscriptionId);
      if (!subscription) return 0;
      
      // Get current uploadsCount or initialize if not exists
      const uploadsCount = subscription.uploadsCount as Record<string, number> || {};
      const profileIdStr = profileId.toString();
      
      // Initialize count for profile if not exists
      if (!uploadsCount[profileIdStr]) {
        uploadsCount[profileIdStr] = 0;
      }
      
      // Increment upload count
      uploadsCount[profileIdStr]++;
      
      // Update subscription
      await db
        .update(subscriptions)
        .set({ uploadsCount })
        .where(eq(subscriptions.id, subscriptionId));
      
      return uploadsCount[profileIdStr];
    } catch (error) {
      console.error(`Error incrementing upload count for subscription ${subscriptionId}, profile ${profileId}:`, error);
      return 0;
    }
  }
  
  private async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, id));
      return subscription;
    } catch (error) {
      console.error(`Error fetching subscription ${id}:`, error);
      return undefined;
    }
  }
  
  async canCreateProfile(userId: number): Promise<boolean> {
    try {
      // Get active subscription for user
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;
      
      // Get subscription plan
      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) return false;
      
      // Unlimited profiles
      if (plan.maxProfiles === -1) return true;
      
      // Check profile count against limit
      return (subscription.profilesCreated || 0) < plan.maxProfiles;
    } catch (error) {
      console.error(`Error checking if user ${userId} can create profile:`, error);
      return false;
    }
  }
  
  async canUploadExam(userId: number, profileId: number): Promise<boolean> {
    try {
      // Get active subscription for user
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;
      
      // Get subscription plan
      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) return false;
      
      // Unlimited uploads
      if (plan.maxUploadsPerProfile === -1) return true;
      
      // Check upload count for profile against limit
      const profileIdStr = profileId.toString();
      const uploadsCount = subscription.uploadsCount as Record<string, number> || {};
      const profileUploads = uploadsCount[profileIdStr] || 0;
      
      return profileUploads < plan.maxUploadsPerProfile;
    } catch (error) {
      console.error(`Error checking if user ${userId} can upload exam for profile ${profileId}:`, error);
      return false;
    }
  }
  
  async getAllSubscriptionsByStripeId(stripeSubscriptionId: string): Promise<Subscription[]> {
    try {
      return await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    } catch (error) {
      console.error(`Error fetching subscriptions by Stripe ID ${stripeSubscriptionId}:`, error);
      return [];
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
