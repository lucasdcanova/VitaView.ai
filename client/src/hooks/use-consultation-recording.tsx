import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Sparkles } from "lucide-react";
import { useLocation } from "wouter";
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

export type ConsultationRecordingState =
  | "idle"
  | "recording"
  | "paused"
  | "processing"
  | "error"
  | "success";

export interface ConsultationExtractedData {
  summary: string;
  diagnoses: any[];
  medications: any[];
  allergies: any[];
  comorbidities: string[];
  surgeries: any[];
}

export interface ConsultationTranscriptionResult {
  profileId: number | null;
  transcription: string;
  anamnesis: string;
  extractedData: ConsultationExtractedData;
}

interface ConsultationRecordingSession {
  profileId: number | null;
  patientName: string | null;
  returnPath: string;
}

interface ConsultationRecordingContextType {
  recordingState: ConsultationRecordingState;
  recordingTime: number;
  errorMessage: string | null;
  currentSession: ConsultationRecordingSession | null;
  completedResult: ConsultationTranscriptionResult | null;
  startRecording: (options?: {
    profileId?: number;
    patientName?: string | null;
    returnPath?: string;
  }) => Promise<void>;
  togglePause: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  clearError: () => void;
  clearCompletedResult: () => void;
}

const ConsultationRecordingContext =
  createContext<ConsultationRecordingContextType | null>(null);

export const formatRecordingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

