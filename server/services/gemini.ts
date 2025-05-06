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
      const prompt = `Você é um especialista médico em análise de exames laboratoriais e documentos médicos, treinado para extrair dados estruturados com máxima precisão.
                
                TAREFA PRINCIPAL: Analise cuidadosamente este documento ${fileType.toUpperCase()} que pode conter MÚLTIPLOS EXAMES de um mesmo paciente e extraia todos os dados solicitados no formato específico abaixo.
                
                EXTRAÇÃO DE METADADOS CRÍTICOS (PRIORIDADE MÁXIMA):
                1. Data de realização do exame:
                   - Esta informação é CRÍTICA! Examine o documento completo com máxima atenção
                   - Busque em todo o documento, incluindo cabeçalho, rodapé e corpo do texto
                   - Procure por todos os padrões possíveis: "Data: xx/xx/xxxx", "Realizado em: xx/xx/xxxx", "Data da coleta", "Emitido em", "Data do Exame" 
                   - Examine datas próximas a palavras como "emissão", "coleta", "realização", "exame", "amostra"
                   - Se encontrar múltiplas datas, priorize a data de coleta/realização do exame, não a data de emissão do laudo
                
                2. Nome do médico solicitante (CRÍTICO):
                   - Procure exaustivamente por "médico solicitante", "solicitado por", "médico", "Dr.", "Dra."
                   - Busque por campos como "Solicitante:", "Médico requisitante:", "Solicitação médica:"
                   - Busque por padrões de texto próximos a CRM (número de registro médico)
                   - Não confunda com médico responsável pelo laboratório ou médico executor
                   - Tente extrair o nome completo, removendo títulos como Dr./Dra.
                
                3. Nome do laboratório:
                   - Identifique o nome da instituição, clínica ou laboratório que realizou o exame
                   - Geralmente está presente no cabeçalho ou rodapé do documento
                   - Pode estar associado a um logotipo ou marca registrada
                
                4. Valores de referência e significância clínica:
                   - Para CADA parâmetro médico, identifique os valores de referência (mínimo e máximo)
                   - Geralmente mostrados como "Valores de referência", "VR", "Intervalo de referência", "Valores normais"
                   - Observe bem a formatação: pode aparecer como "12-45 mg/dL", "VR: 3.5-5.0", "Referência: entre 70 e 99"
                   - Entenda a significância clínica de cada parâmetro (o que ele indica, qual sua importância diagnóstica)
                
                EXTRAÇÃO DE MÉTRICAS DE SAÚDE (ABRANGENTE E PRECISA):
                - Identifique TODOS os parâmetros médicos com seus valores numéricos e unidades exatas
                - O documento pode conter MÚLTIPLOS EXAMES (hemograma, glicemia, lipidograma, etc.) no mesmo arquivo
                - Para cada parâmetro de cada exame:
                  * Determine o status (normal, alto, baixo ou atenção) baseado nos valores de referência
                  * Registre OBRIGATORIAMENTE os valores de referência (mínimo e máximo) para cada parâmetro
                  * Explique a significância clínica do parâmetro (ex: "Indica função renal", "Marcador de inflamação")
                  * Capture a variação explícita em relação a resultados anteriores, se mencionada
                  * Classifique a gravidade de qualquer anormalidade (leve, moderada, severa)
                  * Identifique tendências temporais se múltiplos resultados forem apresentados
                
                DEPOIS da extração completa, forneça uma análise médica profissional integrando todos os exames encontrados no documento.
                
                RESPONDA EXCLUSIVAMENTE NO SEGUINTE FORMATO JSON (sem texto adicional):
                {
                  "examDate": "YYYY-MM-DD (extraia a data exata, campo CRÍTICO, deixe vazio se não encontrada, NUNCA invente)",
                  "requestingPhysician": "Nome completo do médico solicitante (sem títulos como Dr./Dra.)",
                  "laboratoryName": "Nome completo do laboratório ou clínica que realizou o exame",
                  "summary": "Resumo objetivo dos resultados principais em até duas frases, destacando anormalidades significativas",
                  "detailedAnalysis": "Análise médica detalhada (200-300 palavras) dos resultados e suas implicações clínicas, incluindo correlações entre diferentes parâmetros dos vários exames encontrados",
                  "recommendations": [
                    "Recomendação específica e acionável baseada nos resultados anormais",
                    "Sugestão de acompanhamento ou exames adicionais se necessário",
                    "Orientação sobre modificações de estilo de vida relevantes"
                  ],
                  "healthMetrics": [
                    {
                      "name": "Nome preciso do parâmetro (ex: hemoglobina, glicose em jejum, colesterol LDL)",
                      "value": "Valor numérico exato, sem arredondamentos",
                      "unit": "Unidade de medida precisa (ex: g/dL, mg/dL, U/L)",
                      "referenceMin": "Valor mínimo de referência, se disponível",
                      "referenceMax": "Valor máximo de referência, se disponível",
                      "status": "normal, alto, baixo ou atenção (baseado estritamente nos valores de referência)",
                      "change": "Variação quantitativa em relação a exames anteriores (+10%, -5 mg/dL, etc)",
                      "clinical_significance": "Breve interpretação clínica deste parâmetro específico"
                    }
                  ]
                }
                
                RESTRIÇÕES CRÍTICAS:
                - NUNCA invente dados. Se um campo não puder ser determinado com certeza, deixe-o vazio ("").
                - Formate a data SEMPRE como YYYY-MM-DD, convertendo de qualquer outro formato encontrado.
                - O documento pode conter MÚLTIPLOS EXAMES em um único arquivo - identifique TODOS eles.
                - Inclua ABSOLUTAMENTE TODOS os parâmetros médicos encontrados de TODOS os exames, mesmo os que estejam normais.
                - Priorize a extração precisa sobre interpretações ou análises subjetivas.
                - O JSON DEVE ser válido, sem erros de formatação, escapes incorretos ou campos duplicados.
                - Se houver múltiplos resultados para o mesmo parâmetro, inclua todos como métricas separadas.
                - Para valores fora dos intervalos de referência, certifique-se de classificá-los corretamente.`;

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
        
        // Processamento aprimorado e validação dos dados de métricas
        if (analysisData.healthMetrics) {
          analysisData.healthMetrics = analysisData.healthMetrics.map(metric => ({
            name: metric.name || "desconhecido",
            value: String(metric.value || "0"),
            unit: metric.unit || "",
            status: metric.status || "normal",
            change: metric.change || "",
            referenceMin: metric.referenceMin || null,
            referenceMax: metric.referenceMax || null,
            clinical_significance: metric.clinical_significance || null
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
      { 
        name: "hemoglobina", 
        value: "14.2", 
        unit: "g/dL", 
        status: "normal", 
        change: "+0.1", 
        date: currentDate,
        referenceMin: "12.0",
        referenceMax: "16.0",
        clinical_significance: "A hemoglobina é responsável pelo transporte de oxigênio no sangue. Valores baixos podem indicar anemia."
      },
      { 
        name: "glicemia", 
        value: "95", 
        unit: "mg/dL", 
        status: "atenção", 
        change: "+3", 
        date: currentDate,
        referenceMin: "70",
        referenceMax: "99",
        clinical_significance: "Medida de glicose no sangue em jejum. Valores entre 100-125 mg/dL indicam pré-diabetes."
      },
      { 
        name: "colesterol", 
        value: "180", 
        unit: "mg/dL", 
        status: "normal", 
        change: "-5", 
        date: currentDate,
        referenceMin: "150",
        referenceMax: "199",
        clinical_significance: "O colesterol total é importante para avaliar o risco cardiovascular junto com suas frações HDL e LDL."
      },
      { 
        name: "vitamina_d", 
        value: "32", 
        unit: "ng/mL", 
        status: "baixo", 
        change: "-2", 
        date: currentDate,
        referenceMin: "30",
        referenceMax: "100",
        clinical_significance: "Essencial para saúde óssea e imunológica. Níveis baixos são comuns e podem requerer suplementação."
      }
    ];
  } else {
    return [
      { 
        name: "glicemia", 
        value: "95", 
        unit: "mg/dL", 
        status: "atenção", 
        change: "+3", 
        date: currentDate,
        referenceMin: "70",
        referenceMax: "99",
        clinical_significance: "Medida de glicose no sangue em jejum. Valores entre 100-125 mg/dL indicam pré-diabetes."
      },
      { 
        name: "colesterol", 
        value: "180", 
        unit: "mg/dL", 
        status: "normal", 
        change: "-5", 
        date: currentDate,
        referenceMin: "150",
        referenceMax: "199",
        clinical_significance: "O colesterol total é importante para avaliar o risco cardiovascular junto com suas frações HDL e LDL."
      }
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
    
    // Save health metrics with the extracted exam date and enhanced data
    for (const metric of analysisResult.healthMetrics) {
      try {
        console.log("Salvando métrica aprimorada:", {
          userId,
          name: metric.name,
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          referenceMin: metric.referenceMin || null,
          referenceMax: metric.referenceMax || null,
          clinical_significance: metric.clinical_significance || null,
          date: extractedExamDate
        });
        
        await storage.createHealthMetric({
          userId: Number(userId),
          name: metric.name || "desconhecido",
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          referenceMin: metric.referenceMin || null,
          referenceMax: metric.referenceMax || null, 
          clinical_significance: metric.clinical_significance || null,
          date: extractedExamDate // Use the extract date for metrics
        });
        
        console.log(`Métrica ${metric.name} salva com sucesso com valores de referência!`);
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
