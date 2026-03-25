import { Play } from "lucide-react";

import { AppointmentInsuranceBadge, type AgendaAppointment } from "./appointment-insurance-badge";

interface AppointmentPopoverHeaderProps {
    appointment: AgendaAppointment;
    styles: {
        dot: string;
    };
    canStartService?: boolean;
    onStartService?: () => void;
    triageData?: any; // Triage data passed from parent
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    emergent: { color: "bg-red-500", label: "Emergente" },
    very_urgent: { color: "bg-orange-500", label: "Muito Urgente" },
    urgent: { color: "bg-yellow-500", label: "Urgente" },
    standard: { color: "bg-green-500", label: "Pouco Urgente" },
    non_urgent: { color: "bg-blue-500", label: "Não Urgente" },
};

export function AppointmentPopoverHeader({ appointment, styles, canStartService, onStartService, triageData }: AppointmentPopoverHeaderProps) {

    const config = triageData?.manchesterPriority
        ? PRIORITY_CONFIG[triageData.manchesterPriority]
        : null;

    return (
        <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    {canStartService && onStartService ? (
                        <button
                            onClick={onStartService}
                            className="font-medium leading-none text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex min-w-0 items-center gap-1 group"
                            title="Clique para iniciar atendimento"
                        >
                            <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="truncate">{appointment.patientName}</span>
                        </button>
                    ) : (
                        <h4 className="font-medium leading-none truncate">{appointment.patientName}</h4>
                    )}
                    <AppointmentInsuranceBadge
                        appointment={appointment}
                        compact
                        className="w-fit max-w-full"
                    />
                </div>
                {/* Manchester Priority Badge */}
                {config && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
                        <div className={`w-3 h-3 rounded-full ${config.color}`} />
                        <span className="text-xs font-medium text-foreground">{config.label}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                {appointment.type}
            </p>
        </div>
    );
}
