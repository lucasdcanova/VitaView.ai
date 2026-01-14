import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

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
        bg: "bg-blue-50",
        border: "border-blue-500",
        badge: "text-blue-700",
        badgeBg: "bg-blue-100"
    },
    completed: {
        bg: "bg-gray-200",
        border: "border-gray-800",
        badge: "text-gray-100",
        badgeBg: "bg-gray-800"
    },
};

export function AppointmentCard({ appointment, styles, isInService = false }: AppointmentCardProps) {
    // Query triage data at component level (proper hook usage)
    const { data: triageData } = useQuery<any>({
        queryKey: [`/api/triage/appointment/${appointment.id}`],
        enabled: !!appointment.id,
    });

    const isInProgress = appointment.status === 'in_progress';
    const isCompleted = appointment.status === 'completed';
    const statusStyle = STATUS_STYLES[appointment.status] || null;

    // Use status-specific styles for in_progress or completed, otherwise use type styles
    const cardBg = statusStyle?.bg || styles.bg;
    const cardBorder = statusStyle?.border || styles.border;

    return (
        <motion.div
            className={`${cardBg} border-l-4 ${cardBorder} rounded p-2 cursor-pointer hover:shadow-md transition-shadow relative ${isInProgress ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} ${isInService ? 'animate-pulse ring-4 ring-blue-500' : ''}`}
            whileHover={{ scale: 1.02 }}
        >
            {/* Status Badge */}
            {isInProgress && (
                <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold shadow-sm">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Atendendo</span>
                </div>
            )}
            {isCompleted && (
                <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    Finalizado
                </div>
            )}

            <div className={`text-xs font-semibold ${isInProgress ? 'text-blue-900' : isCompleted ? 'text-gray-500' : styles.text}`}>{appointment.time}</div>
            <div className={`text-xs font-medium mt-1 truncate ${isInProgress ? 'text-blue-800' : isCompleted ? 'text-gray-400' : styles.subtext}`}>
                {appointment.patientName}
            </div>
            <div className={`text-xs capitalize ${isInProgress ? 'text-blue-600' : isCompleted ? 'text-gray-400' : styles.label}`}>{appointment.type}</div>

            {/* Manchester Priority Indicator */}
            {triageData?.manchesterPriority && !isInProgress && (
                <div
                    className={`absolute top-1 right-1 w-3 h-3 rounded-full ${PRIORITY_COLORS[triageData.manchesterPriority]
                        } ring-2 ring-white`}
                />
            )}
        </motion.div>
    );
}
