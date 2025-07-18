/**
 * Teste completo do pipeline de análise de exames
 * 
 * Este script testa o fluxo completo:
 * 1. Extração de dados do exame com Gemini
 * 2. Fallback para OpenAI se necessário
 * 3. Análise detalhada com OpenAI
 * 4. Armazenamento em banco de dados
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage';
import { runAnalysisPipeline, type AnalysisOptions } from './services/analyze-pipeline';

// Arquivo para testar (PDF, JPEG ou PNG)
const DEFAULT_FILE_PATH = './attached_assets/Resultado0022119-20241219161215.pdf';

// Executar o teste do pipeline
async function runPipelineTest(filePath = DEFAULT_FILE_PATH) {
  try {
    // === TESTE DO PIPELINE COMPLETO ===
    // Usando arquivo: ${filePath}
    
    // Carregar o arquivo
    // Carregando arquivo...
    const fileContent = readFileSync(filePath, { encoding: 'base64' });
    
    // Determinar o tipo de arquivo
    const fileType = filePath.endsWith('.pdf') 
      ? 'pdf' 
      : filePath.endsWith('.jpeg') || filePath.endsWith('.jpg') 
        ? 'jpeg'
        : 'png';
        
    // Tipo de arquivo: ${fileType}
    // Tamanho: ${Math.round(fileContent.length * 0.75 / 1024)}KB
    
    // Configurar o teste
    const options: AnalysisOptions = {
      userId: 1, // ID do usuário de teste
      name: `Teste Pipeline [${new Date().toISOString()}]`,
      fileType,
      fileContent,
      laboratoryName: 'Teste Automatizado',
      examDate: new Date().toISOString().split('T')[0]
    };
    
    // Executar o pipeline (extração + análise)
    // Iniciando pipeline...
    console.time('Pipeline completo');
    
    const result = await runAnalysisPipeline(options);
    
    console.timeEnd('Pipeline completo');
    
    // Exibir resultados
    // === RESULTADOS DO PIPELINE ===
    // ID do exame: ${result.exam.id}
    // Status final: ${result.exam.status}
    // Métricas extraídas: ${result.metrics.totalExtracted}
    // Categorias identificadas: ${result.metrics.categories.join(', ')}
    
    // Estatísticas de status
    // Distribuição por status:
    Object.entries(result.metrics.status).forEach(([status, count]) => {
      // - ${status}: ${count}
    });
    
    // Buscar resultado de exame no banco
    const examResult = await storage.getExamResultByExamId(result.exam.id);
    if (examResult) {
      // Resumo da análise: ${examResult.summary}
      
      if (examResult.recommendations) {
        // Recomendações principais:
        if (Array.isArray(examResult.recommendations)) {
          examResult.recommendations.slice(0, 3).forEach((rec, i) => {
            // ${i+1}. ${rec}
          });
        } else if (typeof examResult.recommendations === 'string') {
          // examResult.recommendations.split('\n').slice(0, 3).join('\n')
        }
      }
    }
    
    // Teste do pipeline concluído com sucesso!
    
  } catch (error) {
    console.error('Erro no teste do pipeline:', error);
    throw error;
  }
}

// Executar o teste
runPipelineTest()
  .then(() => {
    // Teste finalizado.
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });