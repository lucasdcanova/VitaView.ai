import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadAndAnalyzeDocument, analyzeDocument } from "./services/gemini";
import { generateHealthInsights } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // API routes for exams
  app.post("/api/exams/upload", uploadAndAnalyzeDocument);
  
  // Direct Gemini analysis endpoint for PDF documents
  app.post("/api/analyze/gemini", async (req, res) => {
    try {
      const { fileContent, fileType } = req.body;
      
      if (!fileContent || !fileType) {
        return res.status(400).json({ message: "Conteúdo do arquivo e tipo são obrigatórios" });
      }
      
      const analysisResult = await analyzeDocument(fileContent, fileType);
      res.json(analysisResult);
    } catch (error) {
      console.error("Error in direct Gemini analysis:", error);
      res.status(500).json({ message: "Erro ao analisar o documento com Gemini API" });
    }
  });
  
  app.post("/api/exams", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const examData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const newExam = await storage.createExam(examData);
      res.status(201).json(newExam);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Erro ao criar exame" });
    }
  });
  
  app.get("/api/exams", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const exams = await storage.getExamsByUserId(req.user!.id);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exames" });
    }
  });
  
  app.get("/api/exams/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      if (exam.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const examResult = await storage.getExamResultByExamId(examId);
      
      res.json({ exam, result: examResult });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exame" });
    }
  });
  
  // API route for health insights
  app.get("/api/exams/:id/insights", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      if (exam.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const examResult = await storage.getExamResultByExamId(examId);
      
      if (!examResult) {
        return res.status(404).json({ message: "Resultado do exame não encontrado" });
      }
      
      const insights = await generateHealthInsights(examResult);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar insights" });
    }
  });
  
  // API routes for health metrics
  app.get("/api/health-metrics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const metrics = await storage.getHealthMetricsByUserId(req.user!.id);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas de saúde" });
    }
  });
  
  app.get("/api/health-metrics/latest", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const metrics = await storage.getLatestHealthMetrics(req.user!.id, limit);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas de saúde" });
    }
  });
  
  // API routes for notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const notifications = await storage.getNotificationsByUserId(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });
  
  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
  });
  
  // API routes for user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const updatedUser = await storage.updateUser(req.user!.id, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
