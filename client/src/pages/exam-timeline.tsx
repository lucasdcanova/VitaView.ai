import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import type { Exam, HealthMetric } from "@shared/schema";
import { normalizeExamName, formatMetricDisplayName } from "@shared/exam-normalizer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useProfiles } from "@/hooks/use-profiles";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { useTheme } from "@/hooks/use-theme";

// Função para parsear valores numéricos (suporta formatos PT-BR e EN-US)
function parseMetricValue(value: string | number): number {
  if (value === undefined || value === null) return NaN;
  if (typeof value === 'number') return value;

  const stringValue = String(value).trim();
  if (!stringValue) return NaN;

  // Se tem vírgula e ponto, assume que ponto é milhar e vírgula é decimal (PT-BR)
  // Ex: 1.234,56 -> 1234.56
  if (stringValue.includes(',') && stringValue.includes('.')) {
    return parseFloat(stringValue.replace(/\./g, '').replace(',', '.'));
  }

  // Se tem apenas vírgula, assume que é decimal (PT-BR)
  // Ex: 1234,56 -> 1234.56
  if (stringValue.includes(',')) {
    return parseFloat(stringValue.replace(',', '.'));
  }

  // Formato padrão (EN-US)
  return parseFloat(stringValue);
}

// Função para formatar data no padrão brasileiro
function formatDateToBR(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}



interface ExamTimelineProps {
  embedded?: boolean;
  activeProfile?: any;
  exams?: Exam[];
  healthMetrics?: HealthMetric[];
}

