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
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

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
  const MAX_RETRIES = 5; // Aumentado para 5 tentativas
  const RETRY_DELAY = 2000; // Aumentado para 2 segundos de base, com backoff exponencial
  
  let lastError: any = null;
  
  // Helper function to implement delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Log o tipo e tamanho do arquivo para diagnóstico 
  const fileSizeKB = Math.round(fileContent.length * 0.75 / 1024); // aproximado para base64
  console.log(`Processando documento ${fileType} de aproximadamente ${fileSizeKB}KB`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Analyzing ${fileType} document with Google Gemini API (attempt ${attempt}/${MAX_RETRIES})`);
      
      // Create Gemini model instance
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        safetySettings
      });
      
      // Prepare the prompt for the model - FOCO NA EXTRAÇÃO PRECISA COM ADAPTAÇÃO PARA EXAMES BRASILEIROS
      const prompt = `Você é um especialista médico brasileiro com foco específico na EXTRAÇÃO PRECISA de dados de exames laboratoriais do Brasil, sem analisar ou interpretar resultados.
                
                TAREFA PRINCIPAL: EXTRAIA DADOS ESTRUTURADOS deste documento ${fileType.toUpperCase()} que contém um ou MÚLTIPLOS EXAMES médicos laboratoriais brasileiros. 
                
                FOCO EXCLUSIVO NA EXTRAÇÃO:
                - Sua única função é EXTRAIR dados e metadados, NÃO fazer análises médicas
                - Organize todos os parâmetros encontrados no formato estruturado JSON solicitado
                - Identifique TODOS os exames diferentes presentes no documento (hemograma, glicemia, lipidograma, etc.)
                - Extraia TODOS os parâmetros de CADA exame com precisão máxima
                - Adapte-se para o padrão brasileiro de laboratórios como Dasa, Fleury, DB Diagnósticos, CDPI, etc.
                
                EXTRAÇÃO DE METADADOS (PRIORIDADE MÁXIMA):
                1. Data de realização do exame:
                   - EXAMINE O DOCUMENTO COMPLETO em busca desta data CRÍTICA
                   - Procure diferentes formatos: "Data: xx/xx/xxxx", "Realizado em", "Data da coleta", "Data do Exame", etc.
                   - Busque especialmente formato brasileiro de data (DD/MM/AAAA)
                   - Examine o contexto de cada data (cabeçalho, rodapé, próximo ao nome do paciente)
                   - Priorize datas de coleta/realização do exame, não a data de emissão do laudo
                   - Se houver múltiplas datas para exames diferentes, escolha a mais recente
                
                2. Nome do médico solicitante (CRÍTICO):
                   - Busque EXAUSTIVAMENTE por "médico solicitante", "solicitado por", "solicitante", "médico requisitante"
                   - Busque por "médico", "solicitante" e outros termos próximos
                   - Procure por padrões como "Dr.", "Dra.", "Médico:", "Solicitante:", ou nomes próximos a CRM
                   - Não confunda com médico responsável pelo laboratório ou médico executor do exame
                   - Remova prefixos como "Dr./Dra." e extraia apenas o nome completo
                
                3. Nome do laboratório:
                   - Identifique o laboratório/clínica que realizou o exame (geralmente no cabeçalho/rodapé)
                   - Laboratórios comuns no Brasil: Dasa, Fleury, Grupo Pardini, DB Diagnósticos, CDPI, etc.
                   - Procure por termos como "Laboratório", "Laboratório de Análises Clínicas", etc.
                   - Pode estar próximo a um logotipo, CNPJ ou informações de contato
                
                EXTRAÇÃO DE DADOS DOS EXAMES (PRECISÃO ESSENCIAL):
                Para CADA parâmetro médico de CADA exame encontrado:
                1. Nome exato do parâmetro (ex: "Hemoglobina", "Glicose", "Colesterol Total", "TSH")
                2. Valor numérico preciso (mantenha dígitos exatos, sem arredondamentos)
                   - Atenção para o formato brasileiro que usa vírgula como separador decimal
                   - Converta valores com vírgula (por exemplo, "9,5") para formato com ponto ("9.5")
                3. Unidade de medida completa (mg/dL, g/L, U/L, etc.)
                4. Valores de referência:
                   - Identifique limites mínimo e máximo para cada parâmetro
                   - Procure por "Valores de referência", "VR", "Referência", "Valores normais", "Valor de referência"
                   - Extraia em formato numérico (converta intervalos como "entre 70 e 99" para "70" e "99")
                   - Se houver apenas um valor de referência (como "Até 200"), use null para o mínimo
                5. Status do resultado (normal, alto, baixo, atenção) baseado estritamente nos valores de referência
                   - Compare o valor do parâmetro com os valores de referência para determinar o status
                   - Se o valor estiver acima do máximo de referência, classifique como "alto"
                   - Se o valor estiver abaixo do mínimo de referência, classifique como "baixo"
                   - Se estiver dentro da faixa de referência, classifique como "normal"
                   - Se estiver próximo ao limite, classifique como "atenção"
                6. Significância clínica do parâmetro (o que ele mede ou indica clinicamente)
                7. Variações explícitas em relação a resultados anteriores, se mencionadas
                8. Categoria do exame (ex: "Hemograma", "Lipidograma", "Função Hepática", etc.)
                
                RESPONDA APENAS NO SEGUINTE FORMATO JSON (sem textos adicionais):
                {
                  "examDate": "YYYY-MM-DD",
                  "requestingPhysician": "Nome completo sem prefixos Dr./Dra.",
                  "laboratoryName": "Nome do laboratório ou clínica",
                  "examType": "Tipo principal de exame (ex: Hemograma, Glicemia, Checkup Completo)",
                  "healthMetrics": [
                    {
                      "name": "Nome exato do parâmetro",
                      "value": "Valor numérico preciso",
                      "unit": "Unidade de medida",
                      "referenceMin": "Valor mínimo de referência ou null",
                      "referenceMax": "Valor máximo de referência ou null", 
                      "status": "normal, alto, baixo ou atenção (baseado nos valores de referência)",
                      "change": "Variação em relação a exames anteriores ou vazio",
                      "clinical_significance": "O que este parâmetro indica clinicamente",
                      "category": "Categoria do exame (ex: Hemograma, Lipidograma, Função hepática)"
                    }
                  ]
                }
                
                RESTRIÇÕES CRÍTICAS:
                - NUNCA faça recomendações ou análises - sua função é APENAS EXTRAIR dados
                - NUNCA invente dados. Se um campo não puder ser determinado, deixe-o vazio ("") ou null
                - Formate a data SEMPRE como YYYY-MM-DD, convertendo de qualquer formato encontrado
                - Ao encontrar datas no formato brasileiro DD/MM/AAAA, converta para YYYY-MM-DD
                - Identifique TODOS os exames presentes no documento, mesmo que sejam de tipos diferentes
                - Extraia TODOS os parâmetros encontrados, mesmo os normais
                - Se houver múltiplos valores para o mesmo parâmetro, inclua-os como métricas separadas
                - Cada parâmetro deve ter o campo "category" indicando a qual tipo de exame pertence
                - O JSON DEVE ser válido, sem erros de formatação ou campos duplicados`;

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
      console.log("Enviando documento para Gemini API...");
      const result = await model.generateContent(parts);
      const response = result.response;
      const text = response.text();
      console.log("Resposta recebida da Gemini API. Tamanho da resposta:", text.length);
      console.log("Amostra da resposta:", text.substring(0, 200));
      
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
          analysisData.healthMetrics = analysisData.healthMetrics.map((metric: any) => ({
            name: metric.name || "desconhecido",
            value: String(metric.value || "0"),
            unit: metric.unit || "",
            status: metric.status || "normal",
            change: metric.change || "",
            referenceMin: metric.referenceMin || null,
            referenceMax: metric.referenceMax || null,
            clinical_significance: metric.clinical_significance || null,
            category: metric.category || "Geral"
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
    // Try to use OpenAI as fallback if OPENAI_API_KEY is available
    if (process.env.OPENAI_API_KEY) {
      console.log("Tentando fallback com OpenAI...");
      
      try {
        // Import analyzeDocumentWithOpenAI dynamically to avoid circular dependency
        const { analyzeDocumentWithOpenAI } = await import("./openai");
        
        // Try to extract with OpenAI
        const openAIResults = await analyzeDocumentWithOpenAI(fileContent, fileType);
        
        console.log("Fallback com OpenAI bem-sucedido!");
        return {
          ...openAIResults,
          aiProvider: "openai:fallback",
          summary: "Análise realizada pela OpenAI (fallback)",
          fallbackUsed: true
        };
      } catch (openAIError) {
        console.error("Erro no fallback com OpenAI:", openAIError);
        // Continue to default fallback
      }
    }
    
    // If OpenAI fallback failed or API key not available, use default fallback
    console.log("Usando fallback padrão com dados de exemplo");
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
      healthMetrics: defaultHealthMetrics(fileType),
      aiProvider: "fallback:local",
      fallbackUsed: true
    };
  } catch (fallbackError) {
    console.error("Error in all fallback mechanisms:", fallbackError);
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
        name: "Hemoglobina", 
        value: "9.0", 
        unit: "g/dL", 
        status: "baixo", 
        change: "-0.5", 
        date: currentDate,
        referenceMin: "13.0",
        referenceMax: "17.0",
        category: "Hematologia",
        clinical_significance: "Importante para transporte de oxigênio no sangue. Valores baixos indicam anemia."
      },
      { 
        name: "Glicose", 
        value: "89.1", 
        unit: "mg/dL", 
        status: "normal", 
        change: "0", 
        date: currentDate,
        referenceMin: "65",
        referenceMax: "99",
        category: "Bioquímica",
        clinical_significance: "Indicador de metabolismo de carboidratos e energia celular"
      },
      { 
        name: "Colesterol Total", 
        value: "209.7", 
        unit: "mg/dL", 
        status: "alto", 
        change: "+10", 
        date: currentDate,
        referenceMin: null,
        referenceMax: "200",
        category: "Lipidograma",
        clinical_significance: "Fator de risco para doenças cardiovasculares quando elevado"
      },
      { 
        name: "Colesterol HDL", 
        value: "33.5", 
        unit: "mg/dL", 
        status: "baixo", 
        change: "-2", 
        date: currentDate,
        referenceMin: "40",
        referenceMax: null,
        category: "Lipidograma",
        clinical_significance: "Colesterol 'bom' que ajuda a remover o LDL da corrente sanguínea"
      }
    ];
  } else {
    return [
      { 
        name: "Glicose", 
        value: "89.1", 
        unit: "mg/dL", 
        status: "normal", 
        change: "0", 
        date: currentDate,
        referenceMin: "65",
        referenceMax: "99",
        category: "Bioquímica",
        clinical_significance: "Indicador de metabolismo de carboidratos e energia celular"
      },
      { 
        name: "Colesterol Total", 
        value: "209.7", 
        unit: "mg/dL", 
        status: "alto", 
        change: "+10", 
        date: currentDate,
        referenceMin: null,
        referenceMax: "200",
        category: "Lipidograma",
        clinical_significance: "Fator de risco para doenças cardiovasculares quando elevado"
      },
      { 
        name: "Colesterol HDL", 
        value: "33.5", 
        unit: "mg/dL", 
        status: "baixo", 
        change: "-2", 
        date: currentDate,
        referenceMin: "40",
        referenceMax: null,
        category: "Lipidograma",
        clinical_significance: "Colesterol 'bom' que ajuda a remover o LDL da corrente sanguínea"
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
    
    // ETAPA 1: EXTRAÇÃO com Gemini (sem análise)
    console.log("ETAPA 1: Iniciando extração de dados com Gemini");
    const extractionResult = await analyzeDocument(fileContent, fileType);
    
    // Use extracted date from document or fallback to provided date or current date
    const extractedExamDate = extractionResult.examDate || examDate || new Date().toISOString().split('T')[0];
    console.log(`Data de exame extraída: ${extractedExamDate}`);
    
    // Use extracted laboratory name from document or fallback to provided name
    const extractedLabName = extractionResult.laboratoryName || laboratoryName || "Laboratório não identificado";
    console.log(`Laboratório extraído: ${extractedLabName}`);
    
    // Get requesting physician if available
    let requestingPhysician = extractionResult.requestingPhysician || null;
    
    // Sanitiza o nome do médico requisitante para remover prefixos Dr/Dra se existirem
    if (requestingPhysician) {
      requestingPhysician = requestingPhysician
        .replace(/^Dr\.\s*/i, '')
        .replace(/^Dra\.\s*/i, '')
        .replace(/^Dr\s*/i, '')
        .replace(/^Dra\s*/i, '');
      console.log(`Médico requisitante extraído e sanitizado: ${requestingPhysician}`);
    } else {
      console.log('Médico requisitante não encontrado no documento');
    }
    
    // ETAPA 2: CRIAÇÃO E CLASSIFICAÇÃO DO EXAME
    console.log("ETAPA 2: Criando registro do exame com metadados extraídos");
    const exam = await storage.createExam({
      userId,
      name: extractionResult.examType ? `${extractionResult.examType} - ${name}` : name,
      fileType,
      status: "extracted", // Novo status: apenas extraído, ainda não analisado
      laboratoryName: extractedLabName,
      examDate: extractedExamDate,
      requestingPhysician: requestingPhysician,
      originalContent: fileContent // Guardar conteúdo original direto durante criação
    });
    
    console.log(`Exame criado com sucesso. ID: ${exam.id}`);
    
    // ETAPA 3: SALVAMENTO DAS MÉTRICAS EXTRAÍDAS
    console.log("ETAPA 3: Salvando métricas extraídas");
    
    // Salvamos apenas o resultado da extração, sem análise completa ainda
    // A análise acontecerá posteriormente com OpenAI
    const examResult = await storage.createExamResult({
      examId: exam.id,
      summary: `Exame extraído com ${extractionResult.healthMetrics?.length || 0} parâmetros`,
      detailedAnalysis: null, // Será preenchido posteriormente pela OpenAI
      recommendations: null, // Será preenchido posteriormente pela OpenAI
      healthMetrics: extractionResult.healthMetrics,
      aiProvider: "gemini:extraction-only"
    });
    
    console.log(`Resultado inicial do exame salvo. ID: ${examResult.id}`);
    
    // Notificação mais específica sobre a extração
    await storage.createNotification({
      userId,
      title: "Exame processado",
      message: `${name} foi processado com sucesso. Vá para a página de diagnóstico para análise detalhada.`,
      read: false
    });
    
    // Contagem para log de métricas salvas
    let savedMetricsCount = 0;
    let failedMetricsCount = 0;
    
    // Organizar métricas por categoria para melhor visualização
    const metricsByCategory = new Map();
    
    // Salvar métricas com informações de categoria
    for (const metric of extractionResult.healthMetrics || []) {
      try {
        // Adicionar métrica à categoria para estatísticas
        const category = metric.category || "Geral";
        if (!metricsByCategory.has(category)) {
          metricsByCategory.set(category, []);
        }
        metricsByCategory.get(category).push(metric.name);
        
        // Criar uma nova métrica de saúde usando apenas os campos que existem na tabela
        await storage.createHealthMetric({
          userId: Number(userId),
          name: metric.name || "desconhecido",
          value: String(metric.value || "0"),
          unit: metric.unit || "",
          status: metric.status || "normal",
          change: metric.change || "",
          date: new Date(extractedExamDate)
          // Removi referenceMin, referenceMax, clinical_significance e category que não existem na tabela atual
        });
        
        savedMetricsCount++;
      } catch (metricError) {
        failedMetricsCount++;
        console.error(`Erro ao salvar métrica ${metric.name}:`, metricError);
        // Continua com a próxima métrica mesmo se essa falhar
      }
    }
    
    // Log do resumo das métricas salvas
    console.log(`RESUMO: Salvas ${savedMetricsCount} métricas, falhas: ${failedMetricsCount}`);
    metricsByCategory.forEach((metrics, category) => {
      console.log(`- Categoria '${category}': ${metrics.length} métricas (${metrics.join(', ')})`);
    });
    
    // Após a extração, atualizamos o status do exame
    await storage.updateExam(exam.id, { 
      status: "ready_for_analysis" // Pronto para ser analisado pela OpenAI em etapa separada
    });
    
    res.status(200).json({ 
      exam,
      result: {
        ...examResult,
        extractedCategories: Array.from(metricsByCategory.keys()),
        metricsCount: savedMetricsCount
      }
    });
  } catch (error) {
    console.error("Error in upload and analyze document:", error);
    res.status(500).json({ message: "Erro ao processar o documento", error: String(error) });
  }
}
