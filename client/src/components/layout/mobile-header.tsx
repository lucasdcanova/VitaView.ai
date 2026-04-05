import { Menu } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import Logo from "@/components/ui/logo";
import { NotificationBell } from "@/components/notification-bell";
import ThemeToggleButton from "@/components/layout/theme-toggle-button";

/**
 * VitaView AI Mobile Header Component
 * 
 * Design Language:
 * - Fundo Pure White (#FFFFFF)
 * - Bordas Light Gray (#E0E0E0)
 * - Ícones de linha em Charcoal Gray (#212121)
 */

type MobileHeaderProps = {
  toggleSidebar?: () => void;
};

export default function MobileHeader(props: MobileHeaderProps) {
  const sidebarContext = useSidebar();
  const toggleSidebar = props.toggleSidebar || sidebarContext.toggleSidebar;
  const mobileHeaderHeightClass = "h-[calc(env(safe-area-inset-top)+3.5rem)]";

  return (
    <>
      {/* Spacer keeps layouts stable while the header itself is fixed on iOS */}
      <div aria-hidden="true" className={`md:hidden ${mobileHeaderHeightClass}`} />

      <header
        className={`fixed inset-x-0 top-0 z-40 md:hidden ${mobileHeaderHeightClass}`}
      >
        {/* Soft glass + gradient transition into the iOS status bar area */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pureWhite via-pureWhite/95 to-pureWhite/75 backdrop-blur-xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-pureWhite/0 to-pureWhite/85" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-lightGray/80" />

        <div className="relative box-border h-full pl-[calc(env(safe-area-inset-left)+0.75rem)] pr-[calc(env(safe-area-inset-right)+0.75rem)] pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-charcoal hover:bg-lightGray/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring active:scale-95"
              aria-label="Abrir menu lateral"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Logo size="md" showText={true} textSize="md" variant="icon" />

            <div className="flex items-center gap-1">
              <ThemeToggleButton className="h-9 w-9" />
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
