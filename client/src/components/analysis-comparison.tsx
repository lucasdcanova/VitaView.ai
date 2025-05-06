import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Database, ArrowRight } from "lucide-react";
import { ExamResult } from "@shared/schema";

type AnalysisComparisonProps = {
  initialExtraction: ExamResult;
  aiAnalysis: any; // Usando any aqui para simplificar, idealmente seria tipado
  isAnalysisLoading: boolean;
};

export default function AnalysisComparison({
  initialExtraction,
  aiAnalysis,
  isAnalysisLoading,
}: AnalysisComparisonProps) {
  const [activeTab, setActiveTab] = useState<string>("extraction");

  // Função para formatar o texto com quebras de linha
  const formatText = (text: string | null) => {
    if (!text) return "Nenhuma informação disponível";
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Comparação de Análises</span>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Extração: Gemini AI
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Análise: OpenAI
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Compare os resultados da extração inicial com a análise contextual avançada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="extraction" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Extração Inicial (Gemini)
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Análise Avançada (OpenAI)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="extraction" className="p-4 bg-gray-50 rounded-md border">
            <h3 className="text-md font-medium mb-2">Resumo da Extração</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line mb-4">
              {formatText(initialExtraction.summary)}
            </div>
            
            {initialExtraction.detailedAnalysis && (
              <>
                <h3 className="text-md font-medium mb-2">Detalhes da Extração</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {formatText(initialExtraction.detailedAnalysis)}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="p-4 bg-gray-50 rounded-md border">
            {isAnalysisLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent mb-2"></div>
                  <p className="text-sm text-gray-500">Analisando com OpenAI...</p>
                </div>
              </div>
            ) : !aiAnalysis?.contextualAnalysis ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">Análise Avançada Não Disponível</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Use o botão "Analisar com OpenAI" para obter uma análise contextual aprofundada com interpretações clínicas mais detalhadas.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-md font-medium mb-2">Análise Contextual</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-4">
                  {formatText(aiAnalysis.contextualAnalysis)}
                </div>
                
                {aiAnalysis.possibleDiagnoses && aiAnalysis.possibleDiagnoses.length > 0 && (
                  <>
                    <h3 className="text-md font-medium mb-2">Possíveis Diagnósticos</h3>
                    <ul className="text-sm text-gray-700 list-disc pl-5 mb-4 space-y-1">
                      {aiAnalysis.possibleDiagnoses.map((diagnosis: any, index: number) => (
                        <li key={index}>
                          <span className="font-medium">{diagnosis.condition}</span>
                          <span className="text-xs ml-2">({diagnosis.probability})</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <>
                    <h3 className="text-md font-medium mb-2">Recomendações</h3>
                    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                      {aiAnalysis.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center justify-center mt-4">
          <div className="border-t border-gray-200 w-full flex-1"></div>
          <div className="px-4 text-gray-500 text-xs">Diferença de Profundidade</div>
          <div className="border-t border-gray-200 w-full flex-1"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center">
              <Database className="h-3 w-3 mr-1 text-blue-500" />
              <span>Extração estruturada de dados</span>
            </div>
            <div className="flex items-center">
              <Database className="h-3 w-3 mr-1 text-blue-500" />
              <span>Classificação básica de exames</span>
            </div>
            <div className="flex items-center">
              <Database className="h-3 w-3 mr-1 text-blue-500" />
              <span>Identificação de valores fora da faixa</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-500" />
              <span>Interpretação contextualizada dos resultados</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-500" />
              <span>Correlação com dados do paciente</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-500" />
              <span>Sugestão de diagnósticos e próximos passos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}