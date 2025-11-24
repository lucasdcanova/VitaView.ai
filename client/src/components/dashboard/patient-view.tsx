import React, { useState, memo, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import HealthScore from "@/components/health-score";
import HealthMetrics from "@/components/health-metrics";
import RecentExams from "@/components/recent-exams";
import HealthRecommendations from "@/components/health-recommendations";
import { Exam, HealthMetric, Profile } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    FileUp,
    BarChart,
} from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PatientHeader from "@/components/patient-header";

// Memoized components for better performance
const MemoizedHealthScore = memo(HealthScore);
const MemoizedHealthMetrics = memo(HealthMetrics);
const MemoizedRecentExams = memo(RecentExams);
const MemoizedHealthRecommendations = memo(HealthRecommendations);

interface PatientViewProps {
    activeProfile: Profile;
}

export function PatientView({ activeProfile }: PatientViewProps) {
    const [activeMetricsTab, setActiveMetricsTab] = useState("all");

    const { data: exams, isLoading: isLoadingExams } = useQuery<Exam[]>({
        queryKey: ["/api/exams", activeProfile?.id],
        queryFn: async () => {
            try {
                const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
                const res = await fetch(`/api/exams${queryParam}`, { credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch exams");
                return res.json();
            } catch (error) {
                return [];
            }
        },
        enabled: !!activeProfile,
    });

    const { data: metrics, isLoading: isLoadingMetrics } = useQuery<HealthMetric[]>({
        queryKey: ["/api/health-metrics/latest", activeProfile?.id],
        queryFn: async () => {
            try {
                const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
                const res = await fetch(`/api/health-metrics/latest${queryParam}`, { credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch health metrics");
                return res.json();
            } catch (error) {
                return [];
            }
        },
        enabled: !!activeProfile,
    });

    // Memoized function to process exam data for recency
    const recentExams = useMemo(() => {
        if (!exams || exams.length === 0) return [];

        return [...exams]
            .filter(exam => exam.status === 'analyzed')
            .sort((a, b) => {
                const dateA = a.examDate ? new Date(a.examDate) : new Date(a.uploadDate);
                const dateB = b.examDate ? new Date(b.examDate) : new Date(b.uploadDate);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 3);
    }, [exams]);

    const latestExamDate = useMemo(() => {
        if (!exams || exams.length === 0) return null;

        const getTimestamp = (value?: string | null) => {
            if (!value) return 0;
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        };

        const latestExam = exams.reduce<Exam | null>((currentLatest, exam) => {
            if (!currentLatest) return exam;
            const examTime = getTimestamp(exam.examDate || exam.uploadDate);
            const latestTime = getTimestamp(currentLatest.examDate || currentLatest.uploadDate);
            return examTime > latestTime ? exam : currentLatest;
        }, null);

        return latestExam?.examDate || latestExam?.uploadDate || null;
    }, [exams]);

    const lastMetricsUpdateLabel = useMemo(() => {
        if (!latestExamDate) return null;
        try {
            return format(new Date(latestExamDate), "dd MMM 'às' HH:mm", { locale: ptBR });
        } catch (error) {
            return null;
        }
    }, [latestExamDate]);

    // Memoized chart data processing
    const chartData = useMemo(() => {
        if (!metrics || metrics.length === 0) {
            return [];
        }

        // Group metrics by month and calculate a simple health score
        const dataByMonth: Record<string, any> = {};

        metrics.forEach(metric => {
            const date = new Date(metric.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = {
                    month: new Date(date.getFullYear(), date.getMonth(), 1),
                    monthStr: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'short' }),
                    totalMetrics: 0,
                    normalCount: 0,
                    warningCount: 0,
                    alertCount: 0,
                    healthScore: 0
                };
            }

            dataByMonth[monthKey].totalMetrics += 1;

            // Calculate health score based on status
            const status = metric.status?.toLowerCase() || 'normal';
            if (status === 'normal') {
                dataByMonth[monthKey].normalCount += 1;
            } else if (status.includes('atenção') || status.includes('atencao') || status === 'warning') {
                dataByMonth[monthKey].warningCount += 1;
            } else if (status.includes('alto') || status.includes('baixo') || status === 'alert') {
                dataByMonth[monthKey].alertCount += 1;
            } else {
                dataByMonth[monthKey].normalCount += 1;
            }
        });

        // Calculate health scores for each month
        Object.keys(dataByMonth).forEach(monthKey => {
            const data = dataByMonth[monthKey];
            if (data.totalMetrics > 0) {
                const normalPercentage = (data.normalCount / data.totalMetrics) * 100;
                const warningPercentage = (data.warningCount / data.totalMetrics) * 100;
                const alertPercentage = (data.alertCount / data.totalMetrics) * 100;

                // Calculate weighted health score (normal = 85, warning = 70, alert = 50)
                data.healthScore = Math.round(
                    (normalPercentage * 0.85) + (warningPercentage * 0.70) + (alertPercentage * 0.50)
                );
            }
        });

        const finalResult = Object.values(dataByMonth)
            .map(item => ({
                month: item.monthStr,
                healthScore: item.healthScore,
                totalMetrics: item.totalMetrics
            }))
            .sort((a, b) => {
                const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
                return months.indexOf(a.month) - months.indexOf(b.month);
            });

        return finalResult;
    }, [metrics]);

    // Memoized health metric status calculation
    const getHealthMetricStatus = useCallback((value: number, metricName: string): 'normal' | 'warning' | 'alert' => {
        if (!value) return 'normal';

        const name = metricName.toLowerCase();

        // Colesterol e lipídios
        if (name.includes('colesterol total') || (name.includes('colesterol') && !name.includes('hdl') && !name.includes('ldl'))) {
            if (value < 200) return 'normal';
            if (value <= 239) return 'warning';
            return 'alert';
        }

        if (name.includes('hdl')) {
            if (value >= 40) return 'normal'; // Homens: ≥40, Mulheres: ≥50
            return 'alert';
        }

        if (name.includes('ldl')) {
            if (value < 100) return 'normal';
            if (value <= 159) return 'warning';
            return 'alert';
        }

        if (name.includes('triglicerídeos') || name.includes('triglicerideos')) {
            if (value < 150) return 'normal';
            if (value <= 199) return 'warning';
            return 'alert';
        }

        // Glicemia
        if (name.includes('glicose') || name.includes('glicemia')) {
            if (value <= 99) return 'normal';
            if (value <= 125) return 'warning';
            return 'alert';
        }

        // Hemoglobina Glicada
        if (name.includes('hemoglobina glicada') || name.includes('hba1c')) {
            if (value < 5.7) return 'normal';
            if (value <= 6.4) return 'warning';
            return 'alert';
        }

        // Vitamina D
        if (name.includes('vitamina d') || name.includes('25-hidroxivitamina d')) {
            if (value >= 30) return 'normal'; // ng/mL
            if (value >= 20) return 'warning';
            return 'alert';
        }

        // TSH
        if (name.includes('tsh')) {
            if (value >= 0.4 && value <= 4.0) return 'normal';
            return 'warning';
        }

        // Creatinina
        if (name.includes('creatinina')) {
            if (value <= 1.2) return 'normal'; // mg/dL
            if (value <= 1.5) return 'warning';
            return 'alert';
        }

        // Hemoglobina
        if (name.includes('hemoglobina') && !name.includes('glicada')) {
            if (value >= 12 && value <= 16) return 'normal'; // g/dL
            return 'warning';
        }

        // ALT/TGP
        if (name.includes('alt') || name.includes('tgp')) {
            if (value <= 40) return 'normal'; // U/L
            if (value <= 50) return 'warning';
            return 'alert';
        }

        // Para métricas não identificadas, assumir normal
        return 'normal';
    }, []);

    // Memoized health stats calculation
    const healthStats = useMemo(() => {
        if (!metrics || metrics.length === 0) {
            return { averageScore: null, trend: null, recentMetrics: [], hasData: false };
        }

        // Sort by date, most recent first
        const sortedMetrics = [...metrics].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Extract top 5 most recent metrics
        const recentMetrics = sortedMetrics.slice(0, 5);

        // Calculate a health score based on status
        const calculateMetricScore = (metric: HealthMetric) => {
            switch (metric.status?.toLowerCase()) {
                case 'normal':
                    return 85;
                case 'atenção':
                case 'atencao':
                    return 70;
                case 'alto':
                case 'baixo':
                    return 60;
                default:
                    return 75; // Default score for metrics that exist but don't have a clear status
            }
        };

        // Calculate average from most recent metrics
        const metricsWithScores = recentMetrics.map(calculateMetricScore);
        const averageScore = metricsWithScores.length > 0
            ? Math.round(metricsWithScores.reduce((sum, score) => sum + score, 0) / metricsWithScores.length)
            : null; // Return null if no metrics to calculate score

        // Determine trend (if we have enough data)
        let trend: 'improving' | 'declining' | 'stable' | null = null;

        // Need at least two data points from different dates to calculate a trend
        const uniqueDates = new Set(sortedMetrics.map(m => new Date(m.date).toDateString())).size;
        if (uniqueDates >= 2) {
            // Basic trend analysis - just checking if there are more normal metrics in recent data
            const olderMetrics = sortedMetrics.slice(recentMetrics.length);
            const recentNormalCount = recentMetrics.filter(m =>
                m.status?.toLowerCase() === 'normal').length / (recentMetrics.length || 1);
            const olderNormalCount = olderMetrics.filter(m =>
                m.status?.toLowerCase() === 'normal').length / (olderMetrics.length || 1);

            if (recentNormalCount > olderNormalCount) {
                trend = 'improving';
            } else if (recentNormalCount < olderNormalCount) {
                trend = 'declining';
            } else {
                trend = 'stable';
            }
        } else {
            trend = 'stable'; // Default to stable if not enough data
        }

        return { averageScore, trend, recentMetrics, hasData: true };
    }, [metrics]);

    // Memoized processed metrics map
    const processedMetrics = useMemo(() => {
        if (!metrics || metrics.length === 0) return {};

        const metricMap: Record<string, HealthMetric> = {};

        // Group by metric name and get the most recent value for each
        metrics.forEach(metric => {
            const key = metric.name.toLowerCase();
            if (!metricMap[key] || new Date(metric.date) > new Date(metricMap[key].date)) {
                metricMap[key] = metric;
            }
        });

        return metricMap;
    }, [metrics]);

    return (
        <div className="p-4 md:p-6">
            <PatientHeader
                title="Painel clínico"
                description="Acompanhe os indicadores e análises do paciente selecionado."
                patient={activeProfile}
                lastExamDate={latestExamDate}
            />
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <Link href="/upload-exams">
                    <Button className="gap-2">
                        <FileUp className="h-4 w-4" />
                        Enviar novo exame
                    </Button>
                </Link>
            </div>

            {/* Visão prioritária de métricas */}
            <Card className="mb-6 border border-primary-100 bg-gradient-to-br from-white via-white to-primary-50/40 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg flex items-center">
                                <BarChart className="mr-2 h-5 w-5 text-primary" />
                                Monitoramento prioritário
                            </CardTitle>
                            <CardDescription>Indicadores mais relevantes do paciente</CardDescription>
                        </div>
                        {lastMetricsUpdateLabel && (
                            <Badge variant="outline" className="text-xs text-primary-700 border-primary-200 bg-white">
                                Atualizado em {lastMetricsUpdateLabel}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    {isLoadingMetrics ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="mb-4">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-2 w-full rounded-full" />
                                    <div className="flex justify-between mt-1">
                                        <Skeleton className="h-3 w-10" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : Object.keys(processedMetrics).length > 0 ? (
                        <div>
                            {/* Render metrics dynamically */}
                            {Object.values(processedMetrics).slice(0, 4).map((metric, index) => {
                                const value = parseFloat(String(metric.value).replace(',', '.')) || 0;
                                // Use the improved health metric status function
                                const healthStatus = getHealthMetricStatus(value, metric.name);

                                const getStatusColor = (status: 'normal' | 'warning' | 'alert') => {
                                    if (status === 'normal') return 'text-green-600';
                                    if (status === 'warning') return 'text-amber-600';
                                    if (status === 'alert') return 'text-red-600';
                                    return 'text-green-600';
                                };

                                const getStatusBgColor = (status: 'normal' | 'warning' | 'alert') => {
                                    if (status === 'normal') return 'bg-green-500';
                                    if (status === 'warning') return 'bg-amber-500';
                                    if (status === 'alert') return 'bg-red-500';
                                    return 'bg-green-500';
                                };

                                return (
                                    <div key={index} className="mb-4 last:mb-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">{metric.name}</span>
                                            <span className={`text-sm font-bold ${getStatusColor(healthStatus)}`}>
                                                {metric.value} <span className="text-xs font-normal text-gray-500">{metric.unit}</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getStatusBgColor(healthStatus)}`}
                                                style={{ width: '70%' }} // Simplified width for demo
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma métrica disponível. Envie exames para análise.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <MemoizedHealthScore
                    score={healthStats.averageScore || 0}
                    trend={healthStats.trend || 'stable'}
                    isLoading={isLoadingMetrics}
                />
                <MemoizedRecentExams
                    exams={recentExams}
                    isLoading={isLoadingExams}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MemoizedHealthMetrics
                        metrics={metrics || []}
                        isLoading={isLoadingMetrics}
                        activeTab={activeMetricsTab}
                        onTabChange={setActiveMetricsTab}
                    />
                </div>
                <div>
                    <MemoizedHealthRecommendations
                        metrics={metrics || []}
                        isLoading={isLoadingMetrics}
                    />
                </div>
            </div>
        </div>
    );
}
