import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface AppointmentCardProps {
    appointment: any;
    styles: {
        bg: string;
        border: string;
        text: string;
        subtext: string;
        label: string;
    };
}

const PRIORITY_COLORS: Record<string, string> = {
    emergent: "bg-red-500",
    very_urgent: "bg-orange-500",
    urgent: "bg-yellow-500",
    standard: "bg-green-500",
    non_urgent: "bg-blue-500",
};

export function AppointmentCard({ appointment, styles }: AppointmentCardProps) {
    // Query triage data at component level (proper hook usage)
    const { data: triageData } = useQuery<any>({
        queryKey: [`/api/triage/appointment/${appointment.id}`],
        enabled: !!appointment.id,
    });

    return (
        <motion.div
            className={`${styles.bg} border-l-4 ${styles.border} rounded p-2 cursor-pointer hover:shadow-md transition-shadow relative`}
            whileHover={{ scale: 1.02 }}
        >
            <div className={`text-xs font-semibold ${styles.text}`}>{appointment.time}</div>
            <div className={`text-xs font-medium ${styles.subtext} mt-1 truncate`}>
                {appointment.patientName}
            </div>
            <div className={`text-xs ${styles.label} capitalize`}>{appointment.type}</div>

            {/* Manchester Priority Indicator */}
            {triageData?.manchesterPriority && (
                <div
                    className={`absolute top-1 right-1 w-3 h-3 rounded-full ${PRIORITY_COLORS[triageData.manchesterPriority]
                        } ring-2 ring-white`}
                />
            )}
        </motion.div>
    );
}
