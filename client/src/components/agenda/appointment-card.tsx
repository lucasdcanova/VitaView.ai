import { motion } from "framer-motion";
import { Play, Video } from "lucide-react";

interface AppointmentCardProps {
    appointment: any;
    styles: {
        bg: string;
        border: string;
        text: string;
        subtext: string;
        label: string;
    };
    isInService?: boolean;
    triageData?: any; // Triage data passed from parent (batch fetched)
}

const PRIORITY_COLORS: Record<string, string> = {
    emergent: "bg-red-500",
    very_urgent: "bg-orange-500",
    urgent: "bg-yellow-500",
    standard: "bg-green-500",
    non_urgent: "bg-blue-500",
};

const STATUS_STYLES: Record<string, { bg: string; border: string; badge: string; badgeBg: string }> = {
    in_progress: {
        bg: "bg-muted",
        border: "border-charcoal",
        badge: "text-charcoal",
        badgeBg: "bg-muted"
    },
    completed: {
        bg: "bg-muted",
        border: "border-border",
        badge: "text-white",
        badgeBg: "bg-muted-foreground"
    },
};

export function AppointmentCard({ appointment, styles, isInService = false, triageData }: AppointmentCardProps) {
    const isInProgress = appointment.status === 'in_progress';
    const isCompleted = appointment.status === 'completed';
    // Only show "active" visual cues if the appointment is in progress AND it is the one currently in service in the global context
    const showActiveIndicator = isInProgress && isInService;

    const statusStyle = STATUS_STYLES[appointment.status] || null;

    // Use status-specific styles for in_progress (only if active) or completed, otherwise use type styles
    // If in_progress but not active, fallback to standard styles (or maybe a paused style, but standard is cleaner for "not attending right now")
    const cardBg = (showActiveIndicator ? statusStyle?.bg : null) || (isCompleted ? statusStyle?.bg : null) || styles.bg;
    const cardBorder = (showActiveIndicator ? statusStyle?.border : null) || (isCompleted ? statusStyle?.border : null) || styles.border;

    return (
        <motion.div
            className={`${cardBg} border-l-4 ${cardBorder} rounded p-2 cursor-pointer hover:shadow-md transition-shadow relative ${showActiveIndicator ? 'ring-2 ring-ring/40 animate-pulse ring-4 ring-charcoal/70' : ''}`}
            whileHover={{ scale: 1.02 }}
        >
            {/* Status Badge */}
            {showActiveIndicator && (
                <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-charcoal text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold shadow-sm">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Atendendo</span>
                </div>
            )}
            {isCompleted && (
                <div className="absolute -top-1 -right-1 bg-muted-foreground text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    Finalizado
                </div>
            )}

            <div className={`text-xs font-semibold ${showActiveIndicator ? 'text-charcoal' : isCompleted ? 'text-muted-foreground' : styles.text}`}>{appointment.isAllDay ? 'Dia Inteiro' : appointment.time}</div>
            <div className={`text-xs font-medium mt-1 truncate ${showActiveIndicator ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : styles.subtext}`}>
                <div className="flex items-center gap-1">
                    {appointment.isTelemedicine && (
                        <Video className="w-3 h-3 text-muted-foreground" />
                    )}
                    {appointment.patientName}
                </div>
            </div>
            <div className={`text-xs capitalize ${showActiveIndicator ? 'text-charcoal' : isCompleted ? 'text-muted-foreground' : styles.label}`}>{appointment.type}</div>

            {/* Manchester Priority Indicator */}
            {triageData?.manchesterPriority && !showActiveIndicator && (
                <div
                    className={`absolute top-1 right-1 w-3 h-3 rounded-full ${PRIORITY_COLORS[triageData.manchesterPriority]
                        } ring-2 ring-background`}
                />
            )}
        </motion.div>
    );
}
