/**
 * Script para mostrar as métricas extraídas dos exames
 */

import { storage } from './storage';

async function showHealthMetrics() {
  try {
    // Buscar usuário de teste
    const TEST_USER_ID = 1;
    
    // Buscar métricas do usuário
    const metrics = await storage.getHealthMetricsByUserId(TEST_USER_ID);
    // Total de métricas: ${metrics.length}
    
    // Mostrar métricas mais recentes (últimas 10)
    // Métricas mais recentes:
    metrics.slice(-10).forEach((metric, i) => {
      // ${i+1}. ${metric.name}: ${metric.value} ${metric.unit} (${metric.status})
    });
    
    // Buscar exames do usuário
    const exams = await storage.getExamsByUserId(TEST_USER_ID);
    // Total de exames: ${exams.length}
    
    // Mostrar o exame mais recente
    if (exams.length > 0) {
      const latestExam = exams[exams.length - 1];
      // Exame mais recente: ${latestExam.name}
      // ID: ${latestExam.id}
      // Status: ${latestExam.status}
      // Data: ${latestExam.examDate}
      // Laboratório: ${latestExam.laboratoryName}
      // Médico solicitante: ${latestExam.requestingPhysician || 'Não informado'}
      
      // Buscar resultado do exame
      const result = await storage.getExamResultByExamId(latestExam.id);
      if (result) {
        // Resumo do resultado: ${result.summary}
        // Provedor de IA: ${result.aiProvider}
        
        // Mostrar métricas do exame (se houver)
        if (result.healthMetrics && Array.isArray(result.healthMetrics) && result.healthMetrics.length > 0) {
          // Métricas extraídas do exame:
          
          // Agrupar por categoria
          const metricsByCategory = new Map();
          
          // Processar métricas
          for (const metric of result.healthMetrics) {
            const category = metric.category || 'Sem categoria';
            if (!metricsByCategory.has(category)) {
              metricsByCategory.set(category, []);
            }
            metricsByCategory.get(category).push(metric);
          }
          
          // Mostrar por categoria
          metricsByCategory.forEach((metrics: any[], category: string): void => {
            // == ${category} (${metrics.length} métricas) ==
            metrics.forEach((metric: any, i: number) => {
              // ${i+1}. ${metric.name}: ${metric.value} ${metric.unit} (${metric.status})
              
              // Mostrar valores de referência
              if (metric.referenceMin !== null || metric.referenceMax !== null) {
                const minRef = metric.referenceMin !== null ? metric.referenceMin : '?';
                const maxRef = metric.referenceMax !== null ? metric.referenceMax : '?';
                // Referência: ${minRef} - ${maxRef}
              }
              
              // Mostrar significado clínico se disponível
              if (metric.clinical_significance) {
                // Significado: ${metric.clinical_significance}
              }
            });
          });
        } else {
          // Nenhuma métrica extraída neste exame.
        }
        
        // Mostrar recomendações
        if (result.recommendations) {
          // Recomendações:
          if (Array.isArray(result.recommendations)) {
            result.recommendations.forEach((rec, i) => {
              // ${i+1}. ${rec}
            });
          } else if (typeof result.recommendations === 'string') {
            // result.recommendations
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
  }
}

// Executar automaticamente
showHealthMetrics()
  .then(() => {
    // Exibição de métricas finalizada.
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
  });