import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TriageBadgeProps {
    priority: "emergent" | "very_urgent" | "urgent" | "standard" | "non_urgent";
    className?: string;
    showLabel?: boolean;
}

const PRIORITY_CONFIG = {
    emergent: {
        label: "Emergente",
        color: "bg-red-500",
        textColor: "text-white",
        borderColor: "border-red-600",
    },
    very_urgent: {
        label: "Muito Urgente",
        color: "bg-orange-500",
        textColor: "text-white",
        borderColor: "border-orange-600",
    },
    urgent: {
        label: "Urgente",
        color: "bg-yellow-500",
        textColor: "text-gray-900",
        borderColor: "border-yellow-600",
    },
    standard: {
        label: "Pouco Urgente",
        color: "bg-green-500",
        textColor: "text-white",
        borderColor: "border-green-600",
    },
    non_urgent: {
        label: "Não Urgente",
        color: "bg-blue-500",
        textColor: "text-white",
        borderColor: "border-blue-600",
    },
};

export function TriageBadge({ priority, className, showLabel = true }: TriageBadgeProps) {
    const config = PRIORITY_CONFIG[priority];

    if (!showLabel) {
        return (
            <div
                className={cn(
                    "w-3 h-3 rounded-full border-2",
                    config.color,
                    config.borderColor,
                    className
                )}
                title={config.label}
            />
        );
    }

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
                config.color,
                config.textColor,
                config.borderColor,
                className
            )}
        >
            <Activity className="h-3 w-3" />
            {config.label}
        </div>
    );
}
