import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadAndAnalyzeDocument, analyzeDocument } from "./services/gemini";
import { analyzeExtractedExam } from "./services/openai";
import { generateHealthInsights, generateChronologicalReport } from "./services/openai";
import { pool } from "./db";
import Stripe from "stripe";

// Função para gerar HTML do relatório de saúde
function generateHealthReportHTML({ user, exams, diagnoses, medications, metrics }: any) {
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

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Saúde - ${user.fullName || user.username}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px 0;
          border-bottom: 2px solid #1E3A5F;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1E3A5F;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #48C9B0;
          font-size: 16px;
        }
        .patient-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1E3A5F;
          border-bottom: 2px solid #48C9B0;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .item {
          background: white;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .item-title {
          font-weight: bold;
          color: #1E3A5F;
          margin-bottom: 5px;
        }
        .item-date {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-ativo { background: #fee; color: #c53030; }
        .status-em_tratamento { background: #fff5e6; color: #d69e2e; }
        .status-resolvido { background: #f0fff4; color: #38a169; }
        .status-cronico { background: #ebf8ff; color: #3182ce; }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .metric-item {
          background: #f7fafc;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #48C9B0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VitaView AI</div>
        <div class="subtitle">Relatório Médico Completo</div>
      </div>

      <div class="patient-info">
        <h2>Informações do Paciente</h2>
        <p><strong>Nome:</strong> ${user.fullName || user.username}</p>
        <p><strong>Email:</strong> ${user.email || 'Não informado'}</p>
        <p><strong>Data do Relatório:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Gerado por:</strong> VitaView AI - Plataforma de Gestão de Saúde</p>
      </div>

      ${medications.length > 0 ? `
      <div class="section">
        <div class="section-title">Medicamentos em Uso Contínuo (${medications.length})</div>
        ${medications.map((med: any) => `
          <div class="item">
            <div class="item-title">${med.name}</div>
            <div class="item-date">Iniciado em: ${formatDate(med.start_date)}</div>
            <p><strong>Formato:</strong> ${med.format}</p>
            <p><strong>Dosagem:</strong> ${med.dosage}</p>
            <p><strong>Frequência:</strong> ${med.frequency}</p>
            ${med.notes ? `<p><strong>Observações:</strong> ${med.notes}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${diagnoses.length > 0 ? `
      <div class="section">
        <div class="section-title">Histórico de Diagnósticos (${diagnoses.length})</div>
        ${diagnoses.map((diag: any) => `
          <div class="item">
            <div class="item-title">CID-10: ${diag.cid_code}</div>
            <div class="item-date">Data: ${formatDate(diag.diagnosis_date)}</div>
            ${diag.status ? `<span class="status status-${diag.status}">${getStatusLabel(diag.status)}</span>` : ''}
            ${diag.notes ? `<p><strong>Observações:</strong> ${diag.notes}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${exams.length > 0 ? `
      <div class="section page-break">
        <div class="section-title">Histórico de Exames (${exams.length})</div>
        ${exams.map((exam: any) => `
          <div class="item">
            <div class="item-title">${exam.exam_type || 'Exame Laboratorial'}</div>
            <div class="item-date">Data: ${formatDate(exam.exam_date)}</div>
            <p><strong>Laboratório:</strong> ${exam.laboratory_name || 'Não informado'}</p>
            ${exam.summary ? `<p><strong>Resumo:</strong> ${exam.summary}</p>` : ''}
            ${exam.ai_insights ? `<p><strong>Análise IA:</strong> ${exam.ai_insights}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${metrics.length > 0 ? `
      <div class="section">
        <div class="section-title">Métricas de Saúde Recentes</div>
        <div class="metrics-grid">
          ${metrics.slice(0, 20).map((metric: any) => `
            <div class="metric-item">
              <strong>${metric.metric_name}:</strong><br>
              ${metric.value} ${metric.unit || ''}<br>
              <small>${formatDate(metric.exam_date)}</small>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Este relatório foi gerado automaticamente pela plataforma VitaView AI</p>
        <p>Para mais informações, visite: vitaview.ai</p>
        <p>Data de geração: ${formatDate(new Date().toISOString())} - ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}

// Configuração do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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
  
  // Removido o bypass para análise Gemini
  // Todas as requisições devem ser autenticadas
  
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
      
      console.log(`Processando upload de exame ${name} para usuário ${userId}`);
      
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
      console.error("Erro no processamento de exame:", error);
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
      
      console.log(`Processando geração rápida de resumo para usuário ${userId}`);
      
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
      console.error("Erro na geração rápida de resumo:", error);
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
  app.post("/api/analyze/interpretation", ensureAuthenticated, async (req, res) => {
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
  
  app.post("/api/exams", ensureAuthenticated, async (req, res) => {
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
  
  // API para salvar resultados de exames - com requisito de autenticação
  app.post("/api/exam-results", ensureAuthenticated, async (req, res) => {
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
      
      console.log("Creating health metric with data:", metricData);
      const newMetric = await storage.createHealthMetric(metricData);
      console.log("Health metric created successfully:", newMetric);
      res.status(201).json(newMetric);
    } catch (error) {
      console.error("Error creating health metric:", error);
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
      
      console.log(`[DeleteExam] Excluindo exame ${examId} do usuário ${req.user.id}`);
      
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
      console.error("[DeleteExam] Erro:", error);
      res.status(500).json({ message: "Erro ao excluir o exame" });
    }
  });
  
  app.get("/api/exams", ensureAuthenticated, async (req, res) => {
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
      
      // Verificar se temos userId válido
      if (!userId) {
        // Permitir query param userId para testes em ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development' && req.query.userId) {
          userId = parseInt(req.query.userId as string);
          console.log("[GetExams] Usando userId do query param (modo desenvolvimento):", userId);
        } else {
          return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
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
  
  app.get("/api/exams/:id", ensureAuthenticated, async (req, res) => {
    try {      
      const examId = parseInt(req.params.id);
      
      // Verificar autenticação
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
      }
      let userId = req.user.id;
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
      
      console.log(`Iniciando análise do exame ${examId} com OpenAI para usuário ${userId}`);
      
      // Extrair dados do paciente do corpo da requisição, se disponíveis
      const patientData = req.body.patientData || {};
      
      // Chamar o serviço de análise da OpenAI
      const result = await analyzeExtractedExam(examId, userId, storage, patientData);
      
      if (result.error) {
        console.error(`Erro na análise do exame ${examId}:`, result.message);
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao analisar exame com OpenAI:", error);
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
  
  app.get("/api/health-metrics/latest", ensureAuthenticated, async (req, res) => {
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
      
      // Verificar se temos userId válido
      if (!userId) {
        // Permitir query param userId para testes em ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development' && req.query.userId) {
          userId = parseInt(req.query.userId as string);
          console.log("[GetLatestMetrics] Usando userId do query param (modo desenvolvimento):", userId);
        } else {
          return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
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
      
      console.log(`[DeleteAllHealthMetrics] Requisição para excluir todas as métricas do usuário ${targetUserId}`);
      
      // Executar a exclusão
      const count = await storage.deleteAllHealthMetricsByUserId(targetUserId);
      
      console.log(`[DeleteAllHealthMetrics] Excluídas ${count} métricas de saúde do usuário ${targetUserId}`);
      
      res.status(200).json({ 
        message: `${count} métricas de saúde excluídas com sucesso`, 
        count 
      });
    } catch (error) {
      console.error(`[DeleteAllHealthMetrics] Erro ao excluir métricas de saúde:`, error);
      res.status(500).json({ message: "Erro ao excluir métricas de saúde" });
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
  
  // API routes for diagnoses
  app.get("/api/diagnoses", ensureAuthenticated, async (req, res) => {
    try {
      console.log(`Buscando diagnósticos para usuário ${req.user!.id}`);
      const diagnoses = await storage.getDiagnosesByUserId(req.user!.id);
      console.log(`Diagnósticos encontrados: ${diagnoses?.length || 0}`);
      res.json(diagnoses || []);
    } catch (error) {
      console.error("Erro ao buscar diagnósticos:", error);
      res.status(500).json({ message: "Erro ao buscar diagnósticos" });
    }
  });

  app.post("/api/diagnoses", ensureAuthenticated, async (req, res) => {
    try {
      console.log(`Criando diagnóstico para usuário ${req.user!.id}`, req.body);
      const diagnosisData = {
        userId: req.user!.id,
        cidCode: req.body.cidCode,
        diagnosisDate: req.body.diagnosisDate,
        status: req.body.status,
        notes: req.body.notes || null,
      };

      const newDiagnosis = await storage.createDiagnosis(diagnosisData);
      console.log("Diagnóstico criado com sucesso:", newDiagnosis);
      res.status(201).json(newDiagnosis);
    } catch (error) {
      console.error("Erro ao criar diagnóstico:", error);
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
      console.error("Erro ao atualizar diagnóstico:", error);
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
      console.error("Erro ao excluir diagnóstico:", error);
      res.status(500).json({ message: "Erro ao excluir diagnóstico" });
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

  // API routes for profiles management
  app.get("/api/profiles", ensureAuthenticated, async (req, res) => {
    try {
      const profiles = await storage.getProfilesByUserId(req.user!.id);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
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
      console.error("Error creating profile:", error);
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
      console.error("Error updating profile:", error);
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
      console.error("Error deleting profile:", error);
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
      console.error("Error switching active profile:", error);
      res.status(500).json({ message: "Erro ao alterar perfil ativo" });
    }
  });

  // API routes for subscription management
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
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
      console.error("Error fetching user subscription:", error);
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
      console.error("Error creating payment intent:", error);
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
      console.error("Error creating subscription setup:", error);
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
      console.error('Webhook error:', error);
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
          console.error('Erro ao cancelar assinatura no Stripe:', error);
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
      console.error("Error canceling subscription:", error);
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
      console.error("Error checking subscription limits:", error);
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
      console.error("Error updating Stripe info:", error);
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
      console.error("Error checking upload permission:", error);
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
      console.error("Error creating medication:", error);
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
      console.error("Error fetching medications:", error);
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
      console.error("Error updating medication:", error);
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
      console.error("Error deleting medication:", error);
      res.status(500).json({ message: "Erro ao excluir medicamento" });
    }
  });

  // Rota para exportar relatório de saúde em PDF
  app.post("/api/export-health-report", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Buscar dados do usuário
      const examsResult = await pool.query(`
        SELECT * FROM exams 
        WHERE user_id = $1 
        ORDER BY exam_date DESC
      `, [user.id]);
      
      const diagnosesResult = await pool.query(`
        SELECT * FROM diagnoses 
        WHERE user_id = $1 
        ORDER BY diagnosis_date DESC
      `, [user.id]);
      
      const medicationsResult = await pool.query(`
        SELECT * FROM medications 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [user.id]);

      const metricsResult = await pool.query(`
        SELECT * FROM health_metrics 
        WHERE user_id = $1 
        ORDER BY exam_date DESC
      `, [user.id]);

      // Gerar HTML do relatório
      const htmlContent = generateHealthReportHTML({
        user,
        exams: examsResult.rows,
        diagnoses: diagnosesResult.rows,
        medications: medicationsResult.rows,
        metrics: metricsResult.rows
      });

      // Configurações do PDF
      const options = { 
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true
      };

      // Gerar PDF usando html-pdf-node
      const htmlPdf = require('html-pdf-node');
      const file = { content: htmlContent };
      
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-saude-${user.username}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório de saúde" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
