type ExamUploadHintContext = {
  profileId?: number | null;
  appointmentId?: number | null;
};

type ExamUploadHintPayload = {
  examId: number;
};

const STORAGE_PREFIX = "exam-upload-hint";

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const buildStorageKey = ({ profileId, appointmentId }: ExamUploadHintContext) => {
  if (!profileId) return null;
  return `${STORAGE_PREFIX}:${profileId}:${appointmentId ?? "manual"}`;
};

export function getExamUploadHint(context: ExamUploadHintContext): number | null {
  const key = buildStorageKey(context);
  if (!key || !isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ExamUploadHintPayload;
    return typeof parsed?.examId === "number" ? parsed.examId : null;
  } catch {
    return null;
  }
}

export function setExamUploadHint(
  context: ExamUploadHintContext,
  payload: ExamUploadHintPayload
): void {
  const key = buildStorageKey(context);
  if (!key || !isBrowser()) return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage errors.
  }
}

export function clearExamUploadHint(context: ExamUploadHintContext): void {
  const key = buildStorageKey(context);
  if (!key || !isBrowser()) return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}
