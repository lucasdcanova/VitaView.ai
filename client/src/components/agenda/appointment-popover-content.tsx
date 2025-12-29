import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Clock, User, Stethoscope } from "lucide-react";
import { TriageBadge } from "@/components/triage/triage-badge";
import type { Appointment } from "@shared/schema";

interface AppointmentPopoverContentProps {
    appointment: Appointment;
    styles: {
        dot: string;
        [key: string]: string;
    };
    onTriageClick: () => void;
}

export function AppointmentPopoverContent({
    appointment,
    styles,
    onTriageClick
}: AppointmentPopoverContentProps) {
    // Query triage data for this appointment
    const { data: triageData } = useQuery<any>({
        queryKey: [`/api/triage/appointment/${appointment.id}`],
        enabled: !!appointment.id,
    });

    return (
        <div className="grid gap-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">{appointment.patientName}</h4>
                    {triageData && <TriageBadge priority={triageData.manchesterPriority} showLabel={false} />}
                </div>
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
                {triageData && (
                    <div className="flex items-start gap-2 text-sm bg-blue-50 p-2 rounded">
                        <Stethoscope className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <div className="font-medium text-blue-900">Triagem realizada</div>
                            <div className="text-xs text-blue-700 mt-1">
                                <TriageBadge priority={triageData.manchesterPriority} />
                            </div>
                            {triageData.chiefComplaint && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {triageData.chiefComplaint}
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                    onClick={onTriageClick}
                >
                    <Stethoscope className="w-4 h-4 mr-1" />
                    {triageData ? "Ver Triagem" : "Realizar Triagem"}
                </Button>
                <Button variant="outline" size="sm">Editar</Button>
                <Button variant="destructive" size="sm">Cancelar</Button>
            </div>
        </div>
    );
}
