import ProfileSwitcher from "@/components/profile-switcher";

// ... imports

export default function Sidebar(props: SidebarProps) {
  // ... existing code ...

  return (
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
            <h3 className="font-medium text-sm">{displayDoctor}</h3>
            <p className="text-xs text-[#707070]">Profissional de saúde</p>
          </div>
        </div>

        <div className="w-full">
          <ProfileSwitcher />
        </div>
      </div>

      <nav className="p-4 space-y-1">
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



        <Link href="/health-trends"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/health-trends'
              ? 'bg-[#E0E9F5] text-[#1E3A5F]'
              : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <Heart className="mr-3 h-5 w-5" />
          <span className="text-[#1E3A5F] font-semibold">Prontuário do paciente</span>
        </Link>

        <Link href="/history"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/history'
              ? 'bg-[#E0E9F5] text-[#1E3A5F]'
              : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <History className="mr-3 h-5 w-5" />
          <span>Histórico</span>
        </Link>

        <Link href="/results"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/results'
              ? 'bg-[#E0E9F5] text-[#1E3A5F]'
              : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <LineChart className="mr-3 h-5 w-5" />
          <span>Resultados</span>
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

        <Link href="/subscription-plans"
          onClick={handleNavClick}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${location === '/subscription-plans'
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
  );
}
