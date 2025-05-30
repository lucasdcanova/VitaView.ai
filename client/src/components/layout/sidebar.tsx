import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import ProfileSwitcher from "@/components/profile-switcher";
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  UserCog, 
  LogOut,
  LineChart,
  Filter,
  Activity,
  TrendingUp,
  CreditCard,
  Store,
  Zap,
  ShieldCheck,
  User,
  Heart
} from "lucide-react";

// Props são opcionais agora que estamos usando o contexto global
type SidebarProps = {
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
};

export default function Sidebar(props: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  // Usar o contexto global, mas permitir override via props se necessário
  const sidebarContext = useSidebar();
  
  const isSidebarOpen = props.isSidebarOpen !== undefined ? props.isSidebarOpen : sidebarContext.isSidebarOpen;
  const toggleSidebar = props.toggleSidebar || sidebarContext.toggleSidebar;
  
  const handleLogout = () => {
    logoutMutation.mutate();
    // Fecha a sidebar em dispositivos móveis após o logout
    if (window.innerWidth < 768) {
      sidebarContext.closeSidebar();
    }
  };
  
  // Função para fechar a sidebar em dispositivos móveis após a navegação
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      sidebarContext.closeSidebar();
    }
  };

  return (
    <aside 
      className={`bg-white shadow-md w-64 flex-shrink-0 fixed md:sticky top-0 h-full z-20 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 flex items-center border-b border-gray-100">
        <div className="w-12 h-12 flex items-center justify-center mr-3">
          <img 
            src="/assets/vitaview_logo_icon.png" 
            alt="VitaView AI Logo" 
            className="w-12 h-auto" 
            onError={(e) => {
              console.error("Erro ao carregar logo:", e);
              e.currentTarget.onerror = null;
            }}
          />
        </div>
        <div>
          <span className="font-semibold text-[#1E3A5F] text-xl">VitaView</span>
          <span className="font-semibold text-[#448C9B] text-xl">AI</span>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#E0E9F5] text-[#1E3A5F] flex items-center justify-center mr-3">
            {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-medium text-sm">{user?.fullName || user?.username}</h3>
            <p className="text-xs text-[#707070]">Último exame: 2 dias atrás</p>
          </div>
        </div>
        <div className="mt-3">
          <ProfileSwitcher />
        </div>
      </div>
      
      <nav className="p-4 space-y-1">
        <Link href="/dashboard" 
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/dashboard' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/upload"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/upload' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Upload className="mr-3 h-5 w-5" />
          <span>Enviar Exames</span>
        </Link>
        
        <Link href="/quick-summary"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/quick-summary' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-amber-50 text-amber-700'
          }`}
        >
          <Zap className="mr-3 h-5 w-5 text-amber-500" />
          <span>Resumo Rápido</span>
        </Link>
        
        <Link href="/health-trends"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/health-trends' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Heart className="mr-3 h-5 w-5" />
          <span>
            Meu <span className="text-[#1E3A5F] font-semibold">VitaView</span>
          </span>
        </Link>
        
        <Link href="/history"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/history' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <History className="mr-3 h-5 w-5" />
          <span>Histórico</span>
        </Link>
        
        <Link href="/results"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/results' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <LineChart className="mr-3 h-5 w-5" />
          <span>Resultados</span>
        </Link>
        
        <Link href="/profile"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/profile' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <UserCog className="mr-3 h-5 w-5" />
          <span>Perfil</span>
        </Link>
        
        <Link href="/subscription"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/subscription' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <CreditCard className="mr-3 h-5 w-5" />
          <span>Minha Assinatura</span>
        </Link>
        
        <Link href="/subscription-plans"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/subscription-plans' 
              ? 'bg-[#E0E9F5] text-[#1E3A5F]' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Store className="mr-3 h-5 w-5" />
          <span>Planos</span>
        </Link>
        
        {/* Link para o painel administrativo - visível apenas para administradores */}
        {user?.role === 'admin' && (
          <Link href="/admin-panel"
            onClick={handleNavClick}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              location === '/admin-panel' 
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
  );
}
