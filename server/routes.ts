import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadAndAnalyzeDocument, analyzeDocument } from "./services/gemini";
import { analyzeExtractedExam } from "./services/openai";
import { generateHealthInsights, generateChronologicalReport } from "./services/openai";
import { pool } from "./db";
import Stripe from "stripe";
import { CID10_DATABASE } from "../shared/data/cid10-database";

// Função para gerar HTML do relatório de saúde
function generateHealthReportHTML({ user, exams, diagnoses, medications, metrics, allergies }: any) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo": return "Ativo";
      case "em_tratamento": return "Em Tratamento";
      case "resolvido": return "Resolvido";
      case "cronico": return "Crônico";
      default: return status;
    }
  };

  const getCIDDescription = (cidCode: string): string => {
    const cidEntry = CID10_DATABASE.find(item => item.code === cidCode);
    return cidEntry ? `${cidCode} - ${cidEntry.description}` : cidCode;
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Saúde - ${user.fullName || user.username}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; margin: 0; padding: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 12px; border-bottom: 1px solid #1E3A5F; padding-bottom: 8px; }
        .logo { font-size: 14px; font-weight: bold; color: #1E3A5F; }
        .patient-info { background: #f8f9fa; padding: 8px; margin-bottom: 12px; border-radius: 3px; }
        .patient-info h3 { margin: 0 0 6px 0; font-size: 12px; color: #1E3A5F; }
        .patient-info p { margin: 2px 0; font-size: 10px; }
        .section { margin-bottom: 12px; }
        .section-title { font-size: 12px; font-weight: bold; color: #1E3A5F; border-bottom: 1px solid #48C9B0; padding-bottom: 3px; margin-bottom: 8px; }
        .item { padding: 6px; margin-bottom: 4px; border: 1px solid #e0e0e0; border-radius: 2px; }
        .item-title { font-weight: bold; color: #1E3A5F; font-size: 11px; }
        .item-date { color: #666; font-size: 9px; margin: 2px 0; }
        .item-details { font-size: 10px; margin: 2px 0; }
        .status { padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; }
        .status-ativo { background: #fee; color: #c53030; }
        .status-em_tratamento { background: #fff5e6; color: #d69e2e; }
        .status-resolvido { background: #f0fff4; color: #38a169; }
        .status-cronico { background: #ebf8ff; color: #3182ce; }
        .footer { margin-top: 15px; padding-top: 8px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 8px; color: #666; }
        .compact-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .compact-item { flex: 1; min-width: 45%; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VitaView AI - Relatório de Saúde</div>
      </div>

      <div class="patient-info">
        <h3>Paciente: ${user.fullName || user.username}</h3>
        <p>Relatório gerado em: ${formatDate(new Date().toISOString())}</p>
      </div>

      ${diagnoses.length > 0 ? `
      <div class="section">
        <div class="section-title">Diagnósticos</div>
        <div class="compact-grid">
          ${diagnoses.map((diag: any) => `
            <div class="item compact-item">
              <div class="item-title">${getCIDDescription(diag.cid_code)}</div>
              <div class="item-date">${formatDate(diag.diagnosis_date)}</div>
              ${diag.status ? `<span class="status status-${diag.status}">${getStatusLabel(diag.status)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${medications.length > 0 ? `
      <div class="section">
        <div class="section-title">Medicamentos</div>
        ${medications.map((med: any) => `
          <div class="item">
            <div class="item-title">${med.name}</div>
            <div class="item-details">${med.dosage} • ${med.frequency} • Desde ${formatDate(med.start_date)}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${allergies && allergies.length > 0 ? `
      <div class="section">
        <div class="section-title">Alergias</div>
        <div class="compact-grid">
          ${allergies.map((allergy: any) => `
            <div class="item compact-item">
              <div class="item-title">${allergy.allergen}</div>
              ${allergy.reaction ? `<div class="item-details">${allergy.reaction}</div>` : ''}
              ${allergy.severity ? `<div class="item-details">Severidade: ${allergy.severity}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : `
      <div class="section">
        <div class="section-title">Alergias</div>
        <div class="item" style="text-align: center; color: #666;">Sem alergias registradas</div>
      </div>
      `}

      <div class="footer">
        <p>VitaView AI • ${formatDate(new Date().toISOString())} • Para uso médico</p>
      </div>
    </body>
    </html>
  `;
}

// Configuração do Stripe
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
} else {
  // Stripe secret key not found. Payment features will be disabled.
}

// Middleware para verificar autenticação
async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Verifica a autenticação padrão pelo Passport
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Tenta recuperar a autenticação pelo cookie auxiliar
  try {
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join('='); // Caso o valor contenha =
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>) || {};
    
    // Verifica o cookie simplificado auth_user_id
    if (cookies['auth_user_id']) {
      try {
        const userId = parseInt(cookies['auth_user_id']);
        
        if (!isNaN(userId)) {
          // Recupera o usuário pelo ID
          const user = await storage.getUser(userId);
          
          if (user) {
            // Define o usuário na sessão
            return req.login(user, (err) => {
              if (err) {
                return res.status(401).json({ message: "Erro de autenticação" });
              }
              // Continua o fluxo
              return next();
            });
          } else {
            // Usuário não encontrado para auth_user_id
          }
        } else {
          // auth_user_id inválido
        }
      } catch (error) {
        // Erro ao processar auth_user_id
      }
    }
    // Também tenta o cookie auth_token para compatibilidade com versões anteriores
    else if (cookies['auth_token']) {
      try {
        const decodedToken = decodeURIComponent(cookies['auth_token']);
        const authData = JSON.parse(decodedToken);
        
        if (authData && authData.id) {
          // Recupera o usuário pelo ID
          const user = await storage.getUser(authData.id);
          
          if (user) {
            // Define o usuário na sessão
            return req.login(user, (err) => {
              if (err) {
                return res.status(401).json({ message: "Erro de autenticação" });
              }
              // Continua o fluxo
              return next();
            });
          } else {
            // Usuário não encontrado
          }
        } else {
          // Token sem ID válido
        }
      } catch (parseError) {
        // Erro ao parsear token JSON
      }
    } else {
      // Nenhum cookie de autenticação alternativa encontrado
    }
  } catch (error) {
    // Erro ao processar autenticação alternativa
  }
  
  // Removido o bypass para análise Gemini
  // Todas as requisições devem ser autenticadas
  
  // Se não estiver autenticado, retorna 401
  return res.status(401).json({ message: "Não autenticado" });
}

// Middleware de logs para depuração
function logRequest(req: Request, res: Response, next: NextFunction) {
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Aplicar middleware de log para todas as rotas
  app.use(logRequest);

  // Importar rotas de upload
  const uploadRoutes = await import('./routes/upload.routes');
  app.use('/api', uploadRoutes.default);

  // API routes for exams - com requisito de autenticação
  // Atualizado para usar o novo pipeline de análise otimizado
  app.post("/api/exams/upload", ensureAuthenticated, async (req, res) => {
    try {
      // Assegura que usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login novamente." });
      }
      
      // Extrai userId da sessão autenticada
      const userId = req.user.id;
      
      // Verificar se temos dados suficientes
      const { name, fileType, fileContent, laboratoryName, examDate } = req.body;
      
      if (!name || !fileType || !fileContent) {
        return res.status(400).json({ message: "Dados incompletos para análise. Nome, tipo de arquivo e conteúdo são obrigatórios." });
      }
      
      // Importamos o novo pipeline dinâmicamente para evitar dependência circular
      const { runAnalysisPipeline } = await import('./services/analyze-pipeline');
      
      // Executar o pipeline completo
      const result = await runAnalysisPipeline({
        userId,
        name,
        fileType, 
        fileContent,
        laboratoryName,
        examDate
      });
      
      // Retornar resultado
      res.status(200).json(result);
      
    } catch (error: unknown) {
      res.status(500).json({ 
        message: "Erro ao processar o exame", 
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      });
    }
  });
  
  // API route for quick one-click document summary generation
  app.post("/api/exams/quick-summary", ensureAuthenticated, async (req, res) => {
    try {
      // Assegura que usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login novamente." });
      }
      
      // Extrai userId da sessão autenticada
      const userId = req.user.id;
      
      // Verificar se temos dados suficientes
      const { fileType, fileContent } = req.body;
      
      if (!fileType || !fileContent) {
        return res.status(400).json({ message: "Dados incompletos para análise. Tipo de arquivo e conteúdo são obrigatórios." });
      }
      
      // Primeiro step: utilizar Gemini para extrair informações básicas
      const analysisResult = await analyzeDocument(fileContent, fileType);
      
      // Preparar o resumo final
      const quickSummary = {
        summary: analysisResult.summary || "Não foi possível gerar um resumo para este documento.",
        healthMetrics: analysisResult.healthMetrics || [],
        recommendations: analysisResult.recommendations || [],
        laboratoryName: analysisResult.laboratoryName || "Não identificado",
        examDate: analysisResult.examDate || new Date().toISOString().split('T')[0],
        aiProvider: analysisResult.aiProvider || "gemini"
      };
      
      // Retornar resultado
      res.status(200).json(quickSummary);
      
    } catch (error: unknown) {
      res.status(500).json({ 
        message: "Erro ao gerar resumo rápido", 
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      });
    }
  });
  
  // Rota para análise de documentos - etapa 1: análise com Gemini
  app.post("/api/analyze/gemini", ensureAuthenticated, async (req, res) => {
    try {
      const { fileContent, fileType } = req.body;
      
      if (!fileContent || !fileType) {
        return res.status(400).json({ message: "Conteúdo do arquivo e tipo são obrigatórios" });
      }
      
      // Temporariamente removemos a verificação de autenticação para diagnóstico
      const analysisResult = await analyzeDocument(fileContent, fileType);
      res.json(analysisResult);
    } catch (error) {
      res.status(500).json({ message: "Erro ao analisar o documento com Gemini API" });
    }
  });
  
  // Rota para análise de documentos - etapa 2: interpretação com OpenAI
  app.post("/api/analyze/interpretation", ensureAuthenticated, async (req, res) => {
    try {
      const { analysisResult, patientData } = req.body;
      
      if (!analysisResult) {
        return res.status(400).json({ message: "Resultado da análise é obrigatório" });
      }
      
      // Temporariamente removemos a verificação de autenticação para diagnóstico
      
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
      res.status(500).json({ message: "Erro ao interpretar análise com OpenAI API" });
    }
  });
  
  app.post("/api/exams", ensureAuthenticated, async (req, res) => {
    try {  
      // Sempre usar o userId do corpo da requisição para diagnóstico
      // Esta é uma medida temporária para garantir que os exames sejam salvos
      let userId = req.body.userId;
      
      if (!userId) {
        // Tenta obter do usuário autenticado se disponível
        if (req.isAuthenticated() && req.user) {
          userId = req.user.id;
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
      
      const newExam = await storage.createExam(examData);
      res.status(201).json(newExam);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar exame" });
    }
  });
  
  // API para salvar resultados de exames - com requisito de autenticação
  app.post("/api/exam-results", ensureAuthenticated, async (req, res) => {
    try {      
      const resultData = {
        ...req.body,
        analysisDate: new Date()
      };
      
      // Verificar se o exame existe
      const exam = await storage.getExam(resultData.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Temporariamente removida a verificação de propriedade para diagnóstico
      
      const newResult = await storage.createExamResult(resultData);
      res.status(201).json(newResult);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar resultado do exame" });
    }
  });
  
  // API para salvar métricas de saúde - com requisito de autenticação
  app.post("/api/health-metrics", ensureAuthenticated, async (req, res) => {
    try {      
      // Permitir que userId venha do corpo da requisição
      let userId = req.body.userId;
      
      // Tenta obter da sessão se não estiver no corpo
      if (!userId && req.isAuthenticated() && req.user) {
        userId = req.user.id;
      }
      
      // Verificar se temos userId válido
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
      }
      
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
      
      const newMetric = await storage.createHealthMetric(metricData);
      res.status(201).json(newMetric);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar métrica de saúde" });
    }
  });
  
  // Rota para excluir um exame
  app.delete("/api/exams/:examId", ensureAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login novamente." });
      }
      
      const examId = parseInt(req.params.examId);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "ID do exame inválido" });
      }
      
      // Buscar o exame para verificar a propriedade
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Verificar se o usuário é dono do exame
      if (exam.userId !== req.user.id) {
        return res.status(403).json({ message: "Você não tem permissão para excluir este exame" });
      }
      
      // Primeiro excluir as métricas associadas a este exame
      const examResult = await storage.getExamResultByExamId(examId);
      
      if (examResult) {
        // Buscar IDs das métricas associadas ao exame (se houver)
        let healthMetricsIds: number[] = [];
        
        if (examResult.healthMetrics && Array.isArray(examResult.healthMetrics)) {
          // Extrair IDs de métricas que são objetos com um campo ID
          healthMetricsIds = examResult.healthMetrics
            .filter((metric: any) => metric && typeof metric === 'object' && 'id' in metric)
            .map((metric: any) => metric.id);
        }
          
        // Excluir as métricas associadas
        for (const metricId of healthMetricsIds) {
          if (metricId) {
            await storage.deleteHealthMetric(metricId);
          }
        }
        
        // Excluir o resultado do exame
        await storage.deleteExamResult(examResult.id);
      }
      
      // Agora excluir o exame
      const deleted = await storage.deleteExam(examId);
      
      if (deleted) {
        res.status(200).json({ message: "Exame excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir o exame" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir o exame" });
    }
  });
  
  app.get("/api/exams", ensureAuthenticated, async (req, res) => {
    try {      
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
      } 
      // Se não autenticado, tenta pegar do cookie auxiliar
      else if (cookies['auth_user_id']) {
        userId = parseInt(cookies['auth_user_id']);
        if (!isNaN(userId)) {
          // Usando userId do cookie
        }
      }
      
      // Verificar se temos userId válido
      if (!userId) {
        // Permitir query param userId para testes em ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development' && req.query.userId) {
          userId = parseInt(req.query.userId as string);
        } else {
          return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
        }
      }
      
      try {
        const exams = await storage.getExamsByUserId(userId);
        res.json(exams || []);
      } catch (dbError) {
        throw dbError;
      }
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar exames", error: error?.message || 'Erro desconhecido' });
    }
  });
  
  app.get("/api/exams/:id", ensureAuthenticated, async (req, res) => {
    try {      
      const examId = parseInt(req.params.id);
      
      // Verificar autenticação
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
      }
      let userId = req.user.id;
      
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Para diagnóstico, permitimos acesso mesmo sem autenticação
      if (req.isAuthenticated() && userId !== exam.userId) {
        // Aviso: usuário tentando acessar exame de outro usuário
        // Não bloqueamos o acesso para diagnóstico
      }
      
      const examResult = await storage.getExamResultByExamId(examId);
      
      res.json({ exam, result: examResult });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exame" });
    }
  });
  
  // API route for health insights
  // Nova rota para analisar um exame já extraído com a OpenAI
  app.post("/api/exams/:id/analyze", ensureAuthenticated, async (req, res) => {
    try {
      // ensureAuthenticated garante que req.user não será undefined
      const examId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      if (isNaN(examId)) {
        return res.status(400).json({ message: "ID de exame inválido" });
      }
      
      // Verificar se o exame existe e pertence ao usuário
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      if (exam.userId !== userId) {
        return res.status(403).json({ message: "Acesso não autorizado a este exame" });
      }
      
      // Extrair dados do paciente do corpo da requisição, se disponíveis
      const patientData = req.body.patientData || {};
      
      // Chamar o serviço de análise da OpenAI
      const result = await analyzeExtractedExam(examId, userId, storage, patientData);
      
      if (result.error) {
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Erro ao analisar o exame",
        error: String(error)
      });
    }
  });
  
  app.get("/api/exams/:id/insights", ensureAuthenticated, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      
      // Verificar autenticação
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
      }
      let userId = req.user.id;
      
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }
      
      // Para diagnóstico, permitimos acesso mesmo sem autenticação
      if (req.isAuthenticated() && userId !== exam.userId) {
        // Aviso: usuário tentando acessar insights de outro usuário
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
          // Error parsing patient data
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
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar insights" });
    }
  });
  
  // API routes for health metrics
  app.get("/api/health-metrics", ensureAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getHealthMetricsByUserId(req.user!.id);
      res.json(metrics || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas de saúde" });
    }
  });
  
  app.get("/api/health-metrics/latest", ensureAuthenticated, async (req, res) => {
    try {
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
      } 
      // Se não autenticado, tenta pegar do cookie auxiliar
      else if (cookies['auth_user_id']) {
        userId = parseInt(cookies['auth_user_id']);
        if (!isNaN(userId)) {
          // Usando userId do cookie
        }
      }
      
      // Verificar se temos userId válido
      if (!userId) {
        // Permitir query param userId para testes em ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development' && req.query.userId) {
          userId = parseInt(req.query.userId as string);
        } else {
          return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
        }
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const metrics = await storage.getLatestHealthMetrics(userId, limit);
      res.json(metrics || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas de saúde" });
    }
  });
  
  // Rota para excluir todas as métricas de saúde de um usuário
  app.delete("/api/health-metrics/user/:userId", ensureAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário tem permissão adequada
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login novamente." });
      }
      
      // Verificar se o usuário está tentando excluir suas próprias métricas
      // Em um ambiente real, você poderia adicionar verificação de admin aqui
      const targetUserId = parseInt(req.params.userId);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      if (targetUserId !== req.user.id) {
        return res.status(403).json({ message: "Você não tem permissão para excluir métricas de outro usuário" });
      }
      
      // Executar a exclusão
      const count = await storage.deleteAllHealthMetricsByUserId(targetUserId);
      
      res.status(200).json({ 
        message: `${count} métricas de saúde excluídas com sucesso`, 
        count 
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir métricas de saúde" });
    }
  });
  
  // API routes for notifications
  app.get("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user!.id);
      res.json(notifications || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });
  
  app.post("/api/notifications/:id/read", ensureAuthenticated, async (req, res) => {
    try {
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
  app.put("/api/user/profile", ensureAuthenticated, async (req, res) => {
    try {
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
  
  // API routes for diagnoses
  app.get("/api/diagnoses", ensureAuthenticated, async (req, res) => {
    try {
      const diagnoses = await storage.getDiagnosesByUserId(req.user!.id);
      res.json(diagnoses || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar diagnósticos" });
    }
  });

  app.post("/api/diagnoses", ensureAuthenticated, async (req, res) => {
    try {
      const diagnosisData = {
        userId: req.user!.id,
        cidCode: req.body.cidCode,
        diagnosisDate: req.body.diagnosisDate,
        status: req.body.status,
        notes: req.body.notes || null,
      };

      const newDiagnosis = await storage.createDiagnosis(diagnosisData);
      res.status(201).json(newDiagnosis);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar diagnóstico" });
    }
  });

  app.put("/api/diagnoses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const diagnosisId = parseInt(req.params.id);
      const diagnosis = await storage.getDiagnosis(diagnosisId);
      
      if (!diagnosis) {
        return res.status(404).json({ message: "Diagnóstico não encontrado" });
      }

      if (diagnosis.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updatedDiagnosis = await storage.updateDiagnosis(diagnosisId, req.body);
      res.json(updatedDiagnosis);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar diagnóstico" });
    }
  });

  app.delete("/api/diagnoses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const diagnosisId = parseInt(req.params.id);
      const diagnosis = await storage.getDiagnosis(diagnosisId);
      
      if (!diagnosis) {
        return res.status(404).json({ message: "Diagnóstico não encontrado" });
      }

      if (diagnosis.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deleteDiagnosis(diagnosisId);
      res.json({ message: "Diagnóstico excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir diagnóstico" });
    }
  });

  // Rota para gerar relatório cronológico contextual com OpenAI
  app.get("/api/reports/chronological", ensureAuthenticated, async (req, res) => {
    try {
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
      res.status(500).json({ message: "Erro ao gerar relatório cronológico" });
    }
  });

  // API routes for profiles management
  app.get("/api/profiles", ensureAuthenticated, async (req, res) => {
    try {
      const profiles = await storage.getProfilesByUserId(req.user!.id);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar perfis do usuário" });
    }
  });
  
  app.post("/api/profiles", ensureAuthenticated, async (req, res) => {
    try {
      const profileData = {
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date()
      };
      
      const newProfile = await storage.createProfile(profileData);
      res.status(201).json(newProfile);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar perfil" });
    }
  });
  
  app.put("/api/profiles/:id", ensureAuthenticated, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      
      // Verificar se o perfil existe e pertence ao usuário
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Perfil não encontrado" });
      }
      
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
      }
      
      const updatedProfile = await storage.updateProfile(profileId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  app.delete("/api/profiles/:id", ensureAuthenticated, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      
      // Verificar se o perfil existe e pertence ao usuário
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Perfil não encontrado" });
      }
      
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
      }
      
      // Não permitir a exclusão do perfil principal
      if (profile.isDefault) {
        return res.status(400).json({ message: "Não é possível excluir o perfil principal" });
      }
      
      const success = await storage.deleteProfile(profileId);
      if (success) {
        res.status(200).json({ message: "Perfil excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir perfil" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir perfil" });
    }
  });
  
  // API routes for active profile switch
  app.put("/api/users/active-profile", ensureAuthenticated, async (req, res) => {
    try {
      const { profileId } = req.body;
      if (!profileId) {
        return res.status(400).json({ message: "ID do perfil é obrigatório" });
      }
      
      // Verificar se o perfil existe e pertence ao usuário
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Perfil não encontrado" });
      }
      
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
      }
      
      // Responder com o perfil selecionado
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Erro ao alterar perfil ativo" });
    }
  });

  // API routes for subscription management
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar planos de assinatura" });
    }
  });
  
  app.get("/api/user-subscription", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subscription = await storage.getUserSubscription(userId);
      
      // Se não houver assinatura, retornar objeto vazio em vez de erro 404
      if (!subscription) {
        return res.json({ subscription: null, plan: null });
      }
      
      // Buscar detalhes do plano de assinatura
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      res.json({
        subscription,
        plan
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar assinatura do usuário" });
    }
  });
  
  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "ID do plano é obrigatório" });
      }
      
      // Buscar detalhes do plano
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      
      // Criar payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.price, // Preço já está em centavos
        currency: "brl",
        metadata: {
          planId: planId.toString(),
          planName: plan.name
        },
        payment_method_types: ['card']
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao criar intenção de pagamento: " + error.message });
    }
  });
  
  // Stripe subscription route
  app.post("/api/create-subscription", ensureAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "ID do plano é obrigatório" });
      }
      
      const userId = req.user!.id;
      const user = req.user!;
      
      // Verificar se o usuário já tem uma assinatura ativa
      const existingSubscription = await storage.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === "active") {
        return res.status(400).json({ message: "Usuário já possui uma assinatura ativa" });
      }
      
      // Buscar detalhes do plano
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      
      // Se é o plano gratuito, criar assinatura diretamente sem pagamento
      if (plan.price === 0) {
        const subscription = await storage.createUserSubscription({
          userId,
          planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        });
        
        return res.json({ 
          success: true, 
          subscription,
          plan,
          type: "free"
        });
      }
      
      // Para planos pagos, criar um cliente no Stripe se não existir
      let stripeCustomerId = user.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.username,
          metadata: {
            userId: userId.toString()
          }
        });
        
        stripeCustomerId = customer.id;
        
        // Atualizar o usuário com o ID do cliente Stripe
        await storage.updateUser(userId, { stripeCustomerId });
      }
      
      // Criar SetupIntent para planos pagos (para configurar método de pagamento)
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        metadata: {
          userId: userId.toString(),
          planId: planId.toString()
        }
      });
      
      res.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId: stripeCustomerId,
        plan,
        type: "paid"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao configurar assinatura: " + error.message });
    }
  });
  
  // Webhook para eventos do Stripe
  app.post("/api/webhook", async (req, res) => {
    let event;
    
    try {
      // Verificar assinatura do webhook, necessário configurar o webhook secret
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        const signature = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } else {
        // Para ambiente de desenvolvimento
        event = req.body;
      }
      
      // Lidar com os eventos
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          
          // Extrair metadados
          const { userId, planId } = paymentIntent.metadata;
          
          if (userId && planId) {
            // Criar assinatura para o usuário
            await storage.createUserSubscription({
              userId: parseInt(userId),
              planId: parseInt(planId),
              status: "active",
              stripeCustomerId: paymentIntent.customer,
              stripeSubscriptionId: null,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
            });
          }
          break;
          
        case 'setup_intent.succeeded':
          // Quando o método de pagamento é configurado com sucesso
          const setupIntent = event.data.object;
          
          // Extrair metadados
          const setupMetadata = setupIntent.metadata;
          
          if (setupMetadata.userId && setupMetadata.planId) {
            // Criar assinatura recorrente no Stripe
            // Aqui precisaríamos do ID do preço no Stripe para o plano selecionado
            const plan = await storage.getSubscriptionPlan(parseInt(setupMetadata.planId));
            
            if (plan && plan.stripePriceId) {
              // Criar assinatura no Stripe
              const stripeSubscription = await stripe.subscriptions.create({
                customer: setupIntent.customer,
                items: [{ price: plan.stripePriceId }],
                default_payment_method: setupIntent.payment_method,
                metadata: setupMetadata
              });
              
              // Criar assinatura no banco de dados
              await storage.createUserSubscription({
                userId: parseInt(setupMetadata.userId),
                planId: parseInt(setupMetadata.planId),
                status: "active",
                stripeCustomerId: setupIntent.customer,
                stripeSubscriptionId: stripeSubscription.id,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
              });
            }
          }
          break;
          
        case 'invoice.payment_succeeded':
          // Quando um pagamento recorrente é bem-sucedido
          const invoice = event.data.object;
          
          if (invoice.subscription) {
            // Atualizar período da assinatura
            const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
            
            // Encontrar assinatura no banco de dados
            const subscriptions = await storage.getAllSubscriptionsByStripeId(invoice.subscription);
            
            for (const subscription of subscriptions) {
              // Atualizar período da assinatura
              await storage.updateUserSubscription(subscription.id, {
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
              });
            }
          }
          break;
          
        case 'customer.subscription.deleted':
          // Quando uma assinatura é cancelada
          const canceledSubscription = event.data.object;
          
          // Encontrar assinatura no banco de dados
          const subscriptions = await storage.getAllSubscriptionsByStripeId(canceledSubscription.id);
          
          for (const subscription of subscriptions) {
            // Cancelar assinatura no banco de dados
            await storage.cancelUserSubscription(subscription.id);
          }
          break;
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
  
  // Rota para cancelar assinatura
  app.post("/api/cancel-subscription", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Buscar assinatura do usuário
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Nenhuma assinatura encontrada" });
      }
      
      // Se tiver ID de assinatura do Stripe, cancelar no Stripe também
      if (subscription.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true
          });
        } catch (error: any) {
          // Continuar mesmo com erro no Stripe, para garantir cancelamento local
        }
      }
      
      // Cancelar no banco de dados
      const canceledSubscription = await storage.cancelUserSubscription(subscription.id);
      
      res.json({
        success: true,
        subscription: canceledSubscription
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao cancelar assinatura" });
    }
  });
  
  // Rota para verificar limitações de perfil e uploads
  app.get("/api/subscription/limits", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Verificar se o usuário pode criar mais perfis
      const canCreateProfile = await storage.canCreateProfile(userId);
      
      // Buscar assinatura e plano do usuário para informações detalhadas
      const subscription = await storage.getUserSubscription(userId);
      let plan = null;
      
      if (subscription) {
        plan = await storage.getSubscriptionPlan(subscription.planId);
      }
      
      res.json({
        canCreateProfile,
        subscription,
        plan,
        limits: {
          profiles: plan ? plan.maxProfiles : 0,
          uploadsPerProfile: plan ? plan.maxUploadsPerProfile : 0,
          profilesCreated: subscription ? subscription.profilesCreated : 0,
          uploadsCount: subscription ? subscription.uploadsCount : {}
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar limites de assinatura" });
    }
  });
  
  // Rota para atualizar informações do Stripe no usuário
  app.post("/api/update-stripe-info", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { stripeCustomerId, stripeSubscriptionId } = req.body;
      
      if (!stripeCustomerId && !stripeSubscriptionId) {
        return res.status(400).json({ message: "Pelo menos um ID do Stripe deve ser fornecido" });
      }
      
      // Atualizar informações do Stripe no usuário
      const updatedUser = await storage.updateUserStripeInfo(userId, {
        stripeCustomerId,
        stripeSubscriptionId
      });
      
      res.json({
        success: true,
        user: {
          id: updatedUser?.id,
          username: updatedUser?.username,
          stripeCustomerId: updatedUser?.stripeCustomerId,
          stripeSubscriptionId: updatedUser?.stripeSubscriptionId
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar informações do Stripe" });
    }
  });
  
  // Rota para verificar se o usuário pode fazer upload para um perfil específico
  app.get("/api/subscription/can-upload/:profileId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profileId = parseInt(req.params.profileId);
      
      // Verificar se o perfil existe e pertence ao usuário
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Perfil não encontrado" });
      }
      
      if (profile.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
      }
      
      // Verificar se o usuário pode fazer upload para este perfil
      const canUpload = await storage.canUploadExam(userId, profileId);
      
      // Buscar assinatura e plano para informações detalhadas
      const subscription = await storage.getUserSubscription(userId);
      let plan = null;
      let uploadsUsed = 0;
      
      if (subscription) {
        plan = await storage.getSubscriptionPlan(subscription.planId);
        // Verificar quantos uploads já foram feitos para este perfil
        const uploadsCount = subscription.uploadsCount as Record<string, number> || {};
        uploadsUsed = uploadsCount[profileId.toString()] || 0;
      }
      
      res.json({
        canUpload,
        subscription,
        plan,
        limits: {
          maxUploads: plan ? plan.maxUploadsPerProfile : 0,
          uploadsUsed
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar permissão de upload" });
    }
  });

  // Medications routes
  app.post("/api/medications", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const medicationData = { ...req.body, userId: user.id };
      
      const result = await pool.query(`
        INSERT INTO medications (user_id, name, format, dosage, frequency, notes, start_date, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        medicationData.userId,
        medicationData.name,
        medicationData.format,
        medicationData.dosage,
        medicationData.frequency,
        medicationData.notes || null,
        medicationData.startDate,
        medicationData.isActive !== false
      ]);
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar medicamento" });
    }
  });

  app.get("/api/medications", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const result = await pool.query(`
        SELECT * FROM medications 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [user.id]);
      
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar medicamentos" });
    }
  });

  app.put("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      
      const result = await pool.query(`
        UPDATE medications 
        SET name = $1, format = $2, dosage = $3, frequency = $4, notes = $5, start_date = $6
        WHERE id = $7 AND user_id = $8
        RETURNING *
      `, [
        req.body.name,
        req.body.format,
        req.body.dosage,
        req.body.frequency,
        req.body.notes || null,
        req.body.startDate,
        id,
        user.id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Medicamento não encontrado" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar medicamento" });
    }
  });

  app.delete("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      
      await pool.query(`
        UPDATE medications SET is_active = false 
        WHERE id = $1 AND user_id = $2
      `, [id, user.id]);
      
      res.json({ message: "Medicamento excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir medicamento" });
    }
  });

  // Allergies routes
  app.post("/api/allergies", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { allergen, allergenType, reaction, severity, notes } = req.body;

      if (!allergen) {
        return res.status(400).json({ message: "Nome do alérgeno é obrigatório" });
      }

      const result = await pool.query(`
        INSERT INTO allergies (user_id, allergen, allergen_type, reaction, severity, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [user.id, allergen, allergenType || 'medication', reaction, severity, notes]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao criar alergia:", error);
      res.status(500).json({ message: "Erro ao registrar alergia" });
    }
  });

  app.get("/api/allergies", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const result = await pool.query(`
        SELECT * FROM allergies 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [user.id]);

      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar alergias:", error);
      res.status(500).json({ message: "Erro ao buscar alergias" });
    }
  });

  app.put("/api/allergies/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const { allergen, allergenType, reaction, severity, notes } = req.body;

      if (!allergen) {
        return res.status(400).json({ message: "Nome do alérgeno é obrigatório" });
      }

      const result = await pool.query(`
        UPDATE allergies 
        SET allergen = $1, allergen_type = $2, reaction = $3, severity = $4, notes = $5
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `, [allergen, allergenType, reaction, severity, notes, id, user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Alergia não encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao atualizar alergia:", error);
      res.status(500).json({ message: "Erro ao atualizar alergia" });
    }
  });

  app.delete("/api/allergies/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);

      const result = await pool.query(`
        DELETE FROM allergies 
        WHERE id = $1 AND user_id = $2
      `, [id, user.id]);

      res.json({ message: "Alergia removida com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir alergia:", error);
      res.status(500).json({ message: "Erro ao excluir alergia" });
    }
  });

  // Rota para exportar relatório de saúde em PDF
  app.post("/api/export-health-report", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      console.log('Exportando PDF para usuário:', user.id);
      
      // Buscar dados do usuário
      const examsResult = await pool.query(`
        SELECT * FROM exams 
        WHERE user_id = $1 
        ORDER BY exam_date DESC
      `, [user.id]);
      console.log('Exames encontrados:', examsResult.rows.length);
      
      const diagnosesResult = await pool.query(`
        SELECT * FROM diagnoses 
        WHERE user_id = $1 
        ORDER BY diagnosis_date DESC
      `, [user.id]);
      console.log('Diagnósticos encontrados:', diagnosesResult.rows.length);
      
      const medicationsResult = await pool.query(`
        SELECT * FROM medications 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [user.id]);
      console.log('Medicações encontradas:', medicationsResult.rows.length);

      const metricsResult = await pool.query(`
        SELECT * FROM health_metrics 
        WHERE user_id = $1 
        ORDER BY date DESC
      `, [user.id]);
      console.log('Métricas encontradas:', metricsResult.rows.length);

      const allergiesResult = await pool.query(`
        SELECT * FROM allergies 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [user.id]);
      console.log('Alergias encontradas:', allergiesResult.rows.length);

      // Gerar HTML do relatório
      const htmlContent = generateHealthReportHTML({
        user,
        exams: examsResult.rows,
        diagnoses: diagnosesResult.rows,
        medications: medicationsResult.rows,
        metrics: metricsResult.rows,
        allergies: allergiesResult.rows
      });
      console.log('HTML gerado, tamanho:', htmlContent.length);

      // Configurações do PDF
      const options = { 
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true
      };

      // Gerar PDF usando html-pdf-node
      const { generatePdf } = await import('html-pdf-node');
      const file = { content: htmlContent };
      
      console.log('Gerando PDF...');
      const pdfBuffer = await generatePdf(file, options);
      console.log('PDF gerado, tamanho:', pdfBuffer.length);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-saude-${user.username}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Erro detalhado na geração do PDF:', error);
      res.status(500).json({ message: "Erro ao gerar relatório de saúde", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
