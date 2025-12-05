import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { pool, db } from "./db";
import { prescriptions, medications } from "@shared/schema";
import { inArray, and, eq } from "drizzle-orm";
import Stripe from "stripe";
import multer from "multer";
import { CID10_DATABASE } from "../shared/data/cid10-database";
import { biometricTwoFactorAuth } from "./auth/biometric-2fa";
import { advancedSecurity } from "./middleware/advanced-security";
import { rbacSystem } from "./auth/rbac-system";
import { intrusionDetection } from "./security/intrusion-detection";
import { encryptedBackup } from "./backup/encrypted-backup";
import { webApplicationFirewall } from "./security/waf";
import { uploadAnalysis } from "./middleware/upload.middleware";
import { analyzeDocumentWithOpenAI, analyzeExtractedExam, generateHealthInsights, generateChronologicalReport, extractRecordFromAnamnesis, parseAppointmentCommand } from "./services/openai";
import { buildPatientRecordContext } from "./services/patient-record";
import { S3Service } from "./services/s3.service";
import { runAnalysisPipeline } from "./services/analyze-pipeline";
import { extractPatientsFromImages, extractPatientsFromPDF, extractPatientsFromCSV, normalizePatientData, convertToInsertProfile, type ExtractedPatient } from "./services/bulk-import";
import logger from "./logger";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

const normalizeFileType = (type?: string | null) => {
  if (!type) return undefined;
  const lower = type.toLowerCase();

  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpeg";
  if (lower.includes("png")) return "png";

  return undefined;
};

// Assuming this code block is intended to be placed within a function that has access to `app` and returns `httpServer`.
// Since the provided content does not show such a function, I'm placing it here as a standalone block.
// If this is part of a larger `setupServer` or similar function, please provide that context for a more accurate placement.
// Temporary route to run migration from within the app
// This route needs to be placed inside a function that receives `app` as an argument, e.g., `export const setupServer = (app: Express) => { ... }`
// For now, I'm placing it here, but it will cause a syntax error if `app` is not defined in this scope.
/*
app.post("/api/run-migration-internal", async (req, res) => {
  try {
    console.log("Running internal migration...");
    const sqlPath = path.join(process.cwd(), "create_all_missing_tables.sql");
    
    if (!fs.existsSync(sqlPath)) {
      return res.status(404).json({ message: "Migration file not found" });
    }
    
    const sql = fs.readFileSync(sqlPath, "utf8");
    await pool.query(sql);
    console.log("Internal migration completed successfully!");
    res.json({ success: true, message: "Migration executed successfully" });
  } catch (error: any) {
    console.error("Internal migration failed:", error);
    res.status(500).json({ message: "Migration failed", error: error.message });
  }
});
*/
// The `return httpServer;` and `};` also indicate this code is part of a function definition.
// As these are not present in the provided document, I'm commenting out the route to avoid syntax errors.
// Please ensure this code is placed within the correct function scope.


