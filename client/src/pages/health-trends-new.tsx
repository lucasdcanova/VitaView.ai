import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

// Função para formatar data no padrão brasileiro
function formatDateToBR(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function HealthTrendsNew() {
  // Buscar métricas de saúde
  const { data: healthMetrics = [], isLoading: isLoadingMetrics } = useQuery<any[]>({
    queryKey: ["/api/health-metrics"],
  });

  const isLoading = isLoadingMetrics;

  // Preparar dados do gráfico diretamente das métricas
  const { chartData, availableMetrics } = useMemo(() => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return { chartData: [], availableMetrics: [] };
    }

    // Agrupar métricas por data
    const dataByDate = new Map<string, any>();
    
    healthMetrics.forEach((metric: any) => {
      const metricDate = metric.date;
      const formattedDate = formatDateToBR(metricDate);
      
      if (!dataByDate.has(formattedDate)) {
        dataByDate.set(formattedDate, {
          date: formattedDate,
          timestamp: new Date(metricDate).getTime(),
        });
      }

      const dataPoint = dataByDate.get(formattedDate);
      const metricName = metric.name.toLowerCase();
      const value = parseFloat(metric.value);
      
      if (!isNaN(value)) {
        dataPoint[metricName] = value;
        dataPoint[`${metricName}_unit`] = metric.unit;
        dataPoint[`${metricName}_status`] = metric.status;
      }
    });

    // Ordenar por data
    const sortedData = Array.from(dataByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    // Obter métricas disponíveis
    const metricsSet = new Set<string>();
    healthMetrics.forEach((metric: any) => {
      metricsSet.add(metric.name.toLowerCase());
    });

    // Filtrar métricas principais
    const mainMetrics = ['hemoglobina', 'eritrócitos', 'hematócrito', 'vcm', 'hcm', 'chcm', 'rdw', 'leucócitos'];
    const availableMainMetrics = mainMetrics.filter(m => metricsSet.has(m));
    const otherMetrics = Array.from(metricsSet)
      .filter(m => !mainMetrics.includes(m))
      .slice(0, 8 - availableMainMetrics.length);
    
    return { 
      chartData: sortedData, 
      availableMetrics: [...availableMainMetrics, ...otherMetrics] 
    };
  }, [healthMetrics]);

  // Cores para as métricas
  const getMetricColor = (metric: string): string => {
    const colors = [
      '#1E3A5F', '#48C9B0', '#E74C3C', '#F39C12', '#9B59B6', 
      '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#34495E'
    ];
    const index = availableMetrics.indexOf(metric) % colors.length;
    return colors[index];
  };

  // Capitalizar primeira letra
  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <>
      <Sidebar />
      <MobileHeader />
      <div className="flex flex-col min-h-screen lg:pl-64">
        <main className="flex-1 p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tendências de Saúde
              </h1>
              <p className="text-lg text-gray-600">
                Compare a evolução de diferentes métricas de saúde ao longo do tempo para visualizar tendências e identificar padrões nos seus exames.
              </p>
            </div>

            {/* Gráfico X e Y */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-[#1E3A5F]" />
                  Evolução das Métricas de Saúde
                </CardTitle>
                <CardDescription>
                  Eixo X: Data dos exames | Eixo Y: Valores das métricas • Uma linha para cada métrica
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
                        <YAxis 
                          tick={{ fontSize: 11 }}
                          width={70}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string, props: any) => {
                            const unit = props.payload[`${name}_unit`] || '';
                            const status = props.payload[`${name}_status`] || '';
                            return [
                              `${value} ${unit}`,
                              `${capitalizeFirst(name)} (${status})`
                            ];
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
                        <Legend 
                          formatter={(value) => capitalizeFirst(value)}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
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
                      Nenhum dado encontrado
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Faça o upload de seus exames para visualizar a evolução das métricas
                    </p>
                    <Button 
                      asChild
                      className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white"
                    >
                      <a href="/upload-exams">Enviar Primeiro Exame</a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Activity className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Processando dados
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Aguarde enquanto preparamos a visualização
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo das métricas */}
            {availableMetrics.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-[#1E3A5F]" />
                    Métricas Visualizadas
                  </CardTitle>
                  <CardDescription>
                    Total de {availableMetrics.length} métricas sendo acompanhadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableMetrics.map((metric) => (
                      <div
                        key={metric}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getMetricColor(metric) }}
                        ></div>
                        <span className="text-sm font-medium">
                          {capitalizeFirst(metric)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Total métricas: {healthMetrics.length}</p>
                  <p>Pontos no gráfico: {chartData.length}</p>
                  <p>Métricas disponíveis: {availableMetrics.length}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}