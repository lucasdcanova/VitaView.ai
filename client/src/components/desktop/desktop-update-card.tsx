import { Download, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesktopUpdater } from "@/hooks/use-desktop-updater";

/**
 * Card de atualizações para a página de Configurações.
 * Só renderiza no app desktop (Electron). No web/PWA/iOS, retorna null.
 * Permite checar manualmente e instalar uma atualização já baixada.
 */
export function DesktopUpdateCard() {
  const { isDesktop, status, appVersion, checkForUpdates, installNow, isChecking } =
    useDesktopUpdater();

  if (!isDesktop) return null;

  const renderState = () => {
    if (!status) {
      return <span className="text-muted-foreground">Carregando…</span>;
    }

    switch (status.kind) {
      case "downloaded":
        return (
          <div className="flex items-center gap-2 text-blue-700">
            <Download className="h-4 w-4" />
            <span>
              Atualização {status.version ? `${status.version} ` : ""}pronta para instalar.
            </span>
          </div>
        );
      case "downloading":
        return (
          <div className="flex items-center gap-2 text-blue-700">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Baixando atualização… {status.progress ?? 0}%</span>
          </div>
        );
      case "checking":
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Procurando atualizações…</span>
          </div>
        );
      case "available":
        return (
          <div className="flex items-center gap-2 text-blue-700">
            <Download className="h-4 w-4" />
            <span>
              Versão {status.version ?? "nova"} encontrada. Baixando em segundo plano…
            </span>
          </div>
        );
      case "not-available":
        return (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Você está na versão mais recente.</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Não foi possível verificar agora. Tente novamente em instantes.</span>
          </div>
        );
      case "unsupported":
        return (
          <span className="text-muted-foreground">
            Atualizações automáticas não estão disponíveis nesta build.
          </span>
        );
      default:
        return (
          <span className="text-muted-foreground">
            Atualizações automáticas estão ativas em segundo plano.
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">Atualizações do app</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Versão atual: {appVersion ?? status?.currentVersion ?? "—"}
          </p>
          <div className="mt-2 text-xs">{renderState()}</div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          {status?.kind === "downloaded" ? (
            <Button
              size="sm"
              onClick={() => void installNow()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Reiniciar para atualizar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void checkForUpdates()}
              disabled={isChecking || status?.kind === "checking" || status?.kind === "downloading"}
            >
              {isChecking || status?.kind === "checking" ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Verificando…
                </>
              ) : (
                "Verificar agora"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DesktopUpdateCard;
