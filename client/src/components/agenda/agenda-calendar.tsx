import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronDown, ChevronRight, Filter, Clock, User, Plus, Maximize2, Minimize2, CalendarDays, Calendar as CalendarWeek, DollarSign, Play, CheckCircle, List, Lock, Video, UserCheck } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getHours, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles } from "@/hooks/use-profiles";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import type { Appointment } from "@shared/schema";
import { TriageDialog } from "@/components/triage/triage-dialog";
import { Stethoscope } from "lucide-react";
import { AppointmentCard } from "./appointment-card";
import { AppointmentPopoverHeader } from "./appointment-popover-header";

interface AgendaCalendarProps {
  appointments?: Record<number, Appointment[]>;
  weekStart?: Date;
  onNewAppointment?: () => void;
  onEditAppointment?: (appointment: Appointment) => void;
  fullWidth?: boolean;
}

export function AgendaCalendar({
  appointments = {},
  weekStart = new Date(),
  onNewAppointment,
  onEditAppointment,
  fullWidth = false
}: AgendaCalendarProps) {
  const SLOT_INTERVAL_OPTIONS = [10, 15, 20, 30, 60] as const;
  const [currentDate, setCurrentDate] = useState(weekStart);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState<number>(() => {
    if (typeof window === "undefined") return 30;
    const raw = window.localStorage.getItem("vitaview:agenda-slot-interval-minutes");
    const parsed = raw ? Number.parseInt(raw, 10) : 30;
    return [10, 15, 20, 30, 60].includes(parsed as any) ? parsed : 30;
  });
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [todayPopoverOpen, setTodayPopoverOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { toast } = useToast();
  const { user } = useAuth();
  const { profiles, setActiveProfile, inServiceAppointmentId, setPatientInService, clearPatientInService } = useProfiles();
  const isMobile = useIsMobile();
  const isStandalonePwa = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );

  // Current time state for the red line indicator
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vitaview:agenda-slot-interval-minutes", String(slotIntervalMinutes));
  }, [slotIntervalMinutes]);

  React.useEffect(() => {
    // Prioritize the detailed daily view on mobile/PWA where week view gets cramped.
    if ((isMobile || isStandalonePwa) && viewMode === "week") {
      setViewMode("day");
    }
  }, [isMobile, isStandalonePwa, viewMode]);

  // Get display name for the doctor
  const doctorName = user?.fullName || user?.username || "Médico";

  const { data: appointmentsList = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Batch fetch all triages for appointments (performance optimization)
  const appointmentIds = React.useMemo(() =>
    appointmentsList.map(a => a.id).filter(Boolean),
    [appointmentsList]
  );

  const { data: triageMap = {} } = useQuery<Record<number, any>>({
    queryKey: ["/api/triage/batch", appointmentIds],
    queryFn: async () => {
      if (appointmentIds.length === 0) return {};
      const res = await apiRequest("POST", "/api/triage/batch", { appointmentIds });
      return res.json();
    },
    enabled: appointmentIds.length > 0,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string; checkedInAt?: Date }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Status atualizado",
        description: "O status do agendamento foi atualizado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/appointments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Agendamento apagado",
        description: "O agendamento foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível apagar o agendamento.",
        variant: "destructive",
      });
    }
  });

  const getAppointmentsForDay = (date: Date) => {
    return appointmentsList.filter(app => {
      // Handle both date string (YYYY-MM-DD) and full timestamp formats
      let appDate: Date;
      if (typeof app.date === 'string') {
        // If it's a simple date string, add time component
        if (app.date.length === 10) {
          appDate = new Date(app.date + 'T12:00:00');
        } else {
          // It's already a full timestamp
          appDate = new Date(app.date);
        }
      } else {
        appDate = new Date(app.date);
      }
      return isSameDay(appDate, date);
    });
  };

  const getFilteredAppointmentsForDay = (date: Date) => {
    // Shared Agenda Logic: If "Shared Agenda" is active (we'll add a toggle/prop for this later, 
    // but for now let's assume if it's the 'agenda' tab in MyClinic it passes fullWidth=true, 
    // or we can add a specific prop 'isSharedView').
    // Actually, based on the user request "Agenda compartilhada nao esta funcionando", 
    // we need to make sure we show ALL appointments when in that mode.

    // In `getAppointmentsForDay` we are filtering `appointmentsList`.
    // The `appointmentsList` comes from `/api/appointments` for normal view, 
    // OR `/api/clinic/appointments` for shared view.
    // The parent component seems to decide WHICH endpoint to call or pass data.
    // Let's check where `AgendaCalendar` is used.

    // If we are in "Shared Agenda" mode, we typically want to see everything.
    // The `appointmentsList` data source is key. 
    // If `appointments` prop is passed (which `MyClinic` does), we should use that instead of the internal query if present.

    const sourceAppointments = Object.keys(appointments).length > 0
      ? Object.values(appointments).flat()
      : appointmentsList;

    const dayApps = sourceAppointments.filter(app => {
      let appDate: Date;
      if (typeof app.date === 'string') {
        if (app.date.length === 10) appDate = new Date(app.date + 'T12:00:00');
        else appDate = new Date(app.date);
      } else {
        appDate = new Date(app.date);
      }
      return isSameDay(appDate, date);
    });

    if (filterType === "all") return dayApps;
    return dayApps.filter(app => app.type === filterType);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "consulta":
        return {
          bg: "bg-yellow-100 dark:bg-amber-950/45",
          border: "border-yellow-500 dark:border-amber-700",
          text: "text-yellow-900 dark:text-amber-200",
          subtext: "text-yellow-800 dark:text-amber-300",
          label: "text-yellow-600 dark:text-amber-400",
          dot: "bg-yellow-500"
        };
      case "retorno":
        return {
          bg: "bg-green-100 dark:bg-emerald-950/45",
          border: "border-green-500 dark:border-emerald-700",
          text: "text-green-900 dark:text-emerald-200",
          subtext: "text-green-800 dark:text-emerald-300",
          label: "text-green-600 dark:text-emerald-400",
          dot: "bg-green-500"
        };
      case "exames":
        return {
          bg: "bg-purple-100 dark:bg-violet-950/45",
          border: "border-purple-500 dark:border-violet-700",
          text: "text-purple-900 dark:text-violet-200",
          subtext: "text-purple-800 dark:text-violet-300",
          label: "text-purple-600 dark:text-violet-400",
          dot: "bg-purple-500"
        };
      case "procedimento":
        return {
          bg: "bg-blue-100 dark:bg-blue-950/45",
          border: "border-blue-500 dark:border-blue-700",
          text: "text-blue-900 dark:text-blue-200",
          subtext: "text-blue-800 dark:text-blue-300",
          label: "text-blue-600 dark:text-blue-400",
          dot: "bg-blue-500"
        };
      case "urgencia":
        return {
          bg: "bg-red-100 dark:bg-red-950/45",
          border: "border-red-500 dark:border-red-700",
          text: "text-red-900 dark:text-red-200",
          subtext: "text-red-800 dark:text-red-300",
          label: "text-red-600 dark:text-red-400",
          dot: "bg-red-500"
        };
      case "blocked":
        return {
          bg: "bg-muted dark:bg-slate-800/80",
          border: "border-border dark:border-slate-700",
          text: "text-muted-foreground dark:text-slate-200",
          subtext: "text-muted-foreground dark:text-slate-300",
          label: "text-muted-foreground dark:text-slate-400",
          dot: "bg-muted-foreground"
        };
      default:
        return {
          bg: "bg-yellow-100 dark:bg-amber-950/45",
          border: "border-yellow-500 dark:border-amber-700",
          text: "text-yellow-900 dark:text-amber-200",
          subtext: "text-yellow-800 dark:text-amber-300",
          label: "text-yellow-600 dark:text-amber-400",
          dot: "bg-yellow-500"
        };
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 });

  const startOfCurrentMonth = startOfMonth(currentDate);
  const endOfCurrentMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 }), // Start from the beginning of the week containing the 1st of the month
    end: endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 })
  });

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const handleStartService = (appointment: Appointment) => {
    // If already in progress, just resume checking the patient locally
    if (appointment.status === 'in_progress') {
      if (appointment.profileId) {
        setPatientInService(appointment.profileId, appointment.id);
        setLocation('/atendimento');
        toast({
          title: "Atendimento retomado",
          description: `Retomando atendimento de ${appointment.patientName}`
        });
      }
      return;
    }

    updateStatusMutation.mutate(
      { id: appointment.id, status: 'in_progress' },
      {
        onSuccess: () => {
          if (appointment.profileId) {
            setPatientInService(appointment.profileId, appointment.id);
            setLocation('/atendimento');
          } else {
            toast({
              title: "Paciente não identificado",
              description: "Não é possível iniciar atendimento sem um perfil de paciente vinculado.",
              variant: "destructive"
            })
          }
        }
      }
    );
  };

  const getDailySlots = () => {
    const slots: { hour: number; minute: number }[] = [];
    const startMinutes = 7 * 60;
    const endMinutesExclusive = 20 * 60;

    for (let totalMinutes = startMinutes; totalMinutes < endMinutesExclusive; totalMinutes += slotIntervalMinutes) {
      slots.push({
        hour: Math.floor(totalMinutes / 60),
        minute: totalMinutes % 60,
      });
    }
    return slots;
  };

  const formatSlotTime = (hour: number, minute: number) => {
    const hourLabel = String(hour).padStart(2, "0");
    const minuteLabel = String(minute).padStart(2, "0");
    return `${hourLabel}:${minuteLabel}`;
  };

  const parseTime = (timeValue: string) => {
    const [hourPart, minutePart] = timeValue.split(":");
    const hour = Number.parseInt(hourPart, 10);
    const minute = Number.parseInt(minutePart ?? "0", 10);
    return {
      hour: Number.isNaN(hour) ? 0 : hour,
      minute: Number.isNaN(minute) ? 0 : minute,
    };
  };

  const getTotalMinutes = (hour: number, minute: number) => (hour * 60) + minute;

  const getSlotStartForTime = (timeValue?: string | null) => {
    const { hour, minute } = parseTime(timeValue || "00:00");
    const total = getTotalMinutes(hour, minute);
    const slotStart = Math.floor(total / slotIntervalMinutes) * slotIntervalMinutes;
    return {
      hour: Math.floor(slotStart / 60),
      minute: slotStart % 60,
      totalMinutes: slotStart,
    };
  };

  // Helper to parse appointment date consistently
  const parseAppointmentDate = (date: string | Date): Date => {
    if (typeof date === 'string') {
      // If it's a simple date string (YYYY-MM-DD), add time component
      if (date.length === 10) {
        return new Date(date + 'T12:00:00');
      }
      // It's already a full timestamp
      return new Date(date);
    }
    return new Date(date);
  };

  const canStartServiceFromAppointment = (appointment: Appointment) => {
    const appointmentDate = parseAppointmentDate(appointment.date);
    const isToday = isSameDay(appointmentDate, new Date());
    const isBlocked = appointment.type === "blocked";
    const isActive = appointment.id === inServiceAppointmentId;

    if (!isToday || isBlocked || appointment.status === "completed") {
      return false;
    }

    return (
      !appointment.status ||
      appointment.status === "scheduled" ||
      appointment.status === "waiting" ||
      (appointment.status === "in_progress" && !isActive)
    );
  };

  const currentDayAppointments = getFilteredAppointmentsForDay(currentDate);
  const currentDayNonBlockedAppointments = currentDayAppointments.filter((app) => app.type !== "blocked");
  const currentDayTelemedicineCount = currentDayNonBlockedAppointments.filter((app) => app.isTelemedicine).length;
  const currentDayWaitingCount = currentDayNonBlockedAppointments.filter((app) => app.status === "waiting").length;
  const currentDayInProgressCount = currentDayNonBlockedAppointments.filter((app) => app.status === "in_progress").length;
  const currentDayCompletedCount = currentDayNonBlockedAppointments.filter((app) => app.status === "completed").length;
  const currentDayTotalMinutes = currentDayNonBlockedAppointments.reduce((acc, app) => acc + (Number(app.duration) || 0), 0);
  const isCurrentDateToday = isSameDay(currentDate, new Date());
  const isCompactDayExperience = isMobile || isStandalonePwa;
  const sortedCurrentDayAppointments = [...currentDayNonBlockedAppointments].sort((a, b) => {
    const timeA = a.isAllDay ? "00:00" : (a.time || "00:00");
    const timeB = b.isAllDay ? "00:00" : (b.time || "00:00");
    return timeA.localeCompare(timeB);
  });
  const nextAppointmentForCurrentDay = sortedCurrentDayAppointments.find((app) => {
    if (!isCurrentDateToday) return true;
    if (app.status === "in_progress") return true;
    if (app.isAllDay) return true;
    return (app.time || "00:00") >= format(new Date(), "HH:mm");
  }) || null;

  const handleTodayPopoverChange = (open: boolean) => {
    const today = new Date();
    if (open && !(isSameDay(currentDate, today) && viewMode === "day")) {
      // Not on today – navigate there instead of opening the picker
      setCurrentDate(today);
      setViewMode("day");
      setTodayPopoverOpen(false);
      return;
    }
    setTodayPopoverOpen(open);
  };

  return (
    <div className={cn(
      "bg-card overflow-hidden flex flex-col h-full",
      fullWidth ? "border-b border-border" : "rounded-2xl shadow-2xl"
    )}>
      {/* Calendar Header */}
      <div className={cn("agenda-calendar-hero text-charcoal dark:text-white shrink-0", isMobile ? "p-3" : "p-6")}>
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 md:gap-4">
            {/* Date picker + compact controls */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 xl:flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-auto justify-start p-0 min-w-0 rounded-2xl border px-2 py-2 sm:px-2.5 shadow-sm overflow-hidden",
                      "bg-white/95 border-black/5 text-charcoal hover:bg-white hover:text-charcoal",
                      "dark:bg-transparent dark:border-transparent dark:shadow-none dark:!text-white dark:hover:bg-transparent dark:hover:text-white/90",
                      isCompactDayExperience ? "flex-1" : "w-full max-w-full"
                    )}
                  >
                    <div className={cn(
                      "rounded-2xl border flex items-center justify-center shrink-0",
                      "border-black/10 bg-background/95 shadow-sm",
                      "dark:border-white/15 dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                      isCompactDayExperience ? "w-10 h-10" : "w-14 h-14"
                    )}>
                      <CalendarIcon className={cn("text-charcoal dark:!text-white", isCompactDayExperience ? "w-5 h-5" : "w-7 h-7")} />
                    </div>
                    <div className="text-left ml-2 sm:ml-3 min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className={cn("font-bold capitalize tracking-tight text-charcoal dark:!text-white truncate min-w-0", isCompactDayExperience ? "text-base" : "text-2xl")}>
                          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                        </h3>
                        {isStandalonePwa && !isCompactDayExperience && (
                          <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] rounded-full border border-black/10 bg-white px-2 py-1 text-charcoal/70 dark:border-white/15 dark:bg-black/20 dark:text-white/75">
                            PWA
                          </span>
                        )}
                      </div>
                      <p className={cn("text-charcoal/70 dark:text-white/70 truncate", isCompactDayExperience ? "text-[11px]" : "text-xs sm:text-sm")}>
                        {viewMode === 'day' ? (
                          format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                        ) : viewMode === 'week' ? (
                          `Semana ${format(startOfCurrentWeek, "dd")} - ${format(endOfWeek(currentDate), "dd 'de' MMMM", { locale: ptBR })} `
                        ) : (
                          "Vista mensal"
                        )}
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Mobile: compact action buttons inline with date */}
              {isCompactDayExperience && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    onClick={onNewAppointment}
                    size="sm"
                    className="bg-card text-charcoal hover:bg-muted border-0 shadow-sm h-9 w-9 p-0"
                    title="Nova Consulta"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Popover open={todayPopoverOpen} onOpenChange={handleTodayPopoverChange}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-9 border px-2.5 relative",
                          isCurrentDateToday
                            ? "bg-charcoal text-white border-charcoal shadow-sm dark:bg-white dark:text-charcoal dark:border-white"
                            : "bg-white/80 text-charcoal hover:bg-white hover:text-charcoal border-black/10 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white dark:shadow-none"
                        )}
                      >
                        Hoje
                        {!isCurrentDateToday && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-900" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={(date) => {
                          if (date) {
                            setCurrentDate(date);
                            setViewMode("day");
                          }
                          setTodayPopoverOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center bg-white/80 dark:bg-white/10 rounded-lg p-0.5 border border-black/10 dark:border-white/10 shadow-sm dark:shadow-none">
                    <button
                      className="p-1.5 hover:bg-black/5 dark:hover:bg-white/20 rounded transition-colors text-charcoal dark:text-white"
                      onClick={handlePrev}
                      aria-label="Período anterior"
                    >
                      <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-black/5 dark:hover:bg-white/20 rounded transition-colors text-charcoal dark:text-white"
                      onClick={handleNext}
                      aria-label="Próximo período"
                    >
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: full action buttons */}
            {!isCompactDayExperience && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 xl:justify-end">
                <Button
                  onClick={onNewAppointment}
                  className="bg-card text-charcoal hover:bg-muted border-0 font-semibold shadow-sm"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Consulta
                </Button>

                <Popover open={todayPopoverOpen} onOpenChange={handleTodayPopoverChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "border relative",
                        isCurrentDateToday
                          ? "bg-charcoal text-white border-charcoal shadow-sm dark:bg-white dark:text-charcoal dark:border-white"
                          : "bg-white/80 text-charcoal hover:bg-white hover:text-charcoal border-black/10 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white dark:shadow-none"
                      )}
                    >
                      Hoje
                      {!isCurrentDateToday && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-900" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => {
                        if (date) {
                          setCurrentDate(date);
                          setViewMode("day");
                        }
                        setTodayPopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center bg-white/80 dark:bg-white/10 rounded-xl p-1 border border-black/10 dark:border-white/10 shadow-sm dark:shadow-none">
                  <button
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/20 rounded-md transition-colors text-charcoal dark:text-white"
                    onClick={handlePrev}
                    aria-label="Período anterior"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/20 rounded-md transition-colors text-charcoal dark:text-white"
                    onClick={handleNext}
                    aria-label="Próximo período"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>

                <div className="flex bg-white/80 dark:bg-white/10 rounded-xl p-1 gap-1 border border-black/10 dark:border-white/10 shadow-sm dark:shadow-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 px-3 text-charcoal hover:bg-black/5 dark:text-white dark:hover:bg-white/20 gap-1.5",
                      viewMode === 'day' && "bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-white/20 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                    )}
                    title="Dia"
                    onClick={() => setViewMode('day')}
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden lg:inline">Dia</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 px-3 text-charcoal hover:bg-black/5 dark:text-white dark:hover:bg-white/20 gap-1.5",
                      viewMode === 'week' && "bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-white/20 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                    )}
                    title="Semana"
                    onClick={() => setViewMode('week')}
                  >
                    <CalendarWeek className="w-4 h-4" />
                    <span className="hidden lg:inline">Semana</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 px-3 text-charcoal hover:bg-black/5 dark:text-white dark:hover:bg-white/20 gap-1.5",
                      viewMode === 'month' && "bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-white/20 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                    )}
                    title="Mês"
                    onClick={() => setViewMode('month')}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="hidden lg:inline">Mês</span>
                  </Button>
                </div>

                <div className="w-full sm:w-auto">
                  <Select
                    value={String(slotIntervalMinutes)}
                    onValueChange={(value) => setSlotIntervalMinutes(Number.parseInt(value, 10))}
                  >
                    <SelectTrigger className="h-10 w-full sm:w-[170px] bg-white/80 border-black/10 text-charcoal shadow-sm dark:bg-white/10 dark:border-white/15 dark:text-white dark:shadow-none">
                      <SelectValue placeholder="Intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_INTERVAL_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          Grade: {minutes} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Stats section */}
          <div className="flex flex-col xl:flex-row gap-3 xl:items-stretch">
            {/* Mobile: compact inline stats */}
            {isCompactDayExperience ? (
              <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/75 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none text-sm">
                <span className="text-charcoal dark:text-white">
                  <span className="font-bold">{currentDayNonBlockedAppointments.length}</span>
                  <span className="text-charcoal/60 dark:text-white/60 ml-1">consultas</span>
                </span>
                <span className="text-charcoal/30 dark:text-white/30">·</span>
                <span className="text-charcoal dark:text-white">
                  <span className="font-bold">{currentDayWaitingCount}</span>
                  <span className="text-charcoal/60 dark:text-white/60 ml-1">espera</span>
                </span>
                <span className="text-charcoal/30 dark:text-white/30">·</span>
                <span className="text-charcoal dark:text-white">
                  <span className="font-bold">{currentDayInProgressCount}</span>
                  <span className="text-charcoal/60 dark:text-white/60 ml-1">atend.</span>
                </span>
                <span className="text-charcoal/30 dark:text-white/30">·</span>
                <span className="text-charcoal dark:text-white">
                  <span className="font-bold">{Math.round(currentDayTotalMinutes / 60)}h</span>
                </span>
              </div>
            ) : (
              /* Desktop: full stat cards */
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                <div className="rounded-xl border border-black/10 bg-white/75 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-charcoal/60 dark:text-white/65">Consultas do dia</p>
                  <p className="text-lg font-bold text-charcoal dark:text-white">{currentDayNonBlockedAppointments.length}</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/75 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-charcoal/60 dark:text-white/65">Em espera</p>
                  <p className="text-lg font-bold text-charcoal dark:text-white">{currentDayWaitingCount}</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/75 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-charcoal/60 dark:text-white/65">Atendendo</p>
                  <p className="text-lg font-bold text-charcoal dark:text-white">{currentDayInProgressCount}</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/75 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-charcoal/60 dark:text-white/65">Carga do dia</p>
                  <p className="text-lg font-bold text-charcoal dark:text-white">{Math.round(currentDayTotalMinutes / 60)}h</p>
                </div>
              </div>
            )}

            {/* Next appointment card */}
            <div className={cn(
              "rounded-xl border border-black/10 bg-white/70 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-black/15 dark:shadow-none",
              isCompactDayExperience ? "px-3 py-2" : "xl:w-[320px] px-3 py-3"
            )}>
              <div className="flex items-center justify-between gap-3">
                <p className={cn("font-semibold uppercase tracking-[0.14em] text-charcoal/70 dark:text-white/70", isCompactDayExperience ? "text-[10px]" : "text-xs")}> Próxima consulta</p>
                <span className={cn("text-charcoal/60 dark:text-white/60", isCompactDayExperience ? "text-[10px]" : "text-[11px]")}>
                  {currentDayTelemedicineCount > 0 ? `${currentDayTelemedicineCount} telemed` : `${currentDayCompletedCount} concluídas`}
                </span>
              </div>
              {nextAppointmentForCurrentDay ? (
                <div className={cn(isCompactDayExperience ? "mt-1" : "mt-2")}>
                  <p className={cn("font-bold text-charcoal dark:text-white truncate", isCompactDayExperience ? "text-sm" : "text-base")}>{nextAppointmentForCurrentDay.patientName}</p>
                  <p className={cn("text-charcoal/70 dark:text-white/70", isCompactDayExperience ? "text-xs" : "text-sm")}>
                    {nextAppointmentForCurrentDay.isAllDay ? "Dia inteiro" : nextAppointmentForCurrentDay.time} • {nextAppointmentForCurrentDay.type}
                  </p>
                </div>
              ) : (
                <p className={cn("text-charcoal/70 dark:text-white/70", isCompactDayExperience ? "mt-1 text-xs" : "mt-2 text-sm")}>
                  {isCurrentDateToday ? "Nenhuma consulta pendente para hoje." : "Nenhuma consulta para esta data."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={cn("flex-1 flex flex-col overflow-hidden", isCompactDayExperience ? "p-3" : "p-6")}>
        {viewMode === 'day' ? (
          <div className={cn("space-y-4 overflow-y-auto", isCompactDayExperience ? "pr-0" : "pr-2")}>
            {(() => {
              const allDayApps = getFilteredAppointmentsForDay(currentDate).filter(app => !!app.isAllDay);
              if (allDayApps.length === 0) return null;

              return (
                <div className={cn("flex gap-4 group border-b border-border pb-4 last:border-0", isCompactDayExperience ? "min-h-[64px]" : "min-h-[80px]")}>
                  <div className={cn("flex-shrink-0 text-right", isCompactDayExperience ? "w-16" : "w-20")}>
                    <div className="text-sm font-bold text-muted-foreground pt-1">Dia Inteiro</div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {allDayApps.map(app => {
                      const styles = getTypeStyles(app.type);
                      const appointmentDate = parseAppointmentDate(app.date);
                      const isToday = isSameDay(appointmentDate, new Date());
                      const isActive = app.id === inServiceAppointmentId;
                      const isBlocked = app.type === 'blocked';
                      const canStartService = isToday && !isBlocked && app.status !== 'completed' && (!app.status || app.status === 'scheduled' || (app.status === 'in_progress' && !isActive));

                      return (
                        <div key={app.id} className={cn(
                          "flex flex-col md:flex-row gap-4 rounded-xl border transition-all hover:shadow-md bg-card",
                          isCompactDayExperience ? "p-3" : "p-4",
                          styles.border
                        )}>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider", styles.bg, styles.text)}>
                                {app.type}
                              </span>
                              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Dia Inteiro
                              </span>
                            </div>
                            <h4 className="text-xl font-bold mb-1 flex items-center gap-2">
                              <span className="text-foreground flex items-center gap-2">
                                {isBlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                                {app.patientName}
                              </span>
                            </h4>
                            {app.notes && (
                              <p className="text-muted-foreground text-sm mt-2 bg-muted/40 p-2 rounded-lg border border-border inline-block">
                                "{app.notes}"
                              </p>
                            )}
                          </div>
                          <div className={cn("flex flex-col items-end justify-center gap-2", isCompactDayExperience ? "min-w-0" : "min-w-[180px]")}>
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditAppointment?.(app)}>
                                Editar
                              </Button>
                              {!isBlocked && app.status === 'scheduled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-muted/40 text-foreground border-border hover:bg-muted placeholder:opacity-50"
                                  onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'waiting', checkedInAt: new Date() })}
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Recepcionar
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteAppointmentMutation.mutate(app.id)}
                                disabled={deleteAppointmentMutation.isPending}
                              >
                                Apagar
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {getDailySlots().map(({ hour, minute }) => {
              const slotTotalMinutes = getTotalMinutes(hour, minute);
              const slotEndMinutes = slotTotalMinutes + slotIntervalMinutes;
              const apps = getFilteredAppointmentsForDay(currentDate).filter(app => {
                if (app.isAllDay) return false;
                const appSlot = getSlotStartForTime(app.time);
                return appSlot.totalMinutes === slotTotalMinutes;
              });

              return (
                <div key={`${hour}-${minute}`} className={cn("flex gap-4 group border-b border-border pb-4 last:border-0", isCompactDayExperience ? "min-h-[64px]" : "min-h-[80px]")}>
                  {/* Time Column */}
                  <div className={cn("flex-shrink-0 text-right", isCompactDayExperience ? "w-14" : "w-20")}>
                    <span className={cn("font-bold text-foreground block -mt-1", isCompactDayExperience ? "text-sm" : "text-lg")}>{formatSlotTime(hour, minute)}</span>
                    <span className="text-xs text-muted-foreground">
                      {/* If we want to show anything else here */}
                    </span>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 space-y-3 relative">
                    <div className="absolute top-2 left-0 w-full h-px bg-muted group-hover:bg-muted transition-colors -z-10"></div>

                    {/* Current Time Indicator Line */}
                    {(() => {
                      const isToday = isSameDay(currentDate, new Date());
                      const nowTotalMinutes = getTotalMinutes(now.getHours(), now.getMinutes());
                      const isCurrentSlot = isToday && nowTotalMinutes >= slotTotalMinutes && nowTotalMinutes < slotEndMinutes;

                      if (isCurrentSlot) {
                        const minutesInSlot = nowTotalMinutes - slotTotalMinutes;
                        const percent = (minutesInSlot / slotIntervalMinutes) * 100;

                        // We add a small offset (e.g. top-2 is for the divider line usually at the text baseline)
                        // If top-2 is roughly where the specific time text aligns, we might want to align relative to the container height
                        // The container has min-h-[80px]. Let's assume linear distribution for now or just visual marker.
                        // Actually the divider is at top-2 (~8px). 
                        // Let's position relatively.

                        return (
                          <div
                            className="absolute w-full flex items-center z-10 pointer-events-none"
                            style={{ top: `${percent}%` }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-sm ring-1 ring-white"></div>
                            <div className="h-px bg-red-500 w-full shadow-[0_0_2px_rgba(239,68,68,0.5)]"></div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {apps.length > 0 ? (
                      apps.map(app => {
                        const styles = getTypeStyles(app.type);
                        const isActive = app.id === inServiceAppointmentId;
                        const isBlocked = app.type === 'blocked';
                        const canStartService = canStartServiceFromAppointment(app);

                        return (
                          <div key={app.id} className={cn(
                            "flex flex-col md:flex-row gap-4 rounded-xl border transition-all hover:shadow-md bg-card",
                            isCompactDayExperience ? "p-3" : "p-4",
                            styles.border
                          )}>
                            {/* Left Info */}
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                if (app.profileId) {
                                  const profile = profiles.find(p => p.id === app.profileId);
                                  if (profile) setActiveProfile(profile);
                                } else {
                                  toast({
                                    title: "Paciente não vinculado",
                                    description: "Este agendamento não está vinculado a um perfil de paciente.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider", styles.bg, styles.text)}>
                                  {app.type}
                                </span>
                                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {app.isAllDay ? "Dia Inteiro" : app.time}
                                </span>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {app.duration} min
                                </span>
                              </div>

                              <h4 className="text-xl font-bold mb-1 flex items-center gap-2">
                                {canStartService ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartService(app);
                                    }}
                                    className="text-charcoal hover:text-charcoal/80 hover:underline cursor-pointer flex items-center gap-1 group"
                                    title={app.status === 'in_progress' ? "Retomar atendimento" : "Iniciar atendimento"}
                                  >
                                    <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {app.isTelemedicine && <Video className="w-4 h-4 text-muted-foreground mr-1" />}
                                    {app.patientName}
                                  </button>
                                ) : (
                                  <span className="text-foreground flex items-center gap-2">
                                    {isBlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                                    {app.isTelemedicine && <Video className="w-3.5 h-3.5 text-muted-foreground" />}
                                    {app.patientName}
                                  </span>
                                )}
                                {app.profileId && !isBlocked && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-charcoal" title="Ver perfil">
                                    <User className="h-4 w-4" />
                                  </Button>
                                )}
                              </h4>

                              {app.notes && (
                                <p className="text-muted-foreground text-sm mt-2 bg-muted/40 p-2 rounded-lg border border-border inline-block">
                                  "{app.notes}"
                                </p>
                              )}
                            </div>

                            {/* Right Actions */}
                            <div className={cn("flex flex-col items-end justify-center gap-2", isCompactDayExperience ? "min-w-0" : "min-w-[180px]")}>
                              {canStartService ? (
                                <Button
                                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                  onClick={() => handleStartService(app)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  {app.status === 'in_progress' ? 'Retomar Atendimento' : app.status === 'waiting' ? 'Atender' : 'Iniciar Atendimento'}
                                </Button>
                              ) : (
                                <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium w-full text-center">
                                  {app.status === 'completed' ? 'Concluído' : isActive ? 'Em Atendimento' : 'Agendado'}
                                </div>
                              )}

                              <div className="flex gap-2 w-full">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditAppointment?.(app)}>
                                  Editar
                                </Button>
                                {!isBlocked && (!app.status || app.status === 'scheduled') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                    onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'waiting', checkedInAt: new Date() })}
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Check-in
                                  </Button>
                                )}
                                {!isBlocked && app.status === 'in_progress' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-muted-foreground border-border hover:bg-muted/40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatusMutation.mutate({ id: app.id, status: 'waiting', checkedInAt: new Date() });
                                    }}
                                    title="Voltar para sala de espera"
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Recepção
                                  </Button>
                                )}
                                {!isBlocked && (
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                    setSelectedAppointment(app);
                                    setTriageDialogOpen(true);
                                  }}>
                                    Triagem
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className={cn(
                          "h-full rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-border hover:text-muted-foreground transition-colors cursor-pointer",
                          isCompactDayExperience ? "min-h-[44px] text-xs" : "min-h-[60px] text-sm"
                        )}
                        onClick={onNewAppointment}
                      >
                        <Plus className={cn(isCompactDayExperience ? "w-3.5 h-3.5 mr-1" : "w-4 h-4 mr-1")} />
                        {isCompactDayExperience ? "Livre" : "Disponível"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'week' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4 shrink-0">
              {weekDays.map((day, i) => {
                const date = addDays(startOfCurrentWeek, i);
                const isToday = isSameDay(date, new Date());

                return (
                  <div key={i} className="text-center">
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{day}</div>
                    <div className={cn(
                      "text-sm font-medium flex flex-col items-center justify-center mx-auto rounded-lg py-1 px-2",
                      isToday ? "bg-[#212121] text-white dark:bg-[#2a3242] dark:text-[#f5f7fb]" : "text-foreground"
                    )}>
                      <span className="text-lg font-bold">{format(date, "d")}</span>
                      <span className={cn("text-[10px] uppercase", isToday ? "text-muted-foreground" : "text-muted-foreground")}>
                        {format(date, "MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week All Day Section */}
            <div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const date = addDays(startOfCurrentWeek, dayIndex);
                const allDayApps = getFilteredAppointmentsForDay(date).filter(app => !!app.isAllDay);

                if (allDayApps.length === 0) return <div key={dayIndex} />;

                return (
                  <div key={dayIndex} className="space-y-1">
                    {allDayApps.map((appointment, idx) => {
                      const styles = getTypeStyles(appointment.type);
                      return (
                        <div key={appointment.id || idx} className={cn("text-xs font-semibold p-1 rounded border mb-1 truncate", styles.bg, styles.border, styles.text)}>
                          Dia Inteiro - {appointment.patientName}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Week Time Slots Grid */}
            <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const date = addDays(startOfCurrentWeek, dayIndex);
                return (
                  <div key={dayIndex} className="bg-muted/40 rounded-lg p-2 h-full min-h-[200px] space-y-2">
                    {getFilteredAppointmentsForDay(date)
                      .filter(app => !app.isAllDay)
                      .map((appointment, idx) => {
                        const styles = getTypeStyles(appointment.type);
                        return (
                          <Popover key={appointment.id || idx}>
                            <PopoverTrigger asChild>
                              <div>
                                <AppointmentCard
                                  appointment={appointment}
                                  styles={styles}
                                  isInService={appointment.id === inServiceAppointmentId}
                                  triageData={triageMap[appointment.id]}
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="grid gap-4">
                                {(() => {
                                  return (
                                    <AppointmentPopoverHeader
                                      appointment={appointment}
                                      styles={styles}
                                      canStartService={canStartServiceFromAppointment(appointment)}
                                      onStartService={() => handleStartService(appointment)}
                                      triageData={triageMap[appointment.id]}
                                    />
                                  );
                                })()}
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>{appointment.isAllDay ? 'Dia Inteiro' : appointment.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span>{doctorName}</span>
                                  </div>
                                  {appointment.notes && (
                                    <div className="mt-2 text-sm text-muted-foreground bg-muted/40 p-2 rounded">
                                      {appointment.notes}
                                    </div>
                                  )}
                                  {appointment.price && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                                      <span>
                                        {(appointment.price / 100).toLocaleString('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  {(() => {
                                    const canStartService = canStartServiceFromAppointment(appointment);
                                    const canCheckIn = (!appointment.status || appointment.status === 'scheduled') && !appointment.type.includes('blocked');

                                    return (
                                      <>
                                        {(canStartService || canCheckIn) && (
                                          <div className={cn("grid gap-2", canStartService && canCheckIn ? "grid-cols-2" : "grid-cols-1")}>
                                            {canStartService && (
                                              <Button
                                                size="sm"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                                                onClick={() => handleStartService(appointment)}
                                                disabled={updateStatusMutation.isPending}
                                              >
                                                <Play className="w-4 h-4 mr-1" />
                                                {appointment.status === 'in_progress' ? 'Retomar' : 'Atender'}
                                              </Button>
                                            )}
                                            {canCheckIn && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-foreground border-border hover:bg-muted w-full"
                                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'waiting', checkedInAt: new Date() })}
                                                disabled={updateStatusMutation.isPending}
                                              >
                                                <UserCheck className="w-4 h-4 mr-1" />
                                                Recepcionar
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                  {/* Other action buttons */}
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-card hover:bg-muted"
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setTriageDialogOpen(true);
                                      }}
                                    >
                                      <Stethoscope className="w-4 h-4 mr-1" />
                                      Triagem
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-card hover:bg-muted"
                                      onClick={() => onEditAppointment?.(appointment)}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                                      disabled={deleteAppointmentMutation.isPending}
                                    >
                                      Apagar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4 overflow-y-auto">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2">
                {day}
              </div>
            ))}
            {daysInMonth.map((date, i) => {
              const isToday = isSameDay(date, new Date());
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const apps = getFilteredAppointmentsForDay(date);

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] border rounded-lg p-2 transition-colors cursor-pointer hover:border-border",
                    isCurrentMonth ? "bg-card border-border" : "bg-muted/50 border-border text-muted-foreground",
                    isToday && "ring-2 ring-[#212121]/25 dark:ring-[#6e7b95]/50 ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-[#212121] text-white dark:bg-[#2a3242] dark:text-[#f5f7fb]" : "text-foreground"
                    )}>
                      {format(date, "d")}
                    </span>
                    {apps.length > 0 && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {apps.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {apps.slice(0, 3).map((app, idx) => {
                      const styles = getTypeStyles(app.type);
                      return (
                        <div key={idx} className={cn("text-[10px] truncate rounded px-1 py-0.5", styles.bg, styles.text)}>
                          {app.isAllDay ? "Dia Inteiro" : app.time} {app.patientName}
                        </div>
                      )
                    })}
                    {apps.length > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1">
                        + {apps.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className={cn("mt-6 flex flex-wrap gap-4 justify-center", isCompactDayExperience && "gap-x-3 gap-y-2")}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Consulta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Retorno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Procedimento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Exames</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Urgência</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-charcoal rounded"></div>
            <span className="text-xs text-muted-foreground">Finalizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted-foreground rounded"></div>
            <span className="text-xs text-muted-foreground">Bloqueado</span>
          </div>
        </div>
      </div>



      {/* Triage Dialog */}
      {
        selectedAppointment && (
          <TriageDialog
            open={triageDialogOpen}
            onOpenChange={setTriageDialogOpen}
            appointmentId={selectedAppointment.id}
            patientName={selectedAppointment.patientName}
            profileId={selectedAppointment.profileId || undefined}
          />
        )
      }
    </div>
  );
}
