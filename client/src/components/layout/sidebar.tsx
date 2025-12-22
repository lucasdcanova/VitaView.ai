import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useProfiles } from "@/hooks/use-profiles";
import {
  LayoutDashboard,
  Upload,
  LineChart,
  LogOut,
  CreditCard,
  ShieldCheck,
  Heart,
  Calendar,
  Settings,
  BarChart2,
} from "lucide-react";
import Logo from "@/components/ui/logo";
import ActivePatientIndicator from "@/components/active-patient-indicator";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

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
    return `w-full flex items-center p-3 rounded-lg transition-all duration-200 ${isActive
      ? 'bg-charcoal text-pureWhite'
      : 'text-charcoal hover:bg-lightGray'
      }`;
  };

  // Estilo dos ícones
  const getIconClass = (path: string) => {
    const isActive = location === path;
    return `mr-3 h-5 w-5 ${isActive ? 'text-pureWhite' : 'text-charcoal'}`;
  };

  return (
    <>
      {/* Overlay/Backdrop - apenas no mobile quando sidebar está aberta */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={closeSidebarOnMobile}
        />
      )}

      <aside
        className={`bg-pureWhite border-r border-lightGray w-64 flex-shrink-0 fixed md:sticky top-0 h-full z-20 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-lightGray" data-tour="sidebar-logo">
          <Logo size="md" showText={true} textSize="md" variant="icon" />
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-lightGray">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-lightGray text-charcoal flex items-center justify-center mr-3 font-heading font-bold">
                {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-charcoal truncate max-w-[100px]" title={displayDoctor}>
                  {displayDoctor}
                </h3>
                <p className="text-xs text-mediumGray font-body">Profissional de saúde</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </div>

          <Link href="/profile">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-charcoal bg-transparent text-charcoal rounded-lg transition-all duration-200 hover:bg-lightGray text-sm font-heading font-bold"
              aria-label="Configurações do perfil"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </button>
          </Link>
        </div>

        {/* Patient Selector */}
        <div className="p-3 border-b border-lightGray" data-tour="patient-selector">
          <ActivePatientIndicator className="w-full" />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-340px)]">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={getNavItemClass('/dashboard')}
            data-tour="nav-dashboard"
          >
            <LayoutDashboard className={getIconClass('/dashboard')} />
            <span className="font-body">Dashboard</span>
          </Link>

          <Link
            href="/agenda"
            onClick={handleNavClick}
            className={getNavItemClass('/agenda')}
            data-tour="nav-agenda"
          >
            <Calendar className={getIconClass('/agenda')} />
            <span className="font-body">Agenda</span>
          </Link>

          <Link
            href="/health-trends"
            onClick={handleNavClick}
            className={getNavItemClass('/health-trends')}
            data-tour="nav-timeline"
          >
            <Heart className={getIconClass('/health-trends')} />
            <span className="font-heading font-bold">Vita Timeline</span>
          </Link>

          <Link
            href="/upload"
            onClick={handleNavClick}
            className={getNavItemClass('/upload')}
            data-tour="nav-upload"
          >
            <Upload className={getIconClass('/upload')} />
            <span className="font-body">Enviar Exames</span>
          </Link>

          <Link
            href="/results"
            onClick={handleNavClick}
            className={getNavItemClass('/results')}
          >
            <LineChart className={getIconClass('/results')} />
            <span className="font-body">View Laboratorial</span>
          </Link>

          <Link
            href="/reports"
            onClick={handleNavClick}
            className={getNavItemClass('/reports')}
          >
            <BarChart2 className={getIconClass('/reports')} />
            <span className="font-body">Relatórios</span>
          </Link>

          <Link
            href="/subscription"
            onClick={handleNavClick}
            className={getNavItemClass('/subscription')}
          >
            <CreditCard className={getIconClass('/subscription')} />
            <span className="font-body">Minha Assinatura</span>
          </Link>

          {/* Link para o painel administrativo - visível apenas para administradores */}
          {user?.role === 'admin' && (
            <Link
              href="/admin-panel"
              onClick={handleNavClick}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${location === '/admin-panel'
                ? 'bg-red-600 text-white'
                : 'text-red-600 hover:bg-red-50'
                }`}
            >
              <ShieldCheck className={`mr-3 h-5 w-5 ${location === '/admin-panel' ? 'text-white' : 'text-red-600'}`} />
              <span className="font-body font-bold">Painel Admin</span>
            </Link>
          )}

          {/* Logout Button */}
          <div className="pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 rounded-lg text-charcoal hover:bg-lightGray transition-all duration-200"
              aria-label="Sair da conta"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="font-body">Sair</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
