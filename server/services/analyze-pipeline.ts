/**
 * Pipeline completo de análise de documentos médicos
 * 
 * Este módulo implementa o fluxo completo de processamento:
 * 1. Extração com OpenAI (ChatGPT 5 vision)
 * 2. Análise detalhada com OpenAI
 * 
 * Benefícios:
 * - Tratamento robusto de erros
 * - Otimizado para documentos brasileiros
 * - Mecanismo de fallback entre providers
 */

import type { Exam } from '@shared/schema';
import { analyzeDocumentWithOpenAI } from './openai';
import { storage } from '../storage';
import { buildObjectiveMetricSummary, getObjectiveMetricStatus, normalizeHealthMetrics } from '../../shared/exam-normalizer';
import logger from '../logger';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { S3Service } from './s3.service';
import { createUserNotification } from './user-notification.service';

const stripFileExtension = (value: string) => value.replace(/\.[^.]+$/, '');

const normalizeDisplayName = (value: string) => {
  if (!value) return '';
  return stripFileExtension(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const capitalizeSentence = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const deriveNameFromMetrics = (metrics: any[]) => {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;
  const names = metrics.map(metric => (metric.name || '').toLowerCase());
  const containsAny = (terms: string[]) => terms.some(term => names.some(name => name.includes(term)));

  if (containsAny(['glicose', 'glicemia', 'hba1c'])) return 'Controle de glicemia';
  if (containsAny(['colesterol', 'hdl', 'ldl', 'triglicer'])) return 'Perfil lipídico';
  if (containsAny(['hemograma', 'hemoglobina', 'hematócrito', 'eritro', 'leucócitos'])) return 'Painel hematológico';
  if (containsAny(['tireoide', 'tsh', 't4', 't3'])) return 'Avaliação tireoidiana';
  if (containsAny(['vitamina d', 'vitamina b12'])) return 'Painel vitamínico';
  if (containsAny(['psa'])) return 'Monitoramento PSA';
  return null;
};

const buildExamDisplayName = (
  uploadedName: string,
  extractionResult: any,
  normalizedMetrics: any[],
  fallbackExamDate: string | null
) => {
  const metadata = extractionResult?.examMetadata || {};
  const cleanedUpload = normalizeDisplayName(uploadedName);
  const metricBasedName = deriveNameFromMetrics(normalizedMetrics);

  const primaryCandidate = [
    metadata.documentTitle,
    extractionResult?.examType,
    metadata.examModality,
    metadata.examPurpose,
    metricBasedName,
    cleanedUpload,
    'Exame médico'
  ].find(value => typeof value === 'string' && value.trim().length > 0) as string;

  const uniqueParts: string[] = [];
  const pushUnique = (value?: string | null) => {
    if (!value) return;
    const normalized = value.trim();
    if (!normalized) return;
    const lower = normalized.toLowerCase();
    if (!uniqueParts.some(part => part.toLowerCase() === lower)) {
      uniqueParts.push(capitalizeSentence(normalized));
    }
  };

  pushUnique(primaryCandidate);

  if (metadata.examPurpose && !primaryCandidate?.toLowerCase().includes(metadata.examPurpose.toLowerCase())) {
    pushUnique(metadata.examPurpose);
  }
  if (extractionResult?.laboratoryName && !primaryCandidate?.toLowerCase().includes(extractionResult.laboratoryName.toLowerCase())) {
    pushUnique(extractionResult.laboratoryName);
  }

  const examDate = extractionResult?.examDate || metadata.examDate || fallbackExamDate;
  if (examDate) {
    const parsed = new Date(examDate);
    if (!Number.isNaN(parsed.getTime())) {
      pushUnique(format(parsed, "MMM yyyy", { locale: ptBR }));
    }
  }

  return uniqueParts.join(" • ");
};

const safeText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const uniqueStrings = (values: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = safeText(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
};

const formatExamRecommendations = (value: unknown) => {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => safeText(item))).join("\n") || null;
  }

  const text = safeText(value);
  return text || null;
};

const normalizeRecommendationArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => safeText(item)));
  }

  const text = safeText(value);
  if (!text) return [];

  return uniqueStrings(
    text
      .split(/\n|[•*-]\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
};

const buildStructuredExamPayload = (extractionResult: any) => ({
  summary: extractionResult?.summary || null,
  detailedAnalysis: extractionResult?.detailedAnalysis || null,
  recommendations: normalizeRecommendationArray(extractionResult?.recommendations),
  healthMetrics: Array.isArray(extractionResult?.healthMetrics) ? extractionResult.healthMetrics : [],
  clinicalFindings: Array.isArray(extractionResult?.clinicalFindings) ? extractionResult.clinicalFindings : [],
  diagnosticImpression: Array.isArray(extractionResult?.diagnosticImpression) ? extractionResult.diagnosticImpression : [],
  suggestedDiagnoses: [],
  examMetadata: extractionResult?.examMetadata && typeof extractionResult.examMetadata === "object"
    ? extractionResult.examMetadata
    : {},
  aiProvider: extractionResult?.aiProvider || "openai:extraction"
});

const buildExtractionSummary = (examName: string, extractionResult: any, normalizedMetrics: any[]) => {
  const findings = Array.isArray(extractionResult?.clinicalFindings) ? extractionResult.clinicalFindings : [];
  const impressions = Array.isArray(extractionResult?.diagnosticImpression) ? extractionResult.diagnosticImpression : [];
  const metadata = extractionResult?.examMetadata || {};
  const explicitSummary = safeText(extractionResult?.summary);

  const firstAbnormalMetric = normalizedMetrics.find((metric: any) => {
    return getObjectiveMetricStatus(metric) !== "normal";
  });

  if (firstAbnormalMetric) {
    return buildObjectiveMetricSummary(firstAbnormalMetric);
  }

  if (findings.length > 0) {
    const firstFinding = findings[0];
    const bodySite = safeText(firstFinding?.bodySite);
    return `O exame ${examName} identificou ${safeText(firstFinding?.title)}${bodySite ? ` em ${bodySite}` : ""}.`;
  }

  if (impressions.length > 0) {
    return safeText(impressions[0]?.description) || `O exame ${examName} foi analisado com sucesso.`;
  }

  if (explicitSummary) return explicitSummary;

  if (normalizedMetrics.length > 0) {
    const abnormalCount = normalizedMetrics.filter((metric: any) => {
      return getObjectiveMetricStatus(metric) !== "normal";
    }).length;

    if (abnormalCount > 0) {
      return `O exame ${examName} apresentou ${abnormalCount} parâmetro(s) que merecem atenção clínica.`;
    }

    return `O exame ${examName} foi processado com ${normalizedMetrics.length} parâmetro(s) estruturados.`;
  }

  const examType = safeText(metadata?.examType || metadata?.examModality);
  if (examType) {
    return `Laudo de ${examType.toLowerCase()} analisado e registrado no histórico do paciente.`;
  }

  return `O exame ${examName} foi analisado e registrado no histórico do paciente.`;
};

const buildDiagnosisNotesFromExam = (examName: string, diagnosis: any) => {
  return uniqueStrings([
    `Derivado do exame "${examName}"`,
    safeText(diagnosis?.condition),
    safeText(diagnosis?.basis),
    safeText(diagnosis?.notes)
  ]).join(" | ") || null;
};

const persistSuggestedDiagnoses = async (
  exam: Exam,
  examName: string,
  examDate: string,
  extractionResult: any
) => {
  if (!exam.profileId) return 0;

  const diagnoses = Array.isArray(extractionResult?.suggestedDiagnoses)
    ? extractionResult.suggestedDiagnoses
    : [];

  if (diagnoses.length === 0) return 0;

  const existingDiagnoses = await storage.getDiagnosesByUserId(exam.userId);
  const existingKeys = new Set(
    existingDiagnoses
      .filter((item: any) => item?.profileId === exam.profileId && safeText(item?.cidCode))
      .map((item: any) => `${item.profileId}:${safeText(item.cidCode).toUpperCase()}`)
  );

  let createdCount = 0;

  for (const diagnosis of diagnoses) {
    const cidCode = safeText(diagnosis?.cidCode).toUpperCase();
    if (!cidCode) continue;

    const key = `${exam.profileId}:${cidCode}`;
    if (existingKeys.has(key)) continue;

    try {
      await storage.createDiagnosis({
        userId: exam.userId,
        profileId: exam.profileId,
        cidCode,
        diagnosisDate: examDate,
        status: safeText(diagnosis?.status) || "ativo",
        notes: buildDiagnosisNotesFromExam(examName, diagnosis)
      });

      existingKeys.add(key);
      createdCount += 1;
    } catch (error) {
      logger.error("[Pipeline] Falha ao registrar diagnóstico derivado do exame", {
        examId: exam.id,
        userId: exam.userId,
        profileId: exam.profileId,
        cidCode,
        error
      });
    }
  }

  return createdCount;
};

export interface AnalysisResult {
  exam: any;
  extractionResult: any;
  analysisResult?: any;
  metrics: {
    totalExtracted: number;
    categories: string[];
    status: {
      normal: number;
      alto: number;
      baixo: number;
      atencao: number;
    }
  }
}

/**
 * Executa o pipeline completo de análise de documentos em background
 * 
 * @param examId ID do exame a ser processado
 * @returns Resultado da análise
 */
export async function runAnalysisPipeline(examId: number): Promise<AnalysisResult> {
  logger.info(`[Pipeline] Iniciando runAnalysisPipeline para exame ${examId}`);
  // [Pipeline] Iniciando análise completa para exame existente

  const exam = await storage.getExam(examId);
  if (!exam) {
    throw new Error(`Exame ${examId} não encontrado`);
  }

  try {
    // Atualizar status para processando
    await storage.updateExam(examId, { status: "processing" });

    // Obter conteúdo do arquivo
    let fileContent: string;
    if (exam.filePath) {
      const buffer = await S3Service.getFile(exam.filePath);
      fileContent = buffer.toString('base64');
    } else if (exam.originalContent) {
      // Fallback para conteúdo legado (se houver)
      fileContent = exam.originalContent;
    } else {
      throw new Error("Conteúdo do arquivo não encontrado");
    }

    // ETAPA 1: EXTRAÇÃO DE DADOS (OPENAI)
    // [Pipeline] ETAPA 1: Extraindo dados com OpenAI
    const extractionResult = await analyzeDocumentWithOpenAI(fileContent, exam.fileType);

    // ARMAZENAR METADADOS
    const extractedMetadata = extractionResult.examMetadata || {};
    const extractedExamDate =
      extractionResult.examDate ||
      extractedMetadata.examDate ||
      extractedMetadata.collectionDate ||
      extractedMetadata.reportDate ||
      exam.examDate ||
      new Date().toISOString().split('T')[0];
    const extractedLabName =
      extractionResult.laboratoryName ||
      extractedMetadata.laboratoryName ||
      extractedMetadata.institutionName ||
      exam.laboratoryName ||
      null;
    let requestingPhysician = extractionResult.requestingPhysician || extractedMetadata.requestingPhysician || null;

    // Sanitizar nome do médico
    if (requestingPhysician) {
      requestingPhysician = requestingPhysician
        .replace(/^Dr\.\s*/i, '')
        .replace(/^Dra\.\s*/i, '')
        .replace(/^Dr\s*/i, '')
        .replace(/^Dra\s*/i, '');
    }

    // Normalizar métricas antes de persistir
    const normalizedMetrics = normalizeHealthMetrics(extractionResult.healthMetrics || []);

    // Criar nome contextual para o exame
    const examName = buildExamDisplayName(exam.name, extractionResult, normalizedMetrics, extractedExamDate);

    // Atualizar exame com dados extraídos
    await storage.updateExam(examId, {
      name: examName,
      status: "extracted",
      laboratoryName: extractedLabName,
      examDate: extractedExamDate,
      requestingPhysician: requestingPhysician,
      // originalContent: fileContent // Opcional: não salvar conteúdo se já estiver no S3 para economizar espaço no DB
    });

    // SALVAR RESULTADO DA EXTRAÇÃO COM MÉTRICAS NORMALIZADAS
    // [Pipeline] ETAPA 3: Salvando métricas extraídas (normalizadas)
    const structuredExamPayload = buildStructuredExamPayload({
      ...extractionResult,
      healthMetrics: normalizedMetrics
    });
    const summarizedExtraction = buildExtractionSummary(examName, extractionResult, normalizedMetrics);
    const recommendationText = formatExamRecommendations(extractionResult.recommendations);

    const examResult = await storage.createExamResult({
      examId: exam.id,
      summary: summarizedExtraction,
      detailedAnalysis: JSON.stringify(structuredExamPayload),
      recommendations: recommendationText,
      healthMetrics: normalizedMetrics,
      aiProvider: extractionResult.aiProvider || "openai:extraction"
    });

    // PROCESSAR MÉTRICAS INDIVIDUAIS
    const metricsByCategory = new Map();
    let savedMetricsCount = 0;
    let failedMetricsCount = 0;

    // Estatísticas por status
    const statusCounts = {
      normal: 0,
      alto: 0,
      baixo: 0,
      atencao: 0
    };

    // Usar as métricas já normalizadas para salvar por categoria
    for (const metric of normalizedMetrics) {
      try {
        // Categorizar métricas
        const category = metric.category || "Geral";
        if (!metricsByCategory.has(category)) {
          metricsByCategory.set(category, []);
        }
        metricsByCategory.get(category).push(metric.name);

        // Contar por status
        const status = metric.status?.toLowerCase() || "normal";
        if (status === "normal" || status === "alto" || status === "baixo" || status === "atencao") {
          statusCounts[status as keyof typeof statusCounts] += 1;
        } else {
          statusCounts.normal += 1; // fallback para normal
        }

        // Criar métrica individual (apenas com campos do schema)
        await storage.createHealthMetric({
          userId: exam.userId,
          profileId: exam.profileId,
          clinicId: exam.clinicId ?? null,
          examId: exam.id,
          name: metric.name || "desconhecido",
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          date: new Date(extractedExamDate),
          referenceMin: metric.referenceMin || null,
          referenceMax: metric.referenceMax || null
        });

        savedMetricsCount++;
      } catch (error) {
        failedMetricsCount++;
        logger.error("[Pipeline] Erro ao salvar métrica individual", {
          examId: exam.id,
          userId: exam.userId,
          profileId: exam.profileId,
          metricName: metric.name,
          error
        });
      }
    }

    if (failedMetricsCount > 0) {
      logger.warn("[Pipeline] Métricas não salvas", {
        examId: exam.id,
        userId: exam.userId,
        profileId: exam.profileId,
        failedMetricsCount
      });
    }

    // ETAPA 4: ANÁLISE DETALHADA (OPENAI) - OTIMIZAÇÃO: Pular análise secundária para agilidade
    // Utilizar a análise detalhada que já veio da extração (Step 1)

    logger.info("[Pipeline] Otimização: Finalizando pipeline após extração para resposta rápida");

    // Preparar resultado final combinando extração com estrutura de análise
    // A extração (Step 1) já retorna 'detailedAnalysis' e 'recommendations'

    // Atualizar status para finalizado
    await storage.updateExam(exam.id, { status: "analyzed" });

    // Criar notificação para usuário
    await createUserNotification({
      userId: exam.userId,
      title: "Análise Completa",
      message: `A análise do exame "${examName}" está disponível.`,
      read: false
    });

    // Atualizar o resultado do exame que foi criado na etapa 3 com a análise final (que agora vem da etapa 1)
    await storage.updateExamResult(examResult.id, {
      summary: summarizedExtraction,
      detailedAnalysis: JSON.stringify(structuredExamPayload),
      recommendations: recommendationText,
      aiProvider: extractionResult.aiProvider || "openai:fast-extraction"
    });

    return {
      exam,
      extractionResult,
      analysisResult: examResult, // O resultado já salvo
      metrics: {
        totalExtracted: savedMetricsCount,
        categories: Array.from(metricsByCategory.keys()),
        status: statusCounts
      }
    };

    /* 
    // CÓDIGO ANTERIOR (DESATIVADO TEMPORARIAMENTE PARA PERFORMANCE)
    // [Pipeline] ETAPA 4: Iniciando análise detalhada com OpenAI

    // Atualizar status do exame
    await storage.updateExam(exam.id, { status: "analyzing" });

    try {
      // Obter análise profunda
      const patientProfile = exam.profileId ? await storage.getProfile(exam.profileId) : undefined;
      // ... (rest of the code)
      
      return { ... };

    } catch (analysisError) { ... } 
    */

  } catch (error) {
    logger.error("[Pipeline] Falha geral na análise de exame", {
      userId: exam.userId,
      profileId: exam.profileId,
      examName: exam.name,
      fileType: exam.fileType,
      error
    });

    await storage.updateExam(examId, {
      status: "failed",
      processingError: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
}
