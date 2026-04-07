import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { AudioWaveform } from "@/components/audio-waveform";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import {
  formatRecordingTime,
  useConsultationRecording,
} from "@/hooks/use-consultation-recording";
import { preloadRouteByPath } from "@/lib/route-preload";

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
  const [switchingClinicId, setSwitchingClinicId] = useState<number | null>(null);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user, logoutMutation } = useAuth();
  const { profiles, activeProfile, setActiveProfile } = useProfiles();
  const { recordingState, recordingTime, audioLevel, currentSession } =
    useConsultationRecording();
  const { data: clinicContext } = useQuery<{
    clinic: { id: number; name: string } | null;
    clinics?: Array<{ id: number; name: string; role: string; isActive: boolean }>;
    canCreateClinic?: boolean;
    activeClinicId?: number | null;
  }>({
    queryKey: ["/api/my-clinic", user?.id ?? null, user?.clinicId ?? null],
    enabled: !!user,
    retry: false,
  });

  const selectClinicMutation = useMutation({
    mutationFn: async (clinicId: number) => {
      const res = await apiRequest("POST", "/api/my-clinic/select", { clinicId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao selecionar clínica");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/user"], (currentUser: any) => currentUser ? {
        ...currentUser,
        clinicId: data?.clinicId ?? currentUser.clinicId,
        clinicRole: data?.role ?? currentUser.clinicRole,
      } : currentUser);

      await queryClient.invalidateQueries();
      closeSidebarOnMobile();
    },
    onMutate: (clinicId) => {
      setSwitchingClinicId(clinicId);
    },
    onSettled: () => {
      setSwitchingClinicId(null);
    },
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
  const accessibleClinics = clinicContext?.clinics ?? [];
  const sortedClinics = [...accessibleClinics].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
  const showClinicQuickSwitch = sortedClinics.length > 0;
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

  const roleLabel = (role?: string | null) =>
    role === "admin" ? "Admin" : role === "secretary" ? "Secretaria" : "Profissional";

  const handleClinicSwitch = (clinicId: number, isActive?: boolean) => {
    if (isActive || selectClinicMutation.isPending) return;
    selectClinicMutation.mutate(clinicId);
  };

  const handleOpenClinicPage = () => {
    setLocation("/minha-clinica");
    handleNavClick();
  };

  const getClinicInitials = (name?: string | null) => {
    if (!name) return "CL";
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  };

  const getClinicBadgeStyle = (name?: string | null, active?: boolean) => {
    const palette = [
      { bg: "#E7EEF6", border: "#C7D4E4", text: "#28415E" },
      { bg: "#EDEBE7", border: "#D8D2C8", text: "#4E463B" },
      { bg: "#E7F0EC", border: "#C6D8CF", text: "#2F5245" },
      { bg: "#F1ECE8", border: "#DDCFC6", text: "#5B4639" },
      { bg: "#ECECF4", border: "#D3D5E3", text: "#404A68" },
    ];

    const source = name || "clinica";
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      hash = source.charCodeAt(i) + ((hash << 5) - hash);
    }

    const selected = palette[Math.abs(hash) % palette.length];

    if (active) {
      return {
        backgroundColor: "#FFFFFF1A",
        borderColor: "#FFFFFF26",
        color: "#FFFFFF",
      };
    }

    return {
      backgroundColor: selected.bg,
      borderColor: selected.border,
      color: selected.text,
    };
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
              label: "Gravando agora",
              icon: <Mic className="h-4 w-4" />,
              iconClass:
                "bg-red-500/12 text-red-600 dark:bg-red-500/20 dark:text-red-300",
              dotClass: "bg-red-500 dark:bg-red-400",
              timerClass: "text-red-700 dark:text-red-200",
            };
          case "paused":
            return {
              label: "Gravacao pausada",
              icon: <PauseCircle className="h-4 w-4" />,
              iconClass:
                "bg-amber-500/12 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
              dotClass: "bg-amber-500 dark:bg-amber-400",
              timerClass: "text-amber-700 dark:text-amber-200",
            };
          case "processing":
            return {
              label: "Processando",
              icon: <BrandLoader className="h-4 w-4 animate-spin" />,
              iconClass:
                "bg-sky-500/12 text-sky-600 dark:bg-sky-500/18 dark:text-sky-300",
              dotClass: "bg-sky-500 dark:bg-sky-400",
              timerClass: "text-sky-700 dark:text-sky-200",
            };
          case "success":
            return {
              label: "Anamnese pronta",
              icon: <CheckCircle2 className="h-4 w-4" />,
              iconClass:
                "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/18 dark:text-emerald-300",
              dotClass: "bg-emerald-500 dark:bg-emerald-400",
              timerClass: "text-emerald-700 dark:text-emerald-200",
            };
          case "error":
            return {
              label: "Falha na gravacao",
              icon: <AlertTriangle className="h-4 w-4" />,
              iconClass:
                "bg-rose-500/12 text-rose-600 dark:bg-rose-500/18 dark:text-rose-300",
              dotClass: "bg-rose-500 dark:bg-rose-400",
              timerClass: "text-rose-700 dark:text-rose-200",
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
    const handleIntent = () => {
      void preloadRouteByPath(href);
    };

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
              onMouseEnter={handleIntent}
              onFocus={handleIntent}
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
              <ActivePatientIndicator className="w-full" collapsed={true} patientClickTarget="/pacientes" />
            </div>
          ) : (
            <ActivePatientIndicator className="w-full" surface="glass" patientClickTarget="/pacientes" />
          )}
        </div>

        {showRecordingNotice && recordingStatusMeta ? (
          <div
            className={cn(
              "relative z-10 border-b border-lightGray/80 dark:border-white/10",
              isCollapsed ? "p-2" : "px-3 pb-2 pt-1.5"
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
                        "relative flex h-10 w-full items-center justify-center rounded-xl border border-border/70 bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-accent/60 dark:bg-background/65"
                      )}
                      aria-label="Voltar para a consulta em gravacao"
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg",
                          recordingStatusMeta.iconClass
                        )}
                      >
                        {recordingStatusMeta.icon}
                      </div>
                      <span
                        className={cn(
                          "absolute right-2 top-2 h-2 w-2 rounded-full",
                          recordingStatusMeta.dotClass
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="ml-2 max-w-[220px] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {recordingStatusMeta.label}
                      </p>
                      <p className="text-sm font-semibold">
                        {currentSession?.patientName || "Paciente selecionado"}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-pureWhite/80">
                        <AudioWaveform
                          level={audioLevel}
                          active={recordingState === "recording"}
                          bars={4}
                          className="h-3 text-current"
                        />
                        {formatRecordingTime(recordingTime)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                type="button"
                onClick={handleReturnToRecording}
                className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-accent/55 dark:bg-background/65"
                aria-label="Voltar para a consulta em gravacao"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    recordingStatusMeta.iconClass
                  )}
                >
                  {recordingStatusMeta.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {recordingStatusMeta.label}
                    </span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        recordingStatusMeta.dotClass
                      )}
                    />
                  </div>
                  <p
                    className="mt-1 truncate text-xs text-muted-foreground"
                    title={currentSession?.patientName || "Paciente selecionado"}
                  >
                    {currentSession?.patientName || "Paciente selecionado"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-1">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/75 px-2.5 py-1 font-mono text-xs font-semibold shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] dark:bg-background/70",
                      recordingStatusMeta.timerClass
                    )}
                  >
                    <AudioWaveform
                      level={audioLevel}
                      active={recordingState === "recording"}
                      bars={4}
                      className="h-3"
                    />
                    {formatRecordingTime(recordingTime)}
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
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
              {isCollapsed && showClinicQuickSwitch && (
                <div className="mt-1 space-y-0.5 px-1">
                  {sortedClinics.map((accessibleClinic) => (
                    <TooltipProvider key={accessibleClinic.id} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              handleClinicSwitch(accessibleClinic.id, accessibleClinic.isActive);
                            }}
                            disabled={accessibleClinic.isActive || selectClinicMutation.isPending}
                            className={cn(
                              "relative flex w-full items-center justify-center rounded-lg p-1 transition-all",
                              accessibleClinic.isActive
                                ? "opacity-100"
                                : "opacity-50 hover:opacity-80",
                              selectClinicMutation.isPending && "opacity-40"
                            )}
                            aria-label={`Selecionar clínica ${accessibleClinic.name}`}
                          >
                            {switchingClinicId === accessibleClinic.id ? (
                              <div className="flex h-6 w-6 items-center justify-center">
                                <BrandLoader className="h-3 w-3 animate-spin text-charcoal" />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-semibold",
                                  accessibleClinic.isActive ? "text-pureWhite" : "text-charcoal"
                                )}
                                style={getClinicBadgeStyle(accessibleClinic.name, accessibleClinic.isActive)}
                              >
                                {getClinicInitials(accessibleClinic.name)}
                              </div>
                            )}
                            {accessibleClinic.isActive && (
                              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="ml-2 rounded-xl border border-lightGray bg-pureWhite text-charcoal shadow-lg">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{accessibleClinic.name}</p>
                            <p className="text-xs text-mediumGray">{roleLabel(accessibleClinic.role)}</p>
                            <p className="text-[11px] text-mediumGray">
                              {accessibleClinic.isActive ? "Clínica ativa" : "Trocar para esta clínica"}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}
              {!isCollapsed && showClinicQuickSwitch && (
                <div className="mt-2 space-y-1.5 pl-4 pr-1">
                  <ScrollArea className="max-h-[min(24vh,10rem)] pr-2">
                    <div className="space-y-1.5">
                      {sortedClinics.map((accessibleClinic) => {
                        const isSwitching = switchingClinicId === accessibleClinic.id;
                        return (
                          <button
                            key={accessibleClinic.id}
                            type="button"
                            onClick={() => {
                              handleClinicSwitch(accessibleClinic.id, accessibleClinic.isActive);
                            }}
                            disabled={accessibleClinic.isActive || selectClinicMutation.isPending}
                            className={cn(
                              "w-full rounded-md border px-2 py-1 text-left transition-all",
                              accessibleClinic.isActive
                                ? "border-[#D0D5DD] bg-[#F3F4F6] !text-charcoal shadow-sm"
                                : "border-lightGray bg-white/75 text-charcoal hover:border-charcoal/25 hover:bg-lightGray/25",
                              selectClinicMutation.isPending && "opacity-70"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-semibold leading-4 !text-[#111111]" style={{ color: "#111111" }}>
                                  {accessibleClinic.name}
                                </p>
                              </div>
                              {!accessibleClinic.isActive && (
                                <span className="shrink-0 rounded-full bg-lightGray px-1.5 py-0 text-[8px] font-semibold leading-4 !text-[#111111] dark:!text-white">
                                  {isSwitching ? "Abrindo" : "Entrar"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
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
