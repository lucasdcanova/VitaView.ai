import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Building, FileText } from "lucide-react";
import type { Exam, HealthMetric } from "@shared/schema";
import { normalizeExamName } from "@shared/exam-normalizer";

// Função para formatar data no padrão brasileiro
function formatDateToBR(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

// Função para formatar nomes de métricas
function formatMetricDisplayName(name: string): string {
  const normalizedName = normalizeExamName(name);
  
  const displayMap: Record<string, string> = {
    'eritrócitos': 'Eritrócitos',
    'hemoglobina': 'Hemoglobina', 
    'hematócrito': 'Hematócrito',
    'vcm': 'VCM',
    'hcm': 'HCM',
    'chcm': 'CHCM',
    'rdw': 'RDW',
    'leucócitos': 'Leucócitos',
    'neutrófilos': 'Neutrófilos',
    'eosinófilos': 'Eosinófilos',
    'basófilos': 'Basófilos',
    'monócitos': 'Monócitos',
    'linfócitos': 'Linfócitos',
    'plaquetas': 'Plaquetas',
    'glicose': 'Glicose',
    'colesterol total': 'Colesterol Total',
    'vitamina d': 'Vitamina D',
    'albumina': 'Albumina'
  };
  
  return displayMap[normalizedName] || name;
}

export default function ExamTimeline() {
  // Buscar exames
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Buscar métricas de saúde
  const { data: healthMetrics = [], isLoading: isLoadingMetrics } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics"],
  });

  const isLoading = isLoadingExams || isLoadingMetrics;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Linha do Tempo dos Seus Exames
          </h1>
          <p className="text-lg text-gray-600">
            Acompanhe o histórico cronológico dos seus exames médicos
          </p>
        </div>

        {/* Linha do Tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-[#1E3A5F]" />
              Histórico de Exames
            </CardTitle>
            <CardDescription>
              Visualize todos os seus exames organizados por data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : exams && exams.length > 0 ? (
              <div className="relative">
                {/* Linha vertical central */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1E3A5F] to-[#48C9B0]"></div>
                
                <div className="space-y-8">
                  {exams
                    .sort((a, b) => new Date(b.examDate || b.uploadDate).getTime() - new Date(a.examDate || a.uploadDate).getTime())
                    .map((exam, index) => {
                      const examMetrics = healthMetrics.filter(m => m.examId === exam.id);
                      const examDate = exam.examDate || exam.uploadDate;
                      
                      return (
                        <div key={exam.id} className="relative flex items-start">
                          {/* Ponto na linha */}
                          <div className="absolute left-4 top-6 w-5 h-5 bg-[#1E3A5F] rounded-full border-4 border-white shadow-lg z-10"></div>
                          
                          {/* Card do exame */}
                          <div className="ml-16 bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 w-full group">
                            {/* Cabeçalho do card */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-6 w-6 text-[#1E3A5F]" />
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {exam.name}
                                </h3>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-medium text-[#1E3A5F]">
                                  {formatDateToBR(examDate)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {index === 0 ? 'Mais recente' : `${index + 1}º exame`}
                                </div>
                              </div>
                            </div>
                            
                            {/* Informações do exame */}
                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                              {exam.laboratoryName && (
                                <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                                  <Building className="h-4 w-4 mr-2" />
                                  {exam.laboratoryName}
                                </span>
                              )}
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                exam.status === 'analyzed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : exam.status === 'analyzing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {exam.status === 'analyzed' ? 'Analisado' : 
                                 exam.status === 'analyzing' ? 'Analisando' : 'Processado'}
                              </span>
                            </div>
                            
                            {/* Métricas identificadas */}
                            {examMetrics.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  Métricas identificadas ({examMetrics.length}):
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {examMetrics.slice(0, 9).map((metric) => (
                                    <div
                                      key={metric.id}
                                      className={`p-2 rounded-lg border text-sm ${
                                        metric.status === 'normal'
                                          ? 'bg-green-50 border-green-200 text-green-800'
                                          : metric.status === 'alto' || metric.status === 'elevado'
                                          ? 'bg-red-50 border-red-200 text-red-800'
                                          : metric.status === 'baixo'
                                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                          : 'bg-gray-50 border-gray-200 text-gray-800'
                                      }`}
                                    >
                                      <div className="font-medium">
                                        {formatMetricDisplayName(metric.name)}
                                      </div>
                                      <div className="text-xs opacity-75">
                                        {metric.value} {metric.unit}
                                      </div>
                                    </div>
                                  ))}
                                  {examMetrics.length > 9 && (
                                    <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 flex items-center justify-center">
                                      +{examMetrics.length - 9} métricas
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Ações */}
                            <div className="flex gap-3 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="group-hover:border-[#1E3A5F] group-hover:text-[#1E3A5F]"
                              >
                                <a href={`/results?exam=${exam.id}`}>
                                  Ver Análise Completa
                                </a>
                              </Button>
                              {examMetrics.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="group-hover:border-[#48C9B0] group-hover:text-[#48C9B0]"
                                >
                                  <a href={`/results?exam=${exam.id}#metrics`}>
                                    Ver Métricas ({examMetrics.length})
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum exame encontrado
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Comece fazendo o upload de seus exames médicos para acompanhar sua evolução ao longo do tempo
                </p>
                <Button 
                  asChild
                  className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white"
                >
                  <a href="/upload-exams">Enviar Primeiro Exame</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}