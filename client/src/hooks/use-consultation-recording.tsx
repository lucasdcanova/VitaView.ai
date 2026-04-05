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
import { isIOSAppShell } from "@/lib/app-shell";

// iOS recording reliability: reduce Blob count and auto-restart to prevent WKWebView crashes
const IOS_TIMESLICE_MS = 30_000; // 30s chunks on iOS (vs 1s default) — 30 blobs at 15min instead of 900
const DEFAULT_TIMESLICE_MS = 1_000;
const CHUNK_CONSOLIDATION_INTERVAL_MS = 120_000; // Merge accumulated chunks every 2 min
const IOS_SEGMENT_DURATION_MS = 10 * 60 * 1000; // Auto-restart recorder every 10 min on iOS
const MAX_RECOVERY_ATTEMPTS = 3;

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

interface RecordingFormat {
  extension: string;
  recorderMimeType?: string;
  uploadMimeType: string;
}

type LegacyNavigator = Navigator & {
  getUserMedia?: (
    constraints: MediaStreamConstraints,
    onSuccess: (stream: MediaStream) => void,
    onError: (error: DOMException) => void
  ) => void;
  webkitGetUserMedia?: LegacyNavigator["getUserMedia"];
  mozGetUserMedia?: LegacyNavigator["getUserMedia"];
  msGetUserMedia?: LegacyNavigator["getUserMedia"];
};

const getPreferredRecordingFormats = (): RecordingFormat[] => {
  const webmFormats: RecordingFormat[] = [
    {
      recorderMimeType: "audio/webm;codecs=opus",
      uploadMimeType: "audio/webm",
      extension: "webm",
    },
    {
      recorderMimeType: "audio/webm",
      uploadMimeType: "audio/webm",
      extension: "webm",
    },
  ];

  const iosFormats: RecordingFormat[] = [
    {
      recorderMimeType: "audio/mp4;codecs=mp4a.40.2",
      uploadMimeType: "audio/mp4",
      extension: "mp4",
    },
    {
      recorderMimeType: "audio/mp4",
      uploadMimeType: "audio/mp4",
      extension: "mp4",
    },
    {
      recorderMimeType: "audio/x-m4a",
      uploadMimeType: "audio/x-m4a",
      extension: "m4a",
    },
    {
      recorderMimeType: "audio/m4a",
      uploadMimeType: "audio/m4a",
      extension: "m4a",
    },
  ];

  return isIOSAppShell()
    ? [...iosFormats, ...webmFormats]
    : [...webmFormats, ...iosFormats];
};

const getSupportedRecordingFormat = (): RecordingFormat => {
  const fallback = isIOSAppShell()
    ? { uploadMimeType: "audio/mp4", extension: "mp4" }
    : { uploadMimeType: "audio/webm", extension: "webm" };

  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return fallback;
  }

  for (const format of getPreferredRecordingFormats()) {
    if (!format.recorderMimeType || MediaRecorder.isTypeSupported(format.recorderMimeType)) {
      return format;
    }
  }

  return fallback;
};

const normalizeUploadMimeType = (mimeType: string | undefined, fallbackMimeType: string) => {
  if (!mimeType) return fallbackMimeType;

  if (mimeType.startsWith("audio/webm")) return "audio/webm";
  if (mimeType.startsWith("audio/mp4")) return "audio/mp4";
  if (mimeType.startsWith("audio/x-m4a")) return "audio/x-m4a";
  if (mimeType.startsWith("audio/m4a")) return "audio/m4a";

  return fallbackMimeType;
};

const getAudioStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyNavigator = navigator as LegacyNavigator;
  const legacyGetUserMedia =
    legacyNavigator.getUserMedia ||
    legacyNavigator.webkitGetUserMedia ||
    legacyNavigator.mozGetUserMedia ||
    legacyNavigator.msGetUserMedia;

  if (!legacyGetUserMedia) {
    throw new Error("API_NOT_AVAILABLE");
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(legacyNavigator, constraints, resolve, reject);
  });
};

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
  const recordingFormatRef = useRef<RecordingFormat>({
    uploadMimeType: "audio/webm",
    extension: "webm",
  });

  // Reliability refs for iOS long-recording support
  const segmentsRef = useRef<Blob[]>([]);
  const consolidationTimerRef = useRef<number | null>(null);
  const autoRestartTimerRef = useRef<number | null>(null);
  const isAutoRestartingRef = useRef(false);
  const recoveryAttemptsRef = useRef(0);

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

  const clearReliabilityTimers = useCallback(() => {
    if (consolidationTimerRef.current !== null) {
      window.clearInterval(consolidationTimerRef.current);
      consolidationTimerRef.current = null;
    }
    if (autoRestartTimerRef.current !== null) {
      window.clearTimeout(autoRestartTimerRef.current);
      autoRestartTimerRef.current = null;
    }
  }, []);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    clearTimer();
    clearReliabilityTimers();
    stopStreamTracks();

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    segmentsRef.current = [];
    isAutoRestartingRef.current = false;
    recoveryAttemptsRef.current = 0;
  }, [clearTimer, clearReliabilityTimers, stopStreamTracks]);

  const resetSessionState = useCallback(() => {
    setRecordingState("idle");
    setRecordingTime(0);
    setErrorMessage(null);
    setSession(null);
  }, [setSession]);

  const consolidateChunks = useCallback(() => {
    if (audioChunksRef.current.length <= 1) return;
    const consolidated = new Blob(audioChunksRef.current, {
      type: recordingFormatRef.current.uploadMimeType,
    });
    audioChunksRef.current = [consolidated];
  }, []);

  const saveCurrentSegment = useCallback(() => {
    if (audioChunksRef.current.length === 0) return;
    const segment = new Blob(audioChunksRef.current, {
      type: recordingFormatRef.current.uploadMimeType,
    });
    segmentsRef.current.push(segment);
    audioChunksRef.current = [];
  }, []);

  const processAudio = useCallback(async () => {
    try {
      const session = sessionRef.current;

      // Save any remaining chunks as the final segment
      saveCurrentSegment();

      const allSegments = segmentsRef.current;
      if (allSegments.length === 0) {
        cleanupMedia();
        setCompletedResult(null);
        setErrorMessage(
          "A gravacao foi finalizada sem audio capturado. No iPhone, permita o microfone para o VitaView em Ajustes e tente novamente."
        );
        setRecordingState("error");
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < allSegments.length; i++) {
        formData.append(
          "audio",
          allSegments[i],
          `consultation-${i}.${recordingFormatRef.current.extension}`
        );
      }
      if (session?.profileId) {
        formData.append("profileId", session.profileId.toString());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      let response: Response;
      try {
        response = await fetch("/api/consultation/transcribe", {
          method: "POST",
          body: formData,
          credentials: "include",
          signal: controller.signal,
        });
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          throw new Error(
            "O processamento da gravacao excedeu o tempo limite. Tente gravar em segmentos menores."
          );
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

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
  }, [saveCurrentSegment, cleanupMedia, resetSessionState]);

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
        segmentsRef.current = [];
        recoveryAttemptsRef.current = 0;
        setSession({
          profileId: options?.profileId ?? null,
          patientName: options?.patientName?.trim() || null,
          returnPath: options?.returnPath || "/atendimento",
        });

        if (
          !navigator.mediaDevices?.getUserMedia &&
          !(navigator as LegacyNavigator).getUserMedia &&
          !(navigator as LegacyNavigator).webkitGetUserMedia &&
          !(navigator as LegacyNavigator).mozGetUserMedia &&
          !(navigator as LegacyNavigator).msGetUserMedia
        ) {
          if (
            window.location.protocol === "http:" &&
            window.location.hostname !== "localhost"
          ) {
            throw new Error("INSECURE_CONTEXT");
          }

          throw new Error("API_NOT_AVAILABLE");
        }

        if (typeof MediaRecorder === "undefined") {
          throw new Error("RECORDER_NOT_AVAILABLE");
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

        const stream = await getAudioStream({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        streamRef.current = stream;

        const isIOS = isIOSAppShell();
        const timeslice = isIOS ? IOS_TIMESLICE_MS : DEFAULT_TIMESLICE_MS;

        // Auto-restart scheduler for iOS — restarts the recorder every 10 min
        // to prevent WKWebView MediaRecorder memory exhaustion
        const scheduleAutoRestart = () => {
          if (autoRestartTimerRef.current !== null) {
            window.clearTimeout(autoRestartTimerRef.current);
          }
          autoRestartTimerRef.current = window.setTimeout(() => {
            const mr = mediaRecorderRef.current;
            if (!mr) return;

            if (mr.state === "paused") {
              // Don't restart while paused; reschedule for later
              scheduleAutoRestart();
              return;
            }

            if (mr.state === "recording") {
              isAutoRestartingRef.current = true;
              try {
                mr.requestData();
              } catch (_) {
                // ignore
              }
              mr.stop();
            }
          }, IOS_SEGMENT_DURATION_MS);
        };

        // Creates a MediaRecorder on the given stream, wires up all handlers, and starts it.
        // Called initially and on auto-restart / error recovery.
        const createAndStartRecorder = (s: MediaStream) => {
          const recordingFormat = getSupportedRecordingFormat();

          const mr = recordingFormat.recorderMimeType
            ? new MediaRecorder(s, {
                mimeType: recordingFormat.recorderMimeType,
              })
            : new MediaRecorder(s);

          recordingFormatRef.current = {
            extension: recordingFormat.extension,
            recorderMimeType:
              mr.mimeType || recordingFormat.recorderMimeType,
            uploadMimeType: normalizeUploadMimeType(
              mr.mimeType,
              recordingFormat.uploadMimeType
            ),
          };

          mr.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mr.onstop = async () => {
            // Auto-restart path: save segment and spin up a new recorder seamlessly
            if (isAutoRestartingRef.current) {
              isAutoRestartingRef.current = false;
              saveCurrentSegment();

              const activeStream = streamRef.current;
              if (
                activeStream &&
                activeStream.getTracks().some((t) => t.readyState === "live")
              ) {
                try {
                  createAndStartRecorder(activeStream);
                  scheduleAutoRestart();
                  return;
                } catch (restartErr) {
                  console.error(
                    "[Recording] Auto-restart failed:",
                    restartErr
                  );
                }
              }
              // Fall through to process audio if auto-restart failed
            }

            // Normal stop (user-initiated or failed auto-restart)
            clearTimer();
            clearReliabilityTimers();
            setRecordingState("processing");

            if (
              audioChunksRef.current.length === 0 &&
              segmentsRef.current.length === 0
            ) {
              cleanupMedia();
              setCompletedResult(null);
              setErrorMessage(
                "A gravacao foi finalizada sem audio capturado. No iPhone, permita o microfone para o VitaView em Ajustes e tente novamente."
              );
              setRecordingState("error");
              return;
            }

            await processAudio();
          };

          mr.onerror = (event) => {
            console.error("[Recording] MediaRecorder error:", event);

            // Preserve whatever audio we already have
            saveCurrentSegment();

            // Attempt recovery: create a new recorder on the same stream
            if (recoveryAttemptsRef.current < MAX_RECOVERY_ATTEMPTS) {
              recoveryAttemptsRef.current++;
              const activeStream = streamRef.current;
              if (
                activeStream &&
                activeStream
                  .getTracks()
                  .some((t) => t.readyState === "live")
              ) {
                try {
                  createAndStartRecorder(activeStream);
                  if (isIOS) scheduleAutoRestart();
                  console.log(
                    `[Recording] Recovery successful (attempt ${recoveryAttemptsRef.current})`
                  );
                  return;
                } catch (recoveryErr) {
                  console.error(
                    "[Recording] Recovery restart failed:",
                    recoveryErr
                  );
                }
              }
            }

            // Recovery exhausted — process whatever audio we managed to capture
            clearTimer();
            clearReliabilityTimers();

            if (segmentsRef.current.length > 0) {
              setRecordingState("processing");
              processAudio();
            } else {
              cleanupMedia();
              setCompletedResult(null);
              setErrorMessage(
                "A gravacao falhou no dispositivo. Tente novamente."
              );
              setRecordingState("error");
            }
          };

          mediaRecorderRef.current = mr;
          mr.start(timeslice);
        };

        createAndStartRecorder(stream);
        setRecordingState("recording");

        timerRef.current = window.setInterval(() => {
          setRecordingTime((previous) => previous + 1);
        }, 1000);

        // Periodically merge small chunks into one Blob to reduce memory pressure
        consolidationTimerRef.current = window.setInterval(() => {
          consolidateChunks();
        }, CHUNK_CONSOLIDATION_INTERVAL_MS);

        if (isIOS) {
          scheduleAutoRestart();
        }
      } catch (error) {
        console.error("Erro ao iniciar gravacao:", error);

        let message =
          "Erro ao acessar o microfone. Verifique se seu dispositivo tem um microfone disponivel.";

        if (error instanceof Error) {
          if (error.message === "INSECURE_CONTEXT") {
            message =
              "O acesso ao microfone requer conexao segura (HTTPS). Entre em contato com o suporte.";
          } else if (
            error.message === "API_NOT_AVAILABLE" ||
            error.message === "RECORDER_NOT_AVAILABLE"
          ) {
            message =
              "Este dispositivo nao expôs a gravacao de audio para o app. No iPhone/iPad, atualize o iOS e permita o microfone nas Configuracoes do app VitaView.";
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
    [
      clearTimer,
      cleanupMedia,
      processAudio,
      resetSessionState,
      setSession,
      consolidateChunks,
      saveCurrentSegment,
      clearReliabilityTimers,
    ]
  );

  const togglePause = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    if (recordingState === "recording" && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      clearTimer();
      setRecordingState("paused");
      return;
    }

    if (recordingState === "paused" && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      timerRef.current = window.setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
      setRecordingState("recording");
    }
  }, [clearTimer, recordingState]);

  const stopRecording = useCallback(() => {
    isAutoRestartingRef.current = false;

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    setRecordingState("processing");

    try {
      try {
        mediaRecorder.requestData();
      } catch (requestDataError) {
        console.warn(
          "Nao foi possivel solicitar o ultimo chunk antes de parar:",
          requestDataError
        );
      }

      mediaRecorder.stop();
    } catch (error) {
      console.error("Erro ao finalizar gravacao:", error);
      cleanupMedia();
      setErrorMessage("Nao foi possivel finalizar a gravacao atual.");
      setRecordingState("error");
      return;
    }
  }, [cleanupMedia]);

  const cancelRecording = useCallback(() => {
    isAutoRestartingRef.current = false;
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
