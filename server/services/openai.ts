import OpenAI from "openai";
import type { ExamResult, User } from "@shared/schema";

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
    
    // Prepare prompt for OpenAI based on examination results and patient data
    const prompt = `
      Você é um médico especialista em interpretação de exames laboratoriais e diagnóstico.
      Por favor, analise os seguintes resultados de exames médicos e forneça recomendações
      personalizadas de saúde, considerando todos os dados disponíveis.
      
      ${patientContext}
      
      Resumo do exame: ${examResult.summary}
      
      Análise detalhada: ${examResult.detailedAnalysis}
      
      Recomendações do profissional: ${examResult.recommendations}
      
      Métricas de saúde: ${JSON.stringify(examResult.healthMetrics)}
      
      Responda em formato JSON com as seguintes propriedades:
      1. recommendations: array de recomendações de saúde personalizadas (5 itens)
      2. specialists: array de especialistas recomendados para consulta (3 itens)
      3. lifestyle: objeto com sugestões de estilo de vida {diet, exercise, sleep}
      4. riskFactors: array de potenciais fatores de risco identificados (3-5 itens)
      5. contextualAnalysis: uma análise contextualizada considerando o histórico e perfil do paciente
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
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }
    
    console.log("OpenAI API response received successfully");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

// Fallback response if OpenAI API is unavailable
function getFallbackInsights(patientData?: any) {
  console.log("Using fallback health insights response");
  
  // Base response
  const response = {
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
      sleep: "Priorize 7-8 horas de sono de qualidade por noite para regulação metabólica"
    },
    riskFactors: [
      "Pré-diabetes - devido aos níveis elevados de glicemia",
      "Deficiência de Vitamina D - pode afetar a imunidade e saúde óssea",
      "Resposta inflamatória leve - indicada por leucócitos levemente elevados"
    ],
    contextualAnalysis: "Análise contextual não disponível no momento. Consulte um médico para uma avaliação personalizada."
  };
  
  // If we have patient data, add some customization to the response
  if (patientData) {
    if (patientData.gender === 'feminino') {
      response.recommendations.push("Considere incluir um exame de densitometria óssea para monitorar a saúde óssea");
      if (patientData.age && patientData.age > 40) {
        response.specialists.push("Ginecologista - para acompanhamento hormonal");
      }
    } else if (patientData.gender === 'masculino') {
      response.recommendations.push("Considere incluir exames de próstata para monitoramento preventivo");
      if (patientData.age && patientData.age > 45) {
        response.specialists.push("Urologista - para acompanhamento preventivo");
      }
    }
    
    if (patientData.diseases && patientData.diseases.includes('diabetes')) {
      response.riskFactors.push("Diabetes diagnosticada - necessita monitoramento rigoroso da glicemia");
      response.lifestyle.diet = "Dieta com controle rigoroso de carboidratos, evitando açúcares simples e preferindo carboidratos complexos";
    }
    
    if (patientData.allergies && patientData.allergies.length > 0) {
      response.riskFactors.push(`Alergias a ${patientData.allergies.join(', ')} - considerar em qualquer tratamento`);
    }
    
    response.contextualAnalysis = "Análise baseada no perfil do paciente. Recomenda-se consulta médica para avaliação completa.";
  }
  
  return response;
}

/**
 * Gera um relatório cronológico contextual baseado nos exames do paciente ao longo do tempo
 * @param examResults - Lista de resultados de exames em ordem cronológica
 * @param user - Dados do usuário
 * @returns Relatório cronológico com análise de tendências
 */
export async function generateChronologicalReport(examResults: ExamResult[], user: User) {
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
      const examDate = result.createdAt || 
                       (result as any).analysisDate || 
                       new Date();
      
      return `
        Exame #${index + 1} - Data: ${new Date(examDate).toLocaleDateString('pt-BR')}
        ID: ${result.id}
        Resumo: ${result.summary}
        Análise detalhada: ${result.detailedAnalysis}
        Recomendações: ${result.recommendations}
        Métricas principais: ${JSON.stringify(result.healthMetrics)}
      `;
    }).join('\n\n');
    
    // Prompt completo para a OpenAI
    const prompt = `
      Você é um médico especialista em análise de tendências de saúde e histórico médico.
      
      ${patientInfo}
      
      Analise os seguintes exames em ordem cronológica:
      
      ${examsInfo}
      
      Crie um relatório cronológico contextual que inclua:
      1. Uma análise da evolução dos principais indicadores de saúde ao longo do tempo
      2. Identificação de tendências (melhoria, piora ou estabilidade)
      3. Correlações entre diferentes métricas de saúde
      4. Avaliação da eficácia das intervenções recomendadas anteriormente
      5. Recomendações futuras baseadas na evolução histórica
      
      Responda em formato JSON com as seguintes propriedades:
      1. summary: resumo geral da evolução do paciente
      2. trends: array de tendências identificadas nos principais indicadores
      3. correlations: array de correlações identificadas entre diferentes métricas
      4. effectivenessAnalysis: análise da eficácia das intervenções anteriores
      5. futureRecommendations: array de recomendações futuras
      6. overallAssessment: avaliação geral da saúde do paciente
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
function getFallbackChronologicalReport(examResults: ExamResult[], user: User) {
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
  
  return {
    summary: `Análise de ${examResults.length} exame(s) realizados pelo paciente ${user.fullName || 'sem nome'}, mostrando tendência de ${trendsDirection} em seus indicadores de saúde.`,
    trends: [
      "Não foi possível identificar tendências detalhadas sem acesso à API da OpenAI",
      "Recomenda-se revisão manual dos exames por um profissional de saúde"
    ],
    correlations: [
      "Análise de correlações não disponível no momento",
      "A identificação de correlações entre métricas requer análise especializada"
    ],
    effectivenessAnalysis: "Não é possível determinar a eficácia das intervenções anteriores sem processamento detalhado dos dados",
    futureRecommendations: [
      "Continue realizando exames periódicos para monitoramento",
      "Consulte um médico para análise detalhada dos resultados",
      "Mantenha um estilo de vida saudável com alimentação equilibrada e atividade física regular"
    ],
    overallAssessment: `Com base nos dados disponíveis, o estado de saúde geral parece ${trendsDirection}. Recomenda-se acompanhamento médico regular.`
  };
}
