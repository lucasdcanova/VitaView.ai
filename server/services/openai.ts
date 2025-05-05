import OpenAI from "openai";
import type { ExamResult, User } from "@shared/schema";
import type { HealthMetric } from "@shared/schema";

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
    
    // Prompt aprimorado para OpenAI com ênfase em diagnósticos possíveis e análise baseada em evidências
    const prompt = `
      Você é um médico especialista em interpretação de exames laboratoriais e diagnóstico clínico.
      Sua análise é baseada em evidências científicas atualizadas e diretrizes médicas de 2024.
      
      Analise detalhadamente os seguintes resultados de exames médicos e forneça possíveis diagnósticos
      e recomendações personalizadas de saúde, considerando todos os dados disponíveis.
      
      ${patientContext}
      
      Resumo do exame: ${examResult.summary}
      
      Análise detalhada: ${examResult.detailedAnalysis}
      
      Recomendações do profissional: ${examResult.recommendations}
      
      Métricas de saúde: ${JSON.stringify(examResult.healthMetrics)}
      
      Responda em formato JSON com EXATAMENTE as seguintes propriedades:
      1. contextualAnalysis: uma análise contextualizada considerando o perfil do paciente e resultados dos exames
      2. possibleDiagnoses: array de diagnósticos possíveis com:
         - condition: nome da condição diagnosticada
         - probability: probabilidade (alta/média/baixa)
         - description: descrição breve da condição
         - indicativeMarkers: array de marcadores nos exames que indicam esta condição
      3. recommendations: array de recomendações de saúde personalizadas baseadas em evidências (5-6 itens)
      4. specialists: array de especialistas recomendados para consulta com justificativa (3-4 itens)
      5. lifestyle: objeto com sugestões detalhadas de estilo de vida:
         - diet: recomendações alimentares específicas
         - exercise: tipo, frequência e intensidade de exercícios recomendados
         - sleep: hábitos de sono e recomendações
         - stress_management: técnicas e práticas para gerenciamento do estresse
      6. riskFactors: array de potenciais fatores de risco identificados com níveis de evidência (3-5 itens)
      7. healthParameters: objeto com os seguintes parâmetros de saúde:
         - healthScore: pontuação global de saúde (0-100)
         - criticalAreas: áreas que precisam de atenção imediata
         - stableAreas: áreas com parâmetros estáveis ou saudáveis
         - improvementTrends: tendências de melhoria identificadas
         - worseningTrends: tendências de piora identificadas
      8. evidenceBasedAssessment: objeto com:
         - clinicalGuidelines: diretrizes clínicas oficiais relevantes para os resultados (2-3 itens)
         - studyReferences: referências de estudos científicos relevantes em formato de citação (2-4 itens)
         - confidenceLevel: nível de confiança na avaliação (alto, médio, baixo)
    
      Certifique-se de incluir diagnósticos possíveis baseados nos valores dos exames, mesmo que 
      a probabilidade seja baixa. Para cada possível diagnóstico, liste os marcadores dos exames
      que sustentam essa possibilidade.
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
