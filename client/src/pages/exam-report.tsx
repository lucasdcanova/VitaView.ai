import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Exam, ExamResult } from "@shared/schema";
import { formatMetricDisplayName } from "@shared/exam-normalizer";
import { getExamDetails, getExamInsights, deleteExam } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/use-profiles";
import {
  ArrowLeft,
  FileText,
  Image,
  Share2,
  Download,
  Calendar,
  Building,
  UserRound,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  Minus,
  Info,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  ChevronRight,
  Heart,
  Activity,
  Apple,
  Dumbbell,
  Moon,
  User,
  Microscope,
  FileText as FileMedical,
  Clipboard,
  LineChart,
  Clock,
  Trash2,
  MoreVertical,
  Sparkles
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getExamReturnContext, clearExamReturnContext } from "@/lib/exam-navigation";

// Função para mostrar ícone de variação baseado no valor
function getChangeIconForMetric(change: string | null): JSX.Element {
  if (!change) return <Minus className="h-3 w-3" />;

  if (change.startsWith('+')) {
    return <ArrowUp className="h-3 w-3" />;
  } else if (change.startsWith('-')) {
    return <ArrowDown className="h-3 w-3" />;
  } else {
    return <Minus className="h-3 w-3" />;
  }
}
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { FeatureGate } from "@/components/ui/feature-gate";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  buildDiagnosisDescription,
  buildFindingDescription,
  buildImpressionDescription,
  formatStructuredDate,
  normalizeExamNarrative,
  parseStructuredExamAnalysis,
  splitRecommendations,
} from "@/lib/exam-analysis";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type HealthInsights = {
  recommendations: string[];
  specialists: string[];
  lifestyle: {
    diet: string;
    exercise: string;
    sleep: string;
    stress_management?: string;
  };
  riskFactors: string[];
  contextualAnalysis: string;
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

export default function ExamReport() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [match, params] = useRoute<{ id: string }>("/report/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeProfile } = useProfiles();
  const examId = match && params ? parseInt(params.id) : 0;

  // Smart back navigation: if the user came from atendimento or another
  // page, return there instead of the hardcoded exam history.
  const returnContext = getExamReturnContext({
    path: "/exam-history",
    label: "Voltar ao histórico",
  });

  const handleBack = () => {
    setLocation(returnContext.path);
    clearExamReturnContext();
  };

  const { data, isLoading } = useQuery<{ exam: Exam, result?: ExamResult | null }>({
    queryKey: [`/api/exams/${examId}`],
    queryFn: () => getExamDetails(examId),
    enabled: !!examId,
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery<HealthInsights>({
    queryKey: [`/api/exams/${examId}/insights`],
    queryFn: () => getExamInsights(examId),
    enabled: !!examId && !!data?.result,
  });

  // Mutação para excluir o exame
  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(examId),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas aos exames e métricas de saúde
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/chronological"] });

      // Voltar ao contexto de origem (atendimento, histórico, etc.)
      setLocation(returnContext.path);
      clearExamReturnContext();
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

  // Format relative date
  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  // Get icon for a given lifestyle category
  const getLifestyleIcon = (category: string) => {
    switch (category) {
      case 'diet':
        return <Apple className="h-5 w-5 text-emerald-600" />;
      case 'exercise':
        return <Dumbbell className="h-5 w-5 text-blue-600" />;
      case 'sleep':
        return <Moon className="h-5 w-5 text-indigo-600" />;
      case 'stress_management':
        return <Heart className="h-5 w-5 text-rose-600" />;
      default:
        return <Activity className="h-5 w-5 text-primary-600" />;
    }
  };

  // Get background color for lifestyle card
  const getLifestyleCardStyle = (category: string) => {
    switch (category) {
      case 'diet':
        return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900';
      case 'exercise':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900';
      case 'sleep':
        return 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900';
      case 'stress_management':
        return 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  // Get color for confidence level
  const getConfidenceLevelColor = (level?: string) => {
    switch (level) {
      case 'alto':
        return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900';
      case 'médio':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900';
      case 'baixo':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  // Filtrar recomendações para garantir conformidade com diretrizes do Ministério da Saúde
  const filterRecommendations = (recommendations: string[]) => {
    const prohibitedTerms = [
      'vitamina', 'suplemento', 'zinco', 'magnésio', 'ferro', 'cálcio', 'ômega',
      'b12', 'vitamin', 'supplement', 'prescri', 'dosagem', 'mg', 'ui'
    ];

    return recommendations.filter(rec => {
      const lowerRec = rec.toLowerCase();
      return !prohibitedTerms.some(term => lowerRec.includes(term));
    }).map(rec => {
      // Se ainda houver recomendações problemáticas, substituir por orientação padrão
      if (rec.toLowerCase().includes('acompanhamento') && !rec.includes('Ministério da Saúde')) {
        return 'Consulte um médico para orientações específicas sobre os resultados';
      }
      return rec;
    });
  };

  // Filtrar texto de lifestyle para remover nutrientes específicos
  const filterLifestyleText = (text: string) => {
    const prohibitedTerms = [
      'vitamina', 'suplemento', 'zinco', 'magnésio', 'ferro', 'cálcio', 'ômega',
      'b12', 'vitamin', 'supplement', 'prescri', 'dosagem', 'mg', 'ui'
    ];

    let filteredText = text;
    prohibitedTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      if (regex.test(filteredText)) {
        // Se contém termo proibido, usar texto padrão do Ministério da Saúde
        if (text.toLowerCase().includes('alimentação') || text.toLowerCase().includes('diet')) {
          filteredText = 'Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde';
        } else if (text.toLowerCase().includes('exercí') || text.toLowerCase().includes('atividade')) {
          filteredText = 'Pratique atividade física regular conforme orientações do Ministério da Saúde (150 min/semana)';
        } else {
          filteredText = 'Consulte um médico para orientações específicas';
        }
      }
    });

    return filteredText;
  };

  const getFileIcon = (fileType?: string, iconSize: number = 16) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="text-muted-foreground" size={16} />;
      case 'jpeg':
      case 'png':
        return <Image className="text-muted-foreground" size={16} />;
      default:
        return <FileText className="text-muted-foreground" size={16} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return "Data indisponível";
    }
    return parsedDate.toLocaleDateString('pt-BR');
  };

  // Função simplificada para obter o status da métrica para a UI, independente da função implementada
  const getMetricStatusForUI = (status?: string, value?: string, referenceMin?: string | null, referenceMax?: string | null) => {
    // Valores padrão
    let position = '50%';
    let indicatorClass = 'bg-green-500';

    // Se tem valores de referência, calcula posição com base neles
    if (referenceMin && referenceMax) {
      const min = parseFloat(referenceMin);
      const max = parseFloat(referenceMax);
      const val = value ? parseFloat(value) : 0;

      if (!isNaN(min) && !isNaN(max) && !isNaN(val)) {
        // Normalização para visualização
        const range = max - min;
        const padding = range * 0.2; // 20% de margem visual
        const visualMin = min - padding;
        const visualMax = max + padding;
        const visualRange = visualMax - visualMin;

        // Porcentagem entre 10 e 90% para melhor visibilidade
        let percentage = ((val - visualMin) / visualRange) * 100;
        percentage = Math.max(10, Math.min(90, percentage));

        position = `${percentage}%`;

        // Cores baseadas na relação com os valores de referência
        if (val > max) {
          indicatorClass = 'bg-red-500';
        } else if (val < min) {
          indicatorClass = 'bg-blue-500';
        } else if (val >= max * 0.9) {
          indicatorClass = 'bg-amber-500';
        } else {
          indicatorClass = 'bg-green-500';
        }
      }
    } else {
      // Sem referências, usa apenas o status
      switch (status) {
        case 'alto':
        case 'high':
          position = '80%';
          indicatorClass = 'bg-red-500';
          break;
        case 'atenção':
        case 'atencao':
          position = '65%';
          indicatorClass = 'bg-amber-500';
          break;
        case 'baixo':
        case 'low':
          position = '20%';
          indicatorClass = 'bg-blue-500';
          break;
        default:
          position = '50%';
          indicatorClass = 'bg-green-500';
      }
    }

    // Adicionamos propriedades adicionais para compatibilidade com o código existente
    return {
      position,
      indicatorClass,
      color: indicatorClass,
      width: '40%',
      showRange: !!referenceMin && !!referenceMax,
      referenceMin: referenceMin ? parseFloat(referenceMin) : null,
      referenceMax: referenceMax ? parseFloat(referenceMax) : null,
      value: value ? parseFloat(value) : 0,
      severity: 'normal'
    };
  };

  const getChangeIcon = (change?: string) => {
    if (!change) return <Minus className="h-3 w-3 text-gray-600" />;

    if (change.startsWith('+')) {
      return <ArrowUp className="h-3 w-3 text-red-600 dark:text-red-400" />;
    } else if (change.startsWith('-')) {
      return <ArrowDown className="h-3 w-3 text-green-600 dark:text-green-400" />;
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  // Extract sample health metrics from the exam result
  const healthMetrics = data?.result?.healthMetrics as any[] || [];
  const structuredAnalysis = parseStructuredExamAnalysis(data?.result?.detailedAnalysis);
  const structuredMetadata = structuredAnalysis?.examMetadata || {};
  const clinicalFindings = structuredAnalysis?.clinicalFindings || [];
  const diagnosticImpression = structuredAnalysis?.diagnosticImpression || [];
  const suggestedDiagnoses = structuredAnalysis?.suggestedDiagnoses || [];
  const abnormalMetrics = healthMetrics.filter((metric) => {
    const status = metric?.status?.toLowerCase?.() || "";
    return status && status !== "normal";
  });
  const structuredRecommendations = splitRecommendations(
    insights?.recommendations && insights.recommendations.length > 0
      ? insights.recommendations
      : data?.result?.recommendations || structuredAnalysis?.recommendations || []
  );
  const narrativeAnalysis =
    normalizeExamNarrative(
      structuredAnalysis?.detailedAnalysis ||
      (typeof data?.result?.detailedAnalysis === "string" ? data.result.detailedAnalysis : "")
    );

  const handleDownloadPdf = async () => {
    if (!data) return;
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(
        '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Gerando Relatório...</div></body></html>'
      );
    }
    try {
      const response = await fetch(`/api/export-exam-report/${examId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        if (newTab) newTab.location.href = url;
        else window.open(url, '_blank');
      } else {
        newTab?.close();
        alert('Erro ao gerar o PDF do relatório');
      }
    } catch (error) {
      newTab?.close();
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao gerar o PDF do relatório');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Relatório de Exame - ${data?.exam.name}`,
          text: data?.result?.summary || undefined,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copiado para a área de transferência!');
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const isAnalyzed =
    data?.exam?.status === "analyzed" || data?.exam?.status === "extraction_only";
  const labName =
    data?.exam?.laboratoryName ||
    structuredMetadata.institutionName ||
    structuredMetadata.laboratoryName;
  const physicianName =
    data?.exam?.requestingPhysician || structuredMetadata.requestingPhysician;
  const headlineTitle =
    suggestedDiagnoses.length > 0
      ? "Hipóteses clínicas derivadas do exame"
      : diagnosticImpression.length > 0
        ? "Conclusão principal do laudo"
        : healthMetrics.length > 0 && abnormalMetrics.length === 0
          ? "Resultado predominantemente estável"
          : "Resumo clínico do exame";
  const headlineText =
    suggestedDiagnoses.length > 0
      ? buildDiagnosisDescription(suggestedDiagnoses[0])
      : diagnosticImpression.length > 0
        ? buildImpressionDescription(diagnosticImpression[0])
        : healthMetrics.length > 0 && abnormalMetrics.length === 0
          ? "Os parâmetros estruturados ficaram majoritariamente em faixa estável."
          : clinicalFindings.length > 0
            ? buildFindingDescription(clinicalFindings[0])
            : narrativeAnalysis || "O exame foi processado e estruturado no prontuário do paciente.";
  const attentionText =
    abnormalMetrics.length > 0
      ? `${formatMetricDisplayName(abnormalMetrics[0]?.name || "Alguns parâmetros")} merecem acompanhamento clínico.`
      : suggestedDiagnoses.length > 0
        ? buildDiagnosisDescription(suggestedDiagnoses[0])
        : normalizeExamNarrative(diagnosticImpression[0]?.notes || clinicalFindings[0]?.interpretation) || "A interpretação final deve sempre ser correlacionada ao contexto clínico do paciente.";
  const conciseRecommendations = filterRecommendations(structuredRecommendations).slice(0, 4);
  const specialistSuggestions = (insights?.specialists || [])
    .map((specialist) => normalizeExamNarrative(specialist))
    .filter(Boolean)
    .slice(0, 4);
  const lifestyleGuidance = insights?.lifestyle
    ? [
        { label: "Alimentação", text: normalizeExamNarrative(filterLifestyleText(insights.lifestyle.diet)) },
        { label: "Exercícios", text: normalizeExamNarrative(filterLifestyleText(insights.lifestyle.exercise)) },
        { label: "Sono", text: normalizeExamNarrative(filterLifestyleText(insights.lifestyle.sleep)) },
        insights.lifestyle.stress_management
          ? {
              label: "Gerenciamento de estresse",
              text: normalizeExamNarrative(filterLifestyleText(insights.lifestyle.stress_management)),
            }
          : null,
      ].filter((item): item is { label: string; text: string } => Boolean(item?.text))
    : [];
  const conciseClinicalBlocks = [
    ...diagnosticImpression.slice(0, 2).map((item) => ({
      label: "Impressão",
      tone: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20",
      text: buildImpressionDescription(item),
    })),
    ...clinicalFindings.slice(0, 3).map((finding) => ({
      label: "Achado",
      tone: "border-border/70 bg-muted/25",
      text: buildFindingDescription(finding),
    })),
    ...suggestedDiagnoses.slice(0, 2).map((diagnosis) => ({
      label: "Diagnóstico sugerido",
      tone: "border-blue-200/80 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20",
      text: buildDiagnosisDescription(diagnosis),
    })),
  ].filter((item) => item.text);
  const showComplementaryNarrative =
    Boolean(narrativeAnalysis) &&
    conciseClinicalBlocks.length === 0 &&
    healthMetrics.length === 0;

  // Compact metadata pieces for the PatientHeader description.
  const metadataParts: string[] = [];
  if (data?.exam) {
    const dateLabel = data?.result?.analysisDate
      ? `Analisado em ${formatDate(data.result.analysisDate.toString())}`
      : formatDate(data.exam.examDate || data.exam.uploadDate?.toString());
    if (dateLabel) metadataParts.push(dateLabel);
    if (labName) metadataParts.push(labName);
    if (physicianName) metadataParts.push(`Dr. ${physicianName}`);
    if (data.exam.fileType) metadataParts.push(data.exam.fileType.toUpperCase());
  }
  const headerDescription = metadataParts.length ? metadataParts.join(" • ") : undefined;
  const headerTitle = data?.exam?.name || "Resultado do exame";

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.
              Todos os dados associados ao exame, incluindo resultados e métricas de saúde, serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 bg-background overflow-y-auto">
          <PatientHeader
            title={isLoading ? "Carregando exame..." : headerTitle}
            description={headerDescription}
            patient={activeProfile}
            showTitleAsMain
            compact
            icon={<Microscope className="h-5 w-5 sm:h-6 sm:w-6" />}
          >
            <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="h-9 gap-1.5 rounded-xl border-border/80 bg-background/80 px-3 text-xs sm:h-10 sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="truncate">{returnContext.label}</span>
              </Button>
              {isAnalyzed && (
                <Badge className="hidden h-9 items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300 sm:flex">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Analisado
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-9 w-9 rounded-xl border border-border/60 sm:h-10 sm:w-10"
                    title="Mais ações"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100] w-56">
                  <DropdownMenuItem onClick={handleDownloadPdf} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/30"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir exame
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </PatientHeader>

          <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto">
            <div>
            {/* Report Details — sem card wrapper extra; o conteúdo flui direto sob o header */}
            <div>
                {isLoading ? (
                  <div className="mb-6">
                    <Skeleton className="h-10 w-full mb-6" />
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-400 dark:border-green-600 p-4 rounded-r-lg">
                          <div className="flex">
                            <CheckCircle2 className="text-green-600 dark:text-green-500 mr-3 flex-shrink-0" size={20} />
                            <div>
                              <h4 className="font-medium text-green-800 dark:text-green-300">{headlineTitle}</h4>
                              <p className="text-sm text-green-700 dark:text-green-400 mt-1">{headlineText}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg">
                          <div className="flex">
                            <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0" size={20} />
                            <div>
                              <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Pontos de atenção</h4>
                              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">{attentionText}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {conciseClinicalBlocks.length > 0 && (
                        <section className="space-y-3">
                          <div>
                            <h3 className="font-medium text-lg text-foreground">Leitura clínica do laudo</h3>
                            <p className="text-sm text-muted-foreground">Achados objetivos e hipóteses que realmente ajudam na conversa clínica.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {conciseClinicalBlocks.map((item, index) => (
                              <div key={`${item.label}-${item.text}-${index}`} className={`rounded-xl border p-4 ${item.tone}`}>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                                <p className="mt-2 text-sm text-foreground leading-6">{item.text}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {healthMetrics.length > 0 && (
                        <section className="space-y-3">
                          <div>
                            <h3 className="font-medium text-lg text-foreground">Parâmetros mais relevantes</h3>
                            <p className="text-sm text-muted-foreground">Mantive só a visão prática para consulta, sem virar tabela longa.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {healthMetrics.slice(0, 6).map((metric, index) => (
                              <div key={index} className={`p-4 rounded-lg ${metric.status === 'alto' || metric.status === 'high' ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50' :
                                metric.status === 'baixo' || metric.status === 'low' ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50' :
                                  metric.status === 'atenção' || metric.status === 'atencao' ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/50' : 'bg-muted/30 border border-border'
                                }`}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground flex items-center">
                                    {formatMetricDisplayName(metric.name)}
                                    {metric.status !== 'normal' && (
                                      <Badge variant="outline" className={`ml-2 ${metric.status === 'alto' || metric.status === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900' :
                                        metric.status === 'baixo' || metric.status === 'low' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900' :
                                          'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                                        }`}>
                                        {normalizeExamNarrative(metric.status)}
                                      </Badge>
                                    )}
                                  </span>
                                  <div className="flex items-center">
                                    <span className="text-sm text-foreground font-medium">{metric.value} {metric.unit}</span>
                                    {metric.change && (
                                      <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full ${metric.change.startsWith('+') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                        metric.change.startsWith('-') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                                          'bg-muted text-muted-foreground'
                                        }`}>
                                        {metric.change}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="w-full bg-muted rounded-full h-2.5 mt-2 mb-1 relative">
                                  {(metric.referenceMin && metric.referenceMax) ? (
                                    <div className="absolute h-full bg-green-500/30 dark:bg-green-500/20 rounded-full"
                                      style={{
                                        left: '30%',
                                        width: '40%'
                                      }}>
                                    </div>
                                  ) : (
                                    <div className="absolute h-full bg-muted rounded-full opacity-40"
                                      style={{
                                        left: '25%',
                                        width: '50%'
                                      }}>
                                    </div>
                                  )}

                                  {(metric.referenceMin && metric.referenceMax) && (
                                    <>
                                      <div className="absolute h-full w-0.5 bg-green-600 dark:bg-green-400 opacity-50"
                                        style={{ left: '30%' }}
                                        title={`Valor mínimo de referência: ${metric.referenceMin}`}>
                                      </div>
                                      <div className="absolute h-full w-0.5 bg-green-600 dark:bg-green-400 opacity-50"
                                        style={{ left: '70%' }}
                                        title={`Valor máximo de referência: ${metric.referenceMax}`}>
                                      </div>
                                    </>
                                  )}

                                  {(() => {
                                    const status = getMetricStatusForUI(
                                      metric.status,
                                      metric.value,
                                      metric.referenceMin,
                                      metric.referenceMax
                                    );

                                    return (
                                      <div
                                        className={`w-3 h-3 rounded-full absolute top-1/2 transform -translate-y-1/2 shadow-md ${status.indicatorClass}`}
                                        style={{
                                          left: status.position,
                                          marginLeft: '-4px',
                                          transition: 'left 0.3s ease-in-out'
                                        }}
                                        title={`Valor: ${metric.value} ${metric.unit}`}>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <div className="flex items-center">
                                    <span>
                                      Ref: {metric.referenceMin || '?'}-{metric.referenceMax || '?'} {metric.unit}
                                    </span>

                                    {metric.change && (
                                      <span className={`ml-2 px-1.5 rounded-md flex items-center ${metric.change.startsWith('+') ? 'text-red-700 dark:text-red-400' :
                                        metric.change.startsWith('-') ? 'text-green-700 dark:text-green-400' :
                                          'text-muted-foreground'
                                        }`}>
                                        {getChangeIcon(metric.change)}
                                        <span className="ml-0.5">{metric.change}</span>
                                      </span>
                                    )}
                                  </div>

                                  {metric.clinical_significance && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-primary cursor-help flex items-center">
                                            <Info className="h-3 w-3 mr-1" />
                                            <span className="text-xs">Significado clínico</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs p-3">
                                          <p>{normalizeExamNarrative(metric.clinical_significance)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {(conciseRecommendations.length > 0 || specialistSuggestions.length > 0 || lifestyleGuidance.length > 0) && (
                        <section className="space-y-3">
                          <div>
                            <h3 className="font-medium text-lg text-foreground">Próximos passos sugeridos</h3>
                            <p className="text-sm text-muted-foreground">Orientações condensadas para conduta, sem duplicar o que já foi dito acima.</p>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="rounded-xl border border-border bg-card p-4">
                              {isLoadingInsights ? (
                                <div className="space-y-3">
                                  {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="h-14 w-full" />
                                  ))}
                                </div>
                              ) : conciseRecommendations.length > 0 ? (
                                <ul className="space-y-3">
                                  {conciseRecommendations.map((recommendation, index) => (
                                    <li key={`${recommendation}-${index}`} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                                      <span className="text-sm text-foreground">{normalizeExamNarrative(recommendation)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Nenhuma orientação adicional foi destacada para este exame.
                                </p>
                              )}
                            </div>

                            <div className="space-y-4">
                              {specialistSuggestions.length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <p className="text-sm font-medium text-foreground">Especialistas sugeridos</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {specialistSuggestions.map((specialist, index) => (
                                      <Badge key={`${specialist}-${index}`} variant="outline">
                                        {specialist}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {lifestyleGuidance.length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <p className="text-sm font-medium text-foreground">Cuidados gerais</p>
                                  <ul className="mt-3 space-y-3">
                                    {lifestyleGuidance.slice(0, 3).map((item) => (
                                      <li key={item.label} className="text-sm text-foreground">
                                        <span className="font-medium">{item.label}:</span>{" "}
                                        <span className="text-muted-foreground">{item.text}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      )}

                      {showComplementaryNarrative && (
                        <section className="space-y-3">
                          <div>
                            <h3 className="font-medium text-lg text-foreground">Leitura complementar</h3>
                            <p className="text-sm text-muted-foreground">Mantida só quando o exame não trouxe estrutura suficiente em cards.</p>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{narrativeAnalysis}</p>
                          </div>
                        </section>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
