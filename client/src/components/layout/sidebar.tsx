import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  UserCog, 
  LogOut,
  LineChart,
  Filter
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
        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mr-3">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <span className="font-semibold text-primary-600 text-xl">Hemolog</span>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
            {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-medium text-sm">{user?.fullName || user?.username}</h3>
            <p className="text-xs text-gray-500">Último exame: 2 dias atrás</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-1">
        <Link href="/dashboard" 
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/dashboard' 
              ? 'bg-primary-50 text-primary-700' 
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
              ? 'bg-primary-50 text-primary-700' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Upload className="mr-3 h-5 w-5" />
          <span>Enviar Exames</span>
        </Link>
        
        <Link href="/history"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/history' 
              ? 'bg-primary-50 text-primary-700' 
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
              ? 'bg-primary-50 text-primary-700' 
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
              ? 'bg-primary-50 text-primary-700' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <UserCog className="mr-3 h-5 w-5" />
          <span>Perfil</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 mt-6"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
  );
}
