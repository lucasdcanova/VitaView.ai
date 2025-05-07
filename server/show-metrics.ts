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
    console.log(`Total de métricas: ${metrics.length}`);
    
    // Mostrar métricas mais recentes (últimas 10)
    console.log('\nMétricas mais recentes:');
    metrics.slice(-10).forEach((metric, i) => {
      console.log(`${i+1}. ${metric.name}: ${metric.value} ${metric.unit} (${metric.status})`);
    });
    
    // Buscar exames do usuário
    const exams = await storage.getExamsByUserId(TEST_USER_ID);
    console.log(`\nTotal de exames: ${exams.length}`);
    
    // Mostrar o exame mais recente
    if (exams.length > 0) {
      const latestExam = exams[exams.length - 1];
      console.log(`\nExame mais recente: ${latestExam.name}`);
      console.log(`ID: ${latestExam.id}`);
      console.log(`Status: ${latestExam.status}`);
      console.log(`Data: ${latestExam.examDate}`);
      console.log(`Laboratório: ${latestExam.laboratoryName}`);
      console.log(`Médico solicitante: ${latestExam.requestingPhysician || 'Não informado'}`);
      
      // Buscar resultado do exame
      const result = await storage.getExamResultByExamId(latestExam.id);
      if (result) {
        console.log(`\nResumoto do resultado: ${result.summary}`);
        console.log(`Provedor de IA: ${result.aiProvider}`);
        
        // Mostrar métricas do exame (se houver)
        if (result.healthMetrics && Array.isArray(result.healthMetrics) && result.healthMetrics.length > 0) {
          console.log('\nMétricas extraídas do exame:');
          
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
          for (const [category, metrics] of metricsByCategory.entries()) {
            console.log(`\n== ${category} (${metrics.length} métricas) ==`);
            metrics.forEach((metric, i) => {
              console.log(`${i+1}. ${metric.name}: ${metric.value} ${metric.unit} (${metric.status})`);
              
              // Mostrar valores de referência
              if (metric.referenceMin !== null || metric.referenceMax !== null) {
                const minRef = metric.referenceMin !== null ? metric.referenceMin : '?';
                const maxRef = metric.referenceMax !== null ? metric.referenceMax : '?';
                console.log(`   Referência: ${minRef} - ${maxRef}`);
              }
              
              // Mostrar significado clínico se disponível
              if (metric.clinical_significance) {
                console.log(`   Significado: ${metric.clinical_significance}`);
              }
            });
          }
        } else {
          console.log('\nNenhuma métrica extraída neste exame.');
        }
        
        // Mostrar recomendações
        if (result.recommendations) {
          console.log('\nRecomendações:');
          if (Array.isArray(result.recommendations)) {
            result.recommendations.forEach((rec, i) => {
              console.log(`${i+1}. ${rec}`);
            });
          } else if (typeof result.recommendations === 'string') {
            console.log(result.recommendations);
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
    console.log('\nExibição de métricas finalizada.');
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
  });