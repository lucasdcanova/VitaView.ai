import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Exam, HealthMetric } from "@shared/schema";
import { buildObjectiveMetricSummary, formatMetricDisplayName, getObjectiveMetricStatus } from "@shared/exam-normalizer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { getExamDetails } from "@/lib/api";
import {
  buildFindingDescription,
  buildImpressionDescription,
  normalizeExamNarrative,
  parseStructuredExamAnalysis,
} from "@/lib/exam-analysis";
import { cn } from "@/lib/utils";
import { useUploadManager } from "@/hooks/use-upload-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentExamWorkspaceProps {
  profileId?: number | null;
  exams: Exam[];
  healthMetrics: HealthMetric[];
  onOpenExam: (examId: number) => void;
  onOpenHistory: () => void;
  onOpenEvolution: () => void;
}

const READY_STATUSES = new Set(["analyzed", "extraction_only"]);
const IN_PROGRESS_STATUSES = new Set(["pending", "queued", "processing", "analyzing", "extracted"]);

const formatExamDate = (value?: string | Date | null) => {
  if (!value) return "Data indisponível";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Data indisponível";

  return format(parsed, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
};

const getExamTimestamp = (exam: Exam) => {
  const primaryDate = exam.examDate || exam.uploadDate;
  const parsed = new Date(primaryDate);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const fallback = new Date(exam.uploadDate);
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
};

const normalizeStatus = (status?: string | null) => (status || "").toLowerCase();

const isReady = (status?: string | null) => READY_STATUSES.has(normalizeStatus(status));

const isInProgress = (status?: string | null) => IN_PROGRESS_STATUSES.has(normalizeStatus(status));

const isMetricAbnormal = (metric: any) => getObjectiveMetricStatus(metric) !== "normal";

const getStatusMeta = (status?: string | null) => {
  const normalized = normalizeStatus(status);

  if (READY_STATUSES.has(normalized)) {
    return {
      label: "Analisado",
      badgeVariant: "default" as const,
      icon: CheckCircle2,
      toneClassName:
        "border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100",
      iconClassName: "text-emerald-600 dark:text-emerald-300",
    };
  }

  if (normalized === "failed") {
    return {
      label: "Falhou",
      badgeVariant: "destructive" as const,
      icon: AlertTriangle,
      toneClassName:
        "border-red-200/80 bg-red-50/80 text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-100",
      iconClassName: "text-red-600 dark:text-red-300",
    };
  }

  return {
    label: "Em análise",
    badgeVariant: "secondary" as const,
    icon: Clock3,
    toneClassName:
      "border-blue-200/80 bg-blue-50/80 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-100",
    iconClassName: "text-blue-600 dark:text-blue-300",
  };
};

export function AppointmentExamWorkspace({
  profileId,
  exams,
  healthMetrics,
  onOpenExam,
  onOpenHistory,
  onOpenEvolution,
}: AppointmentExamWorkspaceProps) {
  const { uploads } = useUploadManager();

  const sortedExams = useMemo(() => {
    return [...exams].sort((left, right) => getExamTimestamp(right) - getExamTimestamp(left));
  }, [exams]);

  const scopedUploads = useMemo(() => {
    return uploads.filter((upload) => {
      const sameProfile = profileId ? upload.profileId === profileId : true;
      return sameProfile && ["uploading", "queued", "processing"].includes(upload.status);
    });
  }, [profileId, uploads]);

  const analyzedCount = sortedExams.filter((exam) => isReady(exam.status)).length;
  const pendingCount = Math.max(
    sortedExams.filter((exam) => isInProgress(exam.status)).length,
    scopedUploads.length
  );
  const abnormalMetricCount = new Set(
    healthMetrics
      .filter((metric) => isMetricAbnormal(metric))
      .map((metric) => `${metric.examId ?? "sem-exame"}:${metric.name}`)
  ).size;

  const latestAnalyzedExam = sortedExams.find((exam) => isReady(exam.status)) ?? null;

  const [selectedExamId, setSelectedExamId] = useState<number | null>(sortedExams[0]?.id ?? null);

  useEffect(() => {
    if (sortedExams.length === 0) {
      setSelectedExamId(null);
      return;
    }

    const stillExists = sortedExams.some((exam) => exam.id === selectedExamId);
    if (!stillExists) {
      setSelectedExamId(sortedExams[0].id);
    }
  }, [selectedExamId, sortedExams]);

  const selectedExam = sortedExams.find((exam) => exam.id === selectedExamId) ?? null;

  const { data: selectedExamDetails, isLoading: isSelectedExamLoading } = useQuery({
    queryKey: ["/api/exams", selectedExamId, "workspace-preview"],
    queryFn: () => getExamDetails(selectedExamId as number),
    enabled: Boolean(selectedExamId),
    staleTime: 20_000,
  });

  const previewExam = selectedExamDetails?.exam ?? selectedExam;
  const previewResult = selectedExamDetails?.result ?? null;
  const structuredAnalysis = parseStructuredExamAnalysis(previewResult?.detailedAnalysis);
  const structuredSummary =
    normalizeExamNarrative(
      previewResult?.summary || structuredAnalysis?.summary || structuredAnalysis?.detailedAnalysis || ""
    );
  const clinicalFindings = structuredAnalysis?.clinicalFindings || [];
  const diagnosticImpression = structuredAnalysis?.diagnosticImpression || [];
  const previewMetrics = Array.isArray(previewResult?.healthMetrics)
    ? (previewResult.healthMetrics as any[])
    : healthMetrics.filter((metric) => metric.examId === previewExam?.id);
  const abnormalPreviewMetrics = previewMetrics.filter((metric: any) => isMetricAbnormal(metric));
  const objectivePreviewMetricHighlights = abnormalPreviewMetrics
    .slice(0, 2)
    .map((metric: any) => buildObjectiveMetricSummary(metric))
    .filter(Boolean);
  const previewStatus = getStatusMeta(previewExam?.status);
  const PreviewStatusIcon = previewStatus.icon;

  const quickHighlights = [
    objectivePreviewMetricHighlights[0] || "",
    clinicalFindings[0] ? buildFindingDescription(clinicalFindings[0]) : "",
    diagnosticImpression[0] ? buildImpressionDescription(diagnosticImpression[0]) : "",
  ].filter(Boolean);

  const keySummary = quickHighlights[0] || structuredSummary || "A análise estará disponível assim que a IA concluir o processamento.";
  const attentionSummary =
    objectivePreviewMetricHighlights[1] ||
    normalizeExamNarrative(clinicalFindings[0]?.interpretation || diagnosticImpression[0]?.notes) ||
        "Correlacione a leitura da IA com o contexto clínico do atendimento.";
  const labName =
    normalizeExamNarrative(
      previewExam?.laboratoryName ||
      structuredAnalysis?.examMetadata?.institutionName ||
      structuredAnalysis?.examMetadata?.laboratoryName
    );

  const showEmptyState = sortedExams.length === 0;
  const showProcessingState =
    !isSelectedExamLoading &&
    Boolean(previewExam) &&
    !previewResult &&
    !isReady(previewExam?.status);
  const showErrorState = Boolean(previewExam?.processingError) || normalizeStatus(previewExam?.status) === "failed";

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-4 border-b border-border/70 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-foreground">Central de resultados no atendimento</CardTitle>
            <CardDescription className="max-w-3xl">
              Acompanhe o que acabou de entrar, veja o status da análise e revise os principais achados sem sair da consulta.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={onOpenEvolution}>
              <BarChart3 className="h-4 w-4" />
              Ver evolução
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={onOpenHistory} disabled={showEmptyState}>
              <ArrowUpRight className="h-4 w-4" />
              Histórico completo
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Exames</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{sortedExams.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Resultados já vinculados ao paciente</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Prontos</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{analyzedCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Exames com leitura disponível</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Em andamento</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{pendingCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload ou extração ainda em andamento</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Alertas</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{abnormalMetricCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {latestAnalyzedExam ? `Último pronto em ${formatExamDate(latestAnalyzedExam.examDate || latestAnalyzedExam.uploadDate)}` : "Sem alertas estruturados ainda"}
            </p>
          </div>
        </div>

        {scopedUploads.length > 0 && (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">Uploads em fila para este atendimento</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  A IA atualiza esta área automaticamente assim que os arquivos terminarem de ser estruturados.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {scopedUploads.slice(0, 4).map((upload) => (
                  <Badge key={upload.id} variant="outline" className="border-blue-300/70 bg-white/80 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                    {upload.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5">
        {showEmptyState ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card shadow-sm">
              <FlaskConical className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum exame analisado neste atendimento</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Envie um laudo na central acima. Assim que o upload terminar, esta área passa a mostrar o status e os principais achados clínicos.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Últimos exames enviados</p>
                  <p className="text-xs text-muted-foreground">Selecione um exame para revisar a leitura rápida</p>
                </div>
                <Badge variant="outline">{sortedExams.length} itens</Badge>
              </div>

              <ScrollArea className="h-[440px]">
                <div className="space-y-3 pr-3">
                  {sortedExams.map((exam) => {
                    const statusMeta = getStatusMeta(exam.status);
                    const StatusIcon = statusMeta.icon;
                    const isSelected = exam.id === selectedExamId;

                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => setSelectedExamId(exam.id)}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary/60 bg-primary/5 shadow-sm"
                            : "border-border/70 bg-card hover:border-border hover:bg-muted/35"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("rounded-2xl border p-2.5 shadow-sm", statusMeta.toneClassName)}>
                            <StatusIcon className={cn("h-4 w-4", statusMeta.iconClassName)} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {exam.name || "Exame sem título"}
                              </p>
                              <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                              {formatExamDate(exam.examDate || exam.uploadDate)}
                            </p>

                            {exam.laboratoryName && (
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {exam.laboratoryName}
                              </p>
                            )}

                            {exam.processingError && (
                              <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                                {exam.processingError}
                              </p>
                            )}
                          </div>

                          <ChevronRight
                            className={cn(
                              "mt-0.5 h-4 w-4 flex-shrink-0",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/15 p-5 shadow-sm">
              {isSelectedExamLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-24 w-full" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : previewExam ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={previewStatus.badgeVariant} className="gap-1.5">
                          <PreviewStatusIcon className="h-3.5 w-3.5" />
                          {previewStatus.label}
                        </Badge>
                        {labName && <Badge variant="outline">{labName}</Badge>}
                        <Badge variant="outline">{formatExamDate(previewExam.examDate || previewExam.uploadDate)}</Badge>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">
                          {previewExam.name || "Exame sem título"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {showProcessingState
                            ? "O exame já está vinculado ao prontuário. Assim que a análise concluir, o resumo aparece aqui."
                            : "Resumo clínico condensado para apoiar a decisão durante a consulta."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isReady(previewExam.status) && (
                        <Button size="sm" className="gap-2" onClick={() => onOpenExam(previewExam.id)}>
                          <FileText className="h-4 w-4" />
                          Abrir análise completa
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="gap-2" onClick={onOpenEvolution}>
                        <Activity className="h-4 w-4" />
                        Ver evolução
                      </Button>
                    </div>
                  </div>

                  {showErrorState ? (
                    <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-4 text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-100">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium">Falha no processamento do exame</p>
                          <p className="text-sm">
                            {previewExam.processingError || "A IA não conseguiu concluir a leitura deste documento."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : showProcessingState ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-blue-200/80 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                        <div className="flex items-start gap-3">
                          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-300" />
                          <div className="space-y-1">
                            <p className="font-medium text-blue-950 dark:text-blue-100">Análise em andamento</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              Continue o atendimento normalmente. A leitura rápida deste exame entra aqui assim que a estruturação terminar.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          {
                            title: "Arquivo recebido",
                            done: true,
                          },
                          {
                            title: "Extração do laudo",
                            done: ["processing", "analyzing", "extracted", "analyzed", "extraction_only"].includes(normalizeStatus(previewExam.status)),
                          },
                          {
                            title: "Resumo clínico",
                            done: isReady(previewExam.status),
                          },
                        ].map((step) => (
                          <div
                            key={step.title}
                            className={cn(
                              "rounded-2xl border p-4",
                              step.done
                                ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                                : "border-border/70 bg-card"
                            )}
                          >
                            <p className="text-sm font-medium text-foreground">{step.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {step.done ? "Etapa concluída" : "Aguardando processamento"}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-card p-4">
                        <p className="text-sm font-medium text-foreground">Próximo passo do médico</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Assim que o status mudar para analisado, revise a leitura rápida aqui e abra o relatório completo apenas se precisar aprofundar os achados.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Leitura rápida</p>
                          <p className="mt-3 text-sm leading-6 text-foreground">{keySummary}</p>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ponto de atenção</p>
                          <p className="mt-3 text-sm leading-6 text-foreground">{attentionSummary}</p>
                        </div>
                      </div>

                      {quickHighlights.length > 1 && (
                        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                          <p className="text-sm font-semibold text-foreground">Achados-chave do laudo</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {quickHighlights.slice(0, 4).map((highlight, index) => (
                              <div key={`${highlight}-${index}`} className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                                <p className="text-sm text-foreground">{highlight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {previewMetrics.length > 0 && (
                        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-foreground">Parâmetros mais úteis no atendimento</p>
                            <p className="text-xs text-muted-foreground">Até 4 marcadores estruturados deste exame</p>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {previewMetrics.slice(0, 4).map((metric: any, index: number) => (
                              <div
                                key={`${metric?.name || "metric"}-${index}`}
                                className={cn(
                                  "rounded-2xl border p-3",
                                  isMetricAbnormal(metric)
                                    ? "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
                                    : "border-border/70 bg-muted/25"
                                )}
                              >
                                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                  {typeof metric?.name === "string" ? formatMetricDisplayName(metric.name) : "Parâmetro"}
                                </p>
                                <p className="mt-2 text-lg font-semibold text-foreground">
                                  {metric?.value ?? "--"} {metric?.unit || ""}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {metric?.referenceMin && metric?.referenceMax
                                    ? `Referência ${metric.referenceMin}-${metric.referenceMax} ${metric?.unit || ""}`
                                    : metric?.status || "Sem faixa de referência"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">Selecione um exame para visualizar a leitura rápida.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
