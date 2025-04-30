import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  UserCog, 
  LogOut,
  LineChart,
  Filter
} from "lucide-react";

type SidebarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export default function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside 
      className={`bg-white shadow-md w-64 flex-shrink-0 fixed md:sticky top-0 h-full z-20 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 flex items-center border-b border-gray-100">
        <svg 
          viewBox="0 0 24 24" 
          className="w-8 h-8 rounded-md mr-2 text-primary-600 fill-current"
        >
          <path d="M19 5.5h-4.5V1H9v4.5H4.5V19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5.5zm-9-3h3V7h4.5v10.5c0 .55-.45 1-1 1h-10c-.55 0-1-.45-1-1V7H11V2.5z"/>
          <path d="M11 11h2v6h-2z"/>
          <path d="M11 9h2v1h-2z"/>
        </svg>
        <div>
          <span className="font-semibold text-gray-800">Health</span>
          <span className="font-semibold text-primary-500">Analytics</span>
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
        <Link href="/" 
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            location === '/' 
              ? 'bg-primary-50 text-primary-700' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/upload"
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
