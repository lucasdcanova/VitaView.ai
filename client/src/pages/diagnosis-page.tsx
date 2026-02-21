import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { Exam, ExamResult } from "@shared/schema";
import { getExamDetails, getExamInsights, analyzeExtractedExam, PatientData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import PatientContextForm from "@/components/patient-context-form";
import AnalysisComparison from "@/components/analysis-comparison";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  InfoIcon,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  FileText,
  Stethoscope,
  GraduationCap,
  ClipboardList,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FeatureGate } from "@/components/ui/feature-gate";

// Tipo melhorado para Diagnósticos
type Diagnosis = {
  condition: string;
  probability: "alta" | "média" | "baixa";
  description: string;
  indicativeMarkers: string[];
};

// Tipo atualizado com diagnósticos possíveis
type HealthInsights = {
  contextualAnalysis: string;
  possibleDiagnoses: Diagnosis[];
  recommendations: string[];
  specialists: string[];
  lifestyle: {
    diet: string;
    exercise: string;
    sleep: string;
    stress_management?: string;
  };
  riskFactors: string[];
  healthParameters?: {
    healthScore: number;
    criticalAreas: string[];
    stableAreas: string[];
    improvementTrends: string[];
    worseningTrends: string[];
  };
  evidenceBasedAssessment?: {
    clinicalGuidelines: string[];
    studyReferences: string[];
    confidenceLevel: string;
  };
};

