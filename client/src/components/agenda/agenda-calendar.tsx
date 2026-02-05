import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronDown, ChevronRight, Filter, Clock, User, Plus, Maximize2, Minimize2, CalendarDays, Calendar as CalendarWeek, DollarSign, Play, CheckCircle, List, Lock } from "lucide-react";
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
  const [currentDate, setCurrentDate] = useState(weekStart);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [, setLocation] = useLocation();

  const { toast } = useToast();
  const { user } = useAuth();
  const { profiles, setActiveProfile, inServiceAppointmentId, setPatientInService, clearPatientInService } = useProfiles();

  // Current time state for the red line indicator
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

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
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
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
    const apps = getAppointmentsForDay(date);
    if (filterType === "all") return apps;
    return apps.filter(app => app.type === filterType);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "consulta": return { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-900", subtext: "text-yellow-800", label: "text-yellow-600", dot: "bg-yellow-500" };
      case "retorno": return { bg: "bg-green-100", border: "border-green-500", text: "text-green-900", subtext: "text-green-800", label: "text-green-600", dot: "bg-green-500" };
      case "exames": return { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-900", subtext: "text-purple-800", label: "text-purple-600", dot: "bg-purple-500" };
      case "procedimento": return { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-900", subtext: "text-blue-800", label: "text-blue-600", dot: "bg-blue-500" };
      case "urgencia": return { bg: "bg-red-100", border: "border-red-500", text: "text-red-900", subtext: "text-red-800", label: "text-red-600", dot: "bg-red-500" };
      case "blocked": return { bg: "bg-gray-200", border: "border-gray-400", text: "text-gray-600", subtext: "text-gray-500", label: "text-gray-500", dot: "bg-gray-400" };
      default: return { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-900", subtext: "text-yellow-800", label: "text-yellow-600", dot: "bg-yellow-500" };
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
    for (let hour = 7; hour <= 19; hour++) {
      slots.push({ hour, minute: 0 });
      slots.push({ hour, minute: 30 });
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

  return (
    <div className={cn(
      "bg-white overflow-hidden flex flex-col h-full",
      fullWidth ? "border-b border-lightGray" : "rounded-2xl shadow-2xl"
    )}>
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-6 text-white shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-transparent !text-white hover:text-white/90">
                  <CalendarIcon className="w-8 h-8 mr-4 !text-white" />
                  <div className="text-left">
                    <h3 className="text-2xl font-bold capitalize !text-white">
                      {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {viewMode === 'day' ? (
                        format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                      ) : viewMode === 'week' ? (
                        `Semana ${format(startOfCurrentWeek, "dd")} - ${format(endOfWeek(currentDate), "dd 'de' MMMM", { locale: ptBR })} `
                      ) : (
                        "Vista Mensal"
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
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onNewAppointment}
              className="bg-white text-[#212121] hover:bg-gray-100 border-0 font-semibold"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>

            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <Filter className="w-4 h-4 ml-2 mr-1 text-white/70" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] border-0 bg-transparent text-white focus:ring-0 focus:ring-offset-0 h-8">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="exames">Exames</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="urgencia">Urgência</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              <button
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
                onClick={handlePrev}
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <button
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
                onClick={handleNext}
              >
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </button>
            </div>

            <div className="flex bg-white/10 rounded-lg p-1 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 text-white hover:bg-white/20", viewMode === 'day' && "bg-white/20")}
                title="Dia"
                onClick={() => setViewMode('day')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 text-white hover:bg-white/20", viewMode === 'week' && "bg-white/20")}
                title="Semana"
                onClick={() => setViewMode('week')}
              >
                <CalendarWeek className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 text-white hover:bg-white/20", viewMode === 'month' && "bg-white/20")}
                title="Mês"
                onClick={() => setViewMode('month')}
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        {viewMode === 'day' ? (
          <div className="space-y-4 overflow-y-auto pr-2">
            {(() => {
              const allDayApps = getFilteredAppointmentsForDay(currentDate).filter(app => !!app.isAllDay);
              if (allDayApps.length === 0) return null;

              return (
                <div className="flex gap-4 min-h-[80px] group border-b border-gray-100 pb-4 last:border-0">
                  <div className="w-20 flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-gray-500 pt-1">Dia Inteiro</div>
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
                          "flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all hover:shadow-md bg-white",
                          styles.border
                        )}>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider", styles.bg, styles.text)}>
                                {app.type}
                              </span>
                              <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Dia Inteiro
                              </span>
                            </div>
                            <h4 className="text-xl font-bold mb-1 flex items-center gap-2">
                              <span className="text-gray-800 flex items-center gap-2">
                                {isBlocked && <Lock className="w-3.5 h-3.5 text-gray-500" />}
                                {app.patientName}
                              </span>
                            </h4>
                            {app.notes && (
                              <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block">
                                "{app.notes}"
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditAppointment?.(app)}>
                                Editar
                              </Button>
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
              const apps = getFilteredAppointmentsForDay(currentDate).filter(app => {
                if (app.isAllDay) return false;
                const { hour: appHour, minute: appMinute } = parseTime(app.time);
                const slotMinute = appMinute < 30 ? 0 : 30;
                return appHour === hour && slotMinute === minute;
              });

              return (
                <div key={`${hour}-${minute}`} className="flex gap-4 min-h-[80px] group border-b border-gray-100 pb-4 last:border-0">
                  {/* Time Column */}
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-lg font-bold text-gray-700 block -mt-1">{formatSlotTime(hour, minute)}</span>
                    <span className="text-xs text-gray-400">
                      {/* If we want to show anything else here */}
                    </span>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 space-y-3 relative">
                    <div className="absolute top-2 left-0 w-full h-px bg-gray-100 group-hover:bg-gray-200 transition-colors -z-10"></div>

                    {/* Current Time Indicator Line */}
                    {(() => {
                      const isToday = isSameDay(currentDate, new Date());
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();

                      // Check if current time falls within this slot (slot start <= now < slot start + 30)
                      // The slot starts at 'hour' and 'minute' (0 or 30)
                      const isCurrentSlot = isToday && currentHour === hour && currentMinute >= minute && currentMinute < (minute + 30);

                      if (isCurrentSlot) {
                        // Calculate percentage: (minutes passed in this 30min slot / 30) * 100
                        const minutesInSlot = currentMinute - minute;
                        const percent = (minutesInSlot / 30) * 100;

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
                        const appointmentDate = parseAppointmentDate(app.date);
                        const isToday = isSameDay(appointmentDate, new Date());
                        const isActive = app.id === inServiceAppointmentId;
                        const isBlocked = app.type === 'blocked';
                        const canStartService = isToday && !isBlocked && app.status !== 'completed' && (!app.status || app.status === 'scheduled' || (app.status === 'in_progress' && !isActive));

                        return (
                          <div key={app.id} className={cn(
                            "flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all hover:shadow-md bg-white",
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
                                <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {app.isAllDay ? "Dia Inteiro" : app.time}
                                </span>
                                <span className="text-sm font-semibold text-gray-500">
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
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1 group"
                                    title={app.status === 'in_progress' ? "Retomar atendimento" : "Iniciar atendimento"}
                                  >
                                    <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {app.patientName}
                                  </button>
                                ) : (
                                  <span className="text-gray-800 flex items-center gap-2">
                                    {isBlocked && <Lock className="w-3.5 h-3.5 text-gray-500" />}
                                    {app.patientName}
                                  </span>
                                )}
                                {app.profileId && !isBlocked && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" title="Ver perfil">
                                    <User className="h-4 w-4" />
                                  </Button>
                                )}
                              </h4>

                              {app.notes && (
                                <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block">
                                  "{app.notes}"
                                </p>
                              )}
                            </div>

                            {/* Right Actions */}
                            <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                              {canStartService ? (
                                <Button
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  onClick={() => handleStartService(app)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  {app.status === 'in_progress' ? 'Retomar Atendimento' : 'Iniciar Atendimento'}
                                </Button>
                              ) : (
                                <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium w-full text-center">
                                  {app.status === 'completed' ? 'Concluído' : isActive ? 'Em Atendimento' : 'Agendado'}
                                </div>
                              )}

                              <div className="flex gap-2 w-full">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditAppointment?.(app)}>
                                  Editar
                                </Button>
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
                      <div className="h-full min-h-[60px] rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 text-sm hover:border-gray-300 hover:text-gray-400 transition-colors cursor-pointer" onClick={onNewAppointment}>
                        <Plus className="w-4 h-4 mr-1" /> Disponível
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
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{day}</div>
                    <div className={cn(
                      "text-sm font-medium flex flex-col items-center justify-center mx-auto rounded-lg py-1 px-2",
                      isToday ? "bg-[#212121] text-white" : "text-gray-700"
                    )}>
                      <span className="text-lg font-bold">{format(date, "d")}</span>
                      <span className={cn("text-[10px] uppercase", isToday ? "text-gray-300" : "text-gray-400")}>
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
                  <div key={dayIndex} className="bg-gray-50 rounded-lg p-2 h-full min-h-[200px] space-y-2">
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
                                  const appointmentDate = parseAppointmentDate(appointment.date);
                                  const isToday = isSameDay(appointmentDate, new Date());
                                  const isBlocked = appointment.type === 'blocked';
                                  const canStart = isToday && !isBlocked && appointment.status !== 'in_progress' && appointment.status !== 'completed';
                                  return (
                                    <AppointmentPopoverHeader
                                      appointment={appointment}
                                      styles={styles}
                                      canStartService={canStart}
                                      onStartService={() => handleStartService(appointment)}
                                      triageData={triageMap[appointment.id]}
                                    />
                                  );
                                })()}
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span>{appointment.isAllDay ? 'Dia Inteiro' : appointment.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span>{doctorName}</span>
                                  </div>
                                  {appointment.notes && (
                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      {appointment.notes}
                                    </div>
                                  )}
                                  {appointment.price && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <DollarSign className="w-4 h-4 text-gray-500" />
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
                                  {/* Status action buttons - Iniciar Atendimento only for today */}
                                  {(() => {
                                    const appointmentDate = parseAppointmentDate(appointment.date);
                                    const isToday = isSameDay(appointmentDate, new Date());
                                    const isActive = appointment.id === inServiceAppointmentId;
                                    const canStartService = isToday && appointment.status !== 'completed' && (!appointment.status || appointment.status === 'scheduled' || (appointment.status === 'in_progress' && !isActive));

                                    return (
                                      <>
                                        {canStartService && (
                                          <Button
                                            size="sm"
                                            className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                                            onClick={() => handleStartService(appointment)}
                                            disabled={updateStatusMutation.isPending}
                                          >
                                            <Play className="w-4 h-4 mr-1" />
                                            {appointment.status === 'in_progress' ? 'Retomar Atendimento' : 'Iniciar Atendimento'}
                                          </Button>
                                        )}

                                      </>
                                    );
                                  })()}
                                  {/* Other action buttons */}
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-white hover:bg-gray-100"
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
                                      className="bg-white hover:bg-gray-100"
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
              <div key={day} className="text-center font-semibold text-gray-500 text-sm py-2">
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
                    "min-h-[100px] border rounded-lg p-2 transition-colors cursor-pointer hover:border-gray-300",
                    isCurrentMonth ? "bg-white border-gray-100" : "bg-gray-50/50 border-gray-100 text-gray-400",
                    isToday && "ring-2 ring-blue-500 ring-offset-2"
                  )}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-[#212121] text-white" : "text-gray-700"
                    )}>
                      {format(date, "d")}
                    </span>
                    {apps.length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
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
                      <div className="text-[10px] text-gray-400 pl-1">
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
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-600">Consulta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Retorno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Procedimento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-600">Exames</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-600">Urgência</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-800 rounded"></div>
            <span className="text-xs text-gray-600">Finalizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-xs text-gray-600">Bloqueado</span>
          </div>
        </div>
      </div>

      {/* Calendar Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{Math.round(appointmentsList.length)} consultas</span> {filterType !== 'all' ? `do tipo ${filterType} ` : 'agendadas'} total
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
