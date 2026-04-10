import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { useDesktopUpdater } from "@/hooks/use-desktop-updater";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "vitaview-desktop-update-dismissed-version";

/**
 * Banner sutil de atualização para o app desktop (Windows/macOS DMG).
 * - Só renderiza quando rodando no Electron com update baixado.
 * - Fica fixo no topo, altura mínima, dispensável.
 * - Oculto enquanto o download ainda está em curso (a atualização é silenciosa).
 * - Esconde-se quando o usuário dispensa, até que uma versão NOVA fique pronta.
 */
export function DesktopUpdateBanner() {
  const { isDesktop, status, installNow } = useDesktopUpdater();
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DISMISS_KEY);
      if (stored) setDismissedVersion(stored);
    } catch {
      // localStorage indisponível — segue sem persistência.
    }
  }, []);

  if (!isDesktop || !status) return null;
  if (status.kind !== "downloaded") return null;
  if (status.version && dismissedVersion === status.version) return null;

  const handleDismiss = () => {
    if (!status.version) return;
    setDismissedVersion(status.version);
    try {
      window.localStorage.setItem(DISMISS_KEY, status.version);
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await installNow();
    } finally {
      // Se quitAndInstall funcionar, o app fecha. Caso contrário, libera o botão.
      setTimeout(() => setInstalling(false), 3000);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-blue-100 bg-blue-50/80 px-4 py-1.5",
        "text-xs text-blue-900 backdrop-blur supports-[backdrop-filter]:bg-blue-50/60"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Download className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <span className="truncate">
          Nova versão do VitaView pronta
          {status.version ? ` (${status.version})` : ""}. Reinicie para aplicar.
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium text-white",
            "hover:bg-blue-700 disabled:opacity-60"
          )}
        >
          {installing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Reiniciando…
            </>
          ) : (
            "Reiniciar agora"
          )}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-700/70 hover:bg-blue-100 hover:text-blue-900"
          aria-label="Dispensar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default DesktopUpdateBanner;
