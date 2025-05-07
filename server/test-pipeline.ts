/**
 * Teste completo do pipeline de análise de exames
 * 
 * Este script testa o fluxo completo:
 * 1. Extração de dados do exame com Gemini
 * 2. Fallback para OpenAI se necessário
 * 3. Análise detalhada com OpenAI
 * 4. Armazenamento em banco de dados
 */

import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import { analyzeDocument } from './services/gemini';
import { analyzeExtractedExam } from './services/openai';

// Constantes para o teste
const TEST_USER_ID = 1;  // ID de usuário para teste
const DEFAULT_FILE_PATH = './server/test-data/exam-sample.pdf';

async function runPipelineTest(filePath = DEFAULT_FILE_PATH) {
  console.log("\n======= PIPELINE COMPLETO: GEMINI + OPENAI =======");
  console.log(`Testando com arquivo: ${filePath}`);
  
  try {
    // 1. Ler conteúdo do arquivo
    console.log("\n1. Lendo arquivo de exame...");
    const fileContent = fs.readFileSync(path.resolve(filePath), { encoding: 'base64' });
    const fileType = path.extname(filePath).replace('.', '');
    console.log(`Arquivo carregado: ${(fileContent.length * 0.75 / 1024).toFixed(2)} KB`);
    
    // 2. Extração com Gemini
    console.log("\n2. Executando extração com Gemini...");
    const extractionResult = await analyzeDocument(fileContent, fileType);
    console.log(`Extração realizada ${extractionResult.fallbackUsed ? 'usando fallback' : 'com sucesso'}`);
    
    // 3. Criar registro do exame
    console.log("\n3. Criando registro do exame no banco de dados...");
    const exam = await storage.createExam({
      userId: TEST_USER_ID,
      name: `Teste Pipeline - ${new Date().toISOString()}`,
      fileType,
      status: "extracted",
      laboratoryName: extractionResult.laboratoryName || "Laboratório de Teste",
      examDate: extractionResult.examDate || new Date().toISOString().split('T')[0],
      requestingPhysician: extractionResult.requestingPhysician,
      originalContent: fileContent
    });
    console.log(`Exame criado com ID: ${exam.id}`);
    
    // 4. Salvar resultado da extração
    console.log("\n4. Salvando resultado da extração...");
    const examResult = await storage.createExamResult({
      examId: exam.id,
      summary: `Exame extraído com ${extractionResult.healthMetrics?.length || 0} parâmetros`,
      detailedAnalysis: null,
      recommendations: null,
      healthMetrics: extractionResult.healthMetrics,
      aiProvider: extractionResult.aiProvider || "gemini:extraction-only"
    });
    console.log(`Resultado da extração salvo com ID: ${examResult.id}`);
    
    // Resumo das métricas extraídas
    console.log("\nMétricas extraídas:");
    if (extractionResult.healthMetrics && extractionResult.healthMetrics.length > 0) {
      const metricsByCategory = new Map();
      
      // Agrupar métricas por categoria
      for (const metric of extractionResult.healthMetrics) {
        const category = metric.category || "Geral";
        if (!metricsByCategory.has(category)) {
          metricsByCategory.set(category, []);
        }
        metricsByCategory.get(category).push(metric.name);
      }
      
      // Exibir resumo por categoria
      metricsByCategory.forEach((metrics, category) => {
        console.log(`- ${category}: ${metrics.length} métricas (${metrics.join(', ')})`);
      });
      
      // Exibir detalhes das primeiras 3 métricas
      console.log("\nDetalhes das primeiras métricas:");
      extractionResult.healthMetrics.slice(0, 3).forEach((metric: any, index: number) => {
        console.log(`\n[${index + 1}] ${metric.name}`);
        console.log(`   Valor: ${metric.value} ${metric.unit}`);
        console.log(`   Status: ${metric.status}`);
        console.log(`   Referência: ${metric.referenceMin || "?"} - ${metric.referenceMax || "?"}`);
      });
    } else {
      console.log("Nenhuma métrica extraída");
    }
    
    // 5. Análise com OpenAI
    console.log("\n5. Executando análise detalhada com OpenAI...");
    await storage.updateExam(exam.id, { status: "analyzing" });
    
    try {
      const analysisResult = await analyzeExtractedExam(exam.id, TEST_USER_ID, storage);
      console.log("Análise OpenAI concluída com sucesso");
      console.log("\nRecomendações geradas:");
      
      // Tratamento dos resultados da análise, com suporte a tipagem
      const recommendations = (analysisResult as any).recommendations;
      if (recommendations && Array.isArray(recommendations)) {
        recommendations.forEach((rec: string, i: number) => {
          console.log(`[${i+1}] ${rec}`);
        });
      } else if (typeof recommendations === 'string') {
        console.log(recommendations);
      } else {
        console.log("Nenhuma recomendação gerada");
      }
      
      // Atualizar status do exame
      await storage.updateExam(exam.id, { status: "analyzed" });
    } catch (analysisError) {
      console.error("Erro na análise com OpenAI:", analysisError);
      await storage.updateExam(exam.id, { status: "extraction_only" });
    }
    
    // 6. Verificar status final
    const finalExam = await storage.getExam(exam.id);
    console.log(`\nStatus final do exame: ${finalExam?.status}`);
    
    // Resultados finais
    const finalResult = await storage.getExamResultByExamId(exam.id);
    console.log("\n======= RESUMO DO PIPELINE =======");
    console.log(`✓ Exame criado e processado (ID: ${exam.id})`);
    console.log(`✓ Extração realizada com ${extractionResult.healthMetrics?.length || 0} métricas`);
    console.log(`✓ Análise detalhada: ${finalResult?.detailedAnalysis ? 'Concluída' : 'Não disponível'}`);
    console.log(`✓ Recomendações: ${finalResult?.recommendations ? 'Geradas' : 'Não disponíveis'}`);
    console.log(`✓ Provedor de IA: ${finalResult?.aiProvider || 'Desconhecido'}`);
    
    return {
      success: true,
      examId: exam.id,
      resultId: examResult.id
    };
    
  } catch (error) {
    console.error("\n❌ ERRO NO PIPELINE:");
    console.error(error);
    return {
      success: false,
      error
    };
  }
}

// Executar o teste automaticamente
// Verificar se foi fornecido um caminho de arquivo como argumento
const filePath = process.argv[2] || DEFAULT_FILE_PATH;

runPipelineTest(filePath)
  .then(result => {
    if (result.success) {
      console.log("\nTeste do pipeline concluído com sucesso!");
      process.exit(0);
    } else {
      console.error("\nTeste do pipeline falhou.");
      process.exit(1);
    }
  })
  .catch(err => {
    console.error("Erro não tratado:", err);
    process.exit(1);
  });

// Exportar para uso em outros scripts
export { runPipelineTest };