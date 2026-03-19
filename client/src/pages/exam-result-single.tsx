import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Exam, ExamResult } from "@shared/schema";
import { Link, useRoute, useLocation } from "wouter";

import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import {
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowLeft,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getExamDetails, deleteExam } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  buildDiagnosisDescription,
  buildFindingDescription,
  buildImpressionDescription,
  formatStructuredDate,
  parseStructuredExamAnalysis,
  splitRecommendations,
} from "@/lib/exam-analysis";

export default function ExamResultSingle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Pegar o ID do exame da URL
  const [match, params] = useRoute<{ id: string }>("/results/:id");
  const examId = match && params ? parseInt(params.id) : null;

  // Se temos um ID de exame, buscamos os detalhes do exame específico
  const { data: examData, isLoading } = useQuery<{ exam: Exam, result?: ExamResult | null }>({
    queryKey: [`/api/exams/${examId}`],
    queryFn: () => getExamDetails(examId!),
    enabled: !!examId,
  });

  // Mutação para excluir o exame
  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(examId!),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas aos exames e métricas de saúde
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/chronological"] });

      toast({
        title: "Exame excluído com sucesso",
        description: "O exame e todos os dados associados foram removidos.",
        variant: "default",
      });

      // Redirecionando para a página de resultados
      setLocation("/results");
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir exame",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o exame.",
        variant: "destructive",
      });
    },
  });



  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
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
      case 'atencao':
      case 'attention':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const structuredAnalysis = parseStructuredExamAnalysis(examData?.result?.detailedAnalysis);
  const structuredMetadata = structuredAnalysis?.examMetadata || {};
  const clinicalFindings = structuredAnalysis?.clinicalFindings || [];
  const diagnosticImpression = structuredAnalysis?.diagnosticImpression || [];
  const suggestedDiagnoses = structuredAnalysis?.suggestedDiagnoses || [];
  const recommendations = splitRecommendations(
    examData?.result?.recommendations || structuredAnalysis?.recommendations || []
  );
  const narrativeAnalysis =
    structuredAnalysis?.detailedAnalysis ||
    (typeof examData?.result?.detailedAnalysis === "string" ? examData.result.detailedAnalysis : "");
  const healthMetrics = (examData?.result?.healthMetrics as any[]) || [];

  if (!examId) {
    setLocation("/results");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />

        <main className="flex-1 overflow-y-auto bg-background">
          <PatientHeader
            title="Detalhes do Exame"
            description={examData?.exam ? examData.exam.name : "Carregando detalhes..."}
            showTitleAsMain={true}
            fullWidth={true}
            icon={<FileText className="h-6 w-6" />}
          >
            <div className="flex flex-wrap gap-2">
              <Link href="/results">
                <Button variant="outline" size="sm" className="gap-1">
                  <ArrowLeft size={16} />
                  Voltar
                </Button>
              </Link>
              <Link href={`/report/${examId}`}>
                <Button variant="outline" className="gap-1">
                  <FileText size={16} />
                  Ver Relatório
                </Button>
              </Link>
              <Link href={`/diagnosis/${examId}`}>
                <Button className="bg-primary hover:bg-primary/90 gap-1">
                  <ArrowUpRight size={16} />
                  Diagnóstico
                </Button>
              </Link>
            </div>
          </PatientHeader>
          <div className="container px-4 py-6 mx-auto max-w-7xl">

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
                              (examData.exam.status === 'analyzed' || examData.exam.status === 'extraction_only') ? 'bg-green-100 text-green-800 border-green-200' :
                                examData.exam.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                            }>
                              {(examData.exam.status === 'analyzed' || examData.exam.status === 'extraction_only') ? 'Analisado' :
                                examData.exam.status === 'processing' ? 'Processando' :
                                  examData.exam.status}
                            </Badge>
                          </dd>

                          <dt className="font-medium text-gray-500">Upload:</dt>
                          <dd>{new Date(examData.exam.uploadDate).toLocaleDateString('pt-BR')}</dd>

                          <dt className="font-medium text-gray-500">Tipo:</dt>
                          <dd className="capitalize">{examData.exam.fileType}</dd>

                          {structuredMetadata.examType && (
                            <>
                              <dt className="font-medium text-gray-500">Categoria clínica:</dt>
                              <dd>{structuredMetadata.examType}</dd>
                            </>
                          )}

                          {structuredMetadata.examModality && (
                            <>
                              <dt className="font-medium text-gray-500">Modalidade:</dt>
                              <dd>{structuredMetadata.examModality}</dd>
                            </>
                          )}

                          {structuredMetadata.bodyRegion && (
                            <>
                              <dt className="font-medium text-gray-500">Região/material:</dt>
                              <dd>{structuredMetadata.bodyRegion}</dd>
                            </>
                          )}

                          {structuredMetadata.technique && (
                            <>
                              <dt className="font-medium text-gray-500">Técnica:</dt>
                              <dd>{structuredMetadata.technique}</dd>
                            </>
                          )}

                          {structuredMetadata.collectionDate && (
                            <>
                              <dt className="font-medium text-gray-500">Coleta:</dt>
                              <dd>{formatStructuredDate(structuredMetadata.collectionDate)}</dd>
                            </>
                          )}

                          {structuredMetadata.reportDate && (
                            <>
                              <dt className="font-medium text-gray-500">Laudo:</dt>
                              <dd>{formatStructuredDate(structuredMetadata.reportDate)}</dd>
                            </>
                          )}
                        </dl>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Resumo da Análise</h3>
                        <p className="text-sm text-gray-700 mb-4">{examData.result?.summary || "A análise detalhada ainda está sendo preparada."}</p>

                        <h4 className="font-medium text-gray-700 mb-2">Recomendações</h4>
                        <div className="bg-amber-50 border border-amber-100 rounded-md p-4 text-sm">
                          <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="font-medium mb-2 text-amber-800">Com base nos resultados, recomendamos:</p>
                              <ul className="space-y-1.5 list-disc pl-5 text-amber-800">
                                {recommendations.length > 0 ?
                                  recommendations.map((line, i) => (
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
                {healthMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {healthMetrics.map((metric: any, index: number) => (
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

                {(clinicalFindings.length > 0 || diagnosticImpression.length > 0 || suggestedDiagnoses.length > 0 || narrativeAnalysis) && (
                  <>
                    <h2 className="text-xl font-bold mt-8 mb-4">Achados Estruturados do Laudo</h2>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Achados</CardTitle>
                          <CardDescription>Informações clínicas extraídas do laudo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {clinicalFindings.length > 0 ? clinicalFindings.map((finding, index) => (
                            <div key={`${buildFindingDescription(finding)}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <p className="font-medium text-slate-900">{finding.title}</p>
                              <p className="mt-1 text-slate-600">{buildFindingDescription(finding)}</p>
                            </div>
                          )) : (
                            <p className="text-slate-500">Este exame não trouxe achados descritivos adicionais.</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Impressão Diagnóstica</CardTitle>
                          <CardDescription>Síntese clínica do laudo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {diagnosticImpression.length > 0 ? diagnosticImpression.map((item, index) => (
                            <div key={`${buildImpressionDescription(item)}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-slate-700">{buildImpressionDescription(item)}</p>
                            </div>
                          )) : narrativeAnalysis ? (
                            <p className="text-slate-700 leading-6">{narrativeAnalysis}</p>
                          ) : (
                            <p className="text-slate-500">Nenhuma conclusão estruturada foi identificada.</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Diagnósticos Sugeridos</CardTitle>
                          <CardDescription>Hipóteses sustentadas pelo exame</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {suggestedDiagnoses.length > 0 ? suggestedDiagnoses.map((diagnosis, index) => (
                            <div key={`${buildDiagnosisDescription(diagnosis)}-${index}`} className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                              <p className="font-medium text-emerald-900">{diagnosis.condition || "Condição sugerida"}</p>
                              <p className="mt-1 text-emerald-800">{buildDiagnosisDescription(diagnosis)}</p>
                              {diagnosis.notes && (
                                <p className="mt-2 text-emerald-700">{diagnosis.notes}</p>
                              )}
                            </div>
                          )) : (
                            <p className="text-slate-500">Não houve diagnóstico sugerido automaticamente para este exame.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {/* Botão de Exclusão */}
                <div className="mt-8 border-t pt-6 flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteClick}
                    className="gap-2"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} />
                    {deleteMutation.isPending ? "Excluindo..." : "Excluir Exame"}
                  </Button>
                </div>
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

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir exame</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita e todos os dados associados, incluindo métricas de saúde, serão permanentemente removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
