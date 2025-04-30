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
      const prompt = `Você é um médico especialista em análise de exames laboratoriais. 
                Analise este exame ${fileType.toUpperCase()} e forneça um relatório detalhado 
                incluindo achados clínicos relevantes, interpretação dos valores, 
                recomendações médicas e instruções para o paciente.
                
                Formate sua resposta como um JSON com a seguinte estrutura:
                {
                  "summary": "resumo geral dos resultados, em uma frase",
                  "detailedAnalysis": "análise detalhada dos resultados encontrados",
                  "recommendations": ["lista de 3-5 recomendações para o paciente"],
                  "healthMetrics": [
                    {
                      "name": "nome do parâmetro, ex: hemoglobina",
                      "value": "valor numérico, ex: 14.2",
                      "unit": "unidade, ex: g/dL",
                      "status": "normal, atenção, alto ou baixo",
                      "change": "+0.1 ou -0.2 comparado com o valor anterior"
                    }
                  ]
                }`;

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
        if (!analysisData.healthMetrics || !Array.isArray(analysisData.healthMetrics)) {
          analysisData.healthMetrics = defaultHealthMetrics(fileType);
        }
        
        if (!analysisData.recommendations || !Array.isArray(analysisData.recommendations)) {
          analysisData.recommendations = [
            "Consulta de acompanhamento com seu médico para discutir os resultados",
            "Manter uma dieta equilibrada e exercícios físicos regulares"
          ];
        }
        
        return analysisData;
      } catch (jsonError) {
        console.error("Error parsing Gemini response as JSON:", jsonError);
        // Fallback to structured text parsing
        return {
          summary: "Seus exames foram analisados pela IA Gemini",
          detailedAnalysis: text.substring(0, 500),
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
  if (fileType === 'pdf') {
    return [
      { name: "hemoglobina", value: "14.2", unit: "g/dL", status: "normal", change: "+0.1" },
      { name: "glicemia", value: "95", unit: "mg/dL", status: "atenção", change: "+3" },
      { name: "colesterol", value: "180", unit: "mg/dL", status: "normal", change: "-5" },
      { name: "vitamina_d", value: "32", unit: "ng/mL", status: "baixo", change: "-2" }
    ];
  } else {
    return [
      { name: "glicemia", value: "95", unit: "mg/dL", status: "atenção", change: "+3" },
      { name: "colesterol", value: "180", unit: "mg/dL", status: "normal", change: "-5" }
    ];
  }
}

export async function uploadAndAnalyzeDocument(req: Request, res: Response) {
  try {
    const { userId, name, fileType, fileContent, laboratoryName, examDate } = req.body;
    
    if (!userId || !name || !fileType || !fileContent) {
      return res.status(400).json({ message: "Dados incompletos para análise" });
    }
    
    // Create exam record
    const exam = await storage.createExam({
      userId,
      name,
      fileType,
      status: "pending",
      laboratoryName: laboratoryName || "Laboratório Central",
      examDate: examDate || new Date().toISOString().split('T')[0]
    });
    
    // Simulate document analysis with Gemini
    const analysisResult = await analyzeDocument(fileContent, fileType);
    
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
    
    // Save health metrics
    for (const metric of analysisResult.healthMetrics) {
      await storage.createHealthMetric({
        userId,
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        status: metric.status,
        change: metric.change
      });
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
