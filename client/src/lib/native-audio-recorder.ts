import { registerPlugin } from "@capacitor/core";

export interface NativeAudioRecorderSegment {
  base64Data: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  extension: string;
}

export interface NativeAudioRecorderStatus {
  state: "idle" | "recording" | "paused";
  mimeType: string;
  extension: string;
}

export interface NativeAudioRecorderResult extends NativeAudioRecorderStatus {
  segment?: NativeAudioRecorderSegment | null;
}

export interface NativeAudioRecorderListenerHandle {
  remove: () => Promise<void>;
}

export interface NativeAudioRecorderPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  startRecording(): Promise<NativeAudioRecorderStatus>;
  pauseRecording(): Promise<NativeAudioRecorderResult>;
  resumeRecording(): Promise<NativeAudioRecorderStatus>;
  rotateSegment(): Promise<NativeAudioRecorderResult>;
  stopRecording(): Promise<NativeAudioRecorderResult>;
  cancelRecording(): Promise<void>;
  getStatus(): Promise<NativeAudioRecorderStatus>;
  addListener(
    eventName: "recordingLevel",
    listenerFunc: (event: { level: number }) => void
  ): Promise<NativeAudioRecorderListenerHandle>;
  addListener(
    eventName: "recordingError",
    listenerFunc: (event: { message: string }) => void
  ): Promise<NativeAudioRecorderListenerHandle>;
}

export const NativeAudioRecorder = registerPlugin<NativeAudioRecorderPlugin>(
  "NativeAudioRecorder"
);
