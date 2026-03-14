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
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg transition-all duration-200 font-medium px-4 py-2"
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
              "p-3 border-2",
              recordingState === "recording"
                ? "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10"
                : "border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10"
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full mt-1",
                      recordingState === "recording"
                        ? "bg-red-500 animate-pulse"
                        : "bg-amber-500"
                    )}
                  />
                  <span className="font-mono text-lg font-semibold text-foreground">
                    {formatRecordingTime(recordingTime)}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {recordingState === "recording" ? "Consulta em gravacao" : "Gravacao pausada"}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {sessionPatientName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePause}
                  className="h-8 w-8"
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
                  className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Square className="h-3 w-3" />
                  Finalizar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelRecording}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  Cancelar
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {recordingState === "recording"
                ? "A consulta segue sendo gravada mesmo se voce navegar para outras telas."
                : "A gravacao fica pausada ate voce retomar."}{" "}
              {sessionContextText}
            </p>
          </Card>
        );

      case "processing":
        return (
          <Card className="p-3 border-2 border-border bg-muted/35">
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
          <Card className="p-3 border-2 border-green-300 bg-green-50 dark:border-green-500/45 dark:bg-green-500/10">
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
          <Card className="p-3 border-2 border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10">
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
