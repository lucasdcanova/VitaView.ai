import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import type { Exam, HealthMetric } from "@shared/schema";
import { normalizeExamName } from "@shared/exam-normalizer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useProfiles } from "@/hooks/use-profiles";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";

// Função para formatar data no padrão brasileiro
function formatDateToBR(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

// Função para formatar nomes de métricas
function formatMetricDisplayName(name: string): string {
  const normalizedName = normalizeExamName(name);
  
  const displayMap: Record<string, string> = {
    'eritrócitos': 'Eritrócitos',
    'hemoglobina': 'Hemoglobina', 
    'hematócrito': 'Hematócrito',
    'vcm': 'VCM',
    'hcm': 'HCM',
    'chcm': 'CHCM',
    'rdw': 'RDW',
    'leucócitos': 'Leucócitos',
    'neutrófilos': 'Neutrófilos',
    'eosinófilos': 'Eosinófilos',
    'basófilos': 'Basófilos',
    'monócitos': 'Monócitos',
    'linfócitos': 'Linfócitos',
    'plaquetas': 'Plaquetas',
    'glicose': 'Glicose',
    'colesterol total': 'Colesterol Total',
    'vitamina d': 'Vitamina D',
    'albumina': 'Albumina'
  };
  
  return displayMap[normalizedName] || name;
}

export default function ExamTimeline() {
  const { activeProfile, isLoading: isLoadingProfiles } = useProfiles();

  // Buscar exames
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams", activeProfile?.id],
    queryFn: async () => {
      const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
      const res = await fetch(`/api/exams${queryParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
    enabled: !!activeProfile,
  });

  // Buscar métricas de saúde
  const { data: healthMetrics = [], isLoading: isLoadingMetrics } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics", activeProfile?.id],
    queryFn: async () => {
      const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
      const res = await fetch(`/api/health-metrics${queryParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch health metrics");
      return res.json();
    },
    enabled: !!activeProfile,
  });

  const isLoading = isLoadingExams || isLoadingMetrics;

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

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
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-600">
                <h2 className="text-lg font-semibold text-gray-800">Nenhum paciente selecionado</h2>
                <p className="text-sm text-gray-500 mt-2">
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
    if (!exams || !healthMetrics || exams.length === 0) return { chartData: [], availableMetrics: [] };

    // Agrupar métricas por data de exame
    const dataByDate = new Map();
    
    exams.forEach(exam => {
      const examMetrics = healthMetrics.filter(m => m.examId === exam.id);
      const examDate = exam.examDate || exam.uploadDate;
      const formattedDate = formatDateToBR(examDate);
      
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
          const value = parseFloat(metric.value);
          if (!isNaN(value)) {
            dataPoint[normalizedName] = value;
            dataPoint[`${normalizedName}_unit`] = metric.unit;
            dataPoint[`${normalizedName}_status`] = metric.status;
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

  // Cores para as métricas
  const getMetricColor = (metric: string) => {
    const colors = [
      '#1E3A5F', '#48C9B0', '#E74C3C', '#F39C12', '#9B59B6', 
      '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#34495E'
    ];
    const index = availableMetrics.indexOf(metric) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex h-screen bg-gray-50">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-[#1E3A5F]" />
                  Evolução dos exames
                </CardTitle>
                <CardDescription>
                  Eixo X: data dos exames • Eixo Y: valores das métricas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="w-full h-[600px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : chartData.length > 0 && availableMetrics.length > 0 ? (
                  <div className="w-full h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} width={70} />
                        <Tooltip
                          formatter={(value: any, name: string, props: any) => {
                            const unit = props.payload[`${name}_unit`] || '';
                            const status = props.payload[`${name}_status`] || '';
                            return [`${value} ${unit}`, `${formatMetricDisplayName(name)} (${status})`];
                          }}
                          labelFormatter={(label) => `Data: ${label}`}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '13px',
                            maxWidth: '300px'
                          }}
                        />
                        <Legend formatter={(value) => formatMetricDisplayName(value)} wrapperStyle={{ fontSize: '12px' }} />
                        {availableMetrics.map((metric) => (
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
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="text-center py-16">
                    <BarChart3 className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nenhum exame encontrado
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Faça o upload de exames para visualizar a evolução das métricas
                    </p>
                    <Button asChild className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white">
                      <a href="/upload-exams">Enviar primeiro exame</a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Activity className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Processando dados dos exames
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Aguarde enquanto preparamos a visualização dos resultados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {availableMetrics.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-[#1E3A5F]" />
                    Métricas visualizadas
                  </CardTitle>
                  <CardDescription>
                    Total de {availableMetrics.length} métricas sendo acompanhadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableMetrics.map((metric) => (
                      <div key={metric} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getMetricColor(metric) }}
                        ></div>
                        <span className="text-sm font-medium">{formatMetricDisplayName(metric)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
