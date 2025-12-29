import { useQuery } from "@tanstack/react-query";

interface AppointmentPopoverHeaderProps {
    appointment: any;
    styles: {
        dot: string;
    };
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    emergent: { color: "bg-red-500", label: "Emergente" },
    very_urgent: { color: "bg-orange-500", label: "Muito Urgente" },
    urgent: { color: "bg-yellow-500", label: "Urgente" },
    standard: { color: "bg-green-500", label: "Pouco Urgente" },
    non_urgent: { color: "bg-blue-500", label: "Não Urgente" },
};

export function AppointmentPopoverHeader({ appointment, styles }: AppointmentPopoverHeaderProps) {
    // Query triage data at component level (proper hook usage)
    const { data: triageData } = useQuery<any>({
        queryKey: [`/api/triage/appointment/${appointment.id}`],
        enabled: !!appointment.id,
    });

    const config = triageData?.manchesterPriority
        ? PRIORITY_CONFIG[triageData.manchesterPriority]
        : null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="font-medium leading-none">{appointment.patientName}</h4>
                {/* Manchester Priority Badge */}
                {config && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100">
                        <div className={`w-3 h-3 rounded-full ${config.color}`} />
                        <span className="text-xs font-medium text-gray-700">{config.label}</span>
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
