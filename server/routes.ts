import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadAndAnalyzeDocument, analyzeDocument } from "./services/gemini";
import { generateHealthInsights, generateChronologicalReport } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // API routes for exams
  app.post("/api/exams/upload", uploadAndAnalyzeDocument);
  
  // Rota para análise de documentos - etapa 1: análise com Gemini
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
  
  // Rota para análise de documentos - etapa 2: interpretação com OpenAI
  app.post("/api/analyze/interpretation", async (req, res) => {
    try {
      const { analysisResult, patientData } = req.body;
      
      if (!analysisResult) {
        return res.status(400).json({ message: "Resultado da análise é obrigatório" });
      }
      
      // Formatar como ExamResult para passar para o OpenAI
      const formattedResult = {
        id: 0, // ID temporário
        examId: 0, // ID temporário
        analysisDate: new Date(),
        summary: analysisResult.summary,
        detailedAnalysis: analysisResult.detailedAnalysis,
        recommendations: Array.isArray(analysisResult.recommendations) 
          ? analysisResult.recommendations.join('\n') 
          : analysisResult.recommendations,
        healthMetrics: analysisResult.healthMetrics,
        aiProvider: "gemini"
      };
      
      // Gerar insights usando OpenAI com contexto do paciente
      const insights = await generateHealthInsights(formattedResult, patientData);
      res.json(insights);
    } catch (error) {
      console.error("Error in OpenAI interpretation:", error);
      res.status(500).json({ message: "Erro ao interpretar análise com OpenAI API" });
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
      
      // Obter dados do paciente para contextualização
      const user = req.user;
      
      // Obter dados de histórico médico (se fornecidos via query params)
      let patientData = null;
      if (req.query.patientData) {
        try {
          patientData = JSON.parse(req.query.patientData as string);
        } catch (e) {
          console.warn("Error parsing patient data:", e);
        }
      } else {
        // Se não fornecido, criar dados básicos do perfil do usuário
        patientData = {
          gender: user.gender,
          age: user.birthDate ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          diseases: [],
          surgeries: [],
          allergies: []
        };
      }
      
      // Chamada à OpenAI com contexto do paciente
      const insights = await generateHealthInsights(examResult, patientData);
      res.json(insights);
    } catch (error) {
      console.error("Error generating health insights:", error);
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
  
  // Rota para gerar relatório cronológico contextual com OpenAI
  app.get("/api/reports/chronological", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      // Buscar todos os resultados de exames do usuário
      const exams = await storage.getExamsByUserId(req.user!.id);
      
      if (!exams || exams.length === 0) {
        return res.status(404).json({ message: "Nenhum exame encontrado para análise" });
      }
      
      // Buscar resultados de exames
      const examResults = [];
      for (const exam of exams) {
        const result = await storage.getExamResultByExamId(exam.id);
        if (result) {
          // Adicionamos a data do exame ao resultado para ordenação cronológica
          examResults.push({
            ...result,
            createdAt: exam.uploadDate
          });
        }
      }
      
      if (examResults.length === 0) {
        return res.status(404).json({ message: "Nenhum resultado de exame encontrado para análise" });
      }
      
      // Ordenar resultados por data (do mais antigo para o mais recente)
      examResults.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Buscar dados do usuário para contextualização
      const user = req.user;
      
      // Obter parâmetros adicionais do paciente (se fornecidos)
      const patientData = req.query.patientData ? JSON.parse(req.query.patientData as string) : null;
      
      // Gerar relatório cronológico
      const report = await generateChronologicalReport(examResults, user);
      
      res.json(report);
    } catch (error) {
      console.error("Error generating chronological report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório cronológico" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
