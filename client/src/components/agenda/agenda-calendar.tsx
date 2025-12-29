import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronDown, ChevronRight, Filter, Clock, User, Plus, Maximize2, Minimize2, CalendarDays, Calendar as CalendarWeek } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import type { Appointment } from "@shared/schema";
import { TriageDialog } from "@/components/triage/triage-dialog";
import { Stethoscope } from "lucide-react";

interface AgendaCalendarProps {
  appointments?: Record<number, Appointment[]>;
  weekStart?: Date;
  onNewAppointment?: () => void;
}

export function AgendaCalendar({
  appointments = {},
  weekStart = new Date(),
  onNewAppointment
}: AgendaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(weekStart);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { toast } = useToast();

  const { data: appointmentsList = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const getAppointmentsForDay = (date: Date) => {
    return appointmentsList.filter(app => {
      const appDate = new Date(app.date + 'T12:00:00');
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
      case "consulta": return { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-900", subtext: "text-gray-800", label: "text-gray-600", dot: "bg-gray-500" };
      case "retorno": return { bg: "bg-green-100", border: "border-green-500", text: "text-green-900", subtext: "text-green-800", label: "text-green-600", dot: "bg-green-500" };
      case "exames": return { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-900", subtext: "text-purple-800", label: "text-purple-600", dot: "bg-purple-500" };
      case "urgencia": return { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-900", subtext: "text-amber-800", label: "text-amber-600", dot: "bg-amber-500" };
      default: return { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-900", subtext: "text-gray-800", label: "text-gray-600", dot: "bg-gray-500" };
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
    if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-6 text-white">
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
                      {viewMode === 'week' ? (
                        `Semana ${format(startOfCurrentWeek, "dd")} - ${format(endOfWeek(currentDate), "dd 'de' MMMM", { locale: ptBR })}`
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
                  <SelectItem value="urgencia">Urgência</SelectItem>
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

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title={viewMode === 'week' ? "Ver Mês" : "Ver Semana"}
              onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            >
              {viewMode === 'week' ? <CalendarDays className="w-5 h-5" /> : <CalendarWeek className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {viewMode === 'week' ? (
          <>
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
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

            {/* Week Time Slots Grid */}
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const date = addDays(startOfCurrentWeek, dayIndex);
                return (
                  <div key={dayIndex} className="bg-gray-50 rounded-lg p-2 min-h-[200px] space-y-2">
                    {getFilteredAppointmentsForDay(date).map((appointment, idx) => {
                      const styles = getTypeStyles(appointment.type);
                      return (
                        <Popover key={appointment.id || idx}>
                          <PopoverTrigger asChild>
                            <motion.div
                              className={`${styles.bg} border-l-4 ${styles.border} rounded p-2 cursor-pointer hover:shadow-md transition-shadow`}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className={`text-xs font-semibold ${styles.text}`}>{appointment.time}</div>
                              <div className={`text-xs font-medium ${styles.subtext} mt-1 truncate`}>{appointment.patientName}</div>
                              <div className={`text-xs ${styles.label} capitalize`}>{appointment.type}</div>
                            </motion.div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">{appointment.patientName}</h4>
                                <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                                  {appointment.type}
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span>{appointment.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>Dr. Silva</span>
                                </div>
                                {appointment.notes && (
                                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    {appointment.notes}
                                  </div>
                                )}
                              </div>
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
                                <Button variant="outline" size="sm" className="bg-white hover:bg-gray-100">Editar</Button>
                                <Button variant="destructive" size="sm">Cancelar</Button>
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
          </>
        ) : (
          <div className="grid grid-cols-7 gap-4">
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
                    setViewMode('week');
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
                          {app.time} {app.patientName}
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
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-xs text-gray-600">Consulta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Retorno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-600">Exames</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-xs text-gray-600">Urgência</span>
          </div>
        </div>
      </div>

      {/* Calendar Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{Math.round(appointmentsList.length * 0.8)} consultas</span> {filterType !== 'all' ? `do tipo ${filterType}` : 'agendadas este mês'}
        </div>
      </div>

      {/* Triage Dialog */}
      {selectedAppointment && (
        <TriageDialog
          open={triageDialogOpen}
          onOpenChange={setTriageDialogOpen}
          appointmentId={selectedAppointment.id}
          patientName={selectedAppointment.patientName}
          profileId={selectedAppointment.profileId || undefined}
        />
      )}
    </div>
  );
}
