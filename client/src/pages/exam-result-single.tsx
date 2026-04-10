import { useState, useMemo } from "react";
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
  Activity,
  Beaker,
  Calendar,
  Building2,
  User,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Microscope,
  Heart,
  Shield,
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
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// --- Status helpers ---

function getStatusColor(status: string | null | undefined) {
  if (!status) return "bg-muted text-muted-foreground";
  switch (status.toLowerCase()) {
    case "normal":
      return "bg-green-50 text-green-700 border-green-200";
    case "alto":
    case "high":
    case "elevado":
      return "bg-red-50 text-red-700 border-red-200";
    case "baixo":
    case "low":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "atenção":
    case "atencao":
    case "attention":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: string | null | undefined) {
  if (!status) return <Activity className="h-4 w-4" />;
  switch (status.toLowerCase()) {
    case "normal":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "alto":
    case "high":
    case "elevado":
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    case "baixo":
    case "low":
      return <TrendingDown className="h-4 w-4 text-blue-600" />;
    case "atenção":
    case "atencao":
    case "attention":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string | null | undefined) {
  if (!status) return "Sem status";
  switch (status.toLowerCase()) {
    case "normal":
      return "Normal";
    case "alto":
    case "high":
    case "elevado":
      return "Elevado";
    case "baixo":
    case "low":
      return "Baixo";
    case "atenção":
    case "atencao":
    case "attention":
      return "Atenção";
    default:
      return status;
  }
}

function getExamStatusBadge(status: string | undefined) {
  if (!status) return null;
  const isAnalyzed = status === "analyzed" || status === "extraction_only";
  const isProcessing = status === "processing";
  return (
    <Badge
      className={cn(
        "text-xs gap-1",
        isAnalyzed
          ? "bg-green-50 text-green-700 border-green-200"
          : isProcessing
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-muted text-muted-foreground"
      )}
    >
      {isAnalyzed ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : isProcessing ? (
        <Activity className="h-3 w-3 animate-pulse" />
      ) : null}
      {isAnalyzed ? "Analisado" : isProcessing ? "Processando" : status}
    </Badge>
  );
}

// --- Metric card with improved visualization ---

function MetricCard({ metric }: { metric: any }) {
  const min = parseFloat(metric.referenceMin);
  const max = parseFloat(metric.referenceMax);
  const value = parseFloat(metric.value);
  const hasRange = !isNaN(min) && !isNaN(max) && !isNaN(value);

  const isNormal = metric.status?.toLowerCase() === "normal";
  const isHigh =
    metric.status?.toLowerCase() === "alto" ||
    metric.status?.toLowerCase() === "high" ||
    metric.status?.toLowerCase() === "elevado";
  const isLow =
    metric.status?.toLowerCase() === "baixo" ||
    metric.status?.toLowerCase() === "low";

  const borderColor = isNormal
    ? "border-l-green-400"
    : isHigh
      ? "border-l-red-400"
      : isLow
        ? "border-l-blue-400"
        : "border-l-amber-400";

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4 transition-all duration-200 hover:shadow-md",
        borderColor
      )}
    >
      <CardContent className="p-4">
        {/* Header: name + status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-heading font-semibold text-sm text-foreground truncate">
              {metric.name}
            </h4>
            {metric.category && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {metric.category}
              </p>
            )}
          </div>
          <Badge
            className={cn(
              "text-[10px] px-2 py-0.5 shrink-0 gap-1 font-heading",
              getStatusColor(metric.status)
            )}
          >
            {getStatusIcon(metric.status)}
            {getStatusLabel(metric.status)}
          </Badge>
        </div>

        {/* Value display */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-2xl font-heading font-bold text-foreground tabular-nums">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="text-xs text-muted-foreground font-body">
              {metric.unit}
            </span>
          )}
        </div>

        {/* Reference range visualization */}
        {hasRange && (
          <div className="space-y-1.5">
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              {/* Normal range band */}
              <div
                className="absolute inset-y-0 bg-green-100 rounded-full"
                style={{ left: "10%", right: "10%" }}
              />
              {/* Value marker */}
              {(() => {
                const range = max - min;
                const valuePosition = Math.min(
                  Math.max((value - min) / range, -0.1),
                  1.1
                );
                const positionPercent = 10 + valuePosition * 80;
                return (
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm border-2 border-white",
                      isNormal
                        ? "bg-green-500"
                        : isHigh
                          ? "bg-red-500"
                          : isLow
                            ? "bg-blue-500"
                            : "bg-amber-500"
                    )}
                    style={{
                      left: `${Math.min(Math.max(positionPercent, 2), 98)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                );
              })()}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-body">
              <span>{metric.referenceMin}</span>
              <span className="text-center">Ref: {metric.referenceRange || `${metric.referenceMin} - ${metric.referenceMax}`}</span>
              <span>{metric.referenceMax}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {metric.description && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed font-body">
            {metric.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Info Chip for metadata bar ---

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-body text-foreground hover:bg-muted transition-colors cursor-default">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[140px]">{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {label}: {value}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// --- Main component ---

export default function ExamResultSingle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState(false);

  const [match, params] = useRoute<{ id: string }>("/results/:id");
  const examId = match && params ? parseInt(params.id) : null;

  const { data: examData, isLoading } = useQuery<{
    exam: Exam;
    result?: ExamResult | null;
  }>({
    queryKey: [`/api/exams/${examId}`],
    queryFn: () => getExamDetails(examId!),
    enabled: !!examId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(examId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/health-metrics/latest"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/reports/chronological"],
      });
      setLocation("/results");
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir exame",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao excluir o exame.",
        variant: "destructive",
      });
    },
  });

  const structuredAnalysis = parseStructuredExamAnalysis(
    examData?.result?.detailedAnalysis
  );
  const structuredMetadata = structuredAnalysis?.examMetadata || {};
  const clinicalFindings = structuredAnalysis?.clinicalFindings || [];
  const diagnosticImpression = structuredAnalysis?.diagnosticImpression || [];
  const suggestedDiagnoses = structuredAnalysis?.suggestedDiagnoses || [];
  const recommendations = splitRecommendations(
    examData?.result?.recommendations ||
      structuredAnalysis?.recommendations ||
      []
  );
  const narrativeAnalysis =
    structuredAnalysis?.detailedAnalysis ||
    (typeof examData?.result?.detailedAnalysis === "string"
      ? examData.result.detailedAnalysis
      : "");
  const healthMetrics = (examData?.result?.healthMetrics as any[]) || [];

  // Compute metric stats
  const metricStats = useMemo(() => {
    const normal = healthMetrics.filter(
      (m) => m.status?.toLowerCase() === "normal"
    ).length;
    const altered = healthMetrics.length - normal;
    return { total: healthMetrics.length, normal, altered };
  }, [healthMetrics]);

  // Altered metrics for "Visão Geral" quick view
  const alteredMetrics = useMemo(
    () => healthMetrics.filter((m) => m.status?.toLowerCase() !== "normal"),
    [healthMetrics]
  );

  const hasStructuredData =
    clinicalFindings.length > 0 ||
    diagnosticImpression.length > 0 ||
    suggestedDiagnoses.length > 0 ||
    !!narrativeAnalysis;

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
            description={
              examData?.exam ? examData.exam.name : "Carregando detalhes..."
            }
            showTitleAsMain={true}
            fullWidth={true}
            icon={<FileText className="h-6 w-6" />}
          >
            <div className="flex flex-wrap gap-2">
              <Link href="/results">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft size={14} />
                  Voltar
                </Button>
              </Link>
              <Link href={`/report/${examId}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileText size={14} />
                  Relatório
                </Button>
              </Link>
              <Link href={`/diagnosis/${examId}`}>
                <Button
                  size="sm"
                  className="bg-charcoal hover:bg-charcoal/90 text-pureWhite gap-1.5"
                >
                  <ArrowUpRight size={14} />
                  Diagnóstico
                </Button>
              </Link>
            </div>
          </PatientHeader>

          <div className="container px-4 py-5 mx-auto max-w-7xl">
            {isLoading ? (
              <LoadingSkeleton />
            ) : examData ? (
              <>
                {/* Quick info bar */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {examData.exam.examDate && (
                    <InfoChip
                      icon={Calendar}
                      label="Data do exame"
                      value={new Date(
                        examData.exam.examDate
                      ).toLocaleDateString("pt-BR")}
                    />
                  )}
                  {examData.exam.laboratoryName && (
                    <InfoChip
                      icon={Building2}
                      label="Laboratório"
                      value={examData.exam.laboratoryName}
                    />
                  )}
                  {examData.exam.requestingPhysician && (
                    <InfoChip
                      icon={User}
                      label="Médico solicitante"
                      value={examData.exam.requestingPhysician}
                    />
                  )}
                  {structuredMetadata.examType && (
                    <InfoChip
                      icon={Stethoscope}
                      label="Tipo de exame"
                      value={structuredMetadata.examType}
                    />
                  )}
                  {structuredMetadata.bodyRegion && (
                    <InfoChip
                      icon={Microscope}
                      label="Região/material"
                      value={structuredMetadata.bodyRegion}
                    />
                  )}
                  {getExamStatusBadge(examData.exam.status)}
                </div>

                {/* Tabbed content */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full md:w-auto flex overflow-x-auto">
                    <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
                      <ClipboardList className="h-3.5 w-3.5 hidden sm:block" />
                      Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="gap-1.5 text-xs sm:text-sm">
                      <Activity className="h-3.5 w-3.5 hidden sm:block" />
                      Métricas
                      {metricStats.total > 0 && (
                        <span className="ml-1 text-[10px] bg-background px-1.5 py-0.5 rounded-full">
                          {metricStats.total}
                        </span>
                      )}
                    </TabsTrigger>
                    {hasStructuredData && (
                      <TabsTrigger value="findings" className="gap-1.5 text-xs sm:text-sm">
                        <Stethoscope className="h-3.5 w-3.5 hidden sm:block" />
                        Achados
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="details" className="gap-1.5 text-xs sm:text-sm">
                      <Info className="h-3.5 w-3.5 hidden sm:block" />
                      Dados
                    </TabsTrigger>
                  </TabsList>

                  {/* ============ VISÃO GERAL ============ */}
                  <TabsContent value="overview" className="mt-5 space-y-5">
                    {/* Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          <Heart className="h-5 w-5 text-muted-foreground" />
                          Resumo da Análise
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground leading-relaxed font-body">
                          {examData.result?.summary ||
                            "A análise detalhada ainda está sendo preparada."}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Metric status summary */}
                    {metricStats.total > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <Card className="border-l-4 border-l-muted">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                              <Activity className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                              <p className="text-2xl font-heading font-bold text-foreground">
                                {metricStats.total}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">
                                Métricas
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-400">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-heading font-bold text-green-700">
                                {metricStats.normal}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">
                                Normais
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-red-400">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-heading font-bold text-red-700">
                                {metricStats.altered}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">
                                Alteradas
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Altered metrics highlight */}
                    {alteredMetrics.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Valores que requerem atenção
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() =>
                              document
                                .querySelector('[data-value="metrics"]')
                                ?.dispatchEvent(new Event("click", { bubbles: true }))
                            }
                          >
                            Ver todas
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {alteredMetrics.slice(0, 6).map((metric: any, index: number) => (
                            <MetricCard key={index} metric={metric} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-heading flex items-center gap-2 text-amber-800">
                            <Shield className="h-4 w-4" />
                            Recomendações
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.map((line, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-amber-900 font-body"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* ============ MÉTRICAS ============ */}
                  <TabsContent value="metrics" className="mt-5">
                    {healthMetrics.length > 0 ? (
                      <>
                        {/* Filter pills */}
                        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                          <span className="font-body">
                            {metricStats.total} métricas encontradas
                          </span>
                          {metricStats.altered > 0 && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-red-600 font-semibold">
                                {metricStats.altered} alterada{metricStats.altered > 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {healthMetrics.map((metric: any, index: number) => (
                            <MetricCard key={index} metric={metric} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon={Activity}
                        title="Nenhuma métrica encontrada"
                        description="Não foram identificadas métricas de saúde específicas neste exame."
                      />
                    )}
                  </TabsContent>

                  {/* ============ ACHADOS CLÍNICOS ============ */}
                  {hasStructuredData && (
                    <TabsContent value="findings" className="mt-5 space-y-5">
                      {/* Clinical Findings */}
                      {clinicalFindings.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Beaker className="h-5 w-5 text-muted-foreground" />
                                Achados Clínicos
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs">
                                {clinicalFindings.length}
                              </Badge>
                            </div>
                            <CardDescription className="font-body">
                              Informações clínicas extraídas do laudo
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {(expandedFindings
                              ? clinicalFindings
                              : clinicalFindings.slice(0, 5)
                            ).map((finding, index) => (
                              <div
                                key={`${buildFindingDescription(finding)}-${index}`}
                                className="rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5 h-2 w-2 rounded-full bg-charcoal/60 shrink-0" />
                                  <div>
                                    <p className="font-heading font-semibold text-sm text-foreground">
                                      {finding.title}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed font-body">
                                      {buildFindingDescription(finding)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {clinicalFindings.length > 5 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs gap-1 mt-1"
                                onClick={() => setExpandedFindings(!expandedFindings)}
                              >
                                {expandedFindings ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" />
                                    Mostrar menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    Ver todos os {clinicalFindings.length} achados
                                  </>
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Diagnostic Impression + Narrative */}
                      {(diagnosticImpression.length > 0 || narrativeAnalysis) && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                              <ClipboardList className="h-5 w-5 text-muted-foreground" />
                              Impressão Diagnóstica
                            </CardTitle>
                            <CardDescription className="font-body">
                              Síntese clínica do laudo
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {diagnosticImpression.length > 0
                              ? diagnosticImpression.map((item, index) => (
                                  <div
                                    key={`${buildImpressionDescription(item)}-${index}`}
                                    className="rounded-lg border border-border bg-background p-3"
                                  >
                                    <p className="text-sm text-foreground leading-relaxed font-body">
                                      {buildImpressionDescription(item)}
                                    </p>
                                  </div>
                                ))
                              : narrativeAnalysis && (
                                  <p className="text-sm text-foreground leading-relaxed font-body">
                                    {narrativeAnalysis}
                                  </p>
                                )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Suggested Diagnoses */}
                      {suggestedDiagnoses.length > 0 && (
                        <Card className="border-green-100">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-green-600" />
                                Diagnósticos Sugeridos
                              </CardTitle>
                              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                                {suggestedDiagnoses.length}
                              </Badge>
                            </div>
                            <CardDescription className="font-body">
                              Hipóteses diagnósticas sustentadas pelo exame
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {suggestedDiagnoses.map((diagnosis, index) => (
                              <div
                                key={`${buildDiagnosisDescription(diagnosis)}-${index}`}
                                className="rounded-lg border border-green-200 bg-green-50/50 p-4 transition-colors hover:bg-green-50"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-heading font-semibold text-sm text-green-900">
                                      {diagnosis.condition || "Condição sugerida"}
                                    </p>
                                    <p className="mt-1 text-xs text-green-800 leading-relaxed font-body">
                                      {buildDiagnosisDescription(diagnosis)}
                                    </p>
                                    {diagnosis.notes && (
                                      <p className="mt-2 text-xs text-green-700 font-body italic">
                                        {diagnosis.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  )}

                  {/* ============ DADOS DO EXAME ============ */}
                  <TabsContent value="details" className="mt-5 space-y-5">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          Informações Completas do Exame
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                          <MetadataRow label="Nome" value={examData.exam.name} />
                          <MetadataRow
                            label="Data do exame"
                            value={
                              examData.exam.examDate
                                ? new Date(examData.exam.examDate).toLocaleDateString("pt-BR")
                                : undefined
                            }
                          />
                          <MetadataRow
                            label="Laboratório"
                            value={examData.exam.laboratoryName}
                          />
                          <MetadataRow
                            label="Médico solicitante"
                            value={examData.exam.requestingPhysician}
                          />
                          <MetadataRow
                            label="Data de upload"
                            value={new Date(examData.exam.uploadDate).toLocaleDateString(
                              "pt-BR"
                            )}
                          />
                          <MetadataRow
                            label="Tipo de arquivo"
                            value={examData.exam.fileType}
                            capitalize
                          />
                          {structuredMetadata.examType && (
                            <MetadataRow
                              label="Categoria clínica"
                              value={structuredMetadata.examType}
                            />
                          )}
                          {structuredMetadata.examModality && (
                            <MetadataRow
                              label="Modalidade"
                              value={structuredMetadata.examModality}
                            />
                          )}
                          {structuredMetadata.bodyRegion && (
                            <MetadataRow
                              label="Região/material"
                              value={structuredMetadata.bodyRegion}
                            />
                          )}
                          {structuredMetadata.technique && (
                            <MetadataRow
                              label="Técnica"
                              value={structuredMetadata.technique}
                            />
                          )}
                          {structuredMetadata.collectionDate && (
                            <MetadataRow
                              label="Coleta"
                              value={formatStructuredDate(structuredMetadata.collectionDate) || undefined}
                            />
                          )}
                          {structuredMetadata.reportDate && (
                            <MetadataRow
                              label="Data do laudo"
                              value={formatStructuredDate(structuredMetadata.reportDate) || undefined}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Danger zone */}
                    <Card className="border-red-100">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-heading font-semibold text-foreground">
                            Excluir este exame
                          </p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">
                            Esta ação é irreversível. Todos os dados e métricas serão removidos.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="gap-1.5 shrink-0"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="Exame não encontrado"
                description="O exame solicitado não foi encontrado ou você não tem permissão para acessá-lo."
              >
                <Link href="/results">
                  <Button variant="outline" size="sm">
                    Voltar para a lista de exames
                  </Button>
                </Link>
              </EmptyState>
            )}
          </div>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Excluir exame</DialogTitle>
            <DialogDescription className="font-body">
              Tem certeza que deseja excluir este exame? Esta ação não pode ser
              desfeita e todos os dados associados, incluindo métricas de saúde,
              serão permanentemente removidos.
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
              onClick={() => {
                deleteMutation.mutate();
                setDeleteDialogOpen(false);
              }}
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

// --- Metadata row for details tab ---

function MetadataRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value?: string | null;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground font-body">{label}</span>
      <span
        className={cn(
          "text-sm font-medium text-foreground font-body text-right max-w-[60%] truncate",
          capitalize && "capitalize"
        )}
      >
        {value || "Não informado"}
      </span>
    </div>
  );
}

// --- Empty state component ---

function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-8 flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-heading font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground font-body mb-4 max-w-md">
          {description}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}

// --- Loading skeleton ---

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {/* Info chips skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-80 rounded-lg" />
      {/* Content skeleton */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-10 rounded-full mb-2" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-16 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
