import { Link, useLocation } from "wouter";
import { LayoutDashboard, Upload, History, UserCog } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-lg fixed bottom-0 inset-x-0 z-40 h-16 md:hidden">
      <div className="flex justify-between h-full px-4">
        <Link href="/">
          <a className={`flex flex-col items-center justify-center flex-1 ${
            location === '/' ? 'text-primary-600' : 'text-gray-500'
          }`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>
        
        <Link href="/upload">
          <a className={`flex flex-col items-center justify-center flex-1 ${
            location === '/upload' ? 'text-primary-600' : 'text-gray-500'
          }`}>
            <Upload className="h-5 w-5" />
            <span className="text-xs mt-1">Enviar</span>
          </a>
        </Link>
        
        <Link href="/history">
          <a className={`flex flex-col items-center justify-center flex-1 ${
            location === '/history' ? 'text-primary-600' : 'text-gray-500'
          }`}>
            <History className="h-5 w-5" />
            <span className="text-xs mt-1">Histórico</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`flex flex-col items-center justify-center flex-1 ${
            location === '/profile' ? 'text-primary-600' : 'text-gray-500'
          }`}>
            <UserCog className="h-5 w-5" />
            <span className="text-xs mt-1">Perfil</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
