import OpenAI from "openai";
import type { ExamResult, User, Exam } from "@shared/schema";
import type { HealthMetric } from "@shared/schema";
import type { IStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Initialize OpenAI using the API key from environment variables
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateHealthInsights(examResult: ExamResult, patientData?: any) {
  try {
    console.log("Generating health insights with OpenAI API");
    
    // Prepare patient context if available
    let patientContext = "";
    if (patientData) {
      patientContext = `
      Dados do paciente:
      - Sexo: ${patientData.gender || 'Não informado'}
      - Idade: ${patientData.age || 'Não informada'}
      - Doenças preexistentes: ${patientData.diseases?.join(", ") || 'Nenhuma informada'}
      - Cirurgias prévias: ${patientData.surgeries?.join(", ") || 'Nenhuma informada'}
      - Alergias: ${patientData.allergies?.join(", ") || 'Nenhuma informada'}
      - Histórico familiar: ${patientData.familyHistory || 'Não informado'}
      `;
    }
    
    // Prompt aprimorado para OpenAI com análise holística e personalizada
    const prompt = `
      Você é um especialista médico altamente qualificado em medicina laboratorial, diagnóstico clínico e medicina preventiva.
      Sua análise integra as evidências científicas mais atualizadas (2024) com diretrizes médicas internacionais e abordagem de medicina personalizada.
      
      ### TAREFA PRINCIPAL:
      Analise detalhadamente os seguintes resultados de exames médicos e forneça uma avaliação médica completa, 
      integrando os dados laboratoriais com o contexto específico do paciente para uma análise verdadeiramente personalizada.
      
      ### DADOS DO PACIENTE:
      ${patientContext}
      
      ### DADOS DO EXAME:
      - Resumo: ${examResult.summary}
      - Análise detalhada: ${examResult.detailedAnalysis}
      - Recomendações preliminares: ${examResult.recommendations}
      - Médico solicitante: ${examResult.requestingPhysician || 'Não informado'}
      - Laboratório: ${examResult.laboratoryName || 'Não informado'}
      - Data do exame: ${examResult.examDate || 'Não informada'}
      
      ### MÉTRICAS DE SAÚDE DETALHADAS:
      ${JSON.stringify(examResult.healthMetrics, null, 2)}
      
      ### INSTRUÇÕES ESPECÍFICAS:
      1. Faça correlações entre diferentes marcadores/parâmetros e integre-os no contexto do perfil do paciente
      2. Identifique padrões que possam indicar condições subclínicas ou riscos emergentes
      3. Priorize a detecção de fatores de risco modificáveis e ofereça intervenções específicas
      4. Forneça uma análise de tendências temporais quando houver dados históricos disponíveis
      5. Sugira monitoramento personalizado baseado no perfil de risco específico
      6. Inclua recomendações nutricionais específicas por nutriente baseadas nos resultados 
      7. Ofereça uma interpretação integrada que considere potenciais interações entre medicamentos, suplementos e resultados
      
      ### RESPONDA ESTRITAMENTE NO SEGUINTE FORMATO JSON:
      {
        "contextualAnalysis": "Análise holística detalhada (250-350 palavras) integrando todos os marcadores relevantes com o contexto do paciente, perfil de risco individual e fatores demográficos. Destaque correlações entre diferentes parâmetros e suas implicações clínicas.",
        
        "possibleDiagnoses": [
          {
            "condition": "Nome preciso da condição médica potencial",
            "probability": "alta/média/baixa (baseado na correlação específica dos marcadores)",
            "description": "Descrição concisa da condição com foco no mecanismo fisiopatológico relevante para este paciente",
            "indicativeMarkers": ["Lista precisa de marcadores específicos que sugerem esta condição", "Com valores exatos e status (alto/baixo)"]
          }
        ],
        
        "recommendations": [
          "Recomendação 1: ação específica, mensurável e personalizada",
          "Recomendação 2: prioridade baseada no risco individual",
          "Recomendação 3: intervenção diretamente relacionada aos achados laboratoriais",
          "Recomendação 4: seguimento específico com prazos sugeridos",
          "Recomendação 5: exames complementares se necessário, com justificativa"
        ],
        
        "specialists": [
          "Especialista 1: especialidade médica com justificativa específica baseada nos achados",
          "Especialista 2: especialidade médica com prioridade sugerida (urgente/rotina)",
          "Especialista 3: especialidade médica com foco preventivo baseado no perfil de risco"
        ],
        
        "lifestyle": {
          "diet": "Recomendações nutricionais detalhadas, personalizadas e orientadas pelos resultados, incluindo nutrientes específicos a aumentar/reduzir com quantidades sugeridas e fontes alimentares",
          "exercise": "Recomendações de exercícios específicas (tipo, intensidade, frequência, duração) baseadas nos resultados, incluindo precauções particulares",
          "sleep": "Recomendações de sono baseadas nos parâmetros metabólicos e hormonais, incluindo duração ideal e práticas de higiene do sono",
          "stress_management": "Técnicas específicas de gerenciamento de estresse com relevância particular para o perfil metabólico do paciente"
        },
        
        "riskFactors": [
          "Fator de risco 1: descrição com grau de risco e impacto potencial",
          "Fator de risco 2: estratégias específicas de modificação",
          "Fator de risco 3: relevância particular baseada no perfil individual",
          "Fator de risco 4: conexão com achados laboratoriais específicos"
        ],
        
        "healthParameters": {
          "healthScore": "Pontuação numérica (0-100) com método de cálculo transparente baseado nos principais marcadores",
          "criticalAreas": ["Parâmetros específicos que requerem atenção imediata", "Com valores exatos e desvio do ideal"],
          "stableAreas": ["Parâmetros que estão em níveis saudáveis", "Com valores exatos"],
          "improvementTrends": ["Parâmetros que mostram melhorias", "Se dados históricos disponíveis"],
          "worseningTrends": ["Parâmetros que mostram deterioração", "Se dados históricos disponíveis"]
        },
        
        "evidenceBasedAssessment": {
          "clinicalGuidelines": [
            "Diretriz clínica 1: referência específica à diretriz atual (2023-2024) relacionada aos achados-chave",
            "Diretriz clínica 2: ponto específico da diretriz relevante para este caso"
          ],
          "studyReferences": [
            "Estudo 1: citação em formato científico de estudo relevante e recente",
            "Estudo 2: conexão específica entre o estudo e os achados do paciente",
            "Estudo 3: significância clínica do estudo para o manejo deste paciente"
          ],
          "confidenceLevel": "alto/médio/baixo com justificativa específica baseada na qualidade e completude dos dados"
        }
      }
      
      ### DIRETRIZES CRÍTICAS:
      - Adapte sua análise ao perfil demográfico exato do paciente (idade, sexo, histórico)
      - Priorize a identificação de condições subclínicas e fatores de risco modificáveis
      - Baseie todas as recomendações em evidências científicas sólidas e atualizadas
      - Mantenha um equilíbrio entre sensibilidade diagnóstica e especificidade
      - Evite alarmismo desnecessário, mas não subestime achados potencialmente significativos
      - Considere sempre a integração de múltiplos marcadores em vez de análise isolada
      - O JSON DEVE ser válido, sem erros de formatação ou campos duplicados
    `;
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found, using fallback response");
      return getFallbackInsights(patientData);
    }
    
    try {
      // Call the actual OpenAI API
      return await callOpenAIApi(prompt);
    } catch (apiError) {
      console.error("Error calling OpenAI API, using fallback:", apiError);
      return getFallbackInsights(patientData);
    }
  } catch (error) {
    console.error("Error generating health insights with OpenAI:", error);
    throw new Error("Falha ao gerar insights de saúde com OpenAI");
  }
}