// Função para gerar HTML do relatório de saúde
function generateExamReportHTML({ user, exam, metrics }: any) {
  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'Não informado';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'normal': return '#10b981';
      case 'atenção': case 'atencao': return '#f59e0b';
      case 'alto': case 'crítico': case 'critico': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Exame - ${exam.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 16px; color: #374151; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #2563eb; padding-bottom: 16px; }
        .logo { font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .title { font-size: 16px; color: #1f2937; margin: 8px 0; }
        .patient-info { background: #f8fafc; padding: 16px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .patient-info h3 { margin: 0 0 12px 0; font-size: 14px; color: #1f2937; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { margin-bottom: 6px; }
        .info-label { font-weight: 600; color: #4b5563; }
        .info-value { color: #1f2937; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: 700; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
        .content-box { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
        .summary-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 12px; margin: 12px 0; border-radius: 4px; }
        .analysis-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 12px; margin: 12px 0; border-radius: 4px; }
        .recommendations-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 12px 0; border-radius: 4px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 12px 0; }
        .metric-item { background: white; border: 1px solid #e5e7eb; padding: 8px; border-radius: 4px; }
        .metric-name { font-weight: 600; font-size: 11px; color: #374151; }
        .metric-value { font-size: 13px; font-weight: 700; margin: 2px 0; }
        .metric-unit { font-size: 10px; color: #6b7280; }
        .metric-status { display: inline-block; padding: 2px 6px; border-radius: 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; color: white; margin-top: 4px; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #6b7280; }
        .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VitaView.ai</div>
        <div class="title">Relatório de Análise de Exame</div>
      </div>

      <div class="patient-info">
        <h3>Informações do Exame</h3>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Paciente:</span> <span class="info-value">${user.fullName || user.username}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nome do Exame:</span> <span class="info-value">${exam.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data do Exame:</span> <span class="info-value">${formatDate(exam.exam_date)}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Laboratório:</span> <span class="info-value">${exam.laboratory_name || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Médico Solicitante:</span> <span class="info-value">${exam.requesting_physician || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data da Análise:</span> <span class="info-value">${formatDate(exam.analysis_date)}</span>
            </div>
          </div>
        </div>
        <div style="margin-top: 12px;">
          <span class="info-label">Relatório gerado em:</span> <span class="info-value">${formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      ${exam.summary ? `
      <div class="section">
        <div class="section-title">📋 Resumo Executivo</div>
        <div class="summary-box">
          ${exam.summary}
        </div>
      </div>
      ` : ''}

      ${metrics && metrics.length > 0 ? `
      <div class="section">
        <div class="section-title">📊 Métricas de Saúde</div>
        <div class="metrics-grid">
          ${metrics.map((metric: any) => `
            <div class="metric-item">
              <div class="metric-name">${metric.name}</div>
              <div class="metric-value" style="color: ${getStatusColor(metric.status)}">${metric.value} ${metric.unit || ''}</div>
              <div class="metric-status" style="background-color: ${getStatusColor(metric.status)}">${metric.status || 'N/A'}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${exam.detailed_analysis ? `
      <div class="section">
        <div class="section-title">🔬 Análise Detalhada</div>
        <div class="analysis-box">
          ${exam.detailed_analysis}
        </div>
      </div>
      ` : ''}

      ${exam.recommendations ? `
      <div class="section">
        <div class="section-title">💡 Recomendações</div>
        <div class="recommendations-box">
          ${exam.recommendations}
        </div>
      </div>
      ` : ''}

      <div class="disclaimer">
        <strong>⚠️ Aviso Importante:</strong> Este relatório foi gerado automaticamente pela plataforma VitaView.ai com base na análise de inteligência artificial. As informações contidas neste documento são apenas para fins informativos e não substituem a consulta, diagnóstico ou tratamento médico profissional. Sempre consulte um profissional de saúde qualificado para questões relacionadas à sua saúde.
      </div>

      <div class="footer">
        <p>Este relatório foi gerado pela plataforma VitaView.ai em ${formatDate(new Date().toISOString())}</p>
        <p>Para mais informações, visite nosso site ou entre em contato com nossa equipe de suporte</p>
      </div>
    </body>
    </html>
  `;
}

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

  // Removido o bypass de análise automática
  // Todas as requisições devem ser autenticadas

  // Se não estiver autenticado, retorna 401
  return res.status(401).json({ message: "Não autenticado" });
}

// Middleware de logs para depuração
function logRequest(req: Request, res: Response, next: NextFunction) {
  next();
}

export async function registerRoutes(app: Express): Promise<void> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Set up biometric and 2FA authentication routes
  app.post("/api/auth/biometric/register", biometricTwoFactorAuth.registerBiometric.bind(biometricTwoFactorAuth));
  app.post("/api/auth/biometric/verify-registration", biometricTwoFactorAuth.verifyBiometricRegistration.bind(biometricTwoFactorAuth));
  app.post("/api/auth/totp/setup", biometricTwoFactorAuth.setupTOTP.bind(biometricTwoFactorAuth));
  app.post("/api/auth/totp/verify-setup", biometricTwoFactorAuth.verifyTOTPSetup.bind(biometricTwoFactorAuth));
  app.post("/api/auth/mfa/authenticate", biometricTwoFactorAuth.authenticate.bind(biometricTwoFactorAuth));

  // WAF is now applied at the main server level before routes

  // Apply intrusion detection to all routes
  app.use(intrusionDetection.middleware());

  // Apply advanced security sanitization to all routes
  app.use(advancedSecurity.sanitizeAndValidateInput.bind(advancedSecurity));

  // Security and backup management routes
  app.get("/api/security/statistics", rbacSystem.requirePermission('audit', 'read'), async (req, res) => {
    try {
      const stats = intrusionDetection.getSecurityStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter estatísticas de segurança" });
    }
  });

  // WAF management routes
  app.get("/api/waf/statistics", rbacSystem.requirePermission('security', 'read'), async (req, res) => {
    try {
      const stats = webApplicationFirewall.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter estatísticas do WAF" });
    }
  });

  app.get("/api/waf/rules", rbacSystem.requirePermission('security', 'read'), async (req, res) => {
    try {
      const rules = webApplicationFirewall.getActiveRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter regras do WAF" });
    }
  });

  app.post("/api/waf/rules/:ruleId/toggle", rbacSystem.requirePermission('security', 'update'), async (req, res) => {
    try {
      const { ruleId } = req.params;
      const { enabled } = req.body;
      webApplicationFirewall.toggleRule(ruleId, enabled);

      advancedSecurity.auditLog('WAF_RULE_TOGGLED', req.user?.id, req, { ruleId, enabled });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar regra do WAF" });
    }
  });

  app.post("/api/waf/whitelist", rbacSystem.requirePermission('security', 'update'), async (req, res) => {
    try {
      const { ip } = req.body;
      webApplicationFirewall.whitelistIP(ip);

      advancedSecurity.auditLog('WAF_IP_WHITELISTED', req.user?.id, req, { ip });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar IP à lista branca" });
    }
  });

  app.post("/api/waf/blacklist", rbacSystem.requirePermission('security', 'update'), async (req, res) => {
    try {
      const { ip } = req.body;
      webApplicationFirewall.blacklistIP(ip);

      advancedSecurity.auditLog('WAF_IP_BLACKLISTED', req.user?.id, req, { ip });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar IP à lista negra" });
    }
  });

  app.post("/api/backup/create", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
    try {
      const { type } = req.body;
      const backup = await encryptedBackup.createFullBackup(type || 'manual');
      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar backup", error: error.message });
    }
  });

  app.get("/api/backup/history", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
    try {
      const history = await encryptedBackup.getBackupHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter histórico de backups" });
    }
  });

  app.post("/api/backup/restore/:backupId", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
    try {
      const { backupId } = req.params;
      const { tables, dryRun, overwrite } = req.body;
      const result = await encryptedBackup.restoreBackup(backupId, { tables, dryRun, overwrite });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro ao restaurar backup", error: error.message });
    }
  });

  app.post("/api/backup/verify/:backupId", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
    try {
      const { backupId } = req.params;
      const result = await encryptedBackup.verifyBackup(backupId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar backup", error: error.message });
    }
  });

  // WAF Management routes
  app.get("/api/waf/statistics", rbacSystem.requirePermission('audit', 'read'), async (req, res) => {
    try {
      const stats = webApplicationFirewall.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter estatísticas do WAF" });
    }
  });

  app.get("/api/waf/rules", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const rules = webApplicationFirewall.getActiveRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter regras do WAF" });
    }
  });

  app.post("/api/waf/rules/:ruleId/toggle", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const { ruleId } = req.params;
      const { enabled } = req.body;
      webApplicationFirewall.toggleRule(ruleId, enabled);
      res.json({ success: true, message: `Regra ${ruleId} ${enabled ? 'ativada' : 'desativada'}` });
    } catch (error) {
      res.status(500).json({ message: "Erro ao alterar regra do WAF" });
    }
  });

  app.post("/api/waf/whitelist", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const { ip } = req.body;
      webApplicationFirewall.whitelistIP(ip);
      res.json({ success: true, message: `IP ${ip} adicionado à lista branca` });
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar IP à lista branca" });
    }
  });

  app.post("/api/waf/blacklist", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const { ip } = req.body;
      webApplicationFirewall.blacklistIP(ip);
      res.json({ success: true, message: `IP ${ip} adicionado à lista negra` });
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar IP à lista negra" });
    }
  });

  // Admin User Management Routes
  app.get("/api/admin/users", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      // Enrich users with subscription data
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const { password, ...safeUser } = user;
        const subscription = await storage.getUserSubscription(user.id);

        let plan = undefined;
        if (subscription && subscription.planId) {
          plan = await storage.getSubscriptionPlan(subscription.planId);
        }

        return {
          ...safeUser,
          subscription: subscription ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            currentPeriodStart: subscription.currentPeriodStart,
            createdAt: subscription.createdAt,
            planId: subscription.planId
          } : undefined,
          plan: plan ? {
            name: plan.name,
            price: plan.price,
            interval: plan.interval
          } : undefined
        };
      }));

      res.json(enrichedUsers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  app.delete("/api/admin/users/:id", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // Prevent deleting self
      if (req.user?.id === id) {
        return res.status(400).json({ message: "Não é possível excluir seu próprio usuário" });
      }

      const success = await storage.deleteUser(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Usuário não encontrado" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  app.patch("/api/admin/users/:id", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const updatedUser = await storage.updateUser(id, req.body);
      if (updatedUser) {
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "Usuário não encontrado" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.post("/api/admin/users/:id/change-plan", rbacSystem.requirePermission('system', 'config'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { planId } = req.body;

      if (isNaN(userId) || !planId) {
        return res.status(400).json({ message: "Dados inválidos" });
      }

      const subscription = await storage.getUserSubscription(userId);
      if (subscription) {
        await storage.updateUserSubscription(subscription.id, { planId });
        res.json({ success: true });
      } else {
        // Create new subscription if none exists
        await storage.createUserSubscription({
          userId,
          planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          stripeSubscriptionId: `sub_manual_${Date.now()}`,
          stripeCustomerId: `cus_manual_${Date.now()}`
        });
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao alterar plano" });
    }
  });

  // Appointment Routes
  app.get("/api/appointments", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const appointments = await storage.getAppointmentsByUserId(req.user.id);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  app.post("/api/appointments", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const appointment = await storage.createAppointment({
        ...req.body,
        userId: req.user.id
      });
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar agendamento" });
    }
  });

  // Configure multer for AI scheduling file uploads
  const aiScheduleUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não suportado'));
      }
    }
  });

  app.post("/api/appointments/ai-schedule", ensureAuthenticated, aiScheduleUpload.array('files', 5), async (req, res) => {
    try {
      const { command } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!command && (!files || files.length === 0)) {
        return res.status(400).json({ message: "Comando ou arquivos devem ser fornecidos" });
      }

      const parsedData = await parseAppointmentCommand(command || "", files);
      res.json(parsedData);
    } catch (error) {
      console.error('Error in AI schedule:', error);
      res.status(500).json({ message: "Erro ao processar comando de agendamento" });
    }
  });

  // Doctor Dashboard Stats
  app.get("/api/doctor/dashboard-stats", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const stats = await storage.getDoctorDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas do painel" });
    }
  });

  // Aplicar middleware de log para todas as rotas
  app.use(logRequest);

  // Importar rotas de upload
  const uploadRoutes = await import('./routes/upload.routes');
  app.use('/api', uploadRoutes.default);

  // API routes for exams - com requisito de autenticação e RBAC
  // Atualizado para usar o novo pipeline de análise otimizado
  app.post("/api/exams/upload", ensureAuthenticated, rbacSystem.requirePermission('exam', 'write'), async (req, res) => {
    try {
      // Assegura que usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login novamente." });
      }

      // Extrai userId da sessão autenticada
      const userId = req.user.id;

      // Verificar se temos dados suficientes
      const { name, fileType, fileContent, laboratoryName, examDate, profileId: rawProfileId } = req.body;

      if (!name || !fileType || !fileContent) {
        return res.status(400).json({ message: "Dados incompletos para análise. Nome, tipo de arquivo e conteúdo são obrigatórios." });
      }

      // Determinar paciente ativo
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join('=');
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      let profileId = rawProfileId ? Number(rawProfileId) : undefined;
      if (!profileId && cookies['active_profile_id']) {
        const parsed = Number(cookies['active_profile_id']);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      // Se não tiver profileId, tentar extrair nome do paciente do exame
      if (!profileId || Number.isNaN(profileId)) {
        logger.info("No profileId provided, attempting to extract patient name from exam");

        try {
          // Decodificar o conteúdo do arquivo se for base64
          let textContent = fileContent;
          if (fileContent.startsWith('data:')) {
            // Remove data URL prefix
            const base64Data = fileContent.split(',')[1] || fileContent;
            textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
          } else if (fileContent.length > 100 && !fileContent.includes(' ')) {
            // Provavelmente é base64
            textContent = Buffer.from(fileContent, 'base64').toString('utf-8');
          }

          // Extrair nome do paciente usando IA
          const { extractPatientNameFromExam } = await import('./services/openai');
          const extractedName = await extractPatientNameFromExam(textContent, fileType);

          if (extractedName) {
            logger.info(`Extracted patient name: ${extractedName}`);

            // Buscar perfil existente por nome
            const profiles = await storage.getProfilesByUserId(userId);
            const matchingProfile = profiles.find((p: any) =>
              p.name.toLowerCase().trim() === extractedName.toLowerCase().trim()
            );

            if (matchingProfile) {
              logger.info(`Found matching profile: ${matchingProfile.id}`);
              profileId = matchingProfile.id;
            } else {
              // Criar novo perfil para o paciente
              logger.info(`Creating new profile for patient: ${extractedName}`);
              const newProfile = await storage.createProfile({
                userId,
                name: extractedName,
                // Outros campos podem ser preenchidos depois pelo médico
              });
              profileId = newProfile.id;
              logger.info(`Created new profile with ID: ${profileId}`);
            }
          } else {
            logger.warn("Could not extract patient name from exam");
            return res.status(400).json({
              message: "Não foi possível identificar o paciente no exame. Por favor, selecione um paciente manualmente ou verifique se o nome do paciente está claramente visível no documento."
            });
          }
        } catch (extractError) {
          logger.error("Error during patient name extraction:", extractError);
          return res.status(400).json({
            message: "Erro ao identificar o paciente no exame. Por favor, selecione um paciente manualmente."
          });
        }
      }

      // Validar que temos um profileId válido agora
      if (!profileId || Number.isNaN(profileId)) {
        return res.status(400).json({ message: "Não foi possível determinar o paciente para este exame." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Paciente inválido para este profissional." });
      }

      // Upload para S3/Local
      const s3Result = await S3Service.uploadExamDocument({
        userId,
        profileId,
        buffer: Buffer.from(fileContent, 'base64'),
        originalName: name,
        mimeType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'
      });

      // Criar registro do exame
      const exam = await storage.createExam({
        userId,
        profileId,
        name,
        fileType,
        status: "queued",
        laboratoryName,
        examDate,
        filePath: s3Result.key
      });

      // Iniciar processamento em background (fire and forget)
      runAnalysisPipeline(exam.id).catch(err => {
        logger.error(`Erro no processamento em background do exame ${exam.id}:`, err);
      });

      // Retornar resultado imediato com informação do paciente
      res.status(200).json({
        message: `Upload realizado com sucesso para o paciente ${profile.name}. O processamento continuará em segundo plano.`,
        examId: exam.id,
        status: "queued",
        patientName: profile.name,
        patientId: profileId
      });

    } catch (error: unknown) {
      res.status(500).json({
        message: "Erro ao processar o exame",
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Rota para upload de múltiplos arquivos
  app.post("/api/exams/upload-multiple", ensureAuthenticated, rbacSystem.requirePermission('exam', 'write'), async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }

      const userId = req.user.id;
      const { files, profileId: rawProfileId } = req.body; // files: Array<{ name, fileType, fileContent, ... }>

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      // Determinar paciente ativo (mesma lógica do upload simples)
      let profileId = rawProfileId ? Number(rawProfileId) : undefined;
      // ... (lógica de cookie se necessário, ou confiar no body)

      // Se não vier no body, tentar cookie
      if (!profileId) {
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
          const parts = cookie.trim().split('=');
          if (parts.length >= 2) acc[parts[0]] = parts.slice(1).join('=');
          return acc;
        }, {} as Record<string, string>) || {};

        if (cookies['active_profile_id']) {
          profileId = Number(cookies['active_profile_id']);
        }
      }

      if (!profileId || Number.isNaN(profileId)) {
        return res.status(400).json({ message: "Selecione um paciente." });
      }

      const results = [];

      for (const file of files) {
        const { name, fileType, fileContent, laboratoryName, examDate } = file;

        try {
          const s3Result = await S3Service.uploadExamDocument({
            userId,
            profileId,
            buffer: Buffer.from(fileContent, 'base64'),
            originalName: name,
            mimeType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'
          });

          const exam = await storage.createExam({
            userId,
            profileId,
            name,
            fileType,
            status: "queued",
            laboratoryName,
            examDate,
            filePath: s3Result.key
          });

          // Iniciar processamento
          logger.info(`Iniciando pipeline para exame ${exam.id}`);
          runAnalysisPipeline(exam.id).catch(err => {
            logger.error(`Erro no processamento em background do exame ${exam.id}:`, err);
          });

          results.push({ examId: exam.id, status: "queued", name });
        } catch (err) {
          logger.error(`Erro ao iniciar upload de ${name}:`, err);
          results.push({ name, error: "Falha ao iniciar upload" });
        }
      }

      res.status(200).json({
        message: "Uploads iniciados.",
        results
      });

    } catch (error) {
      res.status(500).json({ message: "Erro no upload múltiplo" });
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

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "Serviço de análise indisponível. Configure a chave da OpenAI." });
      }

      // Extração direta com OpenAI
      const analysisResult = await analyzeDocumentWithOpenAI(fileContent, fileType);

      // Preparar o resumo final
      const quickSummary = {
        summary: analysisResult.summary || "Não foi possível gerar um resumo para este documento.",
        healthMetrics: analysisResult.healthMetrics || [],
        recommendations: analysisResult.recommendations || [],
        laboratoryName: analysisResult.laboratoryName || "Não identificado",
        examDate: analysisResult.examDate || new Date().toISOString().split('T')[0],
        aiProvider: analysisResult.aiProvider || "openai"
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

  const handleVisionAnalysis = async (req: Request, res: Response) => {
    const requestId = nanoid();
    let s3Info:
      | {
        key: string;
        bucket: string;
        url: string;
        size: number;
        mimeType: string;
        originalName: string;
      }
      | undefined;
    try {
      logger.info("[UploadFlow] Upload recebido para análise", {
        requestId,
        route: req.path,
        method: req.method,
        userId: (req as any).user?.id,
        hasFile: Boolean(req.file),
        bodyKeys: Object.keys(req.body || {}),
        contentLengthHeader: req.headers["content-length"],
        ip: req.ip
      });

      let { fileContent } = req.body as { fileContent?: string };
      const providedType = (req.body as { fileType?: string }).fileType;
      const profileIdRaw = (req.body as { profileId?: string }).profileId;
      const parsedProfileId = profileIdRaw ? Number(profileIdRaw) : null;
      const profileId =
        typeof parsedProfileId === "number" && !Number.isNaN(parsedProfileId)
          ? parsedProfileId
          : null;
      let normalizedFileType = normalizeFileType(providedType);
      const initialBase64Length = typeof fileContent === "string" ? fileContent.length : 0;

      logger.info("[Analysis] Iniciando análise de documento", {
        requestId,
        route: req.path,
        method: req.method,
        userId: (req as any).user?.id,
        providedFileType: (req.body as { fileType?: string })?.fileType,
        hasMultipartFile: Boolean(req.file),
        mimetype: req.file?.mimetype,
        filename: req.file?.originalname,
        contentLengthHeader: req.headers["content-length"],
        initialBase64Length
      });

      if (req.file) {
        fileContent = req.file.buffer.toString("base64");
        normalizedFileType = normalizeFileType(req.file.mimetype) ?? normalizeFileType(req.file.originalname) ?? normalizedFileType;
      }

      const effectiveBase64Length = typeof fileContent === "string" ? fileContent.length : 0;
      const userId = (req as any).user?.id;

      if (userId && (req.file?.buffer || fileContent)) {
        const buffer = req.file?.buffer ?? Buffer.from(fileContent!, "base64");
        const originalName =
          req.file?.originalname ||
          `exam-${Date.now()}.${normalizedFileType ?? "bin"}`;
        const mimeType =
          req.file?.mimetype ||
          (normalizedFileType === "pdf"
            ? "application/pdf"
            : normalizedFileType === "png"
              ? "image/png"
              : normalizedFileType === "jpeg"
                ? "image/jpeg"
                : "application/octet-stream");

        s3Info = await S3Service.uploadExamDocument({
          userId,
          profileId,
          buffer,
          originalName,
          mimeType,
          size: req.file?.size ?? buffer.length,
          metadata: {
            fileType: normalizedFileType ?? "unknown",
            requestId,
          },
        });
      } else {
        logger.warn("[UploadFlow] Documento não foi enviado ao S3", {
          requestId,
          hasUser: Boolean(userId),
          hasFileBuffer: Boolean(req.file?.buffer || fileContent),
        });
      }

      logger.debug("[Analysis] Dados normalizados para processamento", {
        requestId,
        normalizedFileType,
        providedType,
        mimetype: req.file?.mimetype,
        filename: req.file?.originalname,
        effectiveBase64Length
      });

      if (!fileContent || !normalizedFileType) {
        logger.warn("[Analysis] Conteúdo ou tipo ausente", {
          requestId,
          hasContent: Boolean(fileContent),
          normalizedFileType
        });
        return res.status(400).json({ message: "Conteúdo do arquivo e tipo são obrigatórios" });
      }

      if (!process.env.OPENAI_API_KEY) {
        logger.error("OpenAI API key não configurada para análise de documentos.");
        return res.status(503).json({
          message: "Serviço de análise indisponível. Configure a chave da OpenAI."
        });
      }

      const analysisResult = await analyzeDocumentWithOpenAI(fileContent, normalizedFileType);
      logger.info("[Analysis] Resultado obtido via OpenAI", {
        requestId,
        normalizedFileType,
        metricsCount: Array.isArray((analysisResult as any)?.healthMetrics) ? (analysisResult as any).healthMetrics.length : undefined,
        hasSummary: Boolean((analysisResult as any)?.summary),
        aiProvider: (analysisResult as any)?.aiProvider
      });

      res.json({
        ...analysisResult,
        fileType: normalizedFileType,
        storage: s3Info
          ? {
            provider: "aws-s3",
            bucket: s3Info.bucket,
            key: s3Info.key,
            size: s3Info.size,
            mimeType: s3Info.mimeType,
            originalName: s3Info.originalName,
            expiresAt: Date.now() + 3600 * 1000,
          }
          : undefined,
      });
      logger.info("[UploadFlow] Análise concluída com sucesso", {
        requestId,
        route: req.path,
        userId: (req as any).user?.id,
        normalizedFileType,
        metricsCount: Array.isArray((analysisResult as any)?.healthMetrics)
          ? (analysisResult as any).healthMetrics.length
          : undefined
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error("Falha ao processar análise de documento", {
        requestId,
        message,
        stack: error instanceof Error ? error.stack : undefined,
        route: req.path,
        method: req.method,
        userId: (req as any).user?.id,
        providedFileType: (req.body as { fileType?: string })?.fileType,
        normalizedFileType: normalizeFileType((req.body as { fileType?: string })?.fileType),
        mimetype: req.file?.mimetype,
        filename: req.file?.originalname,
        hasContent: Boolean((req.body as { fileContent?: string })?.fileContent),
        contentLengthHeader: req.headers["content-length"],
        base64Length: typeof (req.body as { fileContent?: string })?.fileContent === "string"
          ? (req.body as { fileContent?: string })?.fileContent?.length
          : req.file?.buffer?.length,
        s3Attempted: Boolean(s3Info),
        s3Key: s3Info?.key
      });
      res.status(500).json({ message: "Erro ao analisar o documento com GPT-5", details: message });
    }
  };

  // Rota para análise usando GPT-5
  app.post(
    "/api/analyze/openai",
    ensureAuthenticated,
    uploadAnalysis.single("file"),
    handleVisionAnalysis
  );

  // Rota para análise de documentos - etapa 2: interpretação com OpenAI
  app.post("/api/analyze/interpretation", ensureAuthenticated, async (req, res) => {
    const requestId = nanoid();
    try {
      const { analysisResult, patientData } = req.body;
      logger.info("[UploadFlow] Iniciando etapa de interpretação", {
        requestId,
        route: req.path,
        method: req.method,
        userId: req.user?.id,
        hasAnalysisResult: Boolean(analysisResult),
        patientDataKeys: Object.keys(patientData || {})
      });

      if (!analysisResult) {
        logger.warn("[UploadFlow] Interpretação sem resultado de análise", {
          requestId,
          userId: req.user?.id
        });
        return res.status(400).json({ message: "Resultado da análise é obrigatório" });
      }

      // Temporariamente removemos a verificação de autenticação para diagnóstico

      const enrichedPatientData = await buildPatientRecordContext(req.user!.id, patientData || {});

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
        aiProvider: "openai"
      };

      // Gerar insights usando OpenAI com contexto do paciente
      const insights = await generateHealthInsights(formattedResult, enrichedPatientData);
      res.json(insights);
      logger.info("[UploadFlow] Interpretação concluída", {
        requestId,
        userId: req.user?.id,
        includesRecommendations: Boolean(insights?.recommendations && insights.recommendations.length > 0),
        includesWarnings: Boolean(insights?.warnings && insights.warnings.length > 0)
      });
    } catch (error) {
      logger.error("Falha na etapa de interpretação", {
        requestId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id
      });
      res.status(500).json({ message: "Erro ao interpretar análise com OpenAI API" });
    }
  });

  app.post("/api/exams", ensureAuthenticated, async (req, res) => {
    const requestId = nanoid();
    try {
      logger.info("[UploadFlow] Iniciando persistência do exame", {
        requestId,
        route: req.path,
        method: req.method,
        userId: req.user?.id,
        bodyKeys: Object.keys(req.body || {}),
        hasOriginalContent: Boolean(req.body?.originalContent),
        originalContentLength: typeof req.body?.originalContent === 'string' ? req.body.originalContent.length : undefined
      });
      // Sempre usar o userId do corpo da requisição para diagnóstico
      // Esta é uma medida temporária para garantir que os exames sejam salvos
      let userId = req.body.userId;

      if (!userId) {
        // Tenta obter do usuário autenticado se disponível
        if (req.isAuthenticated() && req.user) {
          userId = req.user.id;
        } else {
          logger.warn("[UploadFlow] Persistência de exame sem userId", { requestId });
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

      // Garantir associação com o paciente selecionado
      const {
        requestingPhysician,
        profileId: rawProfileId,
        storageProvider,
        storageKey,
        storageBucket,
        storageMimeType,
        storageSize,
        storageOriginalName,
        ...bodyWithoutProfile
      } = req.body;

      const profileId = rawProfileId ? Number(rawProfileId) : undefined;
      if (!profileId || Number.isNaN(profileId)) {
        logger.warn("[UploadFlow] Persistência de exame com profileId inválido", {
          requestId,
          userId,
          rawProfileId
        });
        return res.status(400).json({ message: "Selecione um paciente para associar o exame." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        logger.warn("[UploadFlow] Persistência de exame com paciente inválido", {
          requestId,
          userId,
          profileId
        });
        return res.status(403).json({ message: "Paciente inválido para este profissional." });
      }

      const examData = {
        ...bodyWithoutProfile,
        userId,
        profileId,
        requestingPhysician: requestingPhysician || null,
        uploadDate: new Date()
      };

      const newExam = await storage.createExam(examData);

      if (storageKey && typeof storageKey === "string") {
        try {
          const metadata = {
            provider: storageProvider || "aws-s3",
            bucket: storageBucket || null,
            linkedAt: new Date().toISOString(),
          };

          await pool.query(
            `
            INSERT INTO s3_files (
              user_id,
              profile_id,
              exam_id,
              s3_key,
              original_name,
              file_type,
              file_size,
              mime_type,
              metadata,
              is_deleted,
              deleted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, FALSE, NULL)
            ON CONFLICT (s3_key) DO UPDATE SET
              exam_id = EXCLUDED.exam_id,
              profile_id = EXCLUDED.profile_id,
              file_size = EXCLUDED.file_size,
              mime_type = EXCLUDED.mime_type,
              metadata = EXCLUDED.metadata,
              is_deleted = FALSE,
              deleted_at = NULL
          `,
            [
              userId,
              profileId,
              newExam.id,
              storageKey,
              storageOriginalName || newExam.name,
              storageProvider || "lab-results",
              storageSize ?? null,
              storageMimeType ||
              (examData.fileType === "pdf"
                ? "application/pdf"
                : examData.fileType === "jpeg"
                  ? "image/jpeg"
                  : examData.fileType === "png"
                    ? "image/png"
                    : "application/octet-stream"),
              JSON.stringify({
                ...metadata,
                originalName: storageOriginalName || newExam.name,
              }),
            ]
          );
          logger.info("[UploadFlow] Referência S3 registrada", {
            requestId,
            examId: newExam.id,
            storageKey,
            storageBucket,
          });
        } catch (s3RecordError) {
          logger.error("[UploadFlow] Falha ao registrar arquivo S3", {
            requestId,
            examId: newExam.id,
            storageKey,
            message: s3RecordError instanceof Error ? s3RecordError.message : s3RecordError,
            stack: s3RecordError instanceof Error ? s3RecordError.stack : undefined,
          });
        }
      }
      logger.info("[UploadFlow] Exame salvo com sucesso", {
        requestId,
        examId: newExam?.id,
        userId,
        profileId,
        status: newExam?.status
      });
      res.status(201).json({
        ...newExam,
        storageKey: storageKey || null,
      });
    } catch (error) {
      logger.error("Falha ao persistir exame", {
        requestId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        bodyKeys: Object.keys(req.body || {})
      });
      res.status(500).json({ message: "Erro ao criar exame" });
    }
  });

  // API para salvar resultados de exames - com requisito de autenticação
  app.post("/api/exam-results", ensureAuthenticated, async (req, res) => {
    const requestId = nanoid();
    try {
      logger.info("[UploadFlow] Persistindo resultado do exame", {
        requestId,
        route: req.path,
        method: req.method,
        userId: req.user?.id,
        bodyKeys: Object.keys(req.body || {}),
        examId: req.body?.examId
      });
      const resultData = {
        ...req.body,
        analysisDate: new Date()
      };

      // Verificar se o exame existe
      const exam = await storage.getExam(resultData.examId);
      if (!exam) {
        logger.warn("[UploadFlow] Resultado sem exame associado", {
          requestId,
          requestedExamId: resultData.examId,
          userId: req.user?.id
        });
        return res.status(404).json({ message: "Exame não encontrado" });
      }

      // Temporariamente removida a verificação de propriedade para diagnóstico

      const newResult = await storage.createExamResult(resultData);
      res.status(201).json(newResult);
      logger.info("[UploadFlow] Resultado salvo com sucesso", {
        requestId,
        examResultId: newResult?.id,
        examId: newResult?.examId,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error("Falha ao salvar resultado do exame", {
        requestId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        examId: req.body?.examId
      });
      res.status(500).json({ message: "Erro ao salvar resultado do exame" });
    }
  });

  // API para salvar métricas de saúde - com requisito de autenticação
  app.post("/api/health-metrics", ensureAuthenticated, async (req, res) => {
    const requestId = nanoid();
    try {
      logger.info("[UploadFlow] Persistindo métrica de saúde", {
        requestId,
        route: req.path,
        method: req.method,
        userId: req.user?.id,
        bodyKeys: Object.keys(req.body || {}),
        examId: req.body?.examId,
        metricName: req.body?.name
      });
      // Permitir que userId venha do corpo da requisição
      let userId = req.body.userId;

      // Tenta obter da sessão se não estiver no corpo
      if (!userId && req.isAuthenticated() && req.user) {
        userId = req.user.id;
      }

      // Verificar se temos userId válido
      if (!userId) {
        logger.warn("[UploadFlow] Métrica sem usuário associado", {
          requestId,
          sessionHasUser: Boolean(req.user)
        });
        return res.status(401).json({ message: "Usuário não autenticado. Por favor, faça login." });
      }

      const profileId = req.body.profileId ? Number(req.body.profileId) : undefined;
      if (!profileId || Number.isNaN(profileId)) {
        logger.warn("[UploadFlow] Métrica com profileId inválido", {
          requestId,
          userId,
          rawProfileId: req.body.profileId
        });
        return res.status(400).json({ message: "Selecione um paciente para associar as métricas." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        logger.warn("[UploadFlow] Métrica com paciente inválido", {
          requestId,
          userId,
          profileId
        });
        return res.status(403).json({ message: "Paciente inválido." });
      }

      // Converte para formato correto e ajusta os dados
      const date = req.body.date ? new Date(req.body.date) : new Date();

      // Verifica se todos os campos obrigatórios existem e estão em formato correto
      const examId = req.body.examId ? Number(req.body.examId) : undefined;

      const metricData = {
        userId: Number(userId),
        profileId,
        name: req.body.name || "desconhecido",
        value: String(req.body.value || "0"),
        unit: req.body.unit || "",
        status: req.body.status || "normal",
        change: req.body.change || "",
        date,
        examId: examId && !Number.isNaN(examId) ? examId : null
      };

      const newMetric = await storage.createHealthMetric(metricData);
      res.status(201).json(newMetric);
      logger.info("[UploadFlow] Métrica de saúde salva", {
        requestId,
        metricId: newMetric?.id,
        userId,
        profileId,
        metricName: newMetric?.name
      });
    } catch (error) {
      logger.error("Falha ao salvar métrica de saúde", {
        requestId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        metricName: req.body?.name
      });
      res.status(500).json({ message: "Erro ao salvar métrica de saúde" });
    }
  });

  // Rota para excluir um exame
  app.delete("/api/exams/:examId", ensureAuthenticated, rbacSystem.requirePermission('exam', 'delete'), async (req, res) => {
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
        // Excluir as métricas associadas de forma eficiente
        await storage.deleteHealthMetricsByExamId(examId);

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

  app.get("/api/exams", ensureAuthenticated, rbacSystem.requirePermission('exam', 'read'), async (req, res) => {
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

      let profileId: number | undefined;
      if (req.query.profileId) {
        const parsed = Number(req.query.profileId);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      if (!profileId) {
        const defaultProfile = await storage.getDefaultProfileForUser(userId);
        profileId = defaultProfile?.id;
      }

      if (!profileId) {
        return res.status(400).json({ message: "Nenhum paciente selecionado." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Paciente inválido para este profissional." });
      }

      try {
        const exams = await storage.getExamsByUserId(userId, profileId);
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
      const requestPatientData = req.body.patientData || {};
      const patientData = await buildPatientRecordContext(userId, requestPatientData);

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

      const ownerId = req.isAuthenticated() && req.user ? req.user.id : exam.userId;
      const enrichedPatientData = await buildPatientRecordContext(ownerId, patientData || {});

      // Chamada à OpenAI com contexto do paciente
      const insights = await generateHealthInsights(examResult, enrichedPatientData);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar insights" });
    }
  });

  // API routes for health metrics
  app.get("/api/health-metrics", ensureAuthenticated, rbacSystem.requirePermission('health_metrics', 'read'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join('=');
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>) || {};
      let profileId: number | undefined;
      if (req.query.profileId) {
        const parsed = Number(req.query.profileId);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      if (!profileId && cookies['active_profile_id']) {
        const parsed = Number(cookies['active_profile_id']);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      if (!profileId) {
        const defaultProfile = await storage.getDefaultProfileForUser(userId);
        profileId = defaultProfile?.id;
      }

      if (!profileId) {
        return res.status(400).json({ message: "Nenhum paciente selecionado." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Paciente inválido." });
      }

      const metrics = await storage.getHealthMetricsByUserId(userId, profileId);
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

      let profileId: number | undefined;
      if (req.query.profileId) {
        const parsed = Number(req.query.profileId);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      if (!profileId && cookies['active_profile_id']) {
        const parsed = Number(cookies['active_profile_id']);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      if (!profileId) {
        const defaultProfile = await storage.getDefaultProfileForUser(userId);
        profileId = defaultProfile?.id;
      }

      if (!profileId) {
        return res.status(400).json({ message: "Nenhum paciente selecionado." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Paciente inválido." });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const metrics = await storage.getLatestHealthMetrics(userId, limit, profileId);
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

      let profileId: number | undefined;
      if (req.query.profileId) {
        const parsed = Number(req.query.profileId);
        if (!Number.isNaN(parsed)) {
          profileId = parsed;
        }
      }

      if (!profileId) {
        return res.status(400).json({ message: "Selecione um paciente para excluir métricas." });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== targetUserId) {
        return res.status(403).json({ message: "Paciente inválido." });
      }

      // Executar a exclusão
      const count = await storage.deleteAllHealthMetricsByUserId(targetUserId, profileId);

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

  app.post("/api/patient-record/analyze", ensureAuthenticated, async (req, res) => {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text : "";
      if (!text.trim()) {
        return res.status(400).json({ message: "Texto da anamnese é obrigatório" });
      }

      // Save evolution
      try {
        await storage.createEvolution({
          userId: req.user!.id,
          text: text,
          date: new Date(),
        });
      } catch (err) {
        console.error("Erro ao salvar evolução:", err);
        // Não falhar a análise se salvar a evolução falhar
      }

      const record = await extractRecordFromAnamnesis(text);
      res.json(record);
    } catch (error) {
      logger.error("[PatientRecord] Falha ao analisar anamnese com IA", {
        userId: req.user?.id,
        message: error instanceof Error ? error.message : String(error)
      });
      res.status(500).json({ message: "Erro ao interpretar anamnese" });
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

  // API routes for surgeries
  app.get("/api/surgeries", ensureAuthenticated, async (req, res) => {
    try {
      const surgeries = await storage.getSurgeriesByUserId(req.user!.id);
      res.json(surgeries || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cirurgias" });
    }
  });

  app.post("/api/surgeries", ensureAuthenticated, async (req, res) => {
    try {
      const surgeryData = {
        userId: req.user!.id,
        procedureName: req.body.procedureName,
        hospitalName: req.body.hospitalName,
        surgeonName: req.body.surgeonName,
        surgeryDate: req.body.surgeryDate,
        notes: req.body.notes || null,
      };

      const newSurgery = await storage.createSurgery(surgeryData);
      res.status(201).json(newSurgery);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar cirurgia" });
    }
  });

  app.put("/api/surgeries/:id", ensureAuthenticated, async (req, res) => {
    try {
      const surgeryId = parseInt(req.params.id);
      const surgery = await storage.getSurgery(surgeryId);

      if (!surgery) {
        return res.status(404).json({ message: "Cirurgia não encontrada" });
      }

      if (surgery.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updatedSurgery = await storage.updateSurgery(surgeryId, req.body);
      res.json(updatedSurgery);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar cirurgia" });
    }
  });

  app.delete("/api/surgeries/:id", ensureAuthenticated, async (req, res) => {
    try {
      const surgeryId = parseInt(req.params.id);
      const surgery = await storage.getSurgery(surgeryId);

      if (!surgery) {
        return res.status(404).json({ message: "Cirurgia não encontrada" });
      }

      if (surgery.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deleteSurgery(surgeryId);
      res.json({ message: "Cirurgia excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir cirurgia" });
    }
  });

  // API routes for evolutions (Consultas/Anamnese)
  app.get("/api/evolutions", ensureAuthenticated, async (req, res) => {
    try {
      const evolutions = await storage.getEvolutionsByUserId(req.user!.id);
      res.json(evolutions || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar evoluções" });
    }
  });

  app.post("/api/evolutions", ensureAuthenticated, async (req, res) => {
    try {
      const evolutionData = {
        userId: req.user!.id,
        text: req.body.text,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };

      const newEvolution = await storage.createEvolution(evolutionData);
      res.status(201).json(newEvolution);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar evolução" });
    }
  });

  app.delete("/api/evolutions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const evolutionId = parseInt(req.params.id);
      const evolution = await storage.getEvolution(evolutionId);

      if (!evolution) {
        return res.status(404).json({ message: "Evolução não encontrada" });
      }

      if (evolution.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deleteEvolution(evolutionId);
      res.json({ message: "Evolução excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir evolução" });
    }
  });

  // API routes for habits (Hábitos: etilismo, tabagismo, UDI)
  app.get("/api/habits", ensureAuthenticated, async (req, res) => {
    try {
      const habits = await storage.getHabitsByUserId(req.user!.id);
      res.json(habits || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar hábitos" });
    }
  });

  app.post("/api/habits", ensureAuthenticated, async (req, res) => {
    try {
      const habitData = {
        userId: req.user!.id,
        profileId: req.body.profileId || null,
        habitType: req.body.habitType,
        status: req.body.status,
        frequency: req.body.frequency || null,
        quantity: req.body.quantity || null,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        notes: req.body.notes || null,
      };

      const newHabit = await storage.createHabit(habitData);
      res.status(201).json(newHabit);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar hábito" });
    }
  });

  app.put("/api/habits/:id", ensureAuthenticated, async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);

      if (!habit) {
        return res.status(404).json({ message: "Hábito não encontrado" });
      }

      if (habit.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updatedHabit = await storage.updateHabit(habitId, req.body);
      res.json(updatedHabit);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar hábito" });
    }
  });

  app.delete("/api/habits/:id", ensureAuthenticated, async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);

      if (!habit) {
        return res.status(404).json({ message: "Hábito não encontrado" });
      }

      if (habit.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deleteHabit(habitId);
      res.json({ message: "Hábito excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir hábito" });
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

      res.cookie('active_profile_id', profileId.toString(), {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });

      // Responder com o perfil selecionado
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Erro ao alterar perfil ativo" });
    }
  });

  // ============================================================================
  // BULK PATIENT IMPORT ROUTES
  // ============================================================================

  // Configure multer for bulk import file uploads
  const bulkImportUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10 // Max 10 files at once
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não suportado. Use imagens (JPG, PNG), PDF ou CSV.'));
      }
    }
  });

  /**
   * POST /api/patients/bulk-import/extract
   * Extract patient data from uploaded files using AI
   */
  app.post("/api/patients/bulk-import/extract",
    ensureAuthenticated,
    bulkImportUpload.array('files', 10),
    async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({
            message: "Nenhum arquivo foi enviado"
          });
        }

        logger.info(`[BulkImport] Processing ${files.length} files for user ${req.user!.id}`);

        // Separate files by type
        const imageFiles: Array<{ buffer: Buffer; filename: string; mimetype: string }> = [];
        const pdfFiles: Array<{ buffer: Buffer; filename: string }> = [];
        const csvFiles: Array<{ buffer: Buffer; filename: string }> = [];

        for (const file of files) {
          if (file.mimetype.startsWith('image/')) {
            imageFiles.push({
              buffer: file.buffer,
              filename: file.originalname,
              mimetype: file.mimetype
            });
          } else if (file.mimetype === 'application/pdf') {
            pdfFiles.push({
              buffer: file.buffer,
              filename: file.originalname
            });
          } else if (file.mimetype.includes('csv') || file.mimetype.includes('spreadsheet')) {
            csvFiles.push({
              buffer: file.buffer,
              filename: file.originalname
            });
          }
        }

        // Process files in parallel
        const results = await Promise.allSettled([
          imageFiles.length > 0 ? extractPatientsFromImages(imageFiles) : Promise.resolve({ patients: [], totalExtracted: 0, errors: [] }),
          pdfFiles.length > 0 ? extractPatientsFromPDF(pdfFiles) : Promise.resolve({ patients: [], totalExtracted: 0, errors: [] }),
          csvFiles.length > 0 ? extractPatientsFromCSV(csvFiles) : Promise.resolve({ patients: [], totalExtracted: 0, errors: [] })
        ]);

        // Combine results
        let allPatients: ExtractedPatient[] = [];
        let allErrors: Array<{ file: string; error: string }> = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allPatients = allPatients.concat(result.value.patients);
            allErrors = allErrors.concat(result.value.errors);
          } else {
            const fileType = index === 0 ? 'imagens' : index === 1 ? 'PDFs' : 'CSVs';
            allErrors.push({
              file: fileType,
              error: result.reason?.message || 'Erro desconhecido'
            });
          }
        });

        // Normalize all extracted patients
        const normalizedPatients = allPatients.map(p => normalizePatientData(p));

        // Check for duplicates
        const names = normalizedPatients.map(p => p.name);
        const cpfs = normalizedPatients.map(p => p.cpf).filter((cpf): cpf is string | null => cpf !== undefined);
        const duplicates = await storage.findDuplicateProfiles(req.user!.id, names, cpfs);

        logger.info(`[BulkImport] Extracted ${normalizedPatients.length} patients, found ${duplicates.length} potential duplicates`);

        res.json({
          success: true,
          patients: normalizedPatients,
          totalExtracted: normalizedPatients.length,
          duplicates: duplicates.map(d => ({
            id: d.id,
            name: d.name,
            cpf: d.cpf,
            birthDate: d.birthDate
          })),
          errors: allErrors,
          summary: {
            totalFiles: files.length,
            imagesProcessed: imageFiles.length,
            pdfsProcessed: pdfFiles.length,
            csvsProcessed: csvFiles.length,
            patientsExtracted: normalizedPatients.length,
            duplicatesFound: duplicates.length,
            errorsCount: allErrors.length
          }
        });

      } catch (error) {
        logger.error('[BulkImport] Error extracting patients:', error);
        res.status(500).json({
          message: "Erro ao processar arquivos",
          error: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  );

  /**
   * POST /api/patients/bulk-import/confirm
   * Create multiple patient profiles from extracted data
   */
  app.post("/api/patients/bulk-import/confirm",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { patients, skipDuplicates } = req.body;

        if (!patients || !Array.isArray(patients) || patients.length === 0) {
          return res.status(400).json({
            message: "Nenhum paciente foi fornecido para importação"
          });
        }

        logger.info(`[BulkImport] Confirming import of ${patients.length} patients for user ${req.user!.id}`);

        // Convert extracted patients to InsertProfile format
        const profilesToCreate = patients.map((patient: ExtractedPatient) =>
          convertToInsertProfile(patient, req.user!.id)
        );

        // Filter out duplicates if requested
        let filteredProfiles = profilesToCreate;
        if (skipDuplicates) {
          const names = patients.map((p: ExtractedPatient) => p.name);
          const cpfs = patients.map((p: ExtractedPatient) => p.cpf).filter((cpf): cpf is string | null => cpf !== undefined);
          const duplicates = await storage.findDuplicateProfiles(req.user!.id, names, cpfs);

          const duplicateNames = new Set(duplicates.map(d => d.name.toLowerCase()));
          const duplicateCpfs = new Set(duplicates.map(d => d.cpf).filter(Boolean));

          filteredProfiles = profilesToCreate.filter((profile: any) => {
            const nameMatch = duplicateNames.has(profile.name.toLowerCase());
            const cpfMatch = profile.cpf && duplicateCpfs.has(profile.cpf);
            return !nameMatch && !cpfMatch;
          });

          logger.info(`[BulkImport] Filtered ${profilesToCreate.length - filteredProfiles.length} duplicates`);
        }

        if (filteredProfiles.length === 0) {
          return res.json({
            success: true,
            created: [],
            skipped: profilesToCreate.length,
            message: "Todos os pacientes já existem no sistema"
          });
        }

        // Create profiles in bulk
        const createdProfiles = await storage.createProfilesBulk(filteredProfiles);

        logger.info(`[BulkImport] Successfully created ${createdProfiles.length} profiles`);

        res.json({
          success: true,
          created: createdProfiles,
          skipped: profilesToCreate.length - filteredProfiles.length,
          message: `${createdProfiles.length} paciente(s) importado(s) com sucesso`
        });

      } catch (error) {
        logger.error('[BulkImport] Error confirming import:', error);
        res.status(500).json({
          message: "Erro ao importar pacientes",
          error: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  );

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
  // Temporary in-memory storage for medications
  const medicationsStore = new Map<number, any[]>();
  let medicationIdCounter = 1;

  app.post("/api/medications", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { name, format, dosage, dosageUnit, frequency, notes, startDate, isActive } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Nome do medicamento é obrigatório" });
      }

      // Create medication object
      const newMedication = {
        id: medicationIdCounter++,
        user_id: user.id,
        name,
        format,
        dosage,
        dosage_unit: dosageUnit || 'mg',
        dosageUnit: dosageUnit || 'mg', // Add camelCase version for frontend
        frequency,
        notes,
        start_date: startDate,
        startDate, // Add camelCase version for frontend
        is_active: isActive !== false,
        created_at: new Date().toISOString()
      };

      // Store in memory
      if (!medicationsStore.has(user.id)) {
        medicationsStore.set(user.id, []);
      }
      medicationsStore.get(user.id)!.push(newMedication);

      console.log("✅ Medicamento criado com sucesso (em memória):", newMedication);
      res.status(201).json(newMedication);
    } catch (error) {
      console.error("Erro ao criar medicamento:", error);
      res.status(500).json({ message: "Erro ao criar medicamento" });
    }
  });

  app.get("/api/medications", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userMedications = medicationsStore.get(user.id) || [];

      // Filter active medications and sort by created_at DESC
      const activeMedications = userMedications
        .filter(m => m.is_active !== false)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json(activeMedications);
    } catch (error) {
      console.error("Erro ao buscar medicamentos:", error);
      res.status(500).json({ message: "Erro ao buscar medicamentos" });
    }
  });

  app.put("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const { name, format, dosage, dosageUnit, frequency, notes, startDate } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Nome do medicamento é obrigatório" });
      }

      // Find and update medication in memory
      const userMedications = medicationsStore.get(user.id) || [];
      const medicationIndex = userMedications.findIndex(m => m.id === id && m.user_id === user.id);

      if (medicationIndex === -1) {
        return res.status(404).json({ message: "Medicamento não encontrado" });
      }

      // Update the medication
      userMedications[medicationIndex] = {
        ...userMedications[medicationIndex],
        name,
        format,
        dosage,
        dosage_unit: dosageUnit || 'mg',
        dosageUnit: dosageUnit || 'mg',
        frequency,
        notes,
        start_date: startDate,
        startDate
      };

      medicationsStore.set(user.id, userMedications);
      console.log("✅ Medicamento atualizado com sucesso (em memória):", userMedications[medicationIndex]);
      res.json(userMedications[medicationIndex]);
    } catch (error) {
      console.error("Erro ao atualizar medicamento:", error);
      res.status(500).json({ message: "Erro ao atualizar medicamento" });
    }
  });

  app.delete("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);

      // Find and mark medication as inactive in memory
      const userMedications = medicationsStore.get(user.id) || [];
      const medicationIndex = userMedications.findIndex(m => m.id === id && m.user_id === user.id);

      if (medicationIndex === -1) {
        return res.status(404).json({ message: "Medicamento não encontrado" });
      }

      // Mark as inactive instead of removing
      userMedications[medicationIndex].is_active = false;
      medicationsStore.set(user.id, userMedications);

      console.log("✅ Medicamento marcado como inativo (em memória)");
      res.json({ message: "Medicamento excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir medicamento:", error);
      res.status(500).json({ message: "Erro ao excluir medicamento" });
    }
  });

  // Allergies routes
  // Temporary in-memory storage for allergies
  const allergiesStore = new Map<number, any[]>();
  let allergyIdCounter = 1;

  app.post("/api/allergies", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { allergen, allergenType, reaction, severity, notes } = req.body;

      if (!allergen) {
        return res.status(400).json({ message: "Nome do alérgeno é obrigatório" });
      }

      // Create allergy object
      const newAllergy = {
        id: allergyIdCounter++,
        user_id: user.id,
        allergen,
        allergen_type: allergenType || 'medication',
        reaction,
        severity,
        notes,
        created_at: new Date().toISOString()
      };

      // Store in memory
      if (!allergiesStore.has(user.id)) {
        allergiesStore.set(user.id, []);
      }
      allergiesStore.get(user.id)!.push(newAllergy);

      console.log("✅ Alergia criada com sucesso (em memória):", newAllergy);
      res.status(201).json(newAllergy);
    } catch (error) {
      console.error("Erro ao criar alergia:", error);
      res.status(500).json({ message: "Erro ao registrar alergia" });
    }
  });

  app.get("/api/allergies", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userAllergies = allergiesStore.get(user.id) || [];

      // Sort by created_at DESC
      const sorted = [...userAllergies].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      res.json(sorted);
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

      // Find and update allergy in memory
      const userAllergies = allergiesStore.get(user.id) || [];
      const allergyIndex = userAllergies.findIndex(a => a.id === id && a.user_id === user.id);

      if (allergyIndex === -1) {
        return res.status(404).json({ message: "Alergia não encontrada" });
      }

      // Update the allergy
      userAllergies[allergyIndex] = {
        ...userAllergies[allergyIndex],
        allergen,
        allergen_type: allergenType,
        reaction,
        severity,
        notes
      };

      allergiesStore.set(user.id, userAllergies);
      console.log("✅ Alergia atualizada com sucesso (em memória):", userAllergies[allergyIndex]);
      res.json(userAllergies[allergyIndex]);
    } catch (error) {
      console.error("Erro ao atualizar alergia:", error);
      res.status(500).json({ message: "Erro ao atualizar alergia" });
    }
  });

  app.delete("/api/allergies/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);

      // Find and remove allergy from memory
      const userAllergies = allergiesStore.get(user.id) || [];
      const allergyIndex = userAllergies.findIndex(a => a.id === id && a.user_id === user.id);

      if (allergyIndex === -1) {
        return res.status(404).json({ message: "Alergia não encontrada" });
      }

      // Remove the allergy
      userAllergies.splice(allergyIndex, 1);
      allergiesStore.set(user.id, userAllergies);

      console.log("✅ Alergia removida com sucesso (em memória)");
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

  // Nova rota para gerar PDF de exame específico
  app.post("/api/export-exam-report/:examId", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const examId = parseInt(req.params.examId);

      console.log('Exportando PDF do exame:', examId, 'para usuário:', user.id);

      // Buscar dados do exame específico
      const examResult = await pool.query(`
        SELECT e.*, er.summary, er.detailed_analysis, er.recommendations, er.analysis_date
        FROM exams e
        LEFT JOIN exam_results er ON e.id = er.exam_id
        WHERE e.id = $1 AND e.user_id = $2
      `, [examId, user.id]);

      if (examResult.rows.length === 0) {
        return res.status(404).json({ message: "Exame não encontrado" });
      }

      const exam = examResult.rows[0];
      console.log('Exame encontrado:', exam.name);

      // Buscar métricas do exame
      const metricsResult = await pool.query(`
        SELECT * FROM health_metrics 
        WHERE exam_id = $1 
        ORDER BY date DESC
      `, [examId]);

      // Gerar HTML do relatório do exame
      const htmlContent = generateExamReportHTML({
        user,
        exam,
        metrics: metricsResult.rows
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
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-exame-${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Erro detalhado na geração do PDF do exame:', error);
      res.status(500).json({ message: "Erro ao gerar relatório do exame", error: error.message });
    }
  });

  // Doctor routes
  app.get("/api/doctors", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const doctors = await storage.getDoctorsByUserId(user.id);
      res.json(doctors);
    } catch (error) {
      console.error("Erro ao buscar médicos:", error);
      res.status(500).json({ message: "Erro ao buscar médicos" });
    }
  });

  app.post("/api/doctors", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { name, crm, specialty, professionalType, isDefault } = req.body;

      if (!name || !crm) {
        return res.status(400).json({ message: "Nome e Número do Conselho são obrigatórios" });
      }

      const newDoctor = await storage.createDoctor({
        userId: user.id,
        name,
        crm,
        specialty: specialty || null,
        professionalType: professionalType || "doctor",
        isDefault: isDefault || false,
      });

      console.log("✅ Médico criado com sucesso:", newDoctor);
      res.status(201).json(newDoctor);
    } catch (error) {
      console.error("Erro ao criar médico:", error);
      res.status(500).json({ message: "Erro ao criar médico" });
    }
  });

  app.put("/api/doctors/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const { name, crm, specialty, professionalType, isDefault } = req.body;

      // Verify doctor belongs to user
      const doctor = await storage.getDoctor(id);
      if (!doctor) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }

      if (doctor.userId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!name || !crm) {
        return res.status(400).json({ message: "Nome e Número do Conselho são obrigatórios" });
      }

      const updatedDoctor = await storage.updateDoctor(id, {
        name,
        crm,
        specialty: specialty || null,
        professionalType: professionalType || "doctor",
        isDefault: isDefault || false,
      });

      console.log("✅ Médico atualizado com sucesso:", updatedDoctor);
      res.json(updatedDoctor);
    } catch (error) {
      console.error("Erro ao atualizar médico:", error);
      res.status(500).json({ message: "Erro ao atualizar médico" });
    }
  });

  app.delete("/api/doctors/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);

      // Verify doctor belongs to user
      const doctor = await storage.getDoctor(id);
      if (!doctor) {
        return res.status(404).json({ message: "Médico não encontrado" });
      }

      if (doctor.userId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const deleted = await storage.deleteDoctor(id);
      if (!deleted) {
        return res.status(500).json({ message: "Erro ao excluir médico" });
      }

      console.log("✅ Médico excluído com sucesso");
      res.json({ message: "Médico excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir médico:", error);
      res.status(500).json({ message: "Erro ao excluir médico" });
    }
  });

  app.put("/api/doctors/:id/set-default", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);

      // Verify doctor belongs to user
      const doctor = await storage.getDoctor(id);
      if (!doctor) {
        return res.status(404).json({ message: "Médico não encontrado" });
      }

      if (doctor.userId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const success = await storage.setDefaultDoctor(user.id, id);
      if (!success) {
        return res.status(500).json({ message: "Erro ao definir médico padrão" });
      }

      console.log("✅ Médico definido como padrão");
      res.json({ message: "Médico definido como padrão com sucesso" });
    } catch (error) {
      console.error("Erro ao definir médico padrão:", error);
      res.status(500).json({ message: "Erro ao definir médico padrão" });
    }
  });

  // Temporary migration endpoint (remove after running once)
  app.post("/api/run-prescription-migration", ensureAuthenticated, async (req, res) => {
    try {
      // Check if user is admin (you might want to add this check)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS prescriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          doctor_name TEXT NOT NULL,
          doctor_crm TEXT NOT NULL,
          doctor_specialty TEXT,
          medications JSONB NOT NULL,
          issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
          valid_until TIMESTAMP NOT NULL,
          observations TEXT,
          pdf_path TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_prescriptions_issue_date ON prescriptions(issue_date DESC);
      `);

      res.json({ success: true, message: "Migration executed successfully" });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ message: "Migration failed", error: error.message });
    }
  });

  // Prescription generation route
  app.post("/api/prescriptions/generate", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { medicationIds, validityDays, observations, doctorName, doctorCrm, doctorSpecialty } = req.body;

      if (!medicationIds || medicationIds.length === 0) {
        return res.status(400).json({ message: "Selecione pelo menos um medicamento" });
      }

      if (!doctorName || !doctorCrm) {
        return res.status(400).json({ message: "Dados do médico são obrigatórios" });
      }

      // Buscar medicamentos selecionados usando Drizzle
      // Se o frontend enviou os medicamentos completos, usar esses dados e pular query do banco
      // Isso torna a geração do PDF resiliente a falhas de banco de dados
      let medicationsList = req.body.medications;

      if (!medicationsList || medicationsList.length === 0) {
        // Fallback: Tentar buscar do banco se não enviado (comportamento antigo legada/segurança)
        try {
          const medicationsResult = await db.select().from(medications)
            .where(and(
              inArray(medications.id, medicationIds),
              eq(medications.userId, user.id),
              eq(medications.isActive, true)
            ));

          medicationsList = medicationsResult;
        } catch (error) {
          console.error("Erro ao buscar medicamentos no banco:", error);
          // Se falhar e não veio do body, retorne erro ou lista vazia dependendo da severidade
          // Para garantir PDF, retornamos lista vazia se falhar tudo
          medicationsList = [];
        }
      }

      const issueDate = new Date();
      const validUntil = new Date(issueDate.getTime() + (validityDays || 30) * 24 * 60 * 60 * 1000);

      let prescription = null;
      try {
        // Inserir registro no banco usando Drizzle
        const [insertedPrescription] = await db.insert(prescriptions).values({
          userId: user.id,
          doctorName,
          doctorCrm,
          doctorSpecialty: doctorSpecialty || null,
          medications: medicationsList.map((m: any) => ({
            id: m.id,
            name: m.name,
            format: m.format,
            dosage: m.dosage, // Drizzle returns camelCase columns matching schema
            frequency: m.frequency,
            notes: m.notes
          })),
          issueDate: new Date(issueDate),
          validUntil: new Date(validUntil),
          observations: observations || null
        }).returning();
        prescription = insertedPrescription;
      } catch (dbError) {
        // Log the error but continue to allow PDF generation
        console.error('Erro ao salvar no banco (permitindo geração de PDF):', dbError);
        // Create a dummy prescription object to satisfy response structure if needed, or just let it be null
      }

      // Retornar sucesso para que o frontend gere o PDF
      // Note: We return success: true even if DB failed, because the PRIMARY goal is the PDF.
      res.json({
        success: true,
        message: prescription ? "Prescrição registrada com sucesso" : "Prescrição gerada (não salva no histórico)",
        prescription,
        // Enviar os dados completos necessários para o frontend gerar o PDF
        pdfData: {
          doctorName,
          doctorCrm,
          doctorSpecialty,
          patientName: user.fullName || user.username,
          patientBirthDate: user.birthDate,
          medications: medicationsList,
          observations,
          issueDate,
          validUntil
        }
      });

    } catch (error) {
      console.error('Erro fatal ao processar solicitação:', error);
      res.status(500).json({ message: "Erro ao processar solicitação", error: error.message });
    }
  });

  // CSP violation reporting endpoint
  app.post("/api/csp-violation-report", (req: Request, res: Response) => {
    try {
      const rawBody = req.body;
      const violation = rawBody && typeof rawBody === 'object'
        ? (rawBody['csp-report'] ?? rawBody)
        : {};

      // Log CSP violations for monitoring
      console.warn('[CSP Violation Report]', {
        timestamp: new Date().toISOString(),
        violatedDirective: violation?.['violated-directive'],
        blockedURI: violation?.['blocked-uri'],
        documentURI: violation?.['document-uri'],
        originalPolicy: violation?.['original-policy'],
        referrer: violation?.referrer,
        statusCode: violation?.['status-code'],
        userAgent: req.get('user-agent'),
        ip: req.ip
      });

      res.status(204).end();
    } catch (error) {
      console.error('Error handling CSP violation report:', error);
      res.status(500).json({ message: "Error processing CSP violation report" });
    }
  });

  // Server creation is now handled by httpsConfig in index.ts
}
