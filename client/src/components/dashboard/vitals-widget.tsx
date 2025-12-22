import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Droplets, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfiles } from "@/hooks/use-profiles";

interface HealthMetric {
    id: number;
    name: string;
    value: string;
    unit: string;
    status: "normal" | "warning" | "critical" | null;
    change: string | null;
    date: string;
}

export function VitalsWidget() {
    const { activeProfile } = useProfiles();
    const activeProfileId = activeProfile?.id;

    const { data: metrics, isLoading } = useQuery<HealthMetric[]>({
        queryKey: ["/api/health-metrics/latest", activeProfileId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeProfileId) params.append("profileId", activeProfileId.toString());
            params.append("limit", "4");

            const res = await fetch(`/api/health-metrics/latest?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch vitals");
            return res.json();
        },
        enabled: !!activeProfileId,
    });

    if (isLoading) {
        return <VitalsSkeleton />;
    }

    // Define priority metrics we want to show if available
    const priorityMetrics = ["Glicemia", "Colesterol Total", "Pressão Arterial", "IMC"];

    // Filter/Sort metrics to prioritize common vitals, or show what we have
    const displayMetrics = metrics && metrics.length > 0
        ? metrics.sort((a, b) => {
            const aIdx = priorityMetrics.indexOf(a.name);
            const bIdx = priorityMetrics.indexOf(b.name);
            // If both are priority, sort by priority order
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            // If only a is priority, put a first
            if (aIdx !== -1) return -1;
            // If only b is priority, put b first
            if (bIdx !== -1) return 1;
            // Otherwise sort by date desc (already sorted by API but good to be safe)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }).slice(0, 4)
        : [];

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("glicemia") || n.includes("açúcar")) return Droplets;
        if (n.includes("colesterol")) return Activity;
        if (n.includes("pressão") || n.includes("batimento")) return Heart;
        if (n.includes("imc") || n.includes("peso")) return Scale;
        return Activity;
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "normal": return "text-green-500";
            case "warning": return "text-yellow-500";
            case "critical": return "text-red-500";
            default: return "text-gray-500";
        }
    };

    const getTrendIcon = (change: string | null) => {
        if (!change) return null;
        if (change.startsWith("+")) return <TrendingUp className="h-3 w-3 text-red-500" />;
        if (change.startsWith("-")) return <TrendingDown className="h-3 w-3 text-green-500" />; // Assuming drop is good generally? Depends on metric.
        return <Minus className="h-3 w-3 text-gray-400" />;
    };

    return (
        <Card className="vitaview-card col-span-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading text-charcoal">Sinais Vitais & Métricas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                {displayMetrics.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {displayMetrics.map((metric) => {
                            const Icon = getIcon(metric.name);
                            return (
                                <div key={metric.id} className="p-3 rounded-lg border border-lightGray bg-white flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-mediumGray truncate" title={metric.name}>
                                            {metric.name}
                                        </span>
                                        <Icon className="h-4 w-4 text-charcoal opacity-70" />
                                    </div>
                                    <div className="flex items-end gap-2 mt-1">
                                        <span className="text-xl font-bold text-charcoal">{metric.value}</span>
                                        <span className="text-xs text-mediumGray mb-1">{metric.unit}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-bold uppercase ${getStatusColor(metric.status)}`}>
                                            {metric.status || "N/A"}
                                        </span>
                                        {metric.change && (
                                            <div className="flex items-center gap-1 text-[10px] text-mediumGray">
                                                {getTrendIcon(metric.change)}
                                                <span>{metric.change}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Activity className="h-8 w-8 text-lightGray mb-2" />
                        <p className="text-sm text-mediumGray">Nenhuma métrica registrada</p>
                        <p className="text-xs text-lightGray mt-1">Envie um exame para ver os dados aqui</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function VitalsSkeleton() {
    return (
        <Card className="vitaview-card col-span-full">
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 rounded-lg border border-lightGray bg-white h-24">
                            <div className="flex justify-between mb-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                            <Skeleton className="h-6 w-16 mb-2" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
