import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Exam } from "@shared/schema";
import { useProfiles } from "@/hooks/use-profiles";
import { useUploadManager } from "@/hooks/use-upload-manager";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUpload from "@/components/ui/file-upload";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Clock3,
  FileText,
  FlaskConical,
  Microscope,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react";

interface ExamUploadLauncherProps {
  title?: string;
  description?: string;
  buttonLabel?: string;
  exams?: Exam[];
  className?: string;
  compact?: boolean;
}

const formatExamDate = (value?: string | Date | null) => {
  if (!value) return "Data não disponível";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Data não disponível";
  }

  return format(parsed, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
};

export function ExamUploadLauncher({
  title = "Analisar exames com IA",
  description = "Envie resultados laboratoriais, exames de imagem, biópsias, endoscopias, ecocardiogramas e outros laudos sem sair do prontuário.",
  buttonLabel = "Enviar exames",
  exams,
  className,
  compact = false,
}: ExamUploadLauncherProps) {
  const [, setLocation] = useLocation();
  const { activeProfile } = useProfiles();
  const { uploads } = useUploadManager();
  const [open, setOpen] = useState(false);

  const { data: fetchedExams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/exams", activeProfile?.id],
    queryFn: async () => {
      const queryParam = activeProfile?.id ? `?profileId=${activeProfile.id}` : "";
      const response = await fetch(`/api/exams${queryParam}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao buscar exames");
      }

      return response.json();
    },
    enabled: Boolean(activeProfile?.id) && !exams,
  });

  const examList = exams ?? fetchedExams;
  const activeUploads = uploads.filter((upload) =>
    ["uploading", "queued", "processing"].includes(upload.status)
  );
  const latestExams = useMemo(() => {
    return [...examList]
      .sort((left, right) => {
        const leftDate = new Date(left.examDate || left.uploadDate).getTime();
        const rightDate = new Date(right.examDate || right.uploadDate).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 6);
  }, [examList]);

  const supportedExamTypes = [
    "Laboratoriais",
    "Tomografia",
    "Ressonância",
    "Biópsia",
    "Endoscopia",
    "Ecocardiograma",
  ];

  return (
    <>
      <Card
        className={cn(
          "border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 shadow-sm",
          compact ? "overflow-hidden" : "",
          className
        )}
      >
        <CardContent className={compact ? "p-4" : "p-5"}>
          <div className={cn("flex gap-4", compact ? "flex-col" : "flex-col xl:flex-row xl:items-center xl:justify-between")}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <BrainCircuit className="h-5 w-5 text-slate-700" />
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {supportedExamTypes.map((item) => (
                    <Badge key={item} variant="outline" className="bg-white text-slate-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className={cn("flex gap-3", compact ? "flex-col" : "flex-col sm:flex-row sm:items-center")}>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  <span>{activeUploads.length > 0 ? `${activeUploads.length} envio(s) em processamento` : `${examList.length} exame(s) no histórico`}</span>
                </div>
              </div>
              <Button type="button" onClick={() => setOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                {buttonLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-5xl">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
              <DialogTitle className="text-xl text-slate-900">Central de exames do atendimento</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Envie laudos laboratoriais, tomografias, ressonâncias, ecografias, biópsias, endoscopias, ecocardiogramas, manometrias e outros exames para análise automática e vínculo imediato ao prontuário.
              </DialogDescription>
            </DialogHeader>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.15fr)_380px]">
              <div className="min-h-0 overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <FlaskConical className="mb-3 h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-900">Laboratoriais</p>
                      <p className="mt-1 text-xs text-slate-600">Hemograma, bioquímica, hormônios, marcadores inflamatórios e outros painéis.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <ScanLine className="mb-3 h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-900">Imagem e função</p>
                      <p className="mt-1 text-xs text-slate-600">Tomografia, ressonância, ecografia, ecocardiograma, endoscopia, manometria e laudos correlatos.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <Microscope className="mb-3 h-5 w-5 text-violet-600" />
                      <p className="text-sm font-semibold text-slate-900">Patologia</p>
                      <p className="mt-1 text-xs text-slate-600">Biópsias, anatomopatológico, citologia e demais exames com descrição histológica.</p>
                    </div>
                  </div>

                  <FileUpload />

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                      <div className="space-y-1">
                        <p className="font-medium">Fluxo clínico do exame</p>
                        <p>
                          A IA identifica o tipo de exame, extrai metadados do laudo, organiza os achados relevantes, registra o exame no histórico do paciente e vincula diagnósticos compatíveis quando houver CID claramente relacionado ao documento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50/80 px-6 py-5 lg:border-l lg:border-t-0">
                <div className="space-y-5">
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-slate-900">Fila de processamento</CardTitle>
                      <CardDescription>
                        Acompanhe os exames que ainda estão sendo analisados.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activeUploads.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum exame em processamento no momento.</p>
                      ) : (
                        activeUploads.map((upload) => (
                          <div key={upload.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-sm font-medium text-slate-900">{upload.name}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {upload.status === "queued" && "Na fila para análise"}
                              {upload.status === "uploading" && "Enviando arquivo"}
                              {upload.status === "processing" && "Extraindo e estruturando o laudo"}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-slate-900">Exames recentes</CardTitle>
                      <CardDescription>
                        Histórico mais recente do paciente em atendimento.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {latestExams.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum exame vinculado a este paciente ainda.</p>
                      ) : (
                        latestExams.map((exam) => (
                          <button
                            key={exam.id}
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              setLocation(`/report/${exam.id}`);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-white"
                          >
                            <div className="rounded-xl bg-white p-2 shadow-sm">
                              <FileText className="h-4 w-4 text-slate-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{exam.name || "Exame sem título"}</p>
                              <p className="mt-1 text-xs text-slate-600">{formatExamDate(exam.examDate || exam.uploadDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={exam.status === "analyzed" ? "default" : "secondary"}>
                                {exam.status === "analyzed" ? "Analisado" : "Processando"}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-slate-400" />
                            </div>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-700" />
                      <div className="space-y-1 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">O que vai para o histórico</p>
                        <p>Data do exame, médico solicitante, tipo de exame, achados relevantes, impressão/conclusão e diagnósticos relacionados quando houver suporte no laudo.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
