import React, { useEffect, useState } from "react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Play, User, LogOut, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TriageDialog } from "@/components/triage/triage-dialog";
import type { Appointment } from "@shared/schema";

interface WaitingRoomProps {
    appointments: Appointment[];
    onStartService: (appointment: Appointment) => void;
    onRemoveCheckIn: (appointment: Appointment) => void;
}

export function WaitingRoom({ appointments, onStartService, onRemoveCheckIn }: WaitingRoomProps) {
    const [now, setNow] = useState(new Date());
    const [triageDialogOpen, setTriageDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // Update timer every minute
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Filter only waiting appointments
    const waitingAppointments = appointments.filter(apt => apt.status === 'waiting');

    return (
        <>
            <Card className="mt-6 border-l-4 border-l-border shadow-sm bg-muted/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        Sala de Espera
                        <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80 ml-2">
                            {waitingAppointments.length} {waitingAppointments.length === 1 ? 'paciente' : 'pacientes'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {waitingAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <User className="w-10 h-10 mb-3 opacity-40" />
                            <p className="text-sm font-medium">Nenhum paciente na sala de espera</p>
                            <p className="text-xs mt-1">Os pacientes recepcionados aparecerão aqui</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {waitingAppointments.map((appointment) => {
                                const checkedInTime = appointment.checkedInAt ? new Date(appointment.checkedInAt) : null;
                                const waitingMinutes = checkedInTime ? differenceInMinutes(now, checkedInTime) : 0;

                                // Color coding for wait time
                                let timeColor = "text-green-600";
                                if (waitingMinutes > 15) timeColor = "text-yellow-600";
                                if (waitingMinutes > 30) timeColor = "text-red-600";

                                return (
                                    <div key={appointment.id} className="bg-card p-4 rounded-lg border shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-semibold text-lg text-foreground flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                {appointment.patientName}
                                            </div>
                                            <Badge variant="outline" className={`${timeColor} border-current bg-card`}>
                                                {waitingMinutes} min
                                            </Badge>
                                        </div>

                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex justify-between">
                                                <span>Horário Agendado:</span>
                                                <span className="font-medium">{appointment.time}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Chegou às:</span>
                                                <span className="font-medium">
                                                    {checkedInTime ? format(checkedInTime, "HH:mm") : "-"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border-border"
                                                onClick={() => onRemoveCheckIn(appointment)}
                                                title="Remover da sala de espera"
                                            >
                                                <LogOut className="w-4 h-4 mr-1" />
                                                Remover
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-muted-foreground border-border hover:bg-muted"
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setTriageDialogOpen(true);
                                                }}
                                            >
                                                <Stethoscope className="w-4 h-4 mr-1" />
                                                Triagem
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-[2] bg-charcoal hover:bg-charcoal/85 text-white"
                                                onClick={() => onStartService(appointment)}
                                            >
                                                <Play className="w-4 h-4 mr-1" />
                                                Atender
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

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
        </>
    );
}
