import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import {
  TrendingUp,
  BarChart3,
  CalendarClock,
  AlertCircle,
  InfoIcon,
} from "lucide-react";
import { normalizeExamName, formatMetricDisplayName } from "@shared/exam-normalizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Função auxiliar para formatação de data
const formatDateToBR = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

// Função auxiliar para gerar cor aleatória baseada na string
function getRandomColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

// Interfaces
interface Exam {
  id: number;
  userId: number;
  name: string;
  status: string;
  examDate: string;
  createdAt: string;
  laboratoryName: string | null;
}

interface ExamMetric {
  id: number;
  examId: number;
  name: string;
  value: number;
  date: string;
  referenceMin?: number | null;
  referenceMax?: number | null;
  unit?: string | null;
  category?: string | null;
  status?: "normal" | "alto" | "baixo" | "atencao" | null;
}

// Componente principal
export default function HealthTrendsPage() {
  // Estados para seleção e filtragem
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableMetrics, setAvailableMetrics] = useState<Record<string, ExamMetric[]>>({});
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [showReferenceLines, setShowReferenceLines] = useState(true);

  // Consultas de dados
  const {
    data: exams,
    isLoading: isLoadingExams,
  } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const {
    data: healthMetrics,
    isLoading: isLoadingMetrics,
  } = useQuery<ExamMetric[]>({
    queryKey: ["/api/health-metrics"],
  });

  // Inicialização - computar as métricas disponíveis
  useEffect(() => {
    if (!healthMetrics || healthMetrics.length === 0) return;

    console.log("[HEALTH-TRENDS] Total de métricas carregadas:", healthMetrics.length);
    
    // Extrair categorias únicas
    const uniqueCategories = Array.from(
      new Set(healthMetrics.map((metric) => metric.category || "Sem categoria"))
    );
    setCategories(uniqueCategories);

    // Organizar métricas por nome normalizado
    const metricsByNormalizedName: Record<string, ExamMetric[]> = {};
    
    // Para depuração - contar métricas por exame
    const metricCountByExam: Record<number, string[]> = {};

    healthMetrics.forEach((metric) => {
      // Normalizar o nome para agrupar variações do mesmo exame
      const normalizedName = normalizeExamName(metric.name);
      
      // Rastrear métricas por exame para depuração
      if (!metricCountByExam[metric.examId]) {
        metricCountByExam[metric.examId] = [];
      }
      metricCountByExam[metric.examId].push(`${metric.name} → ${normalizedName}`);
      
      // Agrupar por nome normalizado
      if (!metricsByNormalizedName[normalizedName]) {
        metricsByNormalizedName[normalizedName] = [];
      }
      
      metricsByNormalizedName[normalizedName].push(metric);
    });
    
    console.log("[HEALTH-TRENDS] Métricas disponíveis:", {
      totalUnicas: Object.keys(metricsByNormalizedName).length,
      nomesUnicos: Object.keys(metricsByNormalizedName),
      metricasPorExame: metricCountByExam
    });
    
    setAvailableMetrics(metricsByNormalizedName);
  }, [healthMetrics]);

  // Pré-selecionar exames quando carregados
  useEffect(() => {
    if (exams && exams.length > 0 && selectedExams.length === 0) {
      const examIds = exams.map(exam => exam.id);
      console.log("[HEALTH-TRENDS] Auto-selecionando exames:", examIds);
      setSelectedExams(examIds);
    }
  }, [exams, selectedExams]);

  // Pré-selecionar algumas métricas comuns quando disponíveis
  useEffect(() => {
    if (Object.keys(availableMetrics).length > 0 && selectedMetrics.length === 0) {
      // Lista de métricas comuns para tentar pré-selecionar
      const commonMetrics = [
        'glicose', 'hemoglobina', 'hematócrito', 'eritrócitos', 
        'leucócitos', 'plaquetas', 'colesterol total', 'triglicerídeos'
      ];
      
      // Filtrar para obter apenas as que existem nos dados
      const availableCommonMetrics = commonMetrics.filter(metric => 
        Object.keys(availableMetrics).includes(metric)
      );
      
      // Selecionar as primeiras 2 métricas disponíveis
      const initialSelection = availableCommonMetrics.slice(0, 2);
      
      if (initialSelection.length > 0) {
        console.log("[HEALTH-TRENDS] Auto-selecionando métricas:", initialSelection);
        setSelectedMetrics(initialSelection);
      }
    }
  }, [availableMetrics, selectedMetrics]);

  // Filtragem de métricas por categoria
  const filteredMetricNames = Object.keys(availableMetrics).filter((metricName) => {
    if (selectedCategory === "all") return true;
    
    return availableMetrics[metricName].some(metric => 
      (metric.category || "Sem categoria") === selectedCategory
    );
  });

  // Preparação dos dados para o gráfico
  const chartData = React.useMemo(() => {
    if (!exams || !healthMetrics || selectedExams.length === 0 || selectedMetrics.length === 0) {
      return [];
    }
    
    console.log("[HEALTH-TRENDS] Preparando dados do gráfico com:", {
      totalExames: exams.length,
      exameSelecionados: selectedExams.length,
      metricasSelecionadas: selectedMetrics,
      metricasDisponiveis: healthMetrics.length
    });

    // Primeiro, preparamos os dados por ponto (exame)
    const dataPoints: any[] = [];
    
    // Para cada exame selecionado
    selectedExams.forEach(examId => {
      const exam = exams.find(e => e.id === examId);
      if (!exam) return;
      
      // Objeto base para este ponto de dados
      const pointData: any = {
        name: formatDateToBR(exam.examDate || exam.createdAt),
        examId: exam.id,
        examName: exam.name,
        examDate: new Date(exam.examDate || exam.createdAt).getTime()
      };
      
      // Filtrar métricas apenas deste exame
      const examMetrics = healthMetrics.filter(m => m.examId === examId);
      
      // Flag para verificar se este exame tem pelo menos uma métrica selecionada
      let hasSelectedMetric = false;
      
      // Para cada métrica selecionada pelo usuário
      selectedMetrics.forEach(metricName => {
        // Buscar esta métrica específica no exame
        // Importante: precisamos normalizar os nomes para comparação
        const metric = examMetrics.find(m => 
          normalizeExamName(m.name) === metricName
        );
        
        if (metric) {
          hasSelectedMetric = true;
          
          // Adicionar valor principal
          pointData[metricName] = parseFloat(metric.value.toString());
          
          // Adicionar valores de referência quando disponíveis
          if (metric.referenceMin !== null && metric.referenceMin !== undefined) {
            pointData[`${metricName}_min`] = parseFloat(metric.referenceMin.toString());
          }
          
          if (metric.referenceMax !== null && metric.referenceMax !== undefined) {
            pointData[`${metricName}_max`] = parseFloat(metric.referenceMax.toString());
          }
          
          // Informações adicionais
          pointData[`${metricName}_unit`] = metric.unit;
          pointData[`${metricName}_status`] = metric.status;
        }
      });
      
      // Só incluir pontos com pelo menos uma métrica relevante
      if (hasSelectedMetric) {
        dataPoints.push(pointData);
      }
    });
    
    // Ordenar por data
    dataPoints.sort((a, b) => a.examDate - b.examDate);
    
    console.log("[HEALTH-TRENDS] Dados finais do gráfico:", {
      totalPontos: dataPoints.length,
      exemploPrimeiroPonto: dataPoints[0],
      metricasNosPontos: dataPoints.map(point => {
        const metrics = {};
        selectedMetrics.forEach(metric => {
          if (point[metric] !== undefined) {
            metrics[metric] = point[metric];
          }
        });
        return { data: point.name, metricas: metrics };
      })
    });
    
    return dataPoints;
  }, [exams, healthMetrics, selectedExams, selectedMetrics]);

  // Cores para cada métrica (consistentes)
  const metricColors: Record<string, string> = React.useMemo(() => {
    return Object.keys(availableMetrics).reduce<Record<string, string>>((acc, metric) => {
      acc[metric] = getRandomColor(metric);
      return acc;
    }, {});
  }, [availableMetrics]);

  // Estado global de carregamento
  const isLoading = isLoadingExams || isLoadingMetrics;

  // Renderização do componente
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <MobileHeader />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Cabeçalho */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-4">
              <TrendingUp className="h-7 w-7 mr-3 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Tendências de Saúde</h1>
            </div>
            <p className="text-gray-600 mb-6 max-w-4xl">
              Compare a evolução de diferentes métricas de saúde ao longo do tempo para 
              visualizar tendências e identificar padrões nos seus exames.
            </p>
          </motion.div>

          {/* Opções do gráfico */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <Label htmlFor="chart-type">Tipo de gráfico:</Label>
              <div className="flex mt-1 space-x-2">
                <Button 
                  variant={chartType === "line" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType("line")}
                >
                  Linha
                </Button>
                <Button 
                  variant={chartType === "bar" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType("bar")}
                >
                  Barra
                </Button>
              </div>
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-references" 
                  checked={showReferenceLines}
                  onCheckedChange={(checked) => setShowReferenceLines(!!checked)}
                />
                <Label htmlFor="show-references">
                  Mostrar valores de referência
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Seleção de Exames */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarClock className="h-5 w-5 mr-2 text-primary-600" />
                  Selecione Exames
                </CardTitle>
                <CardDescription>
                  Escolha quais exames deseja incluir na comparação
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                {isLoadingExams ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : exams && exams.length > 0 ? (
                  <div className="space-y-3">
                    {exams.map((exam) => (
                      <div key={exam.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`exam-${exam.id}`}
                          checked={selectedExams.includes(exam.id)}
                          onCheckedChange={(checked) => {
                            setSelectedExams(
                              checked
                                ? [...selectedExams, exam.id]
                                : selectedExams.filter((id) => id !== exam.id)
                            );
                          }}
                        />
                        <Label htmlFor={`exam-${exam.id}`} className="flex-1 cursor-pointer">
                          <div>
                            <span className="font-medium">{exam.name}</span>
                            <div className="text-sm text-gray-500">
                              {formatDateToBR(exam.examDate || exam.createdAt)}
                              {exam.laboratoryName && ` • ${exam.laboratoryName}`}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Você não possui nenhum exame registrado.</p>
                    <Button className="mt-4" variant="outline" asChild>
                      <a href="/upload-exams">Enviar um exame</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seleção de Métricas */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
                  Selecione Métricas
                </CardTitle>
                <CardDescription>
                  Escolha as métricas que deseja visualizar no gráfico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="overflow-x-auto">
                      <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>
                        Todas
                      </TabsTrigger>
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value={selectedCategory} className="mt-0">
                    {isLoadingMetrics ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array(6)
                          .fill(0)
                          .map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                          ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[320px] overflow-y-auto">
                        {filteredMetricNames.map((metricName) => (
                          <div key={metricName} className="flex items-center space-x-2">
                            <Checkbox
                              id={`metric-${metricName}`}
                              checked={selectedMetrics.includes(metricName)}
                              onCheckedChange={(checked) => {
                                setSelectedMetrics(
                                  checked
                                    ? [...selectedMetrics, metricName]
                                    : selectedMetrics.filter((name) => name !== metricName)
                                );
                              }}
                              style={{ 
                                borderColor: metricColors[metricName],
                                backgroundColor: selectedMetrics.includes(metricName) 
                                  ? metricColors[metricName] 
                                  : undefined 
                              }}
                            />
                            <Label 
                              htmlFor={`metric-${metricName}`} 
                              className="cursor-pointer flex-1"
                            >
                              {formatMetricDisplayName(metricName)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                {/* Botão para gerar gráfico */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {selectedMetrics.length > 0 && selectedExams.length > 0 
                      ? `${selectedMetrics.length} métrica(s) e ${selectedExams.length} exame(s) selecionados`
                      : 'Selecione métricas e exames para visualizar'
                    }
                  </div>
                  <Button 
                    onClick={() => {
                      // Força a atualização do gráfico rolando até ele
                      const chartElement = document.querySelector('#chart-section');
                      if (chartElement) {
                        chartElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    disabled={selectedMetrics.length === 0 || selectedExams.length === 0}
                    className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gerar Gráfico
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendências */}
          <Card id="chart-section" className="mt-6">
            <CardHeader>
              <CardTitle>Evolução dos Resultados</CardTitle>
              <CardDescription>
                Compare a evolução das métricas selecionadas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-full h-[400px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="w-full h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            // Obtém a unidade da métrica
                            const unit = props.payload[`${name}_unit`] || '';
                            return [`${value} ${unit}`, name];
                          }}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Legend />
                        {selectedMetrics.map((metric) => (
                          <React.Fragment key={metric}>
                            <Line
                              type="monotone"
                              dataKey={metric}
                              name={metric}
                              stroke={metricColors[metric]}
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                            {showReferenceLines && 
                             chartData.some(d => d[`${metric}_min`] !== undefined) && (
                              <ReferenceLine
                                y={(() => {
                                  // Pegamos o valor de referência do primeiro ponto que o tem
                                  const point = chartData.find(d => d[`${metric}_min`] !== undefined);
                                  return point ? point[`${metric}_min`] : 0;
                                })()}
                                stroke={metricColors[metric]}
                                strokeDasharray="3 3"
                                strokeOpacity={0.6}
                                label={{
                                  value: "Min",
                                  fill: metricColors[metric],
                                  fontSize: 10
                                }}
                              />
                            )}
                            {showReferenceLines && 
                             chartData.some(d => d[`${metric}_max`] !== undefined) && (
                              <ReferenceLine
                                y={(() => {
                                  // Pegamos o valor de referência do primeiro ponto que o tem
                                  const point = chartData.find(d => d[`${metric}_max`] !== undefined);
                                  return point ? point[`${metric}_max`] : 0;
                                })()}
                                stroke={metricColors[metric]}
                                strokeDasharray="3 3"
                                strokeOpacity={0.6}
                                label={{
                                  value: "Max",
                                  fill: metricColors[metric],
                                  fontSize: 10
                                }}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const unit = props.payload[`${name}_unit`] || '';
                            return [`${value} ${unit}`, name];
                          }}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Legend />
                        {selectedMetrics.map((metric) => (
                          <React.Fragment key={metric}>
                            <Bar
                              dataKey={metric}
                              name={metric}
                              fill={metricColors[metric]}
                            />
                            {showReferenceLines && 
                             chartData.some(d => d[`${metric}_min`] !== undefined) && (
                              <ReferenceLine
                                y={chartData.find(d => d[`${metric}_min`] !== undefined)?.[`${metric}_min`] || 0}
                                stroke={metricColors[metric]}
                                strokeDasharray="3 3"
                                strokeOpacity={0.6}
                                label={{
                                  value: "Min",
                                  fill: metricColors[metric],
                                  fontSize: 10
                                }}
                              />
                            )}
                            {showReferenceLines && 
                             chartData.some(d => d[`${metric}_max`] !== undefined) && (
                              <ReferenceLine
                                y={chartData.find(d => d[`${metric}_max`] !== undefined)?.[`${metric}_max`] || 0}
                                stroke={metricColors[metric]}
                                strokeDasharray="3 3"
                                strokeOpacity={0.6}
                                label={{
                                  value: "Max",
                                  fill: metricColors[metric],
                                  fontSize: 10
                                }}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                    <InfoIcon className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Sem dados para exibir</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Os exames e métricas selecionados não possuem dados compatíveis para 
                    visualização. Tente selecionar outras métricas ou exames.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}