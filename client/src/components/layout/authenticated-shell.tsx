import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopUpdateBanner from "@/components/desktop/desktop-update-banner";

const isElectronMac =
  typeof window !== "undefined" &&
  !!(window as any).vitaViewDesktop?.isDesktop &&
  (window as any).vitaViewDesktop?.platform === "darwin";

interface AuthenticatedShellProps {
  children: ReactNode;
}

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Drag region for macOS traffic lights — spans entire top */}
      {isElectronMac && (
        <div
          className="fixed inset-x-0 top-0 z-[60] h-9"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />
      )}
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DesktopUpdateBanner />
        <MobileHeader />
        <div className="flex-1 min-h-0 overflow-hidden bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthenticatedShell;
