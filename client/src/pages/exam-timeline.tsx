import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import type { Exam, HealthMetric } from "@shared/schema";
import { normalizeExamName } from "@shared/exam-normalizer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  // Estados para controle do gráfico
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['hemoglobina', 'glicose']);
  
  // Buscar exames
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Buscar métricas de saúde
  const { data: healthMetrics = [], isLoading: isLoadingMetrics } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics"],
  });

  const isLoading = isLoadingExams || isLoadingMetrics;

  // Preparar dados do gráfico
  const chartData = useMemo(() => {
    if (!exams || !healthMetrics || exams.length === 0) return [];

    // Agrupar métricas por exame e data
    const examMap = new Map();
    
    exams.forEach(exam => {
      const examMetrics = healthMetrics.filter(m => m.examId === exam.id);
      const examDate = exam.examDate || exam.uploadDate;
      
      if (examMetrics.length > 0) {
        const dataPoint: any = {
          date: formatDateToBR(examDate),
          timestamp: new Date(examDate).getTime(),
          examName: exam.name,
          examId: exam.id
        };

        examMetrics.forEach(metric => {
          const normalizedName = normalizeExamName(metric.name);
          const value = parseFloat(metric.value);
          if (!isNaN(value)) {
            dataPoint[normalizedName] = value;
            dataPoint[`${normalizedName}_unit`] = metric.unit;
            dataPoint[`${normalizedName}_status`] = metric.status;
          }
        });

        examMap.set(exam.id, dataPoint);
      }
    });

    // Converter para array e ordenar por data
    return Array.from(examMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [exams, healthMetrics]);

  // Obter métricas disponíveis
  const availableMetrics = useMemo(() => {
    const metrics = new Set<string>();
    healthMetrics.forEach(metric => {
      const normalizedName = normalizeExamName(metric.name);
      metrics.add(normalizedName);
    });
    return Array.from(metrics);
  }, [healthMetrics]);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evolução das Métricas de Saúde
          </h1>
          <p className="text-lg text-gray-600">
            Acompanhe a evolução dos seus resultados ao longo do tempo
          </p>
        </div>

        {/* Seleção de Métricas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#1E3A5F]" />
              Selecionar Métricas
            </CardTitle>
            <CardDescription>
              Escolha quais métricas deseja visualizar no gráfico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableMetrics.slice(0, 12).map((metric) => (
                <label
                  key={metric}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetrics([...selectedMetrics, metric]);
                      } else {
                        setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">
                    {formatMetricDisplayName(metric)}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico X e Y */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-[#1E3A5F]" />
              Gráfico de Evolução
            </CardTitle>
            <CardDescription>
              Eixo X: Data dos exames | Eixo Y: Valores das métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="w-full h-[500px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartData.length > 0 && selectedMetrics.length > 0 ? (
              <div className="w-full h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => {
                        const unit = props.payload[`${name}_unit`] || '';
                        const status = props.payload[`${name}_status`] || '';
                        return [
                          `${value} ${unit}`,
                          `${formatMetricDisplayName(name)} (${status})`
                        ];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <Legend 
                      formatter={(value) => formatMetricDisplayName(value)}
                      wrapperStyle={{ fontSize: '14px' }}
                    />
                    {selectedMetrics.map((metric) => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        name={metric}
                        stroke={getMetricColor(metric)}
                        strokeWidth={3}
                        dot={{ fill: getMetricColor(metric), strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
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
                  Selecione métricas para visualizar
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Escolha pelo menos uma métrica na seção acima para ver o gráfico
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}