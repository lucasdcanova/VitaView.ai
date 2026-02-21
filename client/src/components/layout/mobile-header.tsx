import { Menu } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import Logo from "@/components/ui/logo";

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

  return (
    <header className="bg-pureWhite border-b border-lightGray px-3 py-2 flex justify-between items-center sticky top-0 z-30 md:hidden shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-charcoal hover:bg-lightGray/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Abrir menu lateral"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Logo size="md" showText={true} textSize="md" variant="icon" />

      <div className="w-9" />
    </header>
  );
}
