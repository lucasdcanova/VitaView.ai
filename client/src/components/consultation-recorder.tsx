import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Loader2, AlertCircle, CheckCircle2, Pause, Play, Info, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
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


interface ConsultationRecorderProps {
  onTranscriptionComplete: (result: {
    transcription: string;
    anamnesis: string;
    extractedData: {
      summary: string;
      diagnoses: any[];
      medications: any[];
      allergies: any[];
      comorbidities: string[];
      surgeries: any[];
    };
  }) => void;
  profileId?: number;
  disabled?: boolean;
  className?: string;
}

type RecordingState = "idle" | "recording" | "paused" | "processing" | "error" | "success";

export function ConsultationRecorder({
  onTranscriptionComplete,
  profileId,
  disabled = false,
  className
}: ConsultationRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [, setLocation] = useLocation();


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Formatar tempo de gravação
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Limpar recursos
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Iniciar gravação
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      // Verificar se a API de mídia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Verificar se é um contexto inseguro (HTTP)
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          throw new Error("INSECURE_CONTEXT");
        }
        throw new Error("API_NOT_AVAILABLE");
      }

      // Verificar permissão prévia se a API estiver disponível
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permissionStatus.state === 'denied') {
            throw new Error("PERMISSION_DENIED");
          }
        } catch (permError) {
          // Alguns navegadores não suportam query de microfone, continuar normalmente
          console.log("Não foi possível verificar permissão prévia:", permError);
        }
      }

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Parar o timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Processar áudio
        if (audioChunksRef.current.length > 0) {
          await processAudio();
        }
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Capturar em chunks de 1 segundo
      setRecordingState("recording");

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);

      let message = "Erro ao acessar o microfone. Verifique se seu dispositivo tem um microfone disponível.";

      if (error instanceof Error) {
        if (error.message === "INSECURE_CONTEXT") {
          message = "O acesso ao microfone requer conexão segura (HTTPS). Entre em contato com o suporte.";
        } else if (error.message === "API_NOT_AVAILABLE") {
          message = "Seu navegador não suporta gravação de áudio. Tente usar Chrome, Firefox ou Edge.";
        } else if (error.message === "PERMISSION_DENIED" || error.name === "NotAllowedError") {
          message = "Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.";
        } else if (error.name === "NotFoundError") {
          message = "Nenhum microfone encontrado. Conecte um microfone e tente novamente.";
        } else if (error.name === "NotReadableError") {
          message = "O microfone está sendo usado por outro aplicativo. Feche outros apps e tente novamente.";
        }
      }

      setErrorMessage(message);
      setRecordingState("error");
    }
  };

  // Pausar/Retomar gravação
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (recordingState === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingState("paused");
    } else if (recordingState === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingState("recording");
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("processing");
    }

    // Parar o stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Processar e enviar áudio
  const processAudio = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Não há limite de tamanho - transcreva qualquer gravação independente da duração

      // Preparar FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'consultation.webm');
      if (profileId) {
        formData.append('profileId', profileId.toString());
      }

      // Enviar para API
      const response = await fetch('/api/consultation/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 403 && errorData.code === 'TRANSCRIPTION_LIMIT_EXCEEDED') {
          setShowUpgradeDialog(true);
          // Não jogar erro para não mostrar o card de erro genérico, apenas abrir o dialog
          setRecordingState("idle");
          setRecordingTime(0);
          return;
        }

        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRecordingState("success");
        onTranscriptionComplete({
          transcription: result.transcription,
          anamnesis: result.anamnesis,
          extractedData: result.extractedData
        });

        // Reset após 2 segundos
        setTimeout(() => {
          setRecordingState("idle");
          setRecordingTime(0);
        }, 2000);
      } else {
        throw new Error(result.message || "Erro ao processar transcrição");
      }

    } catch (error) {
      console.error("Erro ao processar áudio:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao processar a gravação. Tente novamente."
      );
      setRecordingState("error");
    } finally {
      cleanup();
    }
  };

  // Cancelar gravação
  const cancelRecording = () => {
    cleanup();
    setRecordingState("idle");
    setRecordingTime(0);
    setErrorMessage(null);
  };

  // Renderizar conteúdo baseado no estado
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
                    É <strong>extremamente importante</strong> solicitar e confirmar o consentimento do paciente antes de iniciar a gravação.
                    <br /><br />
                    Recomendamos que você inicie a gravação perguntando: <br />
                    <em>"Podemos gravar esta consulta para auxiliar no seu prontuário?"</em>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowConsentDialog(false);
                      startRecording();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Entendi, Iniciar Gravação
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                    <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Limite de Transcrição Excedido
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-muted-foreground">
                    Você atingiu o limite de minutos de transcrição do seu plano atual.
                    <br /><br />
                    Para continuar transcrevendo ilimitadamente sem interrupções, ative o pacote <strong>Transcription Power</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Agora não</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowUpgradeDialog(false);
                      setLocation("/subscription");
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-none"
                  >
                    Fazer Upgrade Agora
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );

      case "recording":
      case "paused":
        return (
          <Card className={cn(
            "p-3 border-2",
            recordingState === "recording"
              ? "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10"
              : "border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10"
          )}>
            <div className="flex items-center gap-3">
              {/* Indicador de gravação */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  recordingState === "recording" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                )} />
                <span className="font-mono text-lg font-semibold text-foreground">
                  {formatTime(recordingTime)}
                </span>
              </div>

              {/* Controles */}
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

            <p className="text-xs text-muted-foreground mt-2">
              {recordingState === "recording"
                ? "Gravando consulta... Fale normalmente com o paciente."
                : "Gravação pausada. Clique em retomar para continuar."}
            </p>
          </Card>
        );

      case "processing":
        return (
          <Card className="p-3 border-2 border-border bg-muted/35">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Processando gravação...</p>
                <p className="text-xs text-muted-foreground">
                  Transcrevendo áudio e gerando anamnese inteligente
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
                <p className="font-medium text-green-700 dark:text-green-300">Transcrição concluída!</p>
                <p className="text-xs text-green-700/80 dark:text-green-200/80">
                  A anamnese e os dados clínicos foram preenchidos automaticamente
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
                <p className="font-medium text-red-700 dark:text-red-300">Erro na gravação</p>
                <p className="text-xs text-red-700/85 dark:text-red-200/85">{errorMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRecordingState("idle");
                  setErrorMessage(null);
                }}
                className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-100/80 dark:hover:bg-red-500/20"
              >
                Tentar novamente
              </Button>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className={cn("consultation-recorder", className)}>
      {renderContent()}
    </div>
  );
}
