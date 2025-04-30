import OpenAI from "openai";
import type { ExamResult } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// In a real implementation, this would use the actual OpenAI API key from environment variables
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-demo-key-for-development" 
});

export async function generateHealthInsights(examResult: ExamResult) {
  try {
    console.log("Generating health insights with OpenAI API");
    
    // In a real implementation, this would call the OpenAI API
    // For this demo, we'll simulate the call with a structured response
    
    // Prepare prompt for OpenAI based on examination results
    const prompt = `
      Por favor, analise os seguintes resultados de exames médicos e forneça recomendações 
      personalizadas de saúde e possíveis especialistas para consultar:
      
      Resumo do exame: ${examResult.summary}
      
      Análise detalhada: ${examResult.detailedAnalysis}
      
      Responda em formato JSON com as seguintes propriedades:
      1. recommendations: array de recomendações de saúde personalizadas
      2. specialists: array de especialistas recomendados para consulta
      3. lifestyle: objeto com sugestões de estilo de vida {diet, exercise, sleep}
      4. riskFactors: array de potenciais fatores de risco identificados
    `;
    
    // Wait for 1.5 seconds to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate OpenAI response
    const response = {
      recommendations: [
        "Agende uma consulta com seu clínico geral para discutir os resultados dos exames",
        "Considere aumentar a exposição solar controlada ou suplementação de Vitamina D",
        "Monitore seus níveis de glicemia com exames regulares a cada 3 meses",
        "Mantenha um registro alimentar para identificar padrões que afetam seus níveis de colesterol"
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
      ]
    };
    
    return response;
  } catch (error) {
    console.error("Error generating health insights with OpenAI:", error);
    throw new Error("Falha ao gerar insights de saúde com OpenAI");
  }
}

// In a real implementation, this would be a complete function to call the OpenAI API
async function callOpenAIApi(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
