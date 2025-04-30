import { users, exams, examResults, healthMetrics, notifications } from "@shared/schema";
import type { User, InsertUser, Exam, InsertExam, ExamResult, InsertExamResult, HealthMetric, InsertHealthMetric, Notification, InsertNotification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exams: Map<number, Exam>;
  private examResults: Map<number, ExamResult>;
  private healthMetricsMap: Map<number, HealthMetric>;
  private notificationsMap: Map<number, Notification>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private examIdCounter: number = 1;
  private examResultIdCounter: number = 1;
  private healthMetricIdCounter: number = 1;
  private notificationIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.examResults = new Map();
    this.healthMetricsMap = new Map();
    this.notificationsMap = new Map();
    
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
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
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
      originalContent: ""
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
    const newResult: ExamResult = { ...result, id, analysisDate: new Date() };
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
    const newMetric: HealthMetric = { ...metric, id, date: new Date() };
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

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = { ...notification, id, date: new Date() };
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
}

export const storage = new MemStorage();
