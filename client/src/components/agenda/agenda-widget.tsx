import React from "react";
import { Link } from "wouter";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Appointment {
    time: string;
    patient: string;
    type: "consulta" | "retorno" | "exames" | "urgencia";
    date?: string;
}

interface AgendaWidgetProps {
    appointments?: Appointment[];
    maxDisplay?: number;
}

export function AgendaWidget({ appointments, maxDisplay = 4 }: AgendaWidgetProps) {
    // Mock data - substituir com dados reais da API
    const mockAppointments: Appointment[] = [
        { time: "09:00", patient: "Maria Silva", type: "consulta", date: "Hoje" },
        { time: "14:30", patient: "João Santos", type: "retorno", date: "Hoje" },
        { time: "10:00", patient: "Ana Costa", type: "exames", date: "Amanhã" },
        { time: "08:00", patient: "Pedro Lima", type: "urgencia", date: "Amanhã" },
    ];

    const displayAppointments = appointments || mockAppointments;
    const upcomingAppointments = displayAppointments.slice(0, maxDisplay);

    const getTypeColor = (type: string) => {
        switch (type) {
            case "consulta": return { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" };
            case "retorno": return { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" };
            case "exames": return { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" };
            case "urgencia": return { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-700" };
            default: return { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-700" };
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "consulta": return "Consulta";
            case "retorno": return "Retorno";
            case "exames": return "Exames";
            case "urgencia": return "Urgência";
            default: return type;
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary-600" />
                        Próximas Consultas
                    </CardTitle>
                    <Link href="/agenda">
                        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                            Ver agenda completa
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Nenhuma consulta agendada</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingAppointments.map((appointment, idx) => {
                            const colors = getTypeColor(appointment.type);
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${colors.border} ${colors.bg} hover:shadow-sm transition-shadow cursor-pointer`}
                                >
                                    <div className="flex-shrink-0">
                                        <Clock className={`h-4 w-4 ${colors.text}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${colors.text}`}>
                                                {appointment.time}
                                            </span>
                                            {appointment.date && (
                                                <span className="text-xs text-gray-500">• {appointment.date}</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {appointment.patient}
                                        </p>
                                        <p className={`text-xs ${colors.text}`}>
                                            {getTypeLabel(appointment.type)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
