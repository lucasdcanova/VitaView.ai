/**
 * Pipeline completo de análise de documentos médicos
 * 
 * Este módulo implementa o fluxo completo de processamento:
 * 1. Extração com Gemini (baixo custo, rápido)
 * 2. Fallback para OpenAI se Gemini falhar
 * 3. Análise detalhada com OpenAI
 * 
 * Benefícios:
 * - Tratamento robusto de erros
 * - Otimizado para documentos brasileiros
 * - Mecanismo de fallback entre providers
 */

import { analyzeDocument } from './gemini';
import { analyzeExtractedExam } from './openai';
import { storage } from '../storage';
import { normalizeExamName, normalizeHealthMetrics } from '../../shared/exam-normalizer';

export interface AnalysisOptions {
  userId: number;
  name: string;
  fileType: string;
  fileContent: string;
  laboratoryName?: string | null;
  examDate?: string | null;
}

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
 * Executa o pipeline completo de análise de documentos
 * 
 * @param options Opções para a análise
 * @returns Resultado da análise
 */
export async function runAnalysisPipeline(options: AnalysisOptions): Promise<AnalysisResult> {
  console.log(`[Pipeline] Iniciando análise completa para usuário ${options.userId}`);
  
  try {
    // ETAPA 1: EXTRAÇÃO DADOS (GEMINI)
    console.log(`[Pipeline] ETAPA 1: Extraindo dados com Gemini (doc tipo: ${options.fileType})`);
    const fileSizeKB = Math.round(options.fileContent.length * 0.75 / 1024);
    console.log(`[Pipeline] Processando arquivo de ${fileSizeKB}KB`);
    
    const extractionResult = await analyzeDocument(options.fileContent, options.fileType);
    
    // ARMAZENAR METADADOS
    const extractedExamDate = extractionResult.examDate || options.examDate || new Date().toISOString().split('T')[0];
    const extractedLabName = extractionResult.laboratoryName || options.laboratoryName || "Laboratório não identificado";
    let requestingPhysician = extractionResult.requestingPhysician || null;
    
    // Sanitizar nome do médico
    if (requestingPhysician) {
      requestingPhysician = requestingPhysician
        .replace(/^Dr\.\s*/i, '')
        .replace(/^Dra\.\s*/i, '')
        .replace(/^Dr\s*/i, '')
        .replace(/^Dra\s*/i, '');
    }
    
    // CRIAR REGISTRO DO EXAME
    console.log(`[Pipeline] ETAPA 2: Criando registro do exame`);
    const examName = extractionResult.examType 
      ? `${extractionResult.examType} - ${options.name}` 
      : options.name;
      
    const exam = await storage.createExam({
      userId: options.userId,
      name: examName,
      fileType: options.fileType,
      status: "extracted",
      laboratoryName: extractedLabName,
      examDate: extractedExamDate,
      requestingPhysician: requestingPhysician,
      originalContent: options.fileContent
    });
    
    console.log(`[Pipeline] Exame criado com ID: ${exam.id}`);
    
    // NORMALIZAR MÉTRICAS - Unificar nomes para evitar duplicatas com nomes ligeiramente diferentes
    console.log(`[Pipeline] Normalizando métricas de saúde...`);
    const normalizedMetrics = normalizeHealthMetrics(extractionResult.healthMetrics || []);
    console.log(`[Pipeline] Normalização reduziu de ${extractionResult.healthMetrics?.length || 0} para ${normalizedMetrics.length} métricas únicas`);
    
    // SALVAR RESULTADO DA EXTRAÇÃO COM MÉTRICAS NORMALIZADAS
    console.log(`[Pipeline] ETAPA 3: Salvando métricas extraídas (normalizadas)`);
    const examResult = await storage.createExamResult({
      examId: exam.id,
      summary: `Exame extraído com ${normalizedMetrics.length} parâmetros`,
      detailedAnalysis: null, // Será preenchido pela OpenAI posteriormente
      recommendations: null, // Será preenchido pela OpenAI posteriormente
      healthMetrics: normalizedMetrics,
      aiProvider: extractionResult.aiProvider || "gemini:extraction-only"
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
          userId: options.userId,
          name: metric.name || "desconhecido",
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          date: new Date(extractedExamDate)
        });
        
        savedMetricsCount++;
      } catch (error) {
        failedMetricsCount++;
        console.error(`[Pipeline] Erro ao salvar métrica ${metric.name}:`, error);
      }
    }
    
    // ETAPA 4: ANÁLISE DETALHADA (OPENAI)
    console.log(`[Pipeline] ETAPA 4: Iniciando análise detalhada com OpenAI`);
    
    // Atualizar status do exame
    await storage.updateExam(exam.id, { status: "analyzing" });
    
    try {
      // Obter análise profunda
      const analysisResult = await analyzeExtractedExam(exam.id, options.userId, storage);
      console.log(`[Pipeline] Análise com OpenAI concluída com sucesso`);
      
      // Atualizar status para finalizado
      await storage.updateExam(exam.id, { status: "analyzed" });
      
      // Criar notificação para usuário
      await storage.createNotification({
        userId: options.userId,
        title: "Análise Completa",
        message: `A análise detalhada do exame "${examName}" está disponível.`,
        read: false
      });
      
      // Preparar resultado final
      return {
        exam,
        extractionResult,
        analysisResult,
        metrics: {
          totalExtracted: savedMetricsCount,
          categories: Array.from(metricsByCategory.keys()),
          status: statusCounts
        }
      };
      
    } catch (analysisError) {
      console.error(`[Pipeline] Erro na análise com OpenAI:`, analysisError);
      
      // Atualizar status para indicar apenas extração
      await storage.updateExam(exam.id, { status: "extraction_only" });
      
      // Criar notificação para usuário
      await storage.createNotification({
        userId: options.userId,
        title: "Análise Parcial",
        message: `O exame "${examName}" foi extraído, mas a análise detalhada não está disponível.`,
        read: false
      });
      
      // Retornar resultado só da extração
      return {
        exam,
        extractionResult,
        metrics: {
          totalExtracted: savedMetricsCount,
          categories: Array.from(metricsByCategory.keys()),
          status: statusCounts
        }
      };
    }
    
  } catch (error) {
    console.error(`[Pipeline] Erro no pipeline de análise:`, error);
    throw error;
  }
}