export default function ExamTimeline({
  embedded = false,
  activeProfile: propProfile,
  exams: propExams,
  healthMetrics: propMetrics
}: ExamTimelineProps = {}) {
  const { activeProfile: hookProfile, isLoading: isLoadingProfiles, inServiceAppointmentId } = useProfiles();
  const activeProfile = propProfile || hookProfile;
  const { theme } = useTheme();

  // Chart colors based on theme
  const gridColor = theme === 'dark' ? '#374151' : '#f0f0f0';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'white',
    border: `1px solid ${theme === 'dark' ? 'hsl(var(--border))' : '#e5e7eb'}`,
    borderRadius: '8px',
    fontSize: '13px',
    maxWidth: '300px',
    color: theme === 'dark' ? 'hsl(var(--popover-foreground))' : 'inherit'
  };

  // Buscar exames (se não fornecidos via props)
  const { data: fetchedExams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams", activeProfile?.id],
    queryFn: async () => {
      const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
      const res = await fetch(`/api/exams${queryParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
    enabled: !!activeProfile && !propExams,
  });
  const exams = propExams || fetchedExams;

  // Buscar métricas de saúde (se não fornecidos via props)
  const { data: fetchedMetrics = [], isLoading: isLoadingMetrics } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics", activeProfile?.id],
    queryFn: async () => {
      const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
      const res = await fetch(`/api/health-metrics${queryParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch health metrics");
      return res.json();
    },
    enabled: !!activeProfile && !propMetrics,
  });
  const healthMetrics = propMetrics || fetchedMetrics;

  const isLoading = isLoadingExams || isLoadingMetrics;

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  // State for selected metrics
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  if (!activeProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <PatientHeader
                title="Evolução clínica"
                description="Selecione um paciente para analisar tendências e linhas do tempo de exames."
                patient={activeProfile}
              />
              <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
                <h2 className="text-lg font-semibold text-foreground">Nenhum paciente selecionado</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Utilize o seletor acima para criar ou escolher um paciente.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Preparar dados do gráfico - uma linha para cada métrica
  const { chartData, availableMetrics } = useMemo(() => {
    // Debug logging
    console.log("[ExamTimeline] Processing data:", {
      examsCount: exams?.length,
      metricsCount: healthMetrics?.length,
      exams: exams,
      metrics: healthMetrics
    });

    if (!exams || !healthMetrics || exams.length === 0) return { chartData: [], availableMetrics: [] };

    // Agrupar métricas por data de exame
    const dataByDate = new Map();

    exams.forEach(exam => {
      let examMetrics = healthMetrics.filter(m => m.examId === exam.id);
      const examDate = exam.examDate || exam.uploadDate;
      const formattedDate = formatDateToBR(examDate);

      // Fallback: Link by date if no explicit ID link found
      if (examMetrics.length === 0) {
        console.log(`[ExamTimeline] No metrics found for exam ${exam.id} by ID. Trying date match: ${formattedDate}`);
        examMetrics = healthMetrics.filter(m => {
          // Only consider metrics without an examId (orphaned) to avoid stealing metrics from other exams
          if (m.examId) return false;

          // Check if metric date matches exam date
          const metricDateStr = formatDateToBR(m.date);
          return metricDateStr === formattedDate;
        });

        if (examMetrics.length > 0) {
          console.log(`[ExamTimeline] Found ${examMetrics.length} orphaned metrics matching date ${formattedDate}`);
        }
      }

      if (examMetrics.length > 0) {
        if (!dataByDate.has(formattedDate)) {
          dataByDate.set(formattedDate, {
            date: formattedDate,
            timestamp: new Date(examDate).getTime(),
            examName: exam.name,
            examId: exam.id
          });
        }

        const dataPoint = dataByDate.get(formattedDate);
        examMetrics.forEach(metric => {
          const normalizedName = normalizeExamName(metric.name);
          const rawValue = metric.value;
          const value = parseMetricValue(rawValue);

          if (!isNaN(value)) {
            dataPoint[normalizedName] = value;
            dataPoint[`${normalizedName}_unit`] = metric.unit;
            dataPoint[`${normalizedName}_status`] = metric.status;
          } else {
            console.warn(`[ExamTimeline] Failed to parse metric value: ${metric.name} = "${rawValue}"`, metric);
          }
        });
      }
    });

    // Ordenar por data
    const sortedData = Array.from(dataByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    // Obter todas as métricas disponíveis
    const metricsSet = new Set<string>();
    healthMetrics.forEach(metric => {
      const normalizedName = normalizeExamName(metric.name);
      metricsSet.add(normalizedName);
    });

    // Filtrar métricas principais para exibir (máximo 8 linhas)
    const mainMetrics = ['hemoglobina', 'glicose', 'colesterol total', 'hematócrito', 'leucócitos', 'plaquetas', 'vitamina d', 'albumina'];
    const availableMainMetrics = mainMetrics.filter(m => metricsSet.has(m));
    const otherMetrics = Array.from(metricsSet).filter(m => !mainMetrics.includes(m)).slice(0, 8 - availableMainMetrics.length);

    return {
      chartData: sortedData,
      availableMetrics: [...availableMainMetrics, ...otherMetrics]
    };
  }, [exams, healthMetrics]);

  // Update selected metrics when available metrics change
  useEffect(() => {
    if (availableMetrics.length > 0) {
      setSelectedMetrics(prev => {
        // If nothing selected yet, select all
        if (prev.length === 0) return availableMetrics;

        // If current selection has items that are no longer available (e.g. switched patient), 
        // or effectively completely different context, reset to all available.
        // Simple heuristic: if intersection is empty and we have available metrics, reset.
        const hasIntersection = prev.some(p => availableMetrics.includes(p));
        if (!hasIntersection) return availableMetrics;

        return prev;
      });
    }
  }, [availableMetrics]);

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        return prev.filter(m => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };

  // Cores para as métricas
  const getMetricColor = (metric: string) => {
    const colors = [
      '#1E3A5F', '#48C9B0', '#E74C3C', '#F39C12', '#9B59B6',
      '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#34495E'
    ];
    const index = availableMetrics.indexOf(metric) % colors.length;
    return colors[index];
  };

  if (embedded) {
    if (isLoading) {
      return (
        <div className="w-full h-[400px] flex items-center justify-center">
          <Skeleton className="h-full w-full bg-muted" />
        </div>
      );
    }

    return (
      <div className="space-y-6 w-full">
        {/* In-Service Banner */}
        {inServiceAppointmentId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-blue-900 font-semibold">Este paciente está em atendimento agora</p>
              <p className="text-blue-700 text-sm">Os dados do exame serão atualizados após finalizar a consulta</p>
            </div>
          </div>
        )}

        {availableMetrics.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Métricas visualizadas
              </CardTitle>
              <CardDescription>
                Total de {availableMetrics.length} métricas sendo acompanhadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableMetrics.map((metric) => (
                  <div key={metric} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                    <Checkbox
                      id={`embedded-metric-${metric}`}
                      checked={selectedMetrics.includes(metric)}
                      onCheckedChange={() => toggleMetric(metric)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div
                      className="w-3 h-3 rounded-full ml-1"
                      style={{ backgroundColor: getMetricColor(metric) }}
                    ></div>
                    <label
                      htmlFor={`embedded-metric-${metric}`}
                      className="text-sm font-medium cursor-pointer flex-1 select-none"
                    >
                      {formatMetricDisplayName(metric)}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Evolução dos exames
            </CardTitle>
            <CardDescription>
              Eixo X: data dos exames • Eixo Y: valores das métricas
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            {isLoading ? (
              <div className="w-full h-[400px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartData.length > 0 && availableMetrics.length > 0 ? (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} width={70} />
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => {
                        const unit = props.payload[`${name}_unit`] || '';
                        const status = props.payload[`${name}_status`] || '';
                        return [`${value} ${unit}`, `${formatMetricDisplayName(name)} (${status})`];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                      contentStyle={tooltipStyle}
                    />
                    <Legend formatter={(value) => formatMetricDisplayName(value)} wrapperStyle={{ fontSize: '12px' }} />
                    {availableMetrics.map((metric) => (
                      selectedMetrics.includes(metric) && (
                        <Line
                          key={metric}
                          type="monotone"
                          dataKey={metric}
                          name={metric}
                          stroke={getMetricColor(metric)}
                          strokeWidth={2}
                          dot={{ fill: getMetricColor(metric), strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          connectNulls={false}
                        />
                      )
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="h-20 w-20 mx-auto mb-6 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {exams && exams.length > 0 ? "Exames encontrados, mas sem dados" : "Nenhum exame encontrado"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {exams && exams.length > 0
                    ? "Não conseguimos extrair métricas numéricas dos seus exames cadastrados."
                    : "Faça o upload de exames para visualizar a evolução das métricas"}
                </p>
                {/* Link removed in embedded mode */}
              </div>
            ) : (
              <div className="text-center py-16">
                <Activity className="h-20 w-20 mx-auto mb-6 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Processando dados dos exames
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Aguarde enquanto preparamos a visualização dos resultados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <PatientHeader
              title="Evolução clínica"
              description={`Acompanhe a evolução das métricas laboratoriais do paciente ${activeProfile.name}.`}
              patient={activeProfile}
            />

            {/* In-Service Banner */}
            {inServiceAppointmentId && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-blue-900 font-semibold">Este paciente está em atendimento agora</p>
                  <p className="text-blue-700 text-sm">Os dados do exame serão atualizados após finalizar a consulta</p>
                </div>
              </div>
            )}

            {availableMetrics.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-primary" />
                    Métricas visualizadas
                  </CardTitle>
                  <CardDescription>
                    Total de {availableMetrics.length} métricas sendo acompanhadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableMetrics.map((metric) => (
                      <div key={metric} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                        <Checkbox
                          id={`metric-${metric}`}
                          checked={selectedMetrics.includes(metric)}
                          onCheckedChange={() => toggleMetric(metric)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div
                          className="w-3 h-3 rounded-full ml-1"
                          style={{ backgroundColor: getMetricColor(metric) }}
                        ></div>
                        <label
                          htmlFor={`metric-${metric}`}
                          className="text-sm font-medium cursor-pointer flex-1 select-none"
                        >
                          {formatMetricDisplayName(metric)}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Evolução dos exames
                </CardTitle>
                <CardDescription>
                  Eixo X: data dos exames • Eixo Y: valores das métricas
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                {isLoading ? (
                  <div className="w-full h-[400px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : chartData.length > 0 && availableMetrics.length > 0 ? (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} width={70} />
                        <Tooltip
                          formatter={(value: any, name: string, props: any) => {
                            const unit = props.payload[`${name}_unit`] || '';
                            const status = props.payload[`${name}_status`] || '';
                            return [`${value} ${unit}`, `${formatMetricDisplayName(name)} (${status})`];
                          }}
                          labelFormatter={(label) => `Data: ${label}`}
                          contentStyle={tooltipStyle}
                        />
                        <Legend formatter={(value) => formatMetricDisplayName(value)} wrapperStyle={{ fontSize: '12px' }} />
                        {availableMetrics.map((metric) => (
                          selectedMetrics.includes(metric) && (
                            <Line
                              key={metric}
                              type="monotone"
                              dataKey={metric}
                              name={metric}
                              stroke={getMetricColor(metric)}
                              strokeWidth={2}
                              dot={{ fill: getMetricColor(metric), strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, strokeWidth: 2 }}
                              connectNulls={false}
                            />
                          )
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="text-center py-16">
                    <BarChart3 className="h-20 w-20 mx-auto mb-6 text-muted-foreground/40" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {exams && exams.length > 0 ? "Exames encontrados, mas sem dados" : "Nenhum exame encontrado"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {exams && exams.length > 0
                        ? "Não conseguimos extrair métricas numéricas dos seus exames cadastrados."
                        : "Faça o upload de exames para visualizar a evolução das métricas"}
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <a href="/upload-exams">Enviar primeiro exame</a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Activity className="h-20 w-20 mx-auto mb-6 text-muted-foreground/40" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Processando dados dos exames
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Aguarde enquanto preparamos a visualização dos resultados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
