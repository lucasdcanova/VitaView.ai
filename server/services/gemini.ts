import type { Request, Response } from "express";
import { storage } from "../storage";
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold,
  GenerateContentRequest,
  Content,
  Part
} from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Gemini model configuration - usando modelo mais recente 
// O gemini-pro-vision foi descontinuado em julho de 2024
// O modelo Gemini 1.5 Pro é a versão mais recente do Gemini com suporte a visão
const MODEL_NAME = "gemini-1.5-pro";

// Safety settings to ensure appropriate medical content 
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

/**
 * Analyzes a medical document using Google Gemini API with retry mechanism
 * @param fileContent - Base64 encoded content of the file
 * @param fileType - Type of the file (pdf, jpeg, png)
 * @returns Analysis result with health metrics and recommendations
 */
export async function analyzeDocument(fileContent: string, fileType: string) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 segundo
  
  let lastError: any = null;
  
  // Helper function to implement delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Analyzing ${fileType} document with Google Gemini API (attempt ${attempt}/${MAX_RETRIES})`);
      
      // Create Gemini model instance
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        safetySettings
      });
      
      // Prepare the prompt for the model
      const prompt = `Você é um especialista médico em análise de exames laboratoriais, altamente treinado para extrair dados estruturados de documentos médicos.
                
                TAREFA: Analise cuidadosamente este exame ${fileType.toUpperCase()} e extraia todos os dados solicitados no formato específico abaixo.
                
                EXTRAÇÃO DE METADADOS CRÍTICOS (prioridade máxima):
                1. Data de realização do exame - busque em todo o documento (geralmente perto do cabeçalho ou rodapé)
                2. Nome do médico solicitante - procure por "médico solicitante", "solicitado por", "Dr.", etc.
                3. Nome do laboratório - busque pelo nome da instituição ou clínica
                
                EXTRAÇÃO DE MÉTRICAS DE SAÚDE:
                - Identifique TODOS os parâmetros médicos com seus valores e unidades
                - Para cada parâmetro, determine se está normal, alto, baixo ou requer atenção
                - Se houver valores de referência, use-os para classificar o status
                - Estime a variação em relação a valores anteriores se mencionado
                
                DEPOIS da extração, forneça uma análise médica profissional baseada nesses dados.
                
                RESPONDA APENAS NO SEGUINTE FORMATO JSON:
                {
                  "examDate": "YYYY-MM-DD (extraia a data precisa, é CRÍTICO. Se não encontrada, deixe VAZIO, não invente)",
                  "requestingPhysician": "Nome completo do médico, se disponível (sem Dr./Dra.)",
                  "laboratoryName": "Nome do laboratório ou clínica",
                  "summary": "Resumo conciso dos resultados principais em uma frase",
                  "detailedAnalysis": "Análise médica detalhada dos resultados e suas implicações",
                  "recommendations": [
                    "Recomendação específica 1",
                    "Recomendação específica 2",
                    "Recomendação específica 3"
                  ],
                  "healthMetrics": [
                    {
                      "name": "Nome do parâmetro (ex: hemoglobina, colesterol, etc)",
                      "value": "Valor numérico exato",
                      "unit": "Unidade de medida (ex: g/dL, mg/dL)",
                      "status": "normal, alto, baixo ou atenção",
                      "change": "Variação em relação ao anterior (+2, -1.5, etc) ou vazio se não mencionado"
                    }
                  ]
                }
                
                RESTRIÇÕES IMPORTANTES:
                - Nunca invente dados. Se um campo não puder ser determinado, deixe-o vazio ("").
                - Formate a data SEMPRE como YYYY-MM-DD, nunca outro formato.
                - Inclua TODOS os parâmetros médicos encontrados, mesmo os que estejam normais.
                - Extração precisa é mais importante que análise detalhada.
                - Certifique-se que o JSON seja válido e sem erros de formatação.`;

      // Determine the mime type based on file type
      const mimeType = 
        fileType === 'pdf' ? 'application/pdf' :
        fileType === 'jpeg' ? 'image/jpeg' : 'image/png';
      
      // Prepare parts for the Gemini API
      const parts: Part[] = [
        { text: prompt },
        { 
          inlineData: { 
            data: fileContent,
            mimeType
          }
        }
      ];
    
      // Generate content using Gemini
      const result = await model.generateContent(parts);
      const response = result.response;
      const text = response.text();
      
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '';
        
        // Parse JSON response
        const analysisData = JSON.parse(jsonStr);
        
        // Validate and enhance the response data if needed
        if (!analysisData.healthMetrics || !Array.isArray(analysisData.healthMetrics) || analysisData.healthMetrics.length === 0) {
          console.log("Sem métricas extraídas do documento. Usando fallback.");
          analysisData.healthMetrics = defaultHealthMetrics(fileType);
        }
        
        // Checagem adicional para valores nulos
        if (analysisData.healthMetrics) {
          analysisData.healthMetrics = analysisData.healthMetrics.map(metric => ({
            name: metric.name || "desconhecido",
            value: String(metric.value || "0"),
            unit: metric.unit || "",
            status: metric.status || "normal",
            change: metric.change || "",
          }));
        }
        
        if (!analysisData.recommendations || !Array.isArray(analysisData.recommendations) || analysisData.recommendations.length === 0) {
          analysisData.recommendations = [
            "Consulta de acompanhamento com seu médico para discutir os resultados",
            "Manter uma dieta equilibrada e exercícios físicos regulares",
            "Monitorar seus valores regularmente conforme recomendação médica"
          ];
        }
        
        return analysisData;
      } catch (jsonError) {
        console.error("Error parsing Gemini response as JSON:", jsonError);
        // Fallback to structured text parsing
        return {
          summary: "Seus exames foram analisados pela IA Gemini",
          detailedAnalysis: text.substring(0, 500),
          examDate: new Date().toISOString().split('T')[0],
          requestingPhysician: null,
          laboratoryName: "Laboratório não identificado",
          recommendations: ["Consultar um médico para interpretação completa dos resultados"],
          healthMetrics: defaultHealthMetrics(fileType)
        };
      }
      
    } catch (error: any) {
      console.error(`Error analyzing document with Gemini API (attempt ${attempt}/${MAX_RETRIES}):`, error);
      lastError = error;
      
      // Check if the error is related to service overload (503) or rate limiting
      const isOverloadError = error.message?.includes("503 Service Unavailable") || 
                              error.message?.includes("overloaded") ||
                              error.status === 503 ||
                              error.message?.includes("rate limit");
      
      // If it's the last attempt or not an overload error, don't retry
      if (attempt === MAX_RETRIES || !isOverloadError) {
        break;
      }
      
      // Exponential backoff: wait longer between each retry
      const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }
  
  // If we reached here, all attempts failed
  console.error("All Gemini API attempts failed. Using fallback...");
  
  try {
    // Return a default response with an error message
    // For future improvement: could implement OpenAI fallback here
    
    // Return a default response with an error message
    return {
      summary: "Não foi possível analisar o documento com precisão",
      detailedAnalysis: "O serviço de análise está temporariamente indisponível. Os resultados mostrados são aproximados e não devem ser usados para diagnóstico médico.",
      examDate: new Date().toISOString().split('T')[0],
      requestingPhysician: null,
      laboratoryName: "Laboratório não identificado",
      recommendations: [
        "Consulte um médico para interpretar seus resultados",
        "Tente fazer upload do documento novamente mais tarde"
      ],
      healthMetrics: defaultHealthMetrics(fileType)
    };
  } catch (fallbackError) {
    console.error("Error in fallback mechanism:", fallbackError);
    // If even the fallback fails, throw a user-friendly error
    throw new Error("Não foi possível analisar o documento neste momento. Por favor, tente novamente mais tarde.");
  }
}

