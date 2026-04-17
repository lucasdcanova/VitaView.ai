import { useMemo } from "react";
import type { Exam } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AppointmentExamHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exams: Exam[];
  patientName?: string | null;
  onOpenExam: (examId: number) => void;
}

const READY_STATUSES = new Set(["analyzed", "extraction_only"]);
const IN_PROGRESS_STATUSES = new Set(["pending", "queued", "processing", "analyzing", "extracted"]);

const normalizeStatus = (status?: string | null) => (status || "").toLowerCase();

const isReady = (status?: string | null) => READY_STATUSES.has(normalizeStatus(status));

const formatExamDate = (value?: string | Date | null) => {
  if (!value) return "Data indisponivel";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Data indisponivel";

  return format(parsed, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
};

const getExamTimestamp = (exam: Exam) => {
  const primaryDate = exam.examDate || exam.uploadDate;
  const parsed = new Date(primaryDate);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const fallback = new Date(exam.uploadDate);
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
};

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
      buttonLabel: "Abrir resultado",
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
      buttonLabel: "Indisponivel",
    };
  }

  return {
    label: "Em analise",
    badgeVariant: "secondary" as const,
    icon: Clock3,
    toneClassName:
      "border-blue-200/80 bg-blue-50/80 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-100",
    iconClassName: "text-blue-600 dark:text-blue-300",
    buttonLabel: "Em processamento",
  };
};

export function AppointmentExamHistoryDialog({
  open,
  onOpenChange,
  exams,
  patientName,
  onOpenExam,
}: AppointmentExamHistoryDialogProps) {
  const sortedExams = useMemo(() => {
    return [...exams].sort((left, right) => getExamTimestamp(right) - getExamTimestamp(left));
  }, [exams]);

  const analyzedCount = sortedExams.filter((exam) => isReady(exam.status)).length;
  const processingCount = sortedExams.filter((exam) => IN_PROGRESS_STATUSES.has(normalizeStatus(exam.status))).length;
  const latestExam = sortedExams[0] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:max-h-[85vh]">
        <DialogHeader className="border-b border-border/70 bg-gradient-to-br from-background via-background to-muted/20 px-6 py-5 text-left">
          <DialogTitle className="text-lg text-foreground">Historico de resultados</DialogTitle>
          <DialogDescription className="max-w-2xl">
            {patientName
              ? `Veja os exames vinculados a ${patientName} sem sair do atendimento.`
              : "Veja os exames vinculados ao paciente sem sair do atendimento."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {sortedExams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card shadow-sm">
                <FlaskConical className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum exame encontrado</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Assim que novos resultados forem enviados e vinculados ao prontuario, eles aparecem aqui.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Resultados</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{sortedExams.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Exames vinculados ao paciente</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Analisados</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{analyzedCount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Resultados prontos para abertura</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Mais recente</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {latestExam ? formatExamDate(latestExam.examDate || latestExam.uploadDate) : "Sem data"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {processingCount > 0 ? `${processingCount} ainda em processamento` : "Todos ja estruturados"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card shadow-sm">
                <ScrollArea className="max-h-[55vh]">
                  <div className="space-y-3 p-4">
                    {sortedExams.map((exam) => {
                      const statusMeta = getStatusMeta(exam.status);
                      const StatusIcon = statusMeta.icon;
                      const canOpenExam = isReady(exam.status);

                      return (
                        <div
                          key={exam.id}
                          className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/80 p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("rounded-2xl border p-2.5 shadow-sm", statusMeta.toneClassName)}>
                              <StatusIcon className={cn("h-4 w-4", statusMeta.iconClassName)} />
                            </div>

                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {exam.name || "Exame sem titulo"}
                                </p>
                                <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                              </div>

                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{formatExamDate(exam.examDate || exam.uploadDate)}</span>
                                {exam.laboratoryName && <span>{exam.laboratoryName}</span>}
                                {exam.requestingPhysician && <span>{exam.requestingPhysician}</span>}
                              </div>

                              {exam.processingError && (
                                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                                  {exam.processingError}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant={canOpenExam ? "default" : "outline"}
                              className="gap-2"
                              disabled={!canOpenExam}
                              onClick={() => {
                                onOpenChange(false);
                                onOpenExam(exam.id);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              {statusMeta.buttonLabel}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
