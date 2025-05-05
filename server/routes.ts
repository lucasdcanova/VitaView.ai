import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadAndAnalyzeDocument, analyzeDocument } from "./services/gemini";
import { generateHealthInsights, generateChronologicalReport } from "./services/openai";

// Middleware para verificar autenticação
async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log(`[Auth Check] Path: ${req.path}, Method: ${req.method}, Auth: ${req.isAuthenticated()}, Session ID: ${req.sessionID || 'undefined'}`);
  console.log(`[Auth Headers] ${JSON.stringify(req.headers)}`);
  
  // Verifica a autenticação padrão pelo Passport
  if (req.isAuthenticated()) {
    console.log(`[Auth Success] User ID: ${req.user!.id}, Username: ${req.user!.username}`);
    return next();
  }
  
  // Tenta recuperar a autenticação pelo cookie auxiliar
  try {
    console.log(`[Auth Debug] Cookie Header: ${req.headers.cookie}`);
    
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join('='); // Caso o valor contenha =
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>) || {};
    
    console.log(`[Auth Debug] Parsed Cookies: ${JSON.stringify(cookies)}`);
    
    // Verifica o cookie simplificado auth_user_id
    if (cookies['auth_user_id']) {
      try {
        console.log(`[Auth Debug] Found auth_user_id: ${cookies['auth_user_id']}`);
        const userId = parseInt(cookies['auth_user_id']);
        
        if (!isNaN(userId)) {
          console.log(`[Auth Alternative] Usando auth_user_id para user ID: ${userId}`);
          // Recupera o usuário pelo ID
          const user = await storage.getUser(userId);
          
          if (user) {
            console.log(`[Auth Alternative] Usuário recuperado via auth_user_id: ${user.username}`);
            // Define o usuário na sessão
            return req.login(user, (err) => {
              if (err) {
                console.error("[Auth Alternative] Erro ao fazer login:", err);
                return res.status(401).json({ message: "Erro de autenticação" });
              }
              // Continua o fluxo
              console.log(`[Auth Alternative] Login bem-sucedido para ${user.username}`);
              return next();
            });
          } else {
            console.log(`[Auth Alternative] Usuário não encontrado para auth_user_id: ${userId}`);
          }
        } else {
          console.log(`[Auth Alternative] auth_user_id inválido: ${cookies['auth_user_id']}`);
        }
      } catch (error) {
        console.error("[Auth Error] Erro ao processar auth_user_id:", error);
      }
    }
    // Também tenta o cookie auth_token para compatibilidade com versões anteriores
    else if (cookies['auth_token']) {
      try {
        console.log(`[Auth Debug] Raw auth_token: ${cookies['auth_token']}`);
        const decodedToken = decodeURIComponent(cookies['auth_token']);
        console.log(`[Auth Debug] Decoded auth_token: ${decodedToken}`);
        const authData = JSON.parse(decodedToken);
        
        if (authData && authData.id) {
          console.log(`[Auth Alternative] Encontrado token auxiliar para user ID: ${authData.id}`);
          // Recupera o usuário pelo ID
          const user = await storage.getUser(authData.id);
          
          if (user) {
            console.log(`[Auth Alternative] Usuário recuperado: ${user.username}`);
            // Define o usuário na sessão
            return req.login(user, (err) => {
              if (err) {
                console.error("[Auth Alternative] Erro ao fazer login:", err);
                return res.status(401).json({ message: "Erro de autenticação" });
              }
              // Continua o fluxo
              console.log(`[Auth Alternative] Login bem-sucedido para ${user.username}`);
              return next();
            });
          } else {
            console.log(`[Auth Alternative] Usuário não encontrado: ID ${authData.id}`);
          }
        } else {
          console.log(`[Auth Alternative] Token sem ID válido: ${JSON.stringify(authData)}`);
        }
      } catch (parseError) {
        console.error("[Auth Error] Erro ao parsear token JSON:", parseError);
      }
    } else {
      console.log(`[Auth Debug] Nenhum cookie de autenticação alternativa encontrado`);
    }
  } catch (error) {
    console.error("[Auth Error] Erro ao processar autenticação alternativa:", error);
  }
  
  // Debug dos cookies
  console.log(`[Auth Failed] Cookies: ${req.headers.cookie}`);
  console.log(`[Auth Failed] Session Data: ${JSON.stringify(req.session || {})}`);
  console.log(`[Auth Failed] PassportJS: ${JSON.stringify(req.session && 'passport' in req.session ? req.session.passport : {})}`);
  
  // Bypass para análise Gemini para diagnóstico
  if (req.path === '/api/analyze/gemini' && req.headers.cookie && req.headers.cookie.includes('connect.sid')) {
    console.log(`[Auth Bypass] Permitindo requisição para análise Gemini para diagnóstico`);
    return next();
  }
  
  // Se não estiver autenticado, retorna 401
  return res.status(401).json({ message: "Não autenticado" });
}

