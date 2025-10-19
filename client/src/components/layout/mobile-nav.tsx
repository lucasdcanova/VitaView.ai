import { Link, useLocation } from "wouter";
import { LayoutDashboard, Upload, History, UserCog, LineChart } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-lg fixed bottom-0 inset-x-0 z-40 h-16 md:hidden">
      <div className="flex justify-between h-full px-4">
        <Link href="/"
          className={`flex flex-col items-center justify-center flex-1 ${
            location === '/' ? 'text-primary-600' : 'text-gray-500'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        
        <Link href="/upload"
          className={`flex flex-col items-center justify-center flex-1 ${
            location === '/upload' ? 'text-primary-600' : 'text-gray-500'
          }`}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs mt-1">Enviar</span>
        </Link>
        
        <Link href="/results"
          className={`flex flex-col items-center justify-center flex-1 ${
            location === '/results' ? 'text-primary-600' : 'text-gray-500'
          }`}
        >
          <LineChart className="h-5 w-5" />
          <span className="text-xs mt-1">Resultados</span>
        </Link>
        
        <Link href="/profile"
          className={`flex flex-col items-center justify-center flex-1 ${
            location === '/profile' ? 'text-primary-600' : 'text-gray-500'
          }`}
        >
          <UserCog className="h-5 w-5" />
          <span className="text-xs mt-1">Conta</span>
        </Link>
      </div>
    </nav>
  );
}
