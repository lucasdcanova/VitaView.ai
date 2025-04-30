import type { Request, Response } from "express";
import { storage } from "../storage";

// Simplified Gemini API integration for document analysis
// In a real implementation, this would use the actual Google Generative AI SDK

export async function analyzeDocument(fileContent: string, fileType: string) {
  try {
    console.log(`Analyzing ${fileType} document with Google Gemini API`);
    
    // In a real implementation, this would call the Google Generative AI API
    // For this demo, we'll simulate the analysis with a structured response

    // Wait for 2 seconds to simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a simulated analysis based on the file type
    let analysis = {
      summary: "Seus exames apresentam resultados majoritariamente dentro da faixa normal.",
      detailedAnalysis: generateDetailedAnalysis(fileType),
      recommendations: [
        "Consulta de acompanhamento com seu médico para discutir os resultados",
        "Manter uma dieta equilibrada e exercícios físicos regulares",
        "Considerar suplementação de vitamina D, já que os níveis estão abaixo do recomendado"
      ],
      healthMetrics: [
        { name: "hemoglobina", value: "14.2", unit: "g/dL", status: "normal", change: "+0.1" },
        { name: "glicemia", value: "95", unit: "mg/dL", status: "atenção", change: "+3" },
        { name: "colesterol", value: "180", unit: "mg/dL", status: "normal", change: "-5" },
        { name: "vitamina_d", value: "32", unit: "ng/mL", status: "baixo", change: "-2" }
      ]
    };
    
    return analysis;
  } catch (error) {
    console.error("Error analyzing document with Gemini API:", error);
    throw new Error("Falha ao analisar o documento com a API do Google Gemini");
  }
}

function generateDetailedAnalysis(fileType: string) {
  if (fileType === "pdf") {
    return `O exame de sangue completo mostra hemoglobina dentro do padrão (14.2 g/dL), 
    com contagem normal de plaquetas (245.000/mm³) e hematócrito (42%). 
    Observamos um leve aumento nos leucócitos totais (10.500/mm³), que pode indicar uma 
    resposta inflamatória leve ou início de processo infeccioso. 
    Recomendamos acompanhamento deste parâmetro.`;
  } else if (fileType === "jpeg" || fileType === "png") {
    return `A análise da imagem do seu exame de glicemia mostra um valor de 95 mg/dL, 
    ligeiramente elevado para glicemia de jejum, que idealmente deve estar abaixo de 
    90 mg/dL. Isto pode indicar um estado de pré-diabetes e necessita de acompanhamento médico.`;
  } else {
    return `A análise do documento mostra resultados majoritariamente dentro dos valores de referência,
    com algumas áreas que merecem atenção. Recomendamos consultar um médico para interpretar 
    os resultados em conjunto com seu histórico clínico.`;
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
