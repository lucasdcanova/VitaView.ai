import { Button } from "@/components/ui/button";
import { Clock, User, Stethoscope } from "lucide-react";
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
    return (
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
                    onClick={onTriageClick}
                >
                    <Stethoscope className="w-4 h-4 mr-1" />
                    Realizar Triagem
                </Button>
                <Button variant="outline" size="sm">Editar</Button>
                <Button variant="destructive" size="sm">Cancelar</Button>
            </div>
        </div>
    );
}
