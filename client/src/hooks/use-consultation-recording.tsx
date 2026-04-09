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

// Reliability: chunked recording with periodic auto-restart to manter cada
// segmento bem abaixo do limite de 25MB do Whisper, em qualquer plataforma.
// iOS: WKWebView precisa de timeslice maior para reduzir Blob count.
// Web/desktop: timeslice de 1s permite consolidação suave.
const IOS_TIMESLICE_MS = 30_000;
const DEFAULT_TIMESLICE_MS = 1_000;
const CHUNK_CONSOLIDATION_INTERVAL_MS = 120_000; // Merge accumulated chunks every 2 min
// Segmentos de 5 min em ambas plataformas. Em mp4/AAC (~6MB/min) isso da ~30MB
// no pior caso, mas com bitrate típico do MediaRecorder fica em ~8-15MB.
// Reduzir mais que isso aumenta overhead de uploads sem benefício.
const SEGMENT_DURATION_MS = 5 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 3;
// Limite teórico Whisper: 25MB. Avisamos antes disso para dar margem.
const MAX_SEGMENT_SIZE_BYTES = 24 * 1024 * 1024;

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
  audioLevel: number; // 0..1 — nível RMS do microfone para feedback visual
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
  const [audioLevel, setAudioLevel] = useState(0);
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

  // Reliability refs for long-recording support
  const segmentsRef = useRef<Blob[]>([]);
  const consolidationTimerRef = useRef<number | null>(null);
  const autoRestartTimerRef = useRef<number | null>(null);
  const isAutoRestartingRef = useRef(false);
  const recoveryAttemptsRef = useRef(0);

  // Streaming transcription refs — cada segmento é transcrito assim que sai
  // do MediaRecorder, evitando o upload monolítico no fim que estourava o
  // timeout do Cloudflare/Render em consultas longas.
  const segmentTranscriptionsRef = useRef<string[]>([]);
  const pendingUploadsRef = useRef<Promise<void>[]>([]);
  const uploadFailureRef = useRef<Error | null>(null);

  // Web Audio API refs para visualização de nível de áudio em tempo real.
  // Confirma que o microfone está realmente captando — útil para diagnóstico
  // do bug "iOS sem áudio captado" e como feedback visual ao usuário.
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioLevelFrameRef = useRef<number | null>(null);

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

  const stopAudioLevelMonitor = useCallback(() => {
    if (audioLevelFrameRef.current !== null) {
      cancelAnimationFrame(audioLevelFrameRef.current);
      audioLevelFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (_) {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (_) {
        // ignore
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      // close pode rejeitar se já estiver fechado
      ctx.close().catch(() => undefined);
    }
    setAudioLevel(0);
  }, []);

  const startAudioLevelMonitor = useCallback((stream: MediaStream) => {
    try {
      const AudioContextCtor: typeof AudioContext | undefined =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        const a = analyserRef.current;
        if (!a) return;
        a.getByteTimeDomainData(buffer);
        // RMS — média quadrática centrada em 128 (silêncio = 128)
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const normalized = (buffer[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        // Boost para que falas normais (~0.05 RMS) já preencham bem a barra
        const boosted = Math.min(1, rms * 4);
        setAudioLevel(boosted);
        audioLevelFrameRef.current = requestAnimationFrame(tick);
      };
      audioLevelFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn("[Recording] AudioContext nao disponivel:", err);
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    clearTimer();
    clearReliabilityTimers();
    stopAudioLevelMonitor();
    stopStreamTracks();

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    segmentsRef.current = [];
    segmentTranscriptionsRef.current = [];
    pendingUploadsRef.current = [];
    uploadFailureRef.current = null;
    isAutoRestartingRef.current = false;
    recoveryAttemptsRef.current = 0;
  }, [clearTimer, clearReliabilityTimers, stopAudioLevelMonitor, stopStreamTracks]);

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

  // Envia um segmento isolado para transcrição e armazena o texto na ordem.
  // Roda em background — falhas vão para uploadFailureRef e são checadas no
  // finalize. Não usa AbortSignal próprio porque cada chamada deve ser curta
  // (<60s) e o servidor já tem timeout de 90s.
  const uploadSegment = useCallback(async (segment: Blob, index: number) => {
    const formData = new FormData();
    formData.append(
      "audio",
      segment,
      `consultation-${index}.${recordingFormatRef.current.extension}`
    );

    try {
      const response = await fetch("/api/consultation/transcribe-segment", {
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
          const limitError = new Error("TRANSCRIPTION_LIMIT_EXCEEDED");
          (limitError as any).code = "TRANSCRIPTION_LIMIT_EXCEEDED";
          throw limitError;
        }

        throw new Error(errorData.message || `Erro ${response.status} ao enviar segmento`);
      }

      const result = await response.json();
      if (!result?.success || typeof result.text !== "string") {
        throw new Error("Resposta inválida da transcrição de segmento");
      }

      segmentTranscriptionsRef.current[index] = result.text;
      console.log("[Recording] Segmento transcrito", {
        index,
        chars: result.text.length,
      });
    } catch (err) {
      if (!uploadFailureRef.current) {
        uploadFailureRef.current = err instanceof Error ? err : new Error(String(err));
      }
      console.error("[Recording] Falha no upload do segmento", { index, err });
      throw err;
    }
  }, []);

  const saveCurrentSegment = useCallback(() => {
    if (audioChunksRef.current.length === 0) return;
    const segment = new Blob(audioChunksRef.current, {
      type: recordingFormatRef.current.uploadMimeType,
    });
    audioChunksRef.current = [];

    // Validação local: bloqueia segmentos > 24MB antes de subir.
    if (segment.size > MAX_SEGMENT_SIZE_BYTES) {
      uploadFailureRef.current = new Error(
        `Um trecho ficou muito grande (${(segment.size / (1024 * 1024)).toFixed(1)}MB). Whisper aceita até 25MB.`
      );
      return;
    }

    const index = segmentsRef.current.length;
    segmentsRef.current.push(segment);
    segmentTranscriptionsRef.current[index] = "";

    // Dispara upload em background; .catch evita unhandledrejection.
    const uploadPromise = uploadSegment(segment, index).catch(() => undefined);
    pendingUploadsRef.current.push(uploadPromise as Promise<void>);
  }, [uploadSegment]);

  const processAudio = useCallback(async () => {
    try {
      const session = sessionRef.current;

      // Salva o último chunk como segmento final (e dispara o upload).
      saveCurrentSegment();

      if (segmentsRef.current.length === 0) {
        cleanupMedia();
        setCompletedResult(null);
        setErrorMessage(
          "A gravacao foi finalizada sem audio capturado. No iPhone, permita o microfone para o VitaView em Ajustes e tente novamente."
        );
        setRecordingState("error");
        return;
      }

      console.log("[Recording] Aguardando uploads pendentes", {
        pendingUploads: pendingUploadsRef.current.length,
        totalSegments: segmentsRef.current.length,
      });

      // Aguarda todos os uploads em background terminarem.
      await Promise.all(pendingUploadsRef.current);

      // Se algum upload falhou irrecuperavelmente, abortamos com mensagem clara.
      if (uploadFailureRef.current) {
        const failure = uploadFailureRef.current;
        if ((failure as any).code === "TRANSCRIPTION_LIMIT_EXCEEDED") {
          setShowUpgradeDialog(true);
          setCompletedResult(null);
          resetSessionState();
          return;
        }
        throw failure;
      }

      const transcripts = segmentTranscriptionsRef.current.filter(
        (t) => typeof t === "string" && t.trim().length > 0
      );

      if (transcripts.length === 0) {
        throw new Error(
          "Não foi possível transcrever nenhum trecho da gravação. Verifique a qualidade do áudio."
        );
      }

      console.log("[Recording] Chamando finalize", {
        segments: transcripts.length,
        totalChars: transcripts.reduce((sum, t) => sum + t.length, 0),
      });

      // Chamada única curta — apenas 1 chamada GPT, fica abaixo do limite do proxy.
      const finalizeRes = await fetch("/api/consultation/finalize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: transcripts,
          profileId: session?.profileId ?? null,
        }),
      });

      if (!finalizeRes.ok) {
        const errorData = await finalizeRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${finalizeRes.status}`);
      }

      const result = await finalizeRes.json();
      if (!result.success) {
        throw new Error(result.message || "Erro ao finalizar a consulta.");
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
        segmentTranscriptionsRef.current = [];
        pendingUploadsRef.current = [];
        uploadFailureRef.current = null;
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

        const isIOS = isIOSAppShell();

        // On iOS/WKWebView, advanced audio constraints can yield a silent
        // stream even when permission is granted. Request plain audio there
        // and let iOS apply its own processing via AVAudioSession.
        const audioConstraints: MediaTrackConstraints | boolean = isIOS
          ? true
          : {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            };

        const stream = await getAudioStream({
          audio: audioConstraints,
        });

        streamRef.current = stream;

        // Diagnostic logging — helps verify the stream actually has live
        // audio tracks. Empty/muted tracks are the tell-tale sign of a
        // missing AVAudioSession configuration on iOS.
        const audioTracks = stream.getAudioTracks();
        console.log("[Recording] Audio tracks obtained:", {
          count: audioTracks.length,
          platform: isIOS ? "ios" : "web",
          tracks: audioTracks.map((t) => ({
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          })),
        });

        if (audioTracks.length === 0) {
          throw new Error("NO_AUDIO_TRACKS");
        }

        const timeslice = isIOS ? IOS_TIMESLICE_MS : DEFAULT_TIMESLICE_MS;

        // Inicia monitor de nivel de audio (para feedback visual e diagnostico).
        // Isso roda em paralelo ao MediaRecorder usando o mesmo MediaStream.
        startAudioLevelMonitor(stream);

        // Auto-restart scheduler — restarts the recorder a cada SEGMENT_DURATION_MS
        // em todas as plataformas para garantir que cada segmento fique abaixo do
        // limite de 25MB do Whisper. Antes só rodava em iOS, deixando gravações
        // longas no web/PWA acumuladas em UM blob gigante que estourava o limite.
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
          }, SEGMENT_DURATION_MS);
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
            console.log("[Recording] ondataavailable", {
              size: event.data.size,
              type: event.data.type,
            });
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
                  console.log("[Recording] Auto-restart segmento OK", {
                    totalSegments: segmentsRef.current.length,
                  });
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
                  scheduleAutoRestart();
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

        // Auto-restart roda em todas as plataformas para manter cada segmento
        // bem abaixo do limite de 25MB do Whisper.
        scheduleAutoRestart();
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
      startAudioLevelMonitor,
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
        audioLevel,
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
