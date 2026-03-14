import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useProfiles } from "@/hooks/use-profiles";
import {
  LogOut,
  CreditCard,
  ShieldCheck,
  Building,
  Calendar,
  Settings,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
  ArrowUpRight,
  Mic,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Logo from "@/components/ui/logo";
import ActivePatientIndicator from "@/components/active-patient-indicator";
import { NotificationBell } from "@/components/notification-bell";
import ThemeToggleButton from "@/components/layout/theme-toggle-button";
import { BrandLoader } from "@/components/ui/brand-loader";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatRecordingTime,
  useConsultationRecording,
} from "@/hooks/use-consultation-recording";

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
  className?: string;
}

export default function Sidebar(props: SidebarProps) {
  const sidebarContext = useSidebar();
  const isSidebarOpen = props.isSidebarOpen ?? sidebarContext.isSidebarOpen;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { profiles, activeProfile, setActiveProfile } = useProfiles();
  const { recordingState, recordingTime, currentSession, errorMessage } =
    useConsultationRecording();
  const { data: clinicContext } = useQuery<{ clinic: { name: string } | null }>({
    queryKey: ["/api/my-clinic", user?.id ?? null, user?.clinicId ?? null],
    enabled: !!user && !!user?.clinicId,
    retry: false,
  });

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

  // Check if secretary is logged in (loggedInAs field comes from API)
  const loggedInAs = (user as any)?.loggedInAs;
  const isSecretary = loggedInAs?.role === 'secretary';
  const displayName = isSecretary ? loggedInAs.name : (user?.fullName || user?.username || "Doutor");
  const displayRole = isSecretary ? 'Secretária' : 'Profissional de saúde';
  const selectedClinicName = clinicContext?.clinic?.name || null;
  const professionalProfile =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, any>).professionalProfile
      : null;
  const fallbackSidebarPhotoUrl =
    typeof professionalProfile?.professionalPhoto === "string"
      ? professionalProfile.professionalPhoto
      : null;
  const serverSidebarPhotoUrl = (() => {
    if (!user?.profilePhotoUrl) return null;

    if (
      user.profilePhotoUrl.startsWith("data:") ||
      user.profilePhotoUrl.startsWith("http") ||
      user.profilePhotoUrl.startsWith("/api/users/profile-photo/")
    ) {
      return user.profilePhotoUrl;
    }

    return `/api/users/profile-photo/${user.id}?v=${encodeURIComponent(user.profilePhotoUrl)}`;
  })();
  const [hasSidebarPhotoError, setHasSidebarPhotoError] = useState(false);
  const sidebarPhotoUrl = hasSidebarPhotoError
    ? fallbackSidebarPhotoUrl || null
    : serverSidebarPhotoUrl || fallbackSidebarPhotoUrl || null;

  useEffect(() => {
    setHasSidebarPhotoError(false);
  }, [serverSidebarPhotoUrl, fallbackSidebarPhotoUrl]);

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

  const showRecordingNotice = Boolean(currentSession && recordingState !== "idle");

  const recordingStatusMeta = showRecordingNotice
    ? (() => {
        switch (recordingState) {
          case "recording":
            return {
              eyebrow: "Consulta em gravacao",
              badge: "Ao vivo",
              subtitle: "O audio continua captando a consulta mesmo fora da tela de atendimento.",
              actionLabel: "Voltar para gravacao",
              containerClass:
                "border-red-200/80 bg-[linear-gradient(135deg,rgba(254,242,242,0.98),rgba(255,255,255,0.98),rgba(255,237,213,0.82))] shadow-[0_18px_45px_-28px_rgba(239,68,68,0.6)]",
              iconWrapperClass:
                "border-red-200/80 bg-red-500 text-white shadow-[0_16px_32px_-20px_rgba(239,68,68,0.85)]",
              badgeClass: "bg-red-600 text-white",
              timerClass: "border-red-200/80 bg-white/90 text-red-700",
              icon: (
                <div className="relative flex items-center justify-center">
                  <Mic className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white/95 shadow-[0_0_0_3px_rgba(239,68,68,0.22)]" />
                </div>
              ),
            };
          case "paused":
            return {
              eyebrow: "Consulta pausada",
              badge: "Pausada",
              subtitle: "A consulta segue aberta. Retome a gravacao ou volte ao atendimento quando precisar.",
              actionLabel: "Retomar consulta",
              containerClass:
                "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98),rgba(255,247,237,0.86))] shadow-[0_18px_45px_-28px_rgba(217,119,6,0.45)]",
              iconWrapperClass:
                "border-amber-200/80 bg-amber-500/95 text-white shadow-[0_16px_32px_-20px_rgba(217,119,6,0.75)]",
              badgeClass: "bg-amber-500 text-white",
              timerClass: "border-amber-200/80 bg-white/90 text-amber-700",
              icon: <PauseCircle className="h-5 w-5" />,
            };
          case "processing":
            return {
              eyebrow: "Processando consulta",
              badge: "IA ativa",
              subtitle: "A transcricao esta sendo preparada para entrar na anamnese automaticamente.",
              actionLabel: "Acompanhar processamento",
              containerClass:
                "border-slate-200/90 bg-[linear-gradient(135deg,rgba(248,250,252,0.99),rgba(255,255,255,0.99),rgba(241,245,249,0.92))] shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)]",
              iconWrapperClass:
                "border-slate-200/80 bg-slate-900 text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.85)]",
              badgeClass: "bg-slate-900 text-white",
              timerClass: "border-slate-200/80 bg-white/92 text-slate-700",
              icon: <BrandLoader className="h-5 w-5 animate-spin text-white" />,
            };
          case "success":
            return {
              eyebrow: "Anamnese pronta",
              badge: "Pronta",
              subtitle: "A IA concluiu a transcricao. Volte para revisar e salvar o atendimento.",
              actionLabel: "Revisar anamnese",
              containerClass:
                "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,0.98),rgba(240,253,250,0.86))] shadow-[0_18px_45px_-28px_rgba(16,185,129,0.38)]",
              iconWrapperClass:
                "border-emerald-200/80 bg-emerald-500 text-white shadow-[0_16px_32px_-20px_rgba(16,185,129,0.78)]",
              badgeClass: "bg-emerald-600 text-white",
              timerClass: "border-emerald-200/80 bg-white/92 text-emerald-700",
              icon: <CheckCircle2 className="h-5 w-5" />,
            };
          case "error":
            return {
              eyebrow: "Falha na gravacao",
              badge: "Atencao",
              subtitle:
                errorMessage ||
                "Encontramos um problema na gravacao. Volte para revisar a consulta.",
              actionLabel: "Voltar para gravacao",
              containerClass:
                "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(255,255,255,0.98),rgba(255,245,245,0.9))] shadow-[0_18px_45px_-28px_rgba(244,63,94,0.36)]",
              iconWrapperClass:
                "border-rose-200/80 bg-rose-500 text-white shadow-[0_16px_32px_-20px_rgba(244,63,94,0.72)]",
              badgeClass: "bg-rose-600 text-white",
              timerClass: "border-rose-200/80 bg-white/92 text-rose-700",
              icon: <AlertTriangle className="h-5 w-5" />,
            };
          default:
            return null;
        }
      })()
    : null;

  const handleReturnToRecording = () => {
    if (!currentSession) return;

    const recordingProfile =
      currentSession.profileId !== null
        ? profiles.find((profile) => profile.id === currentSession.profileId) || null
        : null;

    if (recordingProfile && activeProfile?.id !== recordingProfile.id) {
      setActiveProfile(recordingProfile);
    }

    setLocation(currentSession.returnPath || "/atendimento");
    handleNavClick();
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

  const NavItem = ({ href, icon: Icon, label, tourId, highlight }: { href: string, icon: any, label: string, tourId?: string, highlight?: boolean }) => {
    const isActive = location === href;

    // Custom styles for highlighted item (Atendimento)
    // When active: Standard active style (dark bg, white text)
    // When inactive but highlighted: Primary light bg, primary text, bold
    const highlightClasses = highlight && !isActive
      ? "bg-charcoal text-pureWhite hover:brightness-110 shadow-md border border-transparent"
      : "";

    const highlightIconClasses = highlight && !isActive
      ? "text-pureWhite"
      : "";

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              onClick={handleNavClick}
              className={cn(
                getNavItemClass(href),
                highlightClasses
              )}
              data-tour={tourId}
            >
              <Icon className={cn(getIconClass(href), highlightIconClasses)} />
              {!isCollapsed && <span className={cn("font-heading text-sm truncate opacity-100 transition-opacity duration-300", highlight ? "font-bold" : "font-bold")}>{label}</span>}
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="ml-2 font-bold bg-charcoal text-pureWhite border-0">
              {label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  };

  return (
    <>
      {/* Overlay/Backdrop - apenas no mobile quando sidebar está aberta */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-charcoal/45 backdrop-blur-[2px] md:hidden"
          onClick={closeSidebarOnMobile}
        />
      )}

      <aside
        className={cn(
          "relative bg-pureWhite/95 backdrop-blur-xl border-r border-lightGray flex flex-col flex-shrink-0 fixed left-0 top-0 h-[100svh] min-h-[100svh] md:h-[100dvh] md:min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] z-[70] transition-transform md:transition-all duration-300 ease-out will-change-transform transform-gpu sidebar-shadow overflow-hidden md:overflow-visible",
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-[min(95vw,24rem)] md:w-20' : 'w-[min(95vw,24rem)] md:w-80',
          props.className
        )}
      >
        {/* Safe-area gradient cap for iOS status bar transition */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[calc(env(safe-area-inset-top)+2.5rem)] bg-gradient-to-b from-pureWhite via-pureWhite/95 to-pureWhite/0" />

        {/* Toggle Button (Desktop Only) */}
        <div className="absolute -right-5 top-14 hidden md:flex z-50">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-pureWhite border-2 border-charcoal shadow-xl text-charcoal hover:bg-charcoal hover:text-pureWhite transition-all duration-300 transform hover:scale-110"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
          </Button>
        </div>

        {/* Logo Section */}
        <div
          className={cn(
            "relative z-10 border-b border-lightGray transition-all duration-300",
            isCollapsed ? "p-2 py-4 flex flex-col items-center gap-4" : "p-4 flex items-center justify-between gap-3"
          )}
          data-tour="sidebar-logo"
        >
          {isCollapsed ? (
            <>
              <Logo size="sm" showText={false} variant="icon" />
              <div className="flex flex-col items-center gap-2">
                <ThemeToggleButton className="h-7 w-7" />
                <NotificationBell />
              </div>
            </>
          ) : (
            <>
              <Logo size="md" showText={true} textSize="md" variant="icon" />
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggleButton className="h-8 w-8" />
                <NotificationBell />
              </div>
            </>
          )}
        </div>

        {/* User Profile Section */}
        <div className={cn("relative z-10 border-b border-lightGray transition-all duration-300", isCollapsed ? "p-2 py-4" : "p-4")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center flex-col gap-2" : "")}>
            <div className={cn("flex items-center", isCollapsed ? "flex-col justify-center" : "")}>
              {sidebarPhotoUrl ? (
                <img
                  src={sidebarPhotoUrl}
                  alt={user?.fullName || user?.username || 'Perfil'}
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-lightGray"
                  onError={() => setHasSidebarPhotoError(true)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-lightGray text-charcoal flex items-center justify-center font-heading font-bold shadow-sm border border-lightGray">
                  {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <h3 className="font-heading font-bold text-sm text-charcoal truncate max-w-[180px]" title={displayName}>
                    {displayName}
                  </h3>
                  {selectedClinicName ? (
                    <p className="text-xs text-charcoal/80 font-body truncate flex items-center gap-1" title={selectedClinicName}>
                      <Building className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{selectedClinicName}</span>
                    </p>
                  ) : null}
                  <p className="text-[11px] text-mediumGray font-body truncate">
                    {displayRole}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Selector */}
        <div
          className={cn(
            "relative z-10 border-b border-lightGray/80 bg-gradient-to-b from-pureWhite/45 via-pureWhite/25 to-pureWhite/10 backdrop-blur-sm",
            isCollapsed ? "p-2" : "p-3"
          )}
          data-tour="patient-selector"
        >
          {isCollapsed ? (
            <div className="flex justify-center" title={activeProfile?.name || "Nenhum paciente"}>
              <ActivePatientIndicator className="w-full" collapsed={true} />
            </div>
          ) : (
            <ActivePatientIndicator className="w-full" surface="glass" />
          )}
        </div>

        {showRecordingNotice && recordingStatusMeta ? (
          <div
            className={cn(
              "relative z-10 border-b border-lightGray/80 bg-gradient-to-b from-pureWhite/70 via-pureWhite/40 to-pureWhite/10 backdrop-blur-sm",
              isCollapsed ? "p-2" : "px-3 pb-3 pt-2"
            )}
          >
            {isCollapsed ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleReturnToRecording}
                      className={cn(
                        "relative flex h-12 w-full items-center justify-center rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                        recordingStatusMeta.containerClass
                      )}
                      aria-label="Voltar para a consulta em gravacao"
                    >
                      {recordingStatusMeta.icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2 max-w-[220px] rounded-xl border-0 bg-charcoal text-pureWhite">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pureWhite/70">
                        {recordingStatusMeta.eyebrow}
                      </p>
                      <p className="text-sm font-semibold">
                        {currentSession?.patientName || "Paciente selecionado"}
                      </p>
                      <p className="text-xs text-pureWhite/80">
                        Tempo: {formatRecordingTime(recordingTime)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div
                className={cn(
                  "rounded-[22px] border p-3.5 transition-all duration-300",
                  recordingStatusMeta.containerClass
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                      recordingStatusMeta.iconWrapperClass
                    )}
                  >
                    {recordingStatusMeta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/65">
                          {recordingStatusMeta.eyebrow}
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-charcoal"
                          title={currentSession?.patientName || "Paciente selecionado"}
                        >
                          {currentSession?.patientName || "Paciente selecionado"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          recordingStatusMeta.badgeClass
                        )}
                      >
                        {recordingStatusMeta.badge}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-charcoal/75">
                      {recordingStatusMeta.subtitle}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className={cn(
                          "rounded-2xl border px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]",
                          recordingStatusMeta.timerClass
                        )}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
                          Tempo
                        </p>
                        <p className="font-mono text-lg font-semibold">
                          {formatRecordingTime(recordingTime)}
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleReturnToRecording}
                        className="h-auto flex-1 rounded-2xl bg-charcoal px-4 py-3 text-left text-pureWhite shadow-[0_14px_28px_-20px_rgba(33,33,33,0.85)] transition-all duration-200 hover:bg-charcoal/92"
                      >
                        <span className="flex w-full items-center justify-between gap-3">
                          <span className="text-sm font-semibold">
                            {recordingStatusMeta.actionLabel}
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0" />
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Navigation + Bottom Actions */}
        <div className={cn("relative z-10 flex-1 min-h-0 flex flex-col overflow-y-auto", isCollapsed ? "p-2 pb-1" : "p-4 pb-1")}>
          <nav className="shrink-0">
            <div className="space-y-1">
              <NavItem href="/agenda" icon={Calendar} label="Agenda" tourId="nav-agenda" />
              <NavItem href="/pacientes" icon={Users} label="Pacientes" tourId="nav-pacientes" />
              <NavItem href="/vita-assist" icon={Sparkles} label="Vita Assist" tourId="nav-vita-assist" />
              <NavItem href="/minha-clinica" icon={Building} label="Minha Clínica" tourId="nav-minha-clinica" />
            </div>
          </nav>

          <div className="mt-6 md:mt-auto pt-3 border-t border-lightGray/80 space-y-1">
            <NavItem href="/subscription" icon={CreditCard} label="Minha Assinatura" tourId="nav-assinatura" />
            <NavItem href="/reports" icon={BarChart2} label="Relatórios" tourId="nav-relatorios" />
            <NavItem href="/profile" icon={Settings} label="Configurações" tourId="nav-configuracoes" />

            {/* Link para o painel administrativo - visível apenas para administradores */}
            {user?.role === 'admin' && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/admin-panel"
                      onClick={handleNavClick}
                      className={cn(
                        "w-full flex items-center p-3 rounded-lg transition-all duration-200 mt-3",
                        location === '/admin-panel' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40',
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
            <div className="relative z-10 pt-2 mt-2">
              <div className="pointer-events-none absolute inset-x-0 -top-4 h-10 bg-gradient-to-b from-pureWhite/0 to-pureWhite/70" />
              <div className="pointer-events-none absolute inset-0 rounded-t-xl bg-gradient-to-t from-pureWhite/90 via-pureWhite/78 to-pureWhite/35 backdrop-blur-md" />
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className={cn(
                        "relative w-full flex items-center p-3 rounded-xl border border-lightGray/70 bg-pureWhite/45 text-charcoal hover:bg-red-50/80 dark:hover:bg-red-950/40 hover:text-red-600 transition-all duration-200 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]",
                        isCollapsed && "justify-center px-2"
                      )}
                      aria-label="Sair da conta"
                      type="button"
                    >
                      <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                      {!isCollapsed && <span className="font-body text-sm font-medium">Sair</span>}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right" className="ml-2 bg-red-600 text-white border-0">Sair</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop spacer keeps content area scrollable while sidebar stays fixed */}
      <div
        aria-hidden="true"
        className={cn(
          "hidden md:block flex-shrink-0 transition-all duration-300",
          isCollapsed ? "w-20" : "w-80"
        )}
      />
    </>
  );
}