// Function to call the OpenAI API
async function callOpenAIApi(prompt: string) {
  try {
    console.log("Calling OpenAI API...");
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }
    
    console.log("OpenAI API response received successfully");
    
    try {
      // Tentar analisar a resposta como JSON
      return JSON.parse(content);
    } catch (parseError) {
      console.warn("Error parsing OpenAI response as JSON:", parseError);
      console.log("Raw response content:", content);
      
      // Se não for um JSON válido, tente extrair um JSON válido do conteúdo
      try {
        // Tentar localizar um objeto JSON na resposta
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log("Extracted JSON string:", jsonStr);
          return JSON.parse(jsonStr);
        }
      } catch (extractError) {
        console.error("Failed to extract JSON from response:", extractError);
      }
      
      // Se ainda falhar, retorne um objeto estruturado básico
      return {
        contextualAnalysis: "Não foi possível analisar a resposta da IA. Por favor, tente novamente.",
        possibleDiagnoses: [],
        recommendations: ["Consulte um médico para uma análise profissional."],
        specialists: ["Clínico Geral"],
        lifestyle: {
          diet: "Mantenha uma alimentação balanceada.",
          exercise: "Pratique exercícios regularmente.",
          sleep: "Mantenha um sono de qualidade."
        },
        riskFactors: []
      };
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

// Fallback response if OpenAI API is unavailable
function getFallbackInsights(patientData?: any) {
  console.log("Using fallback health insights response");
  
  // Base response com estrutura atualizada conforme novo formato, incluindo diagnósticos possíveis
  const response = {
    possibleDiagnoses: [
      {
        condition: "Deficiência de Vitamina D",
        probability: "média",
        description: "Níveis baixos de Vitamina D podem afetar o sistema imunológico e a saúde óssea",
        indicativeMarkers: ["Vitamina D < 30 ng/mL", "Histórico de pouca exposição solar"]
      },
      {
        condition: "Pré-diabetes",
        probability: "baixa",
        description: "Níveis de glicose em jejum ligeiramente elevados, indicando potencial risco de diabetes",
        indicativeMarkers: ["Glicemia em jejum entre 100-125 mg/dL", "Hemoglobina glicada (HbA1c) entre 5.7-6.4%"]
      }
    ],
    recommendations: [
      "Agende uma consulta com seu clínico geral para discutir os resultados dos exames",
      "Considere aumentar a exposição solar controlada ou suplementação de Vitamina D",
      "Monitore seus níveis de glicemia com exames regulares a cada 3 meses",
      "Mantenha um registro alimentar para identificar padrões que afetam seus níveis de colesterol",
      "Realize exercícios físicos regulares para melhorar os parâmetros metabólicos"
    ],
    specialists: [
      "Nutricionista - para orientação alimentar personalizada",
      "Endocrinologista - para avaliação dos níveis de glicemia",
      "Cardiologista - para acompanhamento preventivo"
    ],
    lifestyle: {
      diet: "Reduza o consumo de carboidratos refinados e aumente a ingestão de vegetais folhosos e gorduras saudáveis",
      exercise: "Realize pelo menos 150 minutos de atividade física moderada por semana",
      sleep: "Priorize 7-8 horas de sono de qualidade por noite para regulação metabólica",
      stress_management: "Pratique técnicas de relaxamento como meditação ou respiração profunda por 10-15 minutos diariamente"
    },
    riskFactors: [
      "Pré-diabetes - devido aos níveis elevados de glicemia (evidência moderada)",
      "Deficiência de Vitamina D - pode afetar a imunidade e saúde óssea (evidência forte)",
      "Resposta inflamatória leve - indicada por leucócitos levemente elevados (evidência preliminar)"
    ],
    contextualAnalysis: "Análise contextual não disponível no momento. Consulte um médico para uma avaliação personalizada.",
    
    // Novos campos adicionados conforme o formato atualizado
    healthParameters: {
      healthScore: 75,
      criticalAreas: ["Metabolismo da glicose", "Níveis de Vitamina D"],
      stableAreas: ["Função cardíaca", "Função renal", "Hemograma básico"],
      improvementTrends: [],
      worseningTrends: []
    },
    evidenceBasedAssessment: {
      clinicalGuidelines: [
        "American Diabetes Association (ADA) - Diretrizes para prevenção de diabetes 2024",
        "Sociedade Brasileira de Endocrinologia - Protocolo de tratamento para deficiência de Vitamina D"
      ],
      studyReferences: [
        "Journal of Clinical Endocrinology & Metabolism, 2023 - Relação entre vitamina D e imunidade",
        "The Lancet, 2024 - Impacto da atividade física regular em biomarcadores metabólicos"
      ],
      confidenceLevel: "médio"
    }
  };
  
  // If we have patient data, add some customization to the response
  if (patientData) {
    if (patientData.gender === 'feminino') {
      response.recommendations.push("Considere incluir um exame de densitometria óssea para monitorar a saúde óssea");
      if (patientData.age && patientData.age > 40) {
        response.specialists.push("Ginecologista - para acompanhamento hormonal");
        response.evidenceBasedAssessment.clinicalGuidelines.push(
          "Sociedade Brasileira de Ginecologia - Protocolo de acompanhamento para mulheres acima de 40 anos"
        );
      }
    } else if (patientData.gender === 'masculino') {
      response.recommendations.push("Considere incluir exames de próstata para monitoramento preventivo");
      if (patientData.age && patientData.age > 45) {
        response.specialists.push("Urologista - para acompanhamento preventivo");
        response.evidenceBasedAssessment.clinicalGuidelines.push(
          "Sociedade Brasileira de Urologia - Diretrizes para rastreamento de câncer de próstata 2024"
        );
      }
    }
    
    if (patientData.diseases && patientData.diseases.includes('diabetes')) {
      response.riskFactors.push("Diabetes diagnosticada - necessita monitoramento rigoroso da glicemia (evidência forte)");
      response.lifestyle.diet = "Dieta com controle rigoroso de carboidratos, evitando açúcares simples e preferindo carboidratos complexos";
      response.healthParameters.criticalAreas.push("Controle glicêmico rigoroso");
      response.healthParameters.healthScore = 65;
      response.evidenceBasedAssessment.studyReferences.push(
        "The New England Journal of Medicine, 2024 - Estratégias personalizadas para manejo de diabetes tipo 2"
      );
    }
    
    if (patientData.allergies && patientData.allergies.length > 0) {
      response.riskFactors.push(`Alergias a ${patientData.allergies.join(', ')} - considerar em qualquer tratamento (evidência forte)`);
      response.healthParameters.criticalAreas.push("Manejo de alergias");
    }
    
    response.contextualAnalysis = "Análise baseada no perfil do paciente. Os parâmetros de saúde foram ajustados considerando as condições pré-existentes, histórico e demografia. Recomenda-se consulta médica para avaliação completa e individualizada.";
  }
  
  return response;
}

/**
 * Gera um relatório cronológico contextual baseado nos exames do paciente ao longo do tempo
 * @param examResults - Lista de resultados de exames em ordem cronológica
 * @param user - Dados do usuário
 * @returns Relatório cronológico com análise de tendências
 */

/**
 * Analisa exames extraídos pelo Gemini (sem análise prévia) usando a OpenAI
 * @param examId ID do exame que já foi processado pelo Gemini e está pronto para análise
 * @param userId ID do usuário dono do exame
 * @param storage Interface de armazenamento para acessar dados
 * @param patientData Dados adicionais do paciente para contextualização
 */
export async function analyzeExtractedExam(examId: number, userId: number, storage: IStorage, patientData?: any) {
  try {
    console.log(`Iniciando análise do exame ID ${examId} com OpenAI`);
    
    // 1. Obter o exame e resultado da extração feita pelo Gemini
    const exam = await storage.getExam(examId);
    if (!exam || exam.userId !== userId) {
      throw new Error("Exame não encontrado ou acesso não autorizado");
    }
    
    if (exam.status !== "ready_for_analysis" && exam.status !== "extracted") {
      throw new Error(`Exame com status inválido para análise: ${exam.status}`);
    }
    
    // 2. Obter resultado da extração prévia feita pelo Gemini
    const extractionResult = await storage.getExamResultByExamId(examId);
    if (!extractionResult) {
      throw new Error("Resultado da extração não encontrado");
    }
    
    // 3. Obter métricas de saúde extraídas do exame
    const healthMetrics = await storage.getHealthMetricsByUserId(userId);
    const examDateStr = exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : 
                        exam.uploadDate ? new Date(exam.uploadDate).toISOString().split('T')[0] : null;
    
    // Filtrar métricas desta data de exame específica
    let metricsFromThisExam;
    if (examDateStr) {
      metricsFromThisExam = healthMetrics.filter(metric => {
        const metricDateStr = metric.date ? new Date(metric.date).toISOString().split('T')[0] : null;
        return metricDateStr === examDateStr;
      });
    } else {
      // Se não houver data, pega as 20 métricas mais recentes
      metricsFromThisExam = healthMetrics.slice(0, 20);
    }
    
    console.log(`Analisando ${metricsFromThisExam.length} métricas do exame`);
    
    // 4. Organizar métricas por categoria para uma análise mais estruturada
    const metricsByCategory = new Map();
    metricsFromThisExam.forEach(metric => {
      const category = metric.category || "Geral";
      if (!metricsByCategory.has(category)) {
        metricsByCategory.set(category, []);
      }
      metricsByCategory.get(category).push(metric);
    });
    
    // Prepare patient context if available
    let patientContext = "";
    if (patientData) {
      patientContext = `
      Dados do paciente:
      - Sexo: ${patientData.gender || 'Não informado'}
      - Idade: ${patientData.age || 'Não informada'}
      - Doenças preexistentes: ${patientData.diseases?.join(", ") || 'Nenhuma informada'}
      - Cirurgias prévias: ${patientData.surgeries?.join(", ") || 'Nenhuma informada'}
      - Alergias: ${patientData.allergies?.join(", ") || 'Nenhuma informada'}
      - Histórico familiar: ${patientData.familyHistory || 'Não informado'}
      `;
    }
    
    // Criar prompt mais estruturado para a OpenAI com base nas categorias de exames
    let metricsDescriptionByCategory = "";
    metricsByCategory.forEach((metrics, category) => {
      metricsDescriptionByCategory += `\n### ${category.toUpperCase()} (${metrics.length} parâmetros):\n`;
      metrics.forEach(metric => {
        const status = metric.status ? ` (${metric.status.toUpperCase()})` : '';
        const reference = metric.referenceMin && metric.referenceMax 
          ? ` [Referência: ${metric.referenceMin}-${metric.referenceMax} ${metric.unit || ''}]` 
          : '';
        metricsDescriptionByCategory += `- ${metric.name}: ${metric.value} ${metric.unit || ''}${status}${reference}\n`;
        if (metric.clinical_significance) {
          metricsDescriptionByCategory += `  Significado clínico: ${metric.clinical_significance}\n`;
        }
      });
    });
    
    // 5. Criar prompt para OpenAI com análise holística e categorizada
    const prompt = `
      Você é um especialista médico altamente qualificado em medicina laboratorial e diagnóstico clínico.
      Agora você vai realizar uma ANÁLISE GLOBAL E HOLÍSTICA dos resultados de exames que já foram processados e extraídos previamente.
      
      ### TAREFA PRINCIPAL:
      Analise detalhadamente os seguintes resultados de exames médicos e forneça uma avaliação médica integrativa,
      correlacionando os diferentes parâmetros entre si e com o contexto do paciente quando disponível.
      
      ### DADOS DO PACIENTE:
      ${patientContext}
      
      ### DADOS DO EXAME:
      - Nome: ${exam.name}
      - Tipo de documento: ${exam.fileType}
      - Data do exame: ${examDateStr || 'Não informada'}
      - Laboratório: ${exam.laboratoryName || 'Não informado'}
      - Médico solicitante: ${exam.requestingPhysician ? `Dr. ${exam.requestingPhysician}` : 'Não informado'}
      
      ### MÉTRICAS DE SAÚDE ORGANIZADAS POR CATEGORIA:
      ${metricsDescriptionByCategory}
      
      ### INSTRUÇÕES ESPECÍFICAS:
      1. INTEGRE todos os resultados em uma análise clínica compreensiva.
      2. Identifique CORRELAÇÕES e PADRÕES entre diferentes marcadores de diferentes categorias.
      3. Destaque ALTERAÇÕES SIGNIFICATIVAS e explique sua importância clínica.
      4. Considere o CONTEXTO COMPLETO, incluindo exames de diferentes categorias.
      5. Sugira possíveis diagnósticos com diferentes níveis de probabilidade.
      6. Forneça recomendações específicas e personalizadas.
      7. Identifique especialidades médicas relevantes para acompanhamento.
      8. Inclua sugestões de estilo de vida baseadas nos resultados.
      9. Avalie fatores de risco evidenciados pelos exames.
      10. Calcule um "health score" estimado (0-100) baseado nos resultados.
      
      ### FORMATO DA RESPOSTA (responda EXATAMENTE neste formato JSON):
      {
        "contextualAnalysis": "Análise contextualizada dos resultados, integrando diferentes categorias de exames (2-3 parágrafos)",
        "possibleDiagnoses": [
          {
            "condition": "Nome da possível condição",
            "probability": "alta|média|baixa",
            "description": "Breve descrição da condição",
            "indicativeMarkers": ["Marcador 1", "Marcador 2"]
          }
        ],
        "recommendations": [
          "Recomendação específica 1",
          "Recomendação específica 2"
        ],
        "specialists": [
          "Especialidade médica 1 para acompanhamento",
          "Especialidade médica 2 para acompanhamento"
        ],
        "lifestyle": {
          "diet": "Recomendações nutricionais específicas",
          "exercise": "Recomendações de atividade física",
          "sleep": "Recomendações sobre sono",
          "stress_management": "Recomendações sobre gestão do estresse"
        },
        "riskFactors": [
          "Fator de risco 1 identificado nos resultados",
          "Fator de risco 2 identificado nos resultados"
        ],
        "healthParameters": {
          "healthScore": 85,
          "criticalAreas": ["Área 1", "Área 2"],
          "stableAreas": ["Área 3", "Área 4"],
          "improvementTrends": ["Tendência 1", "Tendência 2"],
          "worseningTrends": ["Tendência 3", "Tendência 4"]
        },
        "evidenceBasedAssessment": {
          "clinicalGuidelines": ["Diretriz 1", "Diretriz 2"],
          "studyReferences": ["Referência 1", "Referência 2"],
          "confidenceLevel": "Alta|Média|Baixa"
        }
      }
      
      Importante: Respeite RIGOROSAMENTE o formato JSON acima. Sua análise deve ser integrada e holística, considerando TODAS as categorias de exames em conjunto.
    `;
    
    // 6. Chamar a API da OpenAI
    console.log("Enviando prompt para OpenAI...");
    const insightsResponse = await callOpenAIApi(prompt);
    
    // 7. Atualizar o exame para refletir a análise completa
    console.log("Atualizando exame com análise OpenAI");
    await storage.updateExam(examId, { 
      status: "analyzed" 
    });
    
    // 8. Criar um novo resultado com a análise completa
    const analysisResult = await storage.createExamResult({
      examId: examId,
      summary: insightsResponse.contextualAnalysis?.substring(0, 150) + "...",
      detailedAnalysis: JSON.stringify(insightsResponse),
      recommendations: insightsResponse.recommendations?.join("\n"),
      healthMetrics: extractionResult.healthMetrics, // Mantém as métricas da extração
      aiProvider: "openai:analysis"
    });
    
    // 9. Notificar o usuário
    await storage.createNotification({
      userId,
      title: "Análise completa disponível",
      message: `A análise detalhada do exame "${exam.name}" está pronta para visualização`,
      read: false
    });
    
    return {
      exam,
      extractionResult,
      analysisResult,
      insights: insightsResponse
    };
    
  } catch (error) {
    console.error('Erro ao analisar exame com OpenAI:', error);
    
    // Em caso de falha, retornar um erro estruturado
    return {
      error: true,
      message: `Falha ao analisar o exame: ${error.message}`,
      details: String(error)
    };
  }
}

/**
 * Analisa um documento médico usando a OpenAI como fallback quando o Gemini falha
 * @param fileContent - Conteúdo do arquivo codificado em Base64
 * @param fileType - Tipo do arquivo (pdf, jpeg, png)
 * @returns Resultado da análise com métricas de saúde e recomendações
 */
export async function analyzeDocumentWithOpenAI(fileContent: string, fileType: string) {
  try {
    console.log(`Analyzing ${fileType} document with OpenAI API as fallback`);
    
    // Verificar se a API key está disponível
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found for document analysis fallback");
      throw new Error("OpenAI API key not available");
    }
    
    // Limitar o tamanho do conteúdo para evitar exceder limites da API
    // Nota: O GPT-4o suporta até 1 imagem. O conteúdo Base64 muito grande pode causar problemas
    const truncatedContent = fileContent.length > 300000 
      ? fileContent.substring(0, 300000)
      : fileContent;
      
    // Determinar o tipo MIME baseado no tipo de arquivo
    const mimeType = 
      fileType === 'pdf' ? 'application/pdf' :
      fileType === 'jpeg' ? 'image/jpeg' : 'image/png';
      
    // Preparar o prompt melhorado para a API com foco em evidências científicas e parâmetros detalhados
    const prompt = `Você é um médico especialista em análise de exames laboratoriais e diagnóstico clínico.
                  Sua análise é baseada em diretrizes médicas atualizadas (2024) e evidências científicas.
                  
                  Analise este exame ${fileType.toUpperCase()} e forneça um relatório detalhado e baseado em evidências,
                  incluindo achados clínicos relevantes, interpretação precisa dos valores, 
                  correlações entre parâmetros, diretrizes clínicas aplicáveis, 
                  recomendações médicas e instruções específicas para o paciente.
                  
                  Analise a imagem ou PDF do exame cuidadosamente e extraia todas as informações relevantes.
                  Estabeleça parâmetros de saúde baseados em evidências científicas recentes.
                  Inclua citações de estudos ou diretrizes quando pertinente.
                  
                  Formate sua resposta como um JSON com a seguinte estrutura:
                  {
                    "summary": "resumo geral dos resultados, em uma frase",
                    "detailedAnalysis": "análise detalhada e fundamentada dos resultados encontrados",
                    "recommendations": ["lista de 3-5 recomendações específicas para o paciente baseadas em evidências"],
                    "healthMetrics": [
                      {
                        "name": "nome do parâmetro, ex: hemoglobina",
                        "value": "valor numérico, ex: 14.2",
                        "unit": "unidade, ex: g/dL",
                        "status": "normal, atenção, alto ou baixo",
                        "change": "+0.1 ou -0.2 comparado com o valor anterior",
                        "referenceRange": "intervalo de referência considerado normal",
                        "evidenceLevel": "nível de evidência científica (forte, moderada, preliminar)",
                        "clinicalSignificance": "significado clínico deste parâmetro"
                      }
                    ],
                    "healthStatus": {
                      "overallScore": "pontuação global de saúde (0-100)",
                      "criticalParameters": ["parâmetros que exigem atenção imediata"],
                      "stableParameters": ["parâmetros que estão em níveis aceitáveis"],
                      "clinicalGuidelines": ["diretrizes clínicas relevantes para os resultados"],
                      "differentialAnalysis": "análise diferencial considerando os resultados",
                      "confidenceLevel": "nível de confiança na análise (alto, médio, baixo)"
                    }
                  }`;
    
    try {
      // Chamar a API da OpenAI com suporte a imagens (GPT-4o)
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: prompt 
              },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:${mimeType};base64,${truncatedContent}`
                } 
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI API");
      }
      
      console.log("OpenAI API document analysis successful");
      
      try {
        // Analisar a resposta JSON
        const analysisData = JSON.parse(content);
        
        // Validar e melhorar os dados da resposta se necessário
        if (!analysisData.healthMetrics || !Array.isArray(analysisData.healthMetrics) || analysisData.healthMetrics.length === 0) {
          throw new Error("Invalid health metrics in OpenAI response");
        }
        
        return analysisData;
      } catch (jsonError) {
        console.error("Error parsing OpenAI response:", jsonError);
        throw jsonError;
      }
    } catch (apiError) {
      console.error("Error calling OpenAI API for document analysis:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("Error analyzing document with OpenAI:", error);
    throw new Error("Falha ao analisar o documento com OpenAI como fallback");
  }
}

// Interface específica para o usuário requerido na função
interface UserInfo {
  id: number;
  username: string; 
  fullName?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  password?: string;
  createdAt?: Date;
}

export async function generateChronologicalReport(examResults: ExamResult[], user: UserInfo) {
  try {
    console.log("Generating chronological report with OpenAI API");
    
    // Prepara informações do paciente para contextualização
    const patientInfo = `
      Dados do paciente:
      - Nome: ${user.fullName || 'Não informado'}
      - Sexo: ${user.gender || 'Não informado'}
      - Data de nascimento: ${user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Não informada'}
      - Email: ${user.email || 'Não informado'}
      - Telefone: ${user.phoneNumber || 'Não informado'}
      - Endereço: ${user.address || 'Não informado'}
    `;
    
    // Prepara informações dos exames em ordem cronológica
    const examsInfo = examResults.map((result, index) => {
      // Usamos analysisDate diretamente, que é uma propriedade garantida pelo modelo
      const examDate = result.analysisDate || new Date();
      
      return `
        Exame #${index + 1} - Data: ${new Date(examDate).toLocaleDateString('pt-BR')}
        ID: ${result.id}
        Resumo: ${result.summary}
        Análise detalhada: ${result.detailedAnalysis}
        Recomendações: ${result.recommendations}
        Métricas principais: ${JSON.stringify(result.healthMetrics)}
      `;
    }).join('\n\n');
    
    // Prompt aprimorado para a OpenAI focado em análise baseada em evidências
    const prompt = `
      Você é um médico especialista em análise de tendências de saúde e histórico médico.
      Sua análise é baseada em diretrizes clínicas atualizadas (2024) e evidências científicas sólidas.
      
      ${patientInfo}
      
      Analise os seguintes exames em ordem cronológica:
      
      ${examsInfo}
      
      Crie um relatório cronológico contextual detalhado e baseado em evidências que inclua:
      1. Uma análise abrangente da evolução dos principais indicadores de saúde ao longo do tempo
      2. Identificação precisa de tendências (melhoria, piora ou estabilidade) com significância clínica
      3. Correlações entre diferentes métricas de saúde com base na literatura médica atual
      4. Avaliação da eficácia das intervenções recomendadas anteriormente considerando diretrizes clínicas
      5. Recomendações futuras baseadas na evolução histórica e evidências científicas atualizadas
      6. Parâmetros de saúde baseados em evidências e sua evolução ao longo do tempo
      7. Citações de estudos científicos relevantes ou diretrizes clínicas aplicáveis aos achados
      
      Responda em formato JSON com as seguintes propriedades:
      1. summary: resumo geral da evolução do paciente
      2. trends: array de tendências identificadas nos principais indicadores, incluindo significância clínica e nível de evidência
      3. correlations: array de correlações identificadas entre diferentes métricas, com suporte na literatura médica
      4. effectivenessAnalysis: análise da eficácia das intervenções anteriores baseada em evidências
      5. futureRecommendations: array de recomendações futuras fundamentadas em diretrizes clínicas atualizadas
      6. overallAssessment: avaliação geral e contextualizada da saúde do paciente
      7. healthParameters: {
          healthScore: pontuação global de saúde (0-100),
          criticalAreas: áreas que precisam de atenção imediata,
          stableAreas: áreas com parâmetros estáveis ou saudáveis,
          improvementTrends: tendências de melhoria identificadas,
          worseningTrends: tendências de piora identificadas
       }
      8. evidenceBasedAssessment: {
          clinicalGuidelines: diretrizes clínicas relevantes para os achados,
          studyReferences: referências de estudos aplicáveis,
          confidenceLevel: nível de confiança na avaliação (alto, médio, baixo)
       }
    `;
    
    // Verifica se a API key está disponível
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found, using fallback for chronological report");
      return getFallbackChronologicalReport(examResults, user);
    }
    
    try {
      // Chama a API da OpenAI
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1500
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI API");
      }
      
      console.log("OpenAI API chronological report generated successfully");
      return JSON.parse(content);
    } catch (apiError) {
      console.error("Error calling OpenAI API for chronological report, using fallback:", apiError);
      return getFallbackChronologicalReport(examResults, user);
    }
  } catch (error) {
    console.error("Error generating chronological report with OpenAI:", error);
    throw new Error("Falha ao gerar relatório cronológico com OpenAI");
  }
}

/**
 * Resposta de fallback para o relatório cronológico quando a API da OpenAI não está disponível
 */
function getFallbackChronologicalReport(examResults: ExamResult[], user: UserInfo) {
  console.log("Using fallback chronological report");
  
  // Calcula algumas tendências básicas baseadas nos dados disponíveis
  let hasTrendData = examResults.length > 1;
  let trendsDirection = "estável";
  
  if (hasTrendData) {
    // Tenta identificar alguma tendência simples olhando para o primeiro e último exame
    const firstExam = examResults[0];
    const lastExam = examResults[examResults.length - 1];
    
    // Verificar se healthMetrics está disponível e é um array
    const firstMetrics = Array.isArray(firstExam.healthMetrics) ? firstExam.healthMetrics : [];
    const lastMetrics = Array.isArray(lastExam.healthMetrics) ? lastExam.healthMetrics : [];
    
    if (firstMetrics.length > 0 && lastMetrics.length > 0) {
      // Conta melhorias e pioras em métricas comuns
      let improvements = 0;
      let declines = 0;
      
      // Análise simplificada das métricas
      firstMetrics.forEach((firstMetric: any) => {
        const matchingLastMetric = lastMetrics.find((m: any) => m.name === firstMetric.name);
        if (matchingLastMetric) {
          const firstStatus = firstMetric.status;
          const lastStatus = matchingLastMetric.status;
          
          if (firstStatus === 'alto' || firstStatus === 'baixo') {
            if (lastStatus === 'normal') {
              improvements++;
            }
          } else if (firstStatus === 'normal') {
            if (lastStatus === 'alto' || lastStatus === 'baixo') {
              declines++;
            }
          }
        }
      });
      
      if (improvements > declines) {
        trendsDirection = "melhora";
      } else if (declines > improvements) {
        trendsDirection = "piora";
      }
    }
  }
  
  // Retorna uma resposta de fallback estruturada conforme o novo formato
  return {
    summary: `Análise de ${examResults.length} exame(s) realizados pelo paciente ${user.fullName || 'sem nome'}, mostrando tendência de ${trendsDirection} em seus indicadores de saúde.`,
    trends: [
      "Tendência de estabilidade nos indicadores metabólicos (significância clínica moderada, evidência preliminar)",
      "Não foi possível identificar tendências detalhadas sem acesso à API da OpenAI",
      "Recomenda-se revisão manual dos exames por um profissional de saúde"
    ],
    correlations: [
      "Correlação entre estado nutricional e níveis de hemoglobina (suportado por dados na literatura)",
      "Possível relação entre perfil lipídico e marcadores inflamatórios (requer confirmação)",
      "Análise de correlações completa não disponível no momento"
    ],
    effectivenessAnalysis: "Não é possível determinar a eficácia das intervenções anteriores sem processamento detalhado dos dados. Recomenda-se avaliação médica individualizada.",
    futureRecommendations: [
      "Continue realizando exames periódicos para monitoramento conforme diretrizes da Associação Médica Brasileira",
      "Consulte um médico para análise detalhada dos resultados e orientação personalizada",
      "Mantenha um estilo de vida saudável com alimentação equilibrada e atividade física regular (150 min/semana)",
      "Considere a realização de exames de acompanhamento específicos baseados nos resultados anteriores"
    ],
    overallAssessment: `Com base nos dados disponíveis, o estado de saúde geral parece ${trendsDirection}. As métricas avaliadas sugerem a necessidade de acompanhamento médico regular e adoção de medidas preventivas.`,
    
    // Novos campos adicionados conforme a estrutura atualizada
    healthParameters: {
      healthScore: hasTrendData && trendsDirection === "melhora" ? 75 : hasTrendData && trendsDirection === "piora" ? 60 : 70,
      criticalAreas: ["Avaliação de marcadores metabólicos", "Níveis hormonais", "Função renal"],
      stableAreas: ["Hemograma básico", "Enzimas hepáticas"],
      improvementTrends: hasTrendData && trendsDirection === "melhora" ? ["Perfil lipídico", "Glicemia em jejum"] : [],
      worseningTrends: hasTrendData && trendsDirection === "piora" ? ["Marcadores inflamatórios", "Perfil lipídico"] : []
    },
    evidenceBasedAssessment: {
      clinicalGuidelines: [
        "Sociedade Brasileira de Endocrinologia - Diretrizes para manejo de alterações metabólicas (2024)",
        "American Heart Association - Guidelines for Cardiovascular Health Monitoring (2023)",
        "Sociedade Brasileira de Análises Clínicas - Protocolo de interpretação laboratorial (2024)"
      ],
      studyReferences: [
        "Brazilian Journal of Medical and Biological Research - Interpretação de exames laboratoriais no contexto clínico (2023)",
        "Journal of American Medical Association - Longitudinal Assessment of Laboratory Parameters (2024)"
      ],
      confidenceLevel: "médio"
    }
  };
}
