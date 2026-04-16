// Small helper to remember where the user came from when entering an exam
// page. Without this, exam-history and exam-report always fall back to a
// hardcoded route, breaking the flow when the user navigated from the
// atendimento (consultation) view or the dashboard.

const STORAGE_KEY = "vitaview:exam-return-path";
const LABEL_KEY = "vitaview:exam-return-label";

export interface ExamReturnContext {
  path: string;
  label: string;
}

const isBrowser = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export function resolveExamReturnContext(path: string): ExamReturnContext {
  if (path.startsWith("/atendimento")) {
    return { path: "/atendimento", label: "Voltar ao atendimento" };
  }

  if (path.startsWith("/exam-history")) {
    return { path: "/exam-history", label: "Voltar ao histórico" };
  }

  if (path.startsWith("/results")) {
    return { path, label: "Voltar aos resultados" };
  }

  if (path.startsWith("/timeline")) {
    return { path, label: "Voltar à evolução" };
  }

  return { path, label: "Voltar" };
}

export function captureCurrentExamReturnContext(fallbackPath = "/atendimento"): ExamReturnContext {
  if (!isBrowser()) {
    return resolveExamReturnContext(fallbackPath);
  }

  try {
    const currentPath = window.location.pathname || fallbackPath;
    return resolveExamReturnContext(currentPath);
  } catch {
    return resolveExamReturnContext(fallbackPath);
  }
}

export function setExamReturnContext(context: ExamReturnContext): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, context.path);
    window.sessionStorage.setItem(LABEL_KEY, context.label);
  } catch {
    // sessionStorage may be unavailable (private mode, quota); fail silently.
  }
}

export function getExamReturnContext(fallback: ExamReturnContext): ExamReturnContext {
  if (!isBrowser()) return fallback;
  try {
    const path = window.sessionStorage.getItem(STORAGE_KEY);
    const label = window.sessionStorage.getItem(LABEL_KEY);
    if (path && label) {
      return { path, label };
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function clearExamReturnContext(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(LABEL_KEY);
  } catch {
    // ignore
  }
}
