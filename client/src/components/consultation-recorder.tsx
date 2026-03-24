import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mic,
  Square,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrandLoader } from "@/components/ui/brand-loader";
import {
  formatRecordingTime,
  useConsultationRecording,
} from "@/hooks/use-consultation-recording";

interface ConsultationRecorderProps {
  profileId?: number;
  patientName?: string | null;
  disabled?: boolean;
  className?: string;
  returnPath?: string;
}

export function ConsultationRecorder({
  profileId,
  patientName,
  disabled = false,
  className,
  returnPath = "/atendimento",
}: ConsultationRecorderProps) {
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const {
    recordingState,
    recordingTime,
    errorMessage,
    currentSession,
    startRecording,
    togglePause,
    stopRecording,
    cancelRecording,
    clearError,
  } = useConsultationRecording();

  const sessionPatientName = currentSession?.patientName || patientName || "Paciente atual";
  const isRecordingAnotherPatient =
    currentSession?.profileId !== null &&
    profileId !== undefined &&
    currentSession?.profileId !== profileId;

  const sessionContextText = isRecordingAnotherPatient
    ? `A gravacao ativa pertence a ${sessionPatientName}.`
    : `Paciente atual: ${sessionPatientName}.`;

  const handleConfirmedStart = () => {
    setShowConsentDialog(false);
    void startRecording({
      profileId,
      patientName,
      returnPath,
    });
  };

  const renderContent = () => {
    switch (recordingState) {
      case "idle":
        return (
          <>
            <Button
              variant="default"
              size="default"
              onClick={() => setShowConsentDialog(true)}
              disabled={disabled}
              className="w-full sm:w-auto gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg transition-all duration-200 font-medium px-4 py-2"
            >
              <Mic className="h-4 w-4" />
              Gravar Consulta
            </Button>

            <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Consentimento do Paciente
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-muted-foreground">
                    E extremamente importante solicitar e confirmar o
                    consentimento do paciente antes de iniciar a gravacao.
                    <br />
                    <br />
                    Recomendamos que voce inicie a gravacao perguntando:
                    <br />
                    <em>
                      "Podemos gravar esta consulta para auxiliar no seu
                      prontuario?"
                    </em>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmedStart}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Entendi, Iniciar Gravacao
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );

      case "recording":
      case "paused":
        return (
          <Card
            className={cn(
              "w-full overflow-hidden rounded-2xl border-2 p-3 shadow-sm",
              recordingState === "recording"
                ? "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10"
                : "border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10",
              className
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 h-3 w-3 shrink-0 rounded-full",
                      recordingState === "recording"
                        ? "bg-red-500 animate-pulse"
                        : "bg-amber-500"
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.16em]">
                        {recordingState === "recording" ? "Consulta em gravacao" : "Gravacao pausada"}
                      </p>
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[12px] font-semibold leading-none shadow-[0_1px_0_rgba(255,255,255,0.45)_inset]",
                          recordingState === "recording"
                            ? "border-red-200 bg-white/80 text-red-700 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-100"
                            : "border-amber-200 bg-white/80 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100"
                        )}
                      >
                        {formatRecordingTime(recordingTime)}
                      </div>
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-tight text-foreground break-words">
                      {sessionPatientName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePause}
                    className="h-9 w-full rounded-xl border border-border/60 bg-background/70 sm:h-8 sm:w-8 sm:border-transparent sm:bg-transparent"
                    title={recordingState === "recording" ? "Pausar" : "Retomar"}
                  >
                    {recordingState === "recording" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={stopRecording}
                    className="h-9 gap-1.5 rounded-xl bg-destructive text-[12px] text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Finalizar</span>
                    <span className="sm:hidden">Parar</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelRecording}
                    className="h-9 rounded-xl border border-border/60 text-[12px] text-muted-foreground hover:bg-muted/60 hover:text-foreground sm:border-transparent"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border px-3 py-2",
                  recordingState === "recording"
                    ? "border-red-200/80 bg-white/55 dark:border-red-500/20 dark:bg-red-950/15"
                    : "border-amber-200/80 bg-white/55 dark:border-amber-500/20 dark:bg-amber-950/15"
                )}
              >
                <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  {recordingState === "recording" ? "Consulta em gravacao" : "Gravacao pausada"}
                  {recordingState === "recording"
                    ? ". A consulta segue sendo gravada mesmo se voce navegar para outras telas."
                    : ". A gravacao fica pausada ate voce retomar."}{" "}
                  {sessionContextText}
                </p>
              </div>
            </div>
          </Card>
        );

      case "processing":
        return (
          <Card className={cn("w-full rounded-2xl border-2 border-border bg-muted/35 p-3", className)}>
            <div className="flex items-center gap-3">
              <BrandLoader className="h-5 w-5 animate-spin text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Processando gravacao...</p>
                <p className="text-xs text-muted-foreground">
                  Transcrevendo audio e gerando a anamnese de {sessionPatientName}
                </p>
              </div>
            </div>
          </Card>
        );

      case "success":
        return (
          <Card className={cn("w-full rounded-2xl border-2 border-green-300 bg-green-50 p-3 dark:border-green-500/45 dark:bg-green-500/10", className)}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  Transcricao concluida
                </p>
                <p className="text-xs text-green-700/80 dark:text-green-200/80">
                  A consulta de {sessionPatientName} esta pronta para revisao.
                </p>
              </div>
            </div>
          </Card>
        );

      case "error":
        return (
          <Card className={cn("w-full rounded-2xl border-2 border-red-300 bg-red-50 p-3 dark:border-red-500/50 dark:bg-red-500/10", className)}>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-700 dark:text-red-300">
                  Erro na gravacao
                </p>
                <p className="text-xs text-red-700/85 dark:text-red-200/85">
                  {errorMessage}
                </p>
                <p className="text-[11px] text-red-700/75 dark:text-red-200/75 mt-1">
                  {sessionContextText}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-100/80 dark:hover:bg-red-500/20"
              >
                Tentar novamente
              </Button>
            </div>
          </Card>
        );
    }
  };

  return <div className={cn("consultation-recorder", className)}>{renderContent()}</div>;
}