export default function DiagnosisPage() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [match, params] = useRoute<{ id: string }>("/diagnosis/:id");
  const examId = match && params ? parseInt(params.id) : 0;
  const { toast } = useToast();

  // Dados do paciente para contextualização
  const [patientData, setPatientData] = useState<PatientData>({
    gender: "masculino",
    age: 35,
    diseases: [],
    surgeries: [],
    allergies: []
  });



  const { data, isLoading } = useQuery<{ exam: Exam, result: ExamResult }>({
    queryKey: [`/api/exams/${examId}`],
    queryFn: () => getExamDetails(examId),
    enabled: !!examId,
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery<HealthInsights>({
    queryKey: [`/api/exams/${examId}/insights`],
    queryFn: () => getExamInsights(examId),
    enabled: !!examId && !!data?.result,
  });

  // Mutação para analisar exame com OpenAI
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return await analyzeExtractedExam(examId, patientData);
    },
    onSuccess: () => {
      toast({
        title: "Análise concluída com sucesso",
        description: "O exame foi analisado utilizando IA avançada (OpenAI)",
        variant: "default",
      });
      // Após a análise, atualizamos os insights
      queryClient.invalidateQueries({ queryKey: [`/api/exams/${examId}/insights`] });
    },
    onError: (error) => {
      toast({
        title: "Falha na análise",
        description: error instanceof Error ? error.message : "Ocorreu um erro na análise do exame",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Obter cor baseada na probabilidade
  const getProbabilityColor = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'alta': return "text-red-600";
      case 'média': return "text-amber-600";
      case 'baixa': return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  // Gerar classes de badge baseadas na probabilidade
  const getProbabilityBadgeClass = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'alta': return "bg-red-100 text-red-800 border-red-200";
      case 'média': return "bg-amber-100 text-amber-800 border-amber-200";
      case 'baixa': return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 bg-background overflow-y-auto">
          <PatientHeader
            title="Análise Diagnóstica"
            description="Avaliação especializada com diagnósticos sugeridos."
            showTitleAsMain={true}
            fullWidth={true}
            icon={<Stethoscope className="h-6 w-6" />}
          >
            <Link href="/history" className="inline-flex">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PatientHeader>
          <div className="p-4 md:p-6">

            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                {/* Cabeçalho do Exame */}
                <Card className="mb-6">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-xl">{data?.exam.name}</CardTitle>
                      <CardDescription>
                        Exame realizado em {data?.exam.examDate ? formatDate(data?.exam.examDate) : formatDate(data?.exam.uploadDate?.toString())}
                        {data?.exam.requestingPhysician && <> • Solicitado por Dr(a). {data?.exam.requestingPhysician}</>}
                        {data?.exam.laboratoryName && <> • {data?.exam.laboratoryName}</>}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver exame original</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <PatientContextForm
                        initialData={patientData}
                        onSubmit={(data) => {
                          setPatientData(data);
                          analyzeMutation.mutate();
                        }}
                        isLoading={analyzeMutation.isPending}
                      />



                      <FeatureGate feature="ai-diagnosis-new">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon">
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adicionar nova análise</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FeatureGate>
                    </div>
                  </CardHeader>
                </Card>

                {/* Tabs principais */}
                <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="analysis">
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Análise
                    </TabsTrigger>
                    <FeatureGate feature="ai-diagnosis-results">
                      <TabsTrigger value="diagnoses">
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Diagnósticos
                      </TabsTrigger>
                    </FeatureGate>
                    <FeatureGate feature="ai-diagnosis-rec">
                      <TabsTrigger value="recommendations">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Recomendações
                      </TabsTrigger>
                    </FeatureGate>
                    <FeatureGate feature="ai-diagnosis-evidence">
                      <TabsTrigger value="evidence">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Evidências
                      </TabsTrigger>
                    </FeatureGate>
                  </TabsList>

                  {/* Tab de Análise Contextual */}
                  <TabsContent value="analysis">
                    {isLoadingInsights ? (
                      <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          {/* Componente de comparação entre extração e análise */}
                          {data?.result && (
                            <AnalysisComparison
                              initialExtraction={data.result}
                              aiAnalysis={insights}
                              isAnalysisLoading={analyzeMutation.isPending}
                            />
                          )}

                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center text-lg">
                                <InfoIcon className="h-5 w-5 mr-2 text-primary-600" />
                                Análise Contextual
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-700 whitespace-pre-line">
                                {insights?.contextualAnalysis}
                              </p>
                            </CardContent>
                          </Card>

                          {/* Fatores de Risco */}
                          <Card className="mt-6">
                            <CardHeader>
                              <CardTitle className="flex items-center text-lg">
                                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                                Fatores de Risco Identificados
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {insights?.riskFactors?.map((factor, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-amber-500 mr-2">•</span>
                                    <span className="text-gray-700">{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Pontuação de Saúde e Áreas */}
                        <div>
                          {insights?.healthParameters && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Pontuação Global de Saúde</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex justify-center mb-4">
                                  <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                      <circle
                                        cx="18" cy="18" r="16"
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="3"
                                      />
                                      <circle
                                        cx="18" cy="18" r="16"
                                        fill="none"
                                        stroke={
                                          insights.healthParameters.healthScore >= 80 ? "#22c55e" :
                                            insights.healthParameters.healthScore >= 60 ? "#f59e0b" :
                                              "#ef4444"
                                        }
                                        strokeWidth="3"
                                        strokeDasharray="100"
                                        strokeDashoffset={100 - insights.healthParameters.healthScore}
                                        strokeLinecap="round"
                                        transform="rotate(-90, 18, 18)"
                                      />
                                    </svg>
                                    <div className="absolute text-2xl font-bold">
                                      {insights.healthParameters.healthScore}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  {insights.healthParameters.criticalAreas.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-red-600 mb-1">Áreas críticas</h4>
                                      <ul className="space-y-1">
                                        {insights.healthParameters.criticalAreas.map((area, idx) => (
                                          <li key={idx} className="text-sm flex items-center text-gray-700">
                                            <AlertTriangle className="h-3 w-3 text-red-500 mr-2" />
                                            <span>{area}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {insights.healthParameters.stableAreas.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-green-600 mb-1">Áreas estáveis</h4>
                                      <ul className="space-y-1">
                                        {insights.healthParameters.stableAreas.map((area, idx) => (
                                          <li key={idx} className="text-sm flex items-center text-gray-700">
                                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                                            <span>{area}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {insights.healthParameters.improvementTrends.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-blue-600 mb-1">Tendências de melhoria</h4>
                                      <ul className="space-y-1">
                                        {insights.healthParameters.improvementTrends.map((trend, idx) => (
                                          <li key={idx} className="text-sm flex items-center text-gray-700">
                                            <TrendingUp className="h-3 w-3 text-blue-500 mr-2" />
                                            <span>{trend}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {insights.healthParameters.worseningTrends.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-orange-600 mb-1">Tendências de piora</h4>
                                      <ul className="space-y-1">
                                        {insights.healthParameters.worseningTrends.map((trend, idx) => (
                                          <li key={idx} className="text-sm flex items-center text-gray-700">
                                            <TrendingDown className="h-3 w-3 text-orange-500 mr-2" />
                                            <span>{trend}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab de Diagnósticos Possíveis */}
                  <TabsContent value="diagnoses">
                    {isLoadingInsights ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                              <Stethoscope className="h-5 w-5 mr-2 text-primary-600" />
                              Diagnósticos Sugeridos
                            </CardTitle>
                            <CardDescription>
                              Baseados na análise dos resultados dos exames e parâmetros clínicos
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {insights?.possibleDiagnoses && insights.possibleDiagnoses.length > 0 ? (
                                insights.possibleDiagnoses.map((diagnosis, index) => (
                                  <Card key={index} className="border-l-4" style={{
                                    borderLeftColor: diagnosis.probability === 'alta' ? '#ef4444' :
                                      diagnosis.probability === 'média' ? '#f59e0b' : '#3b82f6'
                                  }}>
                                    <CardHeader className="pb-2">
                                      <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg font-semibold">{diagnosis.condition}</CardTitle>
                                        <Badge className={getProbabilityBadgeClass(diagnosis.probability)}>
                                          Probabilidade {diagnosis.probability}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-gray-700 mb-3">{diagnosis.description}</p>

                                      <div className="mt-2">
                                        <h4 className="text-sm font-medium mb-1">Marcadores indicativos:</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {diagnosis.indicativeMarkers.map((marker, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-gray-50">
                                              {marker}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <Sparkles className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                  <h3 className="text-lg font-medium text-gray-900 mb-1">Não há diagnósticos sugeridos</h3>
                                  <p className="text-gray-600 max-w-md mx-auto">
                                    Os resultados dos exames estão dentro dos parâmetros normais ou não há
                                    dados suficientes para sugerir diagnósticos específicos.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="text-xs text-gray-500 bg-gray-50 rounded-b-lg">
                            <div className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>Estes são apenas diagnósticos sugeridos com base nos exames. Sempre consulte um médico para confirmação.</span>
                            </div>
                          </CardFooter>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab de Recomendações */}
                  <TabsContent value="recommendations">
                    {isLoadingInsights ? (
                      <div className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-3">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center text-lg">
                                <ClipboardList className="h-5 w-5 mr-2 text-primary-600" />
                                Recomendações Médicas
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-4">
                                {insights?.recommendations?.map((recommendation, index) => (
                                  <li key={index} className="p-3 bg-primary-50 rounded-lg">
                                    <div className="flex">
                                      <div className="flex-shrink-0">
                                        <CheckCircle2 className="text-primary-600" size={20} />
                                      </div>
                                      <p className="ml-3 text-gray-700">{recommendation}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="md:col-span-2">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Especialistas Sugeridos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {insights?.specialists?.map((specialist, index) => (
                                  <li key={index} className="flex items-start py-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3 flex-shrink-0">
                                      <Stethoscope className="h-4 w-4" />
                                    </div>
                                    <p className="text-gray-700">{specialist}</p>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>

                          {insights?.lifestyle && (
                            <Card className="mt-6">
                              <CardHeader>
                                <CardTitle className="text-lg">Recomendações de Estilo de Vida</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <dl className="space-y-3">
                                  <div>
                                    <dt className="font-medium text-gray-700">Alimentação</dt>
                                    <dd className="text-gray-600 mt-1">{insights?.lifestyle?.diet}</dd>
                                  </div>
                                  <Separator />
                                  <div>
                                    <dt className="font-medium text-gray-700">Exercícios</dt>
                                    <dd className="text-gray-600 mt-1">{insights?.lifestyle?.exercise}</dd>
                                  </div>
                                  <Separator />
                                  <div>
                                    <dt className="font-medium text-gray-700">Sono</dt>
                                    <dd className="text-gray-600 mt-1">{insights?.lifestyle?.sleep}</dd>
                                  </div>
                                  {insights?.lifestyle?.stress_management && (
                                    <>
                                      <Separator />
                                      <div>
                                        <dt className="font-medium text-gray-700">Gerenciamento de Estresse</dt>
                                        <dd className="text-gray-600 mt-1">{insights?.lifestyle?.stress_management}</dd>
                                      </div>
                                    </>
                                  )}
                                </dl>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab de Evidências Científicas */}
                  <TabsContent value="evidence">
                    {isLoadingInsights ? (
                      <div className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                      </div>
                    ) : (
                      insights?.evidenceBasedAssessment ? (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center text-lg">
                                <GraduationCap className="h-5 w-5 mr-2 text-primary-600" />
                                Diretrizes Clínicas Relevantes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {insights?.evidenceBasedAssessment?.clinicalGuidelines?.map((guideline, idx) => (
                                  <li key={idx} className="bg-blue-50 p-3 rounded-lg text-gray-700">
                                    {guideline}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center text-lg">
                                <FileText className="h-5 w-5 mr-2 text-primary-600" />
                                Referências Científicas
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {insights?.evidenceBasedAssessment?.studyReferences?.map((reference, idx) => (
                                  <li key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex">
                                      <div className="font-mono text-gray-500 mr-3">[{idx + 1}]</div>
                                      <p className="text-gray-700">{reference}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Nível de Confiança na Avaliação</CardTitle>
                              <CardDescription>
                                Baseado na qualidade dos dados disponíveis e nas evidências científicas
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-col items-center">
                                <div className="w-full max-w-md">
                                  <div className="flex items-center mb-1">
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                      <div className={`h-3 rounded-full ${insights?.evidenceBasedAssessment?.confidenceLevel === 'alto' ? 'w-full bg-green-600' :
                                        insights?.evidenceBasedAssessment?.confidenceLevel === 'médio' ? 'w-2/3 bg-yellow-500' :
                                          'w-1/3 bg-red-500'
                                        }`}></div>
                                    </div>
                                    <span className="ml-3 text-gray-700 font-medium min-w-16">
                                      {insights?.evidenceBasedAssessment?.confidenceLevel?.charAt(0).toUpperCase() +
                                        insights?.evidenceBasedAssessment?.confidenceLevel?.slice(1)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Baixa</span>
                                    <span>Média</span>
                                    <span>Alta</span>
                                  </div>
                                </div>

                                {insights?.evidenceBasedAssessment?.confidenceLevel === 'baixo' && (
                                  <p className="mt-4 text-center text-sm text-gray-600 max-w-md">
                                    A confiança baixa indica que os dados disponíveis são limitados ou as evidências científicas
                                    para estas conclusões são preliminares. Consulte um médico para avaliação completa.
                                  </p>
                                )}

                                {insights?.evidenceBasedAssessment?.confidenceLevel === 'médio' && (
                                  <p className="mt-4 text-center text-sm text-gray-600 max-w-md">
                                    A confiança média indica que há evidências científicas moderadas que suportam estas
                                    conclusões, mas algumas áreas podem requerer mais dados ou confirmação clínica.
                                  </p>
                                )}

                                {insights?.evidenceBasedAssessment?.confidenceLevel === 'alto' && (
                                  <p className="mt-4 text-center text-sm text-gray-600 max-w-md">
                                    A confiança alta indica que as conclusões são baseadas em evidências científicas
                                    consistentes e dados robustos. Ainda assim, sempre consulte um médico.
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                          <InfoIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Evidências científicas não disponíveis</h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            Não foram encontradas evidências científicas específicas para este exame ou não foi possível processar
                            esta informação no momento.
                          </p>
                        </div>
                      )
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div >
    </div >
  );
}