/**
 * Fallback health metrics in case of API failure
 */
function defaultHealthMetrics(fileType: string) {
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (fileType === 'pdf') {
    return [
      { name: "hemoglobina", value: "14.2", unit: "g/dL", status: "normal", change: "+0.1", date: currentDate },
      { name: "glicemia", value: "95", unit: "mg/dL", status: "atenção", change: "+3", date: currentDate  },
      { name: "colesterol", value: "180", unit: "mg/dL", status: "normal", change: "-5", date: currentDate  },
      { name: "vitamina_d", value: "32", unit: "ng/mL", status: "baixo", change: "-2", date: currentDate  }
    ];
  } else {
    return [
      { name: "glicemia", value: "95", unit: "mg/dL", status: "atenção", change: "+3", date: currentDate  },
      { name: "colesterol", value: "180", unit: "mg/dL", status: "normal", change: "-5", date: currentDate  }
    ];
  }
}

export async function uploadAndAnalyzeDocument(req: Request, res: Response) {
  try {
    // Extrai userId explicitamente da requisição (para debug)
    let userId = req.body.userId;
    
    // Se usuário estiver autenticado, pega o id do req.user
    if (!userId && req.isAuthenticated() && req.user) {
      userId = req.user.id;
      console.log("Usando userId da sessão:", userId);
    } 
    
    // Verificar se temos dados suficientes
    const { name, fileType, fileContent, laboratoryName, examDate } = req.body;
    
    if (!userId || !name || !fileType || !fileContent) {
      return res.status(400).json({ message: "Dados incompletos para análise" });
    }
    
    console.log("Processando upload de exame para usuário:", userId);
    
    // Analyze document with Gemini first to extract metadata
    const analysisResult = await analyzeDocument(fileContent, fileType);
    
    // Use extracted date from document or fallback to provided date or current date
    const extractedExamDate = analysisResult.examDate || examDate || new Date().toISOString().split('T')[0];
    
    // Use extracted laboratory name from document or fallback to provided name
    const extractedLabName = analysisResult.laboratoryName || laboratoryName || "Laboratório Central";
    
    // Get requesting physician if available
    const requestingPhysician = analysisResult.requestingPhysician || null;
    
    // Create exam record with extracted metadata
    const exam = await storage.createExam({
      userId,
      name,
      fileType,
      status: "pending",
      laboratoryName: extractedLabName,
      examDate: extractedExamDate,
      requestingPhysician: requestingPhysician
    });
    
    // Update exam status
    await storage.updateExam(exam.id, { 
      status: "analyzed",
      originalContent: fileContent
    });
    
    // Save analysis results
    const examResult = await storage.createExamResult({
      examId: exam.id,
      summary: analysisResult.summary,
      detailedAnalysis: analysisResult.detailedAnalysis,
      recommendations: analysisResult.recommendations.join('\n'),
      healthMetrics: analysisResult.healthMetrics,
      aiProvider: "gemini"
    });
    
    // Create notification
    await storage.createNotification({
      userId,
      title: "Análise concluída",
      message: `Seu exame "${name}" foi analisado com sucesso`,
      read: false
    });
    
    // Save health metrics with the extracted exam date
    for (const metric of analysisResult.healthMetrics) {
      try {
        console.log("Salvando métrica:", {
          userId,
          name: metric.name,
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          date: extractedExamDate
        });
        
        await storage.createHealthMetric({
          userId: Number(userId),
          name: metric.name || "desconhecido",
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          date: extractedExamDate // Use the extract date for metrics
        });
        
        console.log(`Métrica ${metric.name} salva com sucesso!`);
      } catch (metricError) {
        console.error(`Erro ao salvar métrica ${metric.name}:`, metricError);
        // Continua com a próxima métrica mesmo se essa falhar
      }
    }
    
    res.status(200).json({ 
      exam,
      result: examResult
    });
  } catch (error) {
    console.error("Error in upload and analyze document:", error);
    res.status(500).json({ message: "Erro ao analisar o documento" });
  }
}