export function ConsultationRecordingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [, setLocation] = useLocation();
  const [recordingState, setRecordingState] =
    useState<ConsultationRecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [currentSession, setCurrentSession] =
    useState<ConsultationRecordingSession | null>(null);
  const [completedResult, setCompletedResult] =
    useState<ConsultationTranscriptionResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<ConsultationRecordingSession | null>(null);

  const setSession = useCallback((session: ConsultationRecordingSession | null) => {
    sessionRef.current = session;
    setCurrentSession(session);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    clearTimer();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, [clearTimer]);

  const resetSessionState = useCallback(() => {
    setRecordingState("idle");
    setRecordingTime(0);
    setErrorMessage(null);
    setSession(null);
  }, [setSession]);

  const processAudio = useCallback(async () => {
    try {
      const session = sessionRef.current;
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();

      formData.append("audio", audioBlob, "consultation.webm");
      if (session?.profileId) {
        formData.append("profileId", session.profileId.toString());
      }

      const response = await fetch("/api/consultation/transcribe", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (
          response.status === 403 &&
          errorData.code === "TRANSCRIPTION_LIMIT_EXCEEDED"
        ) {
          setShowUpgradeDialog(true);
          setCompletedResult(null);
          resetSessionState();
          return;
        }

        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Erro ao processar transcricao");
      }

      setCompletedResult({
        profileId: session?.profileId ?? null,
        transcription: result.transcription,
        anamnesis: result.anamnesis,
        extractedData: result.extractedData,
      });
      setErrorMessage(null);
      setRecordingState("success");
    } catch (error) {
      console.error("Erro ao processar audio:", error);
      setCompletedResult(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao processar a gravacao. Tente novamente."
      );
      setRecordingState("error");
    } finally {
      cleanupMedia();
    }
  }, [cleanupMedia, resetSessionState]);

  const startRecording = useCallback(
    async (options?: {
      profileId?: number;
      patientName?: string | null;
      returnPath?: string;
    }) => {
      try {
        setCompletedResult(null);
        setErrorMessage(null);
        setRecordingTime(0);
        audioChunksRef.current = [];
        setSession({
          profileId: options?.profileId ?? null,
          patientName: options?.patientName?.trim() || null,
          returnPath: options?.returnPath || "/atendimento",
        });

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (
            window.location.protocol === "http:" &&
            window.location.hostname !== "localhost"
          ) {
            throw new Error("INSECURE_CONTEXT");
          }

          throw new Error("API_NOT_AVAILABLE");
        }

        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: "microphone" as PermissionName,
            });

            if (permissionStatus.state === "denied") {
              throw new Error("PERMISSION_DENIED");
            }
          } catch (permissionError) {
            console.log(
              "Nao foi possivel verificar permissao previa do microfone:",
              permissionError
            );
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm",
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          clearTimer();

          if (audioChunksRef.current.length === 0) {
            resetSessionState();
            return;
          }

          await processAudio();
        };

        mediaRecorder.start(1000);
        setRecordingState("recording");
        timerRef.current = window.setInterval(() => {
          setRecordingTime((previous) => previous + 1);
        }, 1000);
      } catch (error) {
        console.error("Erro ao iniciar gravacao:", error);

        let message =
          "Erro ao acessar o microfone. Verifique se seu dispositivo tem um microfone disponivel.";

        if (error instanceof Error) {
          if (error.message === "INSECURE_CONTEXT") {
            message =
              "O acesso ao microfone requer conexao segura (HTTPS). Entre em contato com o suporte.";
          } else if (error.message === "API_NOT_AVAILABLE") {
            message =
              "Seu navegador nao suporta gravacao de audio. Tente usar Chrome, Firefox ou Edge.";
          } else if (
            error.message === "PERMISSION_DENIED" ||
            error.name === "NotAllowedError"
          ) {
            message =
              "Permissao de microfone negada. Clique no icone de cadeado na barra de enderecos e permita o acesso ao microfone.";
          } else if (error.name === "NotFoundError") {
            message =
              "Nenhum microfone encontrado. Conecte um microfone e tente novamente.";
          } else if (error.name === "NotReadableError") {
            message =
              "O microfone esta sendo usado por outro aplicativo. Feche outros apps e tente novamente.";
          }
        }

        cleanupMedia();
        setCompletedResult(null);
        setErrorMessage(message);
        setRecordingState("error");
      }
    },
    [clearTimer, cleanupMedia, processAudio, resetSessionState, setSession]
  );

  const togglePause = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    if (recordingState === "recording") {
      mediaRecorder.pause();
      clearTimer();
      setRecordingState("paused");
      return;
    }

    if (recordingState === "paused") {
      mediaRecorder.resume();
      timerRef.current = window.setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
      setRecordingState("recording");
    }
  }, [clearTimer, recordingState]);

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    setRecordingState("processing");

    try {
      mediaRecorder.stop();
    } catch (error) {
      console.error("Erro ao finalizar gravacao:", error);
      cleanupMedia();
      setErrorMessage("Nao foi possivel finalizar a gravacao atual.");
      setRecordingState("error");
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, [cleanupMedia]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;

      try {
        mediaRecorder.stop();
      } catch (error) {
        console.error("Erro ao cancelar gravacao:", error);
      }
    }

    cleanupMedia();
    setCompletedResult(null);
    resetSessionState();
  }, [cleanupMedia, resetSessionState]);

  const clearError = useCallback(() => {
    cleanupMedia();
    setCompletedResult(null);
    resetSessionState();
  }, [cleanupMedia, resetSessionState]);

  const clearCompletedResult = useCallback(() => {
    setCompletedResult(null);
    resetSessionState();
  }, [resetSessionState]);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  useEffect(() => {
    if (!["recording", "paused", "processing"].includes(recordingState)) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [recordingState]);

  return (
    <ConsultationRecordingContext.Provider
      value={{
        recordingState,
        recordingTime,
        errorMessage,
        currentSession,
        completedResult,
        startRecording,
        togglePause,
        stopRecording,
        cancelRecording,
        clearError,
        clearCompletedResult,
      }}
    >
      {children}

      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Limite de Transcricao Excedido
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Voce atingiu o limite de minutos de transcricao do seu plano atual.
              <br />
              <br />
              Para continuar transcrevendo ilimitadamente sem interrupcoes, ative
              o pacote <strong>Transcription Power</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Agora nao</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUpgradeDialog(false);
                setLocation("/subscription");
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-none hover:from-yellow-600 hover:to-amber-700"
            >
              Fazer Upgrade Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConsultationRecordingContext.Provider>
  );
}

export function useConsultationRecording() {
  const context = useContext(ConsultationRecordingContext);

  if (!context) {
    throw new Error(
      "useConsultationRecording must be used within a ConsultationRecordingProvider"
    );
  }

  return context;
}
