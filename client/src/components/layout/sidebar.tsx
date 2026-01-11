import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useProfiles } from "@/hooks/use-profiles";
import {
  LogOut,
  CreditCard,
  ShieldCheck,
  Heart,
  Calendar,
  Settings,
  BarChart2,
  ChevronLeft,
  ChevronRight,

} from "lucide-react";
import Logo from "@/components/ui/logo";
import ActivePatientIndicator from "@/components/active-patient-indicator";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * VitaView AI Sidebar Component
 * 
 * Design Language:
 * - Fundo Pure White (#FFFFFF)
 * - Navegação modular com ícones de linha (outline)
 * - Item ativo: Fundo Charcoal Gray (#212121), texto branco
 * - Item inativo: Texto Charcoal Gray (#212121), hover Light Gray (#E0E0E0)
 * - Tipografia: Open Sans para itens de menu
 */
interface SidebarProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
}

export default function Sidebar(props: SidebarProps) {
  const sidebarContext = useSidebar();
  const isSidebarOpen = props.isSidebarOpen ?? sidebarContext.isSidebarOpen;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { activeProfile } = useProfiles();


  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNavClick = () => {
    // Fecha a sidebar em mobile ao clicar em um link
    if (window.innerWidth < 768) {
      if (props.setIsSidebarOpen) {
        props.setIsSidebarOpen(false);
      } else {
        sidebarContext.closeSidebar();
      }
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  }

  const displayDoctor = user?.fullName || user?.username || "Doutor";

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      if (props.setIsSidebarOpen) {
        props.setIsSidebarOpen(false);
      } else {
        sidebarContext.closeSidebar();
      }
    }
  };

  // Estilo dos itens de navegação
  const getNavItemClass = (path: string) => {
    const isActive = location === path;
    return cn(
      "w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative",
      isActive ? 'bg-charcoal text-pureWhite' : 'text-charcoal hover:bg-lightGray',
      isCollapsed && "justify-center px-2"
    );
  };

  // Estilo dos ícones
  const getIconClass = (path: string) => {
    const isActive = location === path;
    return cn(
      "h-6 w-6 flex-shrink-0 transition-all",
      isActive ? 'text-pureWhite' : 'text-charcoal',
      !isCollapsed && "mr-3"
    );
  };

  const NavItem = ({ href, icon: Icon, label, tourId }: { href: string, icon: any, label: string, tourId?: string }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            onClick={handleNavClick}
            className={getNavItemClass(href)}
            data-tour={tourId}
          >
            <Icon className={getIconClass(href)} />
            {!isCollapsed && <span className="font-heading font-bold text-sm truncate opacity-100 transition-opacity duration-300">{label}</span>}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="ml-2 font-bold bg-charcoal text-white border-0">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {/* Overlay/Backdrop - apenas no mobile quando sidebar está aberta */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebarOnMobile}
        />
      )}

      <aside
        className={cn(
          "bg-pureWhite border-r border-lightGray flex-shrink-0 fixed md:sticky top-0 h-full z-50 transition-all duration-300 ease-in-out sidebar-shadow",
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-20' : 'w-80' // Alterado de w-64 para w-80 (expandido) e w-20 (colapsado)
        )}
      >
        {/* Toggle Button (Desktop Only) */}
        <div className="absolute -right-5 top-14 hidden md:flex z-50">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-white border-2 border-[#212121] shadow-xl text-[#212121] hover:bg-[#212121] hover:text-white transition-all duration-300 transform hover:scale-110"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
          </Button>
        </div>

        {/* Logo Section */}
        <div className={cn("border-b border-lightGray transition-all duration-300", isCollapsed ? "p-2 py-4 flex justify-center" : "p-4")} data-tour="sidebar-logo">
          {isCollapsed ? (
            <Logo size="sm" showText={false} variant="icon" />
          ) : (
            <Logo size="md" showText={true} textSize="md" variant="icon" />
          )}
        </div>

        {/* User Profile Section */}
        <div className={cn("border-b border-lightGray transition-all duration-300", isCollapsed ? "p-2 py-4" : "p-4")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center flex-col gap-2" : "")}>
            <div className={cn("flex items-center", isCollapsed ? "flex-col justify-center" : "")}>
              <div className="w-10 h-10 rounded-full bg-lightGray text-charcoal flex items-center justify-center font-heading font-bold shadow-sm border border-white">
                {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <h3 className="font-heading font-bold text-sm text-charcoal truncate max-w-[180px]" title={displayDoctor}>
                    {displayDoctor}
                  </h3>
                  <p className="text-xs text-mediumGray font-body truncate">Profissional de saúde</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Selector */}
        <div className={cn("border-b border-lightGray bg-gray-50/50", isCollapsed ? "p-2" : "p-3")} data-tour="patient-selector">
          {isCollapsed ? (
            <div className="flex justify-center" title={activeProfile?.name || "Nenhum paciente"}>
              <ActivePatientIndicator className="w-full" collapsed={true} />
            </div>
          ) : (
            <ActivePatientIndicator className="w-full" />
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar", isCollapsed ? "p-2" : "p-4")}>
          <NavItem href="/agenda" icon={Calendar} label="Agenda" tourId="nav-agenda" />
          <NavItem href="/atendimento" icon={Heart} label="Atendimento" tourId="nav-atendimento" />

          {/* Separador */}
          <div className="py-2">
            <div className={cn("h-px bg-lightGray", isCollapsed ? "mx-2" : "mx-0")}></div>
          </div>

          {/* Configurações */}
          <NavItem href="/profile" icon={Settings} label="Configurações" />
          <NavItem href="/reports" icon={BarChart2} label="Relatórios" />
          <NavItem href="/subscription" icon={CreditCard} label="Minha Assinatura" />





          {/* Link para o painel administrativo - visível apenas para administradores */}
          {user?.role === 'admin' && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin-panel"
                    onClick={handleNavClick}
                    className={cn(
                      "w-full flex items-center p-3 rounded-lg transition-all duration-200 mt-6",
                      location === '/admin-panel' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50',
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <ShieldCheck className={cn("h-5 w-5", location === '/admin-panel' ? 'text-white' : 'text-red-600', !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span className="font-body font-bold text-sm">Painel Admin</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="ml-2 font-bold bg-red-600 text-white border-0">Painel Admin</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Logout Button */}
          <div className="pt-6 mt-auto">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      "w-full flex items-center p-3 rounded-lg text-charcoal hover:bg-red-50 hover:text-red-600 transition-all duration-200",
                      isCollapsed && "justify-center px-2"
                    )}
                    aria-label="Sair da conta"
                  >
                    <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span className="font-body text-sm font-medium">Sair</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="ml-2 bg-red-600 text-white border-0">Sair</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
        </nav>
      </aside>
    </>
  );
}
