import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";

interface Appointment {
  time: string;
  patient: string;
  type: "consulta" | "retorno" | "exames" | "urgencia";
}

interface AgendaCalendarProps {
  appointments?: Record<number, Appointment[]>; // day index -> appointments
  weekStart?: Date;
  onNewAppointment?: () => void;
}

export function AgendaCalendar({ 
  appointments = {},
  weekStart = new Date(),
  onNewAppointment 
}: AgendaCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(weekStart);

  // Mock data - substituir com dados reais da API
  const mockAppointments: Record<number, Appointment[]> = {
    1: [ // Monday
      { time: "09:00", patient: "Maria Silva", type: "consulta" },
      { time: "14:30", patient: "João Santos", type: "retorno" }
    ],
    2: [ // Tuesday
      { time: "10:00", patient: "Ana Costa", type: "exames" }
    ],
    3: [ // Wednesday
      { time: "08:00", patient: "Pedro Lima", type: "urgencia" },
      { time: "11:00", patient: "Carla Mendes", type: "consulta" },
      { time: "15:00", patient: "Roberto Silva", type: "retorno" }
    ],
    4: [ // Thursday
      { time: "09:30", patient: "Lucia Alves", type: "consulta" },
      { time: "13:00", patient: "Fernando Costa", type: "exames" }
    ],
    5: [ // Friday
      { time: "10:30", patient: "Beatriz Souza", type: "retorno" }
    ]
  };

  const displayAppointments = Object.keys(appointments).length > 0 ? appointments : mockAppointments;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consulta": return "blue";
      case "retorno": return "green";
      case "exames": return "purple";
      case "urgencia": return "amber";
      default: return "gray";
    }
  };

  const totalAppointments = Object.values(displayAppointments).reduce(
    (sum, apps) => sum + apps.length, 
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8" />
            <div>
              <h3 className="text-2xl font-bold">Abril 2025</h3>
              <p className="text-sm text-primary-100">Semana 14 - 20 de Abril</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="p-2 hover:bg-primary-500 rounded-lg transition-colors"
              onClick={() => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() - 7);
                setCurrentWeek(newWeek);
              }}
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <button 
              className="p-2 hover:bg-primary-500 rounded-lg transition-colors"
              onClick={() => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() + 7);
                setCurrentWeek(newWeek);
              }}
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{day}</div>
              <div className={`text-sm font-medium ${i === 1 ? 'text-primary-600' : 'text-gray-700'}`}>
                {14 + i}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <div key={dayIndex} className="bg-gray-50 rounded-lg p-2 min-h-[200px] space-y-2">
              {displayAppointments[dayIndex]?.map((appointment, idx) => {
                const color = getTypeColor(appointment.type);
                return (
                  <motion.div
                    key={idx}
                    className={`bg-${color}-100 border-l-4 border-${color}-500 rounded p-2 cursor-pointer hover:shadow-md transition-shadow`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`text-xs font-semibold text-${color}-900`}>{appointment.time}</div>
                    <div className={`text-xs font-medium text-${color}-800 mt-1`}>{appointment.patient}</div>
                    <div className={`text-xs text-${color}-600 capitalize`}>{appointment.type}</div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
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
          <span className="font-semibold">{totalAppointments} consultas</span> agendadas esta semana
        </div>
        <button 
          onClick={onNewAppointment}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>Nova Consulta</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
