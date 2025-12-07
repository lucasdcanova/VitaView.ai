import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
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
  Users
} from "lucide-react";
import Logo from "@/components/ui/logo";


interface SidebarProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
}

export default function Sidebar(props: SidebarProps) {
  const sidebarContext = useSidebar();
  const isSidebarOpen = props.isSidebarOpen ?? sidebarContext.isSidebarOpen;
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

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
        className={`bg-white shadow-md w-64 flex-shrink-0 fixed md:sticky top-0 h-full z-20 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
      <div className="p-4 border-b border-gray-100">
        <Logo size="md" showText={true} textSize="md" />
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#E0E9F5] text-[#1E3A5F] flex items-center justify-center mr-3">
            {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-medium text-sm truncate max-w-[140px]" title={displayDoctor}>{displayDoctor}</h3>
            <p className="text-xs text-[#707070]">Profissional de saúde</p>
          </div>
        </div>

        <Link href="/profile">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm">
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </button>
        </Link>

      </div>

      <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        <Link href="/dashboard"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/dashboard'
            ? 'bg-[#E0E9F5] text-[#1E3A5F]'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        <Link href="/agenda"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/agenda'
            ? 'bg-[#E0E9F5] text-[#1E3A5F]'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <Calendar className="mr-3 h-5 w-5" />
          <span>Agenda</span>
        </Link>

        <Link href="/health-trends"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/health-trends'
            ? 'bg-[#E0E9F5] text-[#1E3A5F]'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <Heart className="mr-3 h-5 w-5" />
          <span className="text-[#1E3A5F] font-semibold">Vita Timeline</span>
        </Link>

        <Link href="/upload"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/upload'
            ? 'bg-[#E0E9F5] text-[#1E3A5F]'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <Upload className="mr-3 h-5 w-5" />
          <span>Enviar Exames</span>
        </Link>

        <Link href="/results"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/results'
            ? 'bg-[#E0E9F5] text-[#1E3A5F]'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <LineChart className="mr-3 h-5 w-5" />
          <span>View Laboratorial</span>
        </Link>

        <Link href="/subscription"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/subscription'
            ? 'bg-[#E0E9F5] text-[#1E3A5F]'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <CreditCard className="mr-3 h-5 w-5" />
          <span>Minha Assinatura</span>
        </Link>

        {/* Link para o painel administrativo - visível apenas para administradores */}
        {user?.role === 'admin' && (
          <Link href="/admin-panel"
            onClick={handleNavClick}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/admin-panel'
              ? 'bg-[#E0E9F5] text-[#1E3A5F]'
              : 'hover:bg-red-50 text-red-700'
              }`}
          >
            <ShieldCheck className="mr-3 h-5 w-5" />
            <span>Painel Admin</span>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg text-[#1E3A5F] hover:bg-gray-50 mt-6"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
    </>
  );
}