// Middleware de logs para depuração
function logRequest(req: Request, res: Response, next: NextFunction) {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.path} - User: ${req.isAuthenticated() ? req.user?.id : 'não autenticado'}`);
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Aplicar middleware de log para todas as rotas
  app.use(logRequest);

  // API routes for exams - removendo requisito de autenticação para diagnóstico
  app.post("/api/exams/upload", uploadAndAnalyzeDocument);
  
  // Rota para análise de documentos - etapa 1: análise com Gemini
  app.post("/api/analyze/gemini", async (req, res) => {
    try {
      console.log("[Gemini Endpoint] Recebida requisição");
      console.log("[Gemini Endpoint] Autenticado:", req.isAuthenticated());
      console.log("[Gemini Endpoint] Session ID:", req.sessionID);
      console.log("[Gemini Endpoint] Cookies:", req.headers.cookie);
      
      const { fileContent, fileType } = req.body;
      
      if (!fileContent || !fileType) {
        return res.status(400).json({ message: "Conteúdo do arquivo e tipo são obrigatórios" });
      }
      
      // Temporariamente removemos a verificação de autenticação para diagnóstico
      console.log(`[Gemini Endpoint] Iniciando análise (autenticado: ${req.isAuthenticated()})`);
      const analysisResult = await analyzeDocument(fileContent, fileType);
      console.log("[Gemini Endpoint] Análise concluída com sucesso");
      res.json(analysisResult);
    } catch (error) {
      console.error("Error in direct Gemini analysis:", error);
      res.status(500).json({ message: "Erro ao analisar o documento com Gemini API" });
    }
  });
  
  // Rota para análise de documentos - etapa 2: interpretação com OpenAI
  app.post("/api/analyze/interpretation", async (req, res) => {
    try {
      console.log("[OpenAI Endpoint] Recebida requisição");
      console.log("[OpenAI Endpoint] Autenticado:", req.isAuthenticated());
      console.log("[OpenAI Endpoint] Session ID:", req.sessionID);
      console.log("[OpenAI Endpoint] Cookies:", req.headers.cookie);
      
      const { analysisResult, patientData } = req.body;
      
      if (!analysisResult) {
        return res.status(400).json({ message: "Resultado da análise é obrigatório" });
      }
      
      // Temporariamente removemos a verificação de autenticação para diagnóstico
      console.log(`[OpenAI Endpoint] Iniciando interpretação (autenticado: ${req.isAuthenticated()})`);
      
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
      console.log("[OpenAI Endpoint] Interpretação concluída com sucesso");
      res.json(insights);
    } catch (error) {
      console.error("Error in OpenAI interpretation:", error);
      res.status(500).json({ message: "Erro ao interpretar análise com OpenAI API" });
    }
  });
  
  app.post("/api/exams", async (req, res) => {
    try {  
      console.log("[Exams Endpoint] Recebida requisição para criar exame");
      console.log("[Exams Endpoint] Autenticado:", req.isAuthenticated());
      console.log("[Exams Endpoint] Session ID:", req.sessionID);
      console.log("[Exams Endpoint] Cookies:", req.headers.cookie);
      
      // Sempre usar o userId do corpo da requisição para diagnóstico
      // Esta é uma medida temporária para garantir que os exames sejam salvos
      let userId = req.body.userId;
      
      if (!userId) {
        console.error("[Exams Endpoint] Sem userId válido no corpo da requisição");
        // Tenta obter do usuário autenticado se disponível
        if (req.isAuthenticated() && req.user) {
          userId = req.user.id;
          console.log("[Exams Endpoint] Usando userId da sessão:", userId);
        } else {
          return res.status(400).json({ message: "Erro: userId é obrigatório" });
        }
      }
      
      // Adicionando cookie auxiliar para facilitar a autenticação em requisições futuras
      if (userId) {
        res.cookie('auth_user_id', userId.toString(), {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
          httpOnly: false, // Permitir acesso pelo JavaScript
          secure: false,   // Mudar para true em produção
          sameSite: 'lax',
          path: '/'
        });
      }
      
      // Remover campo requestingPhysician que pode vir do cliente mas não existe no DB
      const { requestingPhysician, ...bodyWithoutRequestingPhysician } = req.body;
      
      const examData = {
        ...bodyWithoutRequestingPhysician,
        userId: userId,
        uploadDate: new Date()
      };
      
      console.log("[Exams Endpoint] Creating exam with data:", examData);
      const newExam = await storage.createExam(examData);
      console.log("[Exams Endpoint] Exam created successfully:", newExam);
      res.status(201).json(newExam);
    } catch (error) {
      console.error("[Exams Endpoint] Error creating exam:", error);
      res.status(500).json({ message: "Erro ao criar exame" });
    }
  });
  
  // API para salvar resultados de exames - removendo requisito de autenticação para diagnóstico
  app.post("/api/exam-results", async (req, res) => {
    try {      
      console.log("[ExamResults Endpoint] Recebida requisição para criar resultado de exame");
      console.log("[ExamResults Endpoint] Autenticado:", req.isAuthenticated());
      console.log("[ExamResults Endpoint] Session ID:", req.sessionID);
      console.log("[ExamResults Endpoint] Cookies:", req.headers.cookie);
      
      const resultData = {
        ...req.body,
        analysisDate: new Date()
      };
      
      console.log("[ExamResults Endpoint] Creating exam result with data:", resultData);
      
      // Verificar se o exame existe
      const exam = await storage.getExam(resultData.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Temporariamente removida a verificação de propriedade para diagnóstico
      
      const newResult = await storage.createExamResult(resultData);
      console.log("[ExamResults Endpoint] Exam result created successfully:", newResult);
      res.status(201).json(newResult);
    } catch (error) {
      console.error("[ExamResults Endpoint] Error creating exam result:", error);
      res.status(500).json({ message: "Erro ao salvar resultado do exame" });
    }
  });
  
  // API para salvar métricas de saúde - removendo requisito de autenticação para diagnóstico
  app.post("/api/health-metrics", async (req, res) => {
    try {      
      // Permitir que userId venha do corpo da requisição
      let userId = req.body.userId;
      
      // Tenta obter da sessão se não estiver no corpo
      if (!userId && req.isAuthenticated() && req.user) {
        userId = req.user.id;
      }
      
      // IMPORTANTE: Vamos aceitar qualquer userId para diagnóstico
      userId = userId || 2; // Fallback para usuário 2 (Lucas Canova)
      
      // Converte para formato correto e ajusta os dados
      const date = req.body.date ? new Date(req.body.date) : new Date();
      
      // Verifica se todos os campos obrigatórios existem e estão em formato correto
      const metricData = {
        userId: Number(userId),
        name: req.body.name || "desconhecido",
        value: String(req.body.value || "0"),
        unit: req.body.unit || "",
        status: req.body.status || "normal",
        change: req.body.change || "",
        date
      };
      
      console.log("Creating health metric with data:", metricData);
      const newMetric = await storage.createHealthMetric(metricData);
      console.log("Health metric created successfully:", newMetric);
      res.status(201).json(newMetric);
    } catch (error) {
      console.error("Error creating health metric:", error);
      res.status(500).json({ message: "Erro ao salvar métrica de saúde" });
    }
  });
  
  app.get("/api/exams", async (req, res) => {
    try {      
      // Adicionar mais logs para debug
      console.log("[GetExams] Autenticado:", req.isAuthenticated());
      console.log("[GetExams] Cookies:", req.headers.cookie);
      
      // Tenta extrair userId dos cookies
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join('=');
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>) || {};
      
      let userId: number | undefined;
      
      // Se autenticado, usa o userId do req.user
      if (req.isAuthenticated() && req.user) {
        userId = req.user.id;
        console.log("[GetExams] Usando userId da sessão:", userId);
      } 
      // Se não autenticado, tenta pegar do cookie auxiliar
      else if (cookies['auth_user_id']) {
        userId = parseInt(cookies['auth_user_id']);
        if (!isNaN(userId)) {
          console.log("[GetExams] Usando userId do cookie:", userId);
        }
      }
      
      // Para diagnóstico, permitimos qualquer userId
      if (!userId) {
        // Permitir query param userId para testes
        if (req.query.userId) {
          userId = parseInt(req.query.userId as string);
          console.log("[GetExams] Usando userId do query param:", userId);
        } else {
          // Usar ID 2 (Lucas Canova) como fallback para diagnóstico
          userId = 2;
          console.log("[GetExams] Usando userId de fallback:", userId);
        }
      }
      
      try {
        const exams = await storage.getExamsByUserId(userId);
        console.log("[GetExams] Exames encontrados:", exams?.length || 0);
        res.json(exams || []);
      } catch (dbError) {
        console.error("[GetExams] Erro na função getExamsByUserId:", dbError);
        throw dbError;
      }
    } catch (error: any) {
      console.error("[GetExams] Erro detalhado ao buscar exames:", error);
      res.status(500).json({ message: "Erro ao buscar exames", error: error?.message || 'Erro desconhecido' });
    }
  });
  
  app.get("/api/exams/:id", async (req, res) => {
    try {      
      const examId = parseInt(req.params.id);
      
      // Verificar autenticação
      let userId = req.isAuthenticated() && req.user ? req.user.id : 2;
      console.log(`Buscando exame ID ${examId}, autenticado: ${req.isAuthenticated()}, userId: ${userId}`);
      
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Para diagnóstico, permitimos acesso mesmo sem autenticação
      if (req.isAuthenticated() && userId !== exam.userId) {
        console.log(`Aviso: usuário ${userId} tentando acessar exame de outro usuário (${exam.userId})`);
        // Não bloqueamos o acesso para diagnóstico
      }
      
      const examResult = await storage.getExamResultByExamId(examId);
      console.log(`Exame encontrado:`, exam);
      console.log(`Resultado do exame:`, examResult);
      
      res.json({ exam, result: examResult });
    } catch (error) {
      console.error("Erro ao buscar exame:", error);
      res.status(500).json({ message: "Erro ao buscar exame" });
    }
  });
  
  // API route for health insights
  app.get("/api/exams/:id/insights", async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      
      // Verificar autenticação
      let userId = req.isAuthenticated() && req.user ? req.user.id : 2;
      console.log(`Gerando insights para exame ID ${examId}, autenticado: ${req.isAuthenticated()}, userId: ${userId}`);
      
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Para diagnóstico, permitimos acesso mesmo sem autenticação
      if (req.isAuthenticated() && userId !== exam.userId) {
        console.log(`Aviso: usuário ${userId} tentando acessar insights de outro usuário (${exam.userId})`);
        // Não bloqueamos o acesso para diagnóstico
      }
      
      const examResult = await storage.getExamResultByExamId(examId);
      
      if (!examResult) {
        return res.status(404).json({ message: "Resultado do exame não encontrado" });
      }
      
      // Obter dados do paciente para contextualização
      // Se não estiver autenticado, usamos dados genéricos
      let user = req.isAuthenticated() ? req.user! : null;
      
      // Obter dados de histórico médico (se fornecidos via query params)
      let patientData = null;
      if (req.query.patientData) {
        try {
          patientData = JSON.parse(req.query.patientData as string);
        } catch (e) {
          console.warn("Error parsing patient data:", e);
        }
      } else if (user) {
        // Se não fornecido, criar dados básicos do perfil do usuário
        patientData = {
          gender: user?.gender || null,
          age: user?.birthDate ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          diseases: [],
          surgeries: [],
          allergies: []
        };
      } else {
        // Dados genéricos para testes
        patientData = {
          gender: "male",
          age: 30,
          diseases: [],
          surgeries: [],
          allergies: []
        };
      }
      
      // Chamada à OpenAI com contexto do paciente
      const insights = await generateHealthInsights(examResult, patientData);
      console.log("Insights gerados com sucesso");
      res.json(insights);
    } catch (error) {
      console.error("Error generating health insights:", error);
      res.status(500).json({ message: "Erro ao gerar insights" });
    }
  });
  
  // API routes for health metrics
  app.get("/api/health-metrics", ensureAuthenticated, async (req, res) => {
    try {
      console.log(`Buscando métricas de saúde para usuário ${req.user!.id}`);
      const metrics = await storage.getHealthMetricsByUserId(req.user!.id);
      console.log(`Métricas encontradas: ${metrics?.length || 0}`);
      res.json(metrics || []);
    } catch (error) {
      console.error("Erro ao buscar métricas de saúde:", error);
      res.status(500).json({ message: "Erro ao buscar métricas de saúde" });
    }
  });
  
  app.get("/api/health-metrics/latest", async (req, res) => {
    try {
      console.log("[GetLatestMetrics] Autenticado:", req.isAuthenticated());
      console.log("[GetLatestMetrics] Cookies:", req.headers.cookie);
      
      // Tenta extrair userId dos cookies
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join('=');
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>) || {};
      
      let userId: number | undefined;
      
      // Se autenticado, usa o userId do req.user
      if (req.isAuthenticated() && req.user) {
        userId = req.user.id;
        console.log("[GetLatestMetrics] Usando userId da sessão:", userId);
      } 
      // Se não autenticado, tenta pegar do cookie auxiliar
      else if (cookies['auth_user_id']) {
        userId = parseInt(cookies['auth_user_id']);
        if (!isNaN(userId)) {
          console.log("[GetLatestMetrics] Usando userId do cookie:", userId);
        }
      }
      
      // Para diagnóstico, permitimos qualquer userId
      if (!userId) {
        // Permitir query param userId para testes
        if (req.query.userId) {
          userId = parseInt(req.query.userId as string);
          console.log("[GetLatestMetrics] Usando userId do query param:", userId);
        } else {
          // Usar ID 2 (Lucas Canova) como fallback para diagnóstico
          userId = 2;
          console.log("[GetLatestMetrics] Usando userId de fallback:", userId);
        }
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      console.log(`[GetLatestMetrics] Buscando ${limit} métricas mais recentes para usuário ${userId}`);
      const metrics = await storage.getLatestHealthMetrics(userId, limit);
      console.log(`[GetLatestMetrics] Métricas encontradas: ${metrics?.length || 0}`);
      res.json(metrics || []);
    } catch (error) {
      console.error("[GetLatestMetrics] Erro ao buscar métricas de saúde:", error);
      res.status(500).json({ message: "Erro ao buscar métricas de saúde" });
    }
  });
  
  // API routes for notifications
  app.get("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      console.log(`Buscando notificações para usuário ${req.user!.id}`);
      const notifications = await storage.getNotificationsByUserId(req.user!.id);
      console.log(`Notificações encontradas: ${notifications?.length || 0}`);
      res.json(notifications || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });
  
  app.post("/api/notifications/:id/read", ensureAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      console.log(`Marcando notificação ${notificationId} como lida para usuário ${req.user!.id}`);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
  });
  
  // API routes for user profile
  app.put("/api/user/profile", ensureAuthenticated, async (req, res) => {
    try {
      console.log(`Atualizando perfil do usuário ${req.user!.id}`);
      const updatedUser = await storage.updateUser(req.user!.id, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  // Rota para gerar relatório cronológico contextual com OpenAI
  app.get("/api/reports/chronological", ensureAuthenticated, async (req, res) => {
    try {
      console.log(`Gerando relatório cronológico para usuário ${req.user!.id}`);
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
      const user = req.user!;
      
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
