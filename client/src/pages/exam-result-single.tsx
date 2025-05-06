import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Exam, ExamResult } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link, useRoute, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { 
  FileText, 
  AlertCircle, 
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { getExamDetails } from "@/lib/api";

export default function ExamResultSingle() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [, setLocation] = useLocation();
  
  // Pegar o ID do exame da URL
  const [match, params] = useRoute<{ id: string }>("/results/:id");
  const examId = match && params ? parseInt(params.id) : null;
  
  // Se temos um ID de exame, buscamos os detalhes do exame específico
  const { data: examData, isLoading } = useQuery<{ exam: Exam, result: ExamResult }>({
    queryKey: [`/api/exams/${examId}`],
    queryFn: () => getExamDetails(examId!),
    enabled: !!examId,
  });
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Helper function to map status to colors
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'alto':
      case 'high':
      case 'elevado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'baixo':
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atenção':
      case 'attention':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (!examId) {
    setLocation("/results");
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container px-4 py-6 mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/results">
                    <Button variant="outline" size="sm" className="gap-1">
                      <ArrowLeft size={16} />
                      Voltar
                    </Button>
                  </Link>
                  <h1 className="text-3xl font-bold text-gray-900">Detalhes do Exame</h1>
                </div>
                <p className="text-gray-500 mt-1">
                  {examData?.exam ? examData.exam.name : "Carregando detalhes..."}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Link href={`/report/${examId}`}>
                  <Button variant="outline" className="gap-1">
                    <FileText size={16} />
                    Ver Relatório
                  </Button>
                </Link>
                <Link href={`/diagnosis/${examId}`}>
                  <Button className="bg-primary-600 hover:bg-primary-700 gap-1">
                    <ArrowUpRight size={16} />
                    Diagnóstico
                  </Button>
                </Link>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                <Card className="animate-pulse">
                  <CardHeader>
                    <Skeleton className="h-5 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-2" />
                  </CardContent>
                </Card>
              </div>
            ) : examData ? (
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Exame</CardTitle>
                    <CardDescription>
                      Detalhes do exame e resultados encontrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Dados do Exame</h3>
                        <dl className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                          <dt className="font-medium text-gray-500">Nome:</dt>
                          <dd>{examData.exam.name}</dd>
                          
                          <dt className="font-medium text-gray-500">Data:</dt>
                          <dd>{examData.exam.examDate ? new Date(examData.exam.examDate).toLocaleDateString('pt-BR') : 'Não disponível'}</dd>
                          
                          <dt className="font-medium text-gray-500">Laboratório:</dt>
                          <dd>{examData.exam.laboratoryName || 'Não informado'}</dd>
                          
                          <dt className="font-medium text-gray-500">Médico Solicitante:</dt>
                          <dd>{examData.exam.requestingPhysician || 'Não informado'}</dd>
                          
                          <dt className="font-medium text-gray-500">Status:</dt>
                          <dd>
                            <Badge className={
                              examData.exam.status === 'analyzed' ? 'bg-green-100 text-green-800 border-green-200' :
                              examData.exam.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }>
                              {examData.exam.status === 'analyzed' ? 'Analisado' : 
                              examData.exam.status === 'processing' ? 'Processando' : 
                              examData.exam.status}
                            </Badge>
                          </dd>
                          
                          <dt className="font-medium text-gray-500">Upload:</dt>
                          <dd>{new Date(examData.exam.uploadDate).toLocaleDateString('pt-BR')}</dd>
                          
                          <dt className="font-medium text-gray-500">Tipo:</dt>
                          <dd className="capitalize">{examData.exam.fileType}</dd>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Resumo da Análise</h3>
                        <p className="text-sm text-gray-700 mb-4">{examData.result.summary}</p>
                        
                        <h4 className="font-medium text-gray-700 mb-2">Recomendações</h4>
                        <div className="bg-amber-50 border border-amber-100 rounded-md p-4 text-sm">
                          <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="font-medium mb-2 text-amber-800">Com base nos resultados, recomendamos:</p>
                              <ul className="space-y-1.5 list-disc pl-5 text-amber-800">
                                {examData.result.recommendations ? 
                                  examData.result.recommendations.split('\n').filter(line => line.trim()).map((line, i) => (
                                    <li key={i}>{line}</li>
                                  )) 
                                  : <li>Nenhuma recomendação específica disponível.</li>
                                }
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <h2 className="text-xl font-bold mt-8 mb-4">Métricas de Saúde Encontradas</h2>
                {examData.result.healthMetrics && examData.result.healthMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {examData.result.healthMetrics.map((metric: any, index: number) => (
                      <Card key={index} className="overflow-hidden group hover:shadow-md transition-shadow duration-300">
                        <CardHeader className={cn("pb-3", metric.status && metric.status.toLowerCase() === 'normal' ? 'border-l-4 border-green-400' : metric.status && (metric.status.toLowerCase().includes('alt') || metric.status.toLowerCase().includes('high')) ? 'border-l-4 border-red-400' : metric.status && (metric.status.toLowerCase().includes('baix') || metric.status.toLowerCase().includes('low')) ? 'border-l-4 border-blue-400' : '')}>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">
                              {metric.name}
                              {metric.referenceRange && (
                                <span className="block text-xs text-gray-500 font-normal mt-1">
                                  Referência: {metric.referenceRange}
                                </span>
                              )}
                            </CardTitle>
                            
                            <Badge className={cn("text-xs", getStatusColor(metric.status))}>
                              {metric.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            {metric.unit ? `Medido em ${metric.unit}` : 'Sem unidade de medida'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-center">
                              {metric.value}{' '}
                              <span className="text-sm font-normal text-gray-500">{metric.unit}</span>
                            </div>
                          </div>
                          
                          {/* Visualização de faixa de referência */}
                          {metric.referenceMin && metric.referenceMax && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
                                <div className="absolute inset-y-0 bg-green-200 rounded-full" style={{ 
                                  left: '10%', 
                                  right: '10%' 
                                }} />
                                
                                {/* Posição do valor atual */}
                                {(() => {
                                  const min = parseFloat(metric.referenceMin);
                                  const max = parseFloat(metric.referenceMax);
                                  const value = parseFloat(metric.value);
                                  
                                  if (!isNaN(min) && !isNaN(max) && !isNaN(value)) {
                                    const range = max - min;
                                    const valuePosition = Math.min(Math.max((value - min) / range, 0), 1);
                                    const positionPercent = 10 + (valuePosition * 80);
                                    
                                    return (
                                      <div 
                                        className={cn(
                                          "absolute top-0 w-1 h-6 -mt-1.5 shadow-sm", 
                                          value < min ? "bg-blue-500" : 
                                          value > max ? "bg-red-500" : 
                                          "bg-green-600"
                                        )} 
                                        style={{ left: `${positionPercent}%` }}
                                      />
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{metric.referenceMin}</span>
                                <span>Faixa de Referência</span>
                                <span>{metric.referenceMax}</span>
                              </div>
                            </div>
                          )}
                          
                          {metric.description && (
                            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                              {metric.description}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="mb-8">
                    <CardContent className="p-6 text-center">
                      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <h3 className="text-lg font-medium mb-1">Nenhuma métrica encontrada</h3>
                      <p className="text-gray-500">Não foram identificadas métricas de saúde específicas neste exame.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-1">Exame não encontrado</h3>
                  <p className="text-gray-500 mb-4">O exame solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
                  <Link href="/results">
                    <Button variant="outline">Voltar para a lista de exames</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}