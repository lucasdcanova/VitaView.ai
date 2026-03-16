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
        bg: "bg-muted dark:bg-slate-700/90",
        border: "border-charcoal dark:border-slate-300",
        badge: "text-charcoal",
        badgeBg: "bg-muted"
    },
    completed: {
        bg: "bg-muted dark:bg-slate-800/80",
        border: "border-border dark:border-slate-700",
        badge: "text-white",
        badgeBg: "bg-muted-foreground"
    },
    cancelled: {
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-900/60",
        badge: "text-rose-700 dark:text-rose-200",
        badgeBg: "bg-rose-100 dark:bg-rose-900/60"
    },
};

export function AppointmentCard({ appointment, styles, isInService = false, triageData }: AppointmentCardProps) {
    const isInProgress = appointment.status === 'in_progress';
    const isCompleted = appointment.status === 'completed';
    const isCancelled = appointment.status === 'cancelled';
    // Only show "active" visual cues if the appointment is in progress AND it is the one currently in service in the global context
    const showActiveIndicator = isInProgress && isInService;

    const statusStyle = STATUS_STYLES[appointment.status] || null;

    // Use status-specific styles for in_progress (only if active) or completed, otherwise use type styles
    // If in_progress but not active, fallback to standard styles (or maybe a paused style, but standard is cleaner for "not attending right now")
    const cardBg = (showActiveIndicator ? statusStyle?.bg : null) || ((isCompleted || isCancelled) ? statusStyle?.bg : null) || styles.bg;
    const cardBorder = (showActiveIndicator ? statusStyle?.border : null) || ((isCompleted || isCancelled) ? statusStyle?.border : null) || styles.border;
    const timeClassName = showActiveIndicator ? 'text-charcoal' : isCompleted ? 'text-muted-foreground' : isCancelled ? 'text-rose-700 dark:text-rose-200' : styles.text;
    const patientClassName = showActiveIndicator ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : isCancelled ? 'text-rose-800 dark:text-rose-100' : styles.subtext;
    const typeClassName = showActiveIndicator ? 'text-charcoal' : isCompleted ? 'text-muted-foreground' : isCancelled ? 'text-rose-600 dark:text-rose-300' : styles.label;

    return (
        <motion.div
            className={`${cardBg} border-l-4 ${cardBorder} rounded p-2 cursor-pointer hover:shadow-md dark:hover:shadow-black/30 transition-shadow relative ${showActiveIndicator ? 'ring-2 ring-ring/40 animate-pulse ring-4 ring-charcoal/70 dark:ring-slate-200/25' : ''}`}
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
            {isCancelled && (
                <div className="absolute -top-1 -right-1 bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-100 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    Cancelada
                </div>
            )}

            <div className={`text-xs font-semibold ${timeClassName}`}>{appointment.isAllDay ? 'Dia Inteiro' : appointment.time}</div>
            <div className={`text-xs font-medium mt-1 truncate ${patientClassName}`}>
                <div className="flex items-center gap-1">
                    {appointment.isTelemedicine && (
                        <Video className="w-3 h-3 text-muted-foreground" />
                    )}
                    {appointment.patientName}
                </div>
            </div>
            <div className={`text-xs capitalize ${typeClassName}`}>{appointment.type}</div>

            {/* Manchester Priority Indicator */}
            {triageData?.manchesterPriority && !showActiveIndicator && !isCancelled && (
                <div
                    className={`absolute top-1 right-1 w-3 h-3 rounded-full ${PRIORITY_COLORS[triageData.manchesterPriority]
                        } ring-2 ring-background`}
                />
            )}
        </motion.div>
    );
}
