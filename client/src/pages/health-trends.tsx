import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BarChart3, ArrowUpDown, Info, TrendingUp, CalendarClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { getRandomColor } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useSidebar } from "@/hooks/use-sidebar";
import { normalizeExamName } from "@shared/exam-normalizer";

// Helpers para o gráfico
const formatDateToBR = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

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
  normalizedName?: string; // Adicionado para facilitar o debug
}

interface Exam {
  id: number;
  userId: number;
  name: string;
  status: string;
  examDate: string;
  createdAt: string;
  laboratoryName: string | null;
}

export default function HealthTrendsPage() {
  // Estados
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [metricCategories, setMetricCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableMetrics, setAvailableMetrics] = useState<Record<string, ExamMetric[]>>({});
  
  // Dados de exames
  const { data: exams, isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Métricas de saúde
  const { data: healthMetrics, isLoading: isLoadingMetrics } = useQuery<ExamMetric[]>({
    queryKey: ["/api/health-metrics"],
  });

  useEffect(() => {
    if (!healthMetrics) return;
    
    console.log("MÉTRICAS CARREGADAS:", healthMetrics.length);
    
    // Extrair categorias únicas
    const categories = Array.from(
      new Set(healthMetrics.map((metric) => metric.category || "Sem categoria"))
    );
    setMetricCategories(categories);

    // Organizar métricas por nome para seleção (normalizando os nomes)
    const metricsByName: Record<string, ExamMetric[]> = {};
    
    // Para debugging - métricas por exame
    const metricsByExamId: Record<number, string[]> = {};
    
    healthMetrics.forEach((metric) => {
      // Normalizar o nome da métrica para unificar variações do mesmo exame
      const normalizedName = normalizeExamName(metric.name);
      
      // Tracking de métricas por exame para debugging
      if (!metricsByExamId[metric.examId]) {
        metricsByExamId[metric.examId] = [];
      }
      metricsByExamId[metric.examId].push(`${metric.name} (${normalizedName})`);
      
      if (!metricsByName[normalizedName]) {
        metricsByName[normalizedName] = [];
      }
      
      // Importante: manter o nome original mas adicionar uma propriedade com o nome normalizado
      metricsByName[normalizedName].push({
        ...metric,
        normalizedName // Adicionamos essa propriedade para facilitar o acesso
      });
    });
    
    console.log("MAPEAMENTO DE MÉTRICAS:", {
      metricasPorExame: metricsByExamId,
      totalMetricasUnicas: Object.keys(metricsByName).length,
      metricasUnicas: Object.keys(metricsByName),
    });
    
    setAvailableMetrics(metricsByName);
  }, [healthMetrics]);

  // Filtragem de métricas por categoria
  const filteredMetricNames = Object.keys(availableMetrics).filter((metricName) => {
    if (selectedCategory === "all") return true;
    return availableMetrics[metricName].some(metric => 
      (metric.category || "Sem categoria") === selectedCategory
    );
  });

  // Esta é a parte mais crítica - vamos inicializar selectedExams com todos os IDs de exames
  // e selecionar algumas métricas comuns automaticamente
  useEffect(() => {
    if (exams && exams.length > 0 && selectedExams.length === 0) {
      console.log("Inicializando seleção automática de exames:", exams.map(e => e.id));
      setSelectedExams(exams.map(e => e.id));
    }
  }, [exams, selectedExams]);

  // Esta é a segunda parte crítica - vamos selecionar algumas métricas populares automaticamente
  useEffect(() => {
    if (Object.keys(availableMetrics).length > 0 && selectedMetrics.length === 0) {
      // Métricas que vamos tentar selecionar automaticamente (por prioridade)
      const popularMetrics = [
        'glicose', 'eritrócitos', 'hemoglobina', 'hematócrito', 'leucócitos', 'plaquetas'
      ];
      
      // Filtrar apenas as que realmente existem no conjunto de dados
      const available = popularMetrics.filter(metric => 
        Object.keys(availableMetrics).includes(metric)
      );
      
      // Selecionar automaticamente as 2 primeiras métricas disponíveis
      const initialSelection = available.slice(0, 2);
      
      if (initialSelection.length > 0) {
        console.log("Selecionando métricas automaticamente:", initialSelection);
        setSelectedMetrics(initialSelection);
      }
    }
  }, [availableMetrics, selectedMetrics]);

  // Adicionar debugging detalhado para identificar o problema
  console.log("DASHBOARD DEBUG - Métricas disponíveis:", {
    healthMetrics: healthMetrics?.slice(0, 5).map(m => ({
      id: m.id,
      examId: m.examId,
      name: m.name,
      value: m.value
    }))
  });

  // Simplificamos radicalmente para identificar e corrigir o problema
  const chartData = React.useMemo(() => {
    // Verificações críticas de dados
    if (!exams || !healthMetrics) {
      console.log("ERRO: Dados de exames ou métricas nulos");
      return [];
    }

    if (selectedExams.length === 0 || selectedMetrics.length === 0) {
      console.log("ERRO: Nenhum exame ou métrica selecionada");
      return [];
    }

    console.log("ANÁLISE DETALHADA:", {
      examesTotal: exams.length,
      examsSelecionados: selectedExams,
      metricasTotal: healthMetrics.length,
      metricasSelecionadas: selectedMetrics,
      
      // Verificação de compatibilidade
      metricasPorExame: selectedExams.map(examId => {
        const metricas = healthMetrics.filter(m => m.examId === examId);
        return {
          examId,
          total: metricas.length,
          nomes: metricas.map(m => m.name),
          nomesNormalizados: metricas.map(m => normalizeExamName(m.name)),
          temMetricasSelecionadas: metricas.some(m => 
            selectedMetrics.includes(normalizeExamName(m.name)))
        };
      })
    });

    // Abordagem simplificada: criar ponto por ponto com informações de debug
    const results = [];
    
    // Para cada exame selecionado
    for (const examId of selectedExams) {
      const exam = exams.find(e => e.id === examId);
      if (!exam) continue;
      
      const pointData: any = {
        date: formatDateToBR(exam.examDate || exam.createdAt),
        examDate: new Date(exam.examDate || exam.createdAt).getTime(),
        examId: exam.id,
        examName: exam.name
      };
      
      // Filtrar métricas deste exame
      const examMetrics = healthMetrics.filter(m => m.examId === examId);
      console.log(`DEBUG EXAME ${examId}:`, examMetrics.map(m => ({
        nome: m.name, 
        normalizado: normalizeExamName(m.name)
      })));
      
      // Flag para verificar se temos pelo menos uma métrica selecionada neste exame
      let hasAnySelectedMetric = false;
      
      // Para cada métrica selecionada, verificar se existe no exame
      for (const metricName of selectedMetrics) {
        // Procurar métrica entre as disponíveis para este exame
        // Chave: precisamos fazer a normalização das métricas do exame para comparar
        const metric = examMetrics.find(m => normalizeExamName(m.name) === metricName);
        
        if (metric) {
          hasAnySelectedMetric = true;
          
          // Log específico para entender o que está acontecendo
          console.log(`ENCONTRADO: Métrica ${metricName} no exame ${examId}`, {
            nomeOriginal: metric.name,
            valor: metric.value
          });
          
          // Adicionar a métrica e seus dados ao ponto
          pointData[metricName] = parseFloat(metric.value.toString());
          
          if (metric.referenceMin !== null && metric.referenceMin !== undefined) {
            pointData[`${metricName}_min`] = parseFloat(metric.referenceMin.toString());
          }
          
          if (metric.referenceMax !== null && metric.referenceMax !== undefined) {
            pointData[`${metricName}_max`] = parseFloat(metric.referenceMax.toString());
          }
          
          pointData[`${metricName}_unit`] = metric.unit;
          pointData[`${metricName}_status`] = metric.status;
        } else {
          console.log(`NÃO ENCONTRADO: Métrica ${metricName} não está presente no exame ${examId}`);
        }
      }
      
      // Só adicionar o ponto se tiver pelo menos uma métrica selecionada
      if (hasAnySelectedMetric) {
        results.push(pointData);
      }
    }
    
    // Ordenar por data
    results.sort((a, b) => a.examDate - b.examDate);
    
    console.log("DADOS FINAIS DO GRÁFICO:", {
      pontos: results.length,
      dados: results
    });
    
    return results;
  }, [exams, healthMetrics, selectedExams, selectedMetrics]);
    
  console.log("Dados do gráfico:", { 
    selectedMetrics, 
    selectedExams, 
    chartDataLength: chartData?.length || 0,
    chartData
  });
  
  // Adicional debugging para entender o problema
  console.log("Health metrics:", { 
    healthMetrics: healthMetrics?.map(m => ({
      id: m.id,
      examId: m.examId,
      name: m.name,
      normalizedName: normalizeExamName(m.name),
      value: m.value
    }))
  });

  // Cores aleatórias mas consistentes para cada métrica
  const metricColors = React.useMemo(() => {
    return Object.keys(availableMetrics).reduce<Record<string, string>>((acc, metric) => {
      acc[metric] = getRandomColor(metric);
      return acc;
    }, {});
  }, [availableMetrics]);

  // Estado de carregamento
  const isLoading = isLoadingExams || isLoadingMetrics;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <MobileHeader />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <TrendingUp className="h-7 w-7 mr-3 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Tendências de Saúde</h1>
            </div>
            <p className="text-gray-600 mb-6 max-w-4xl">
              Compare a evolução de diferentes métricas de saúde ao longo do tempo para 
              visualizar tendências e padrões nos seus exames.
            </p>
          </motion.div>

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
                    <TabsList>
                      <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>
                        Todas
                      </TabsTrigger>
                      {metricCategories.map((category) => (
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
                              style={{ color: selectedMetrics.includes(metricName) ? metricColors[metricName] : undefined }}
                            >
                              {metricName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico interativo */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
                Evolução dos Resultados
              </CardTitle>
              <CardDescription>
                Compare a evolução das métricas selecionadas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : selectedMetrics.length === 0 || selectedExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <Info className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Selecione exames e métricas para visualizar</p>
                  <p className="text-sm max-w-md text-center">
                    Escolha pelo menos um exame e uma métrica para visualizar a evolução dos valores ao longo do tempo.
                  </p>
                </div>
              ) : !chartData || chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <AlertCircle className="h-12 w-12 mb-4 text-orange-300" />
                  <p className="text-lg font-medium mb-2">Sem dados para exibir</p>
                  <p className="text-sm max-w-md text-center">
                    Os exames e métricas selecionados não possuem dados compatíveis para visualização.
                  </p>
                </div>
              ) : (
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name, props) => {
                          // Formatar valor com unidade se disponível
                          const unit = props.payload[`${name}_unit`];
                          return [
                            `${value}${unit ? ` ${unit}` : ""}`,
                            name,
                          ];
                        }}
                        labelFormatter={(value) => `Data: ${value}`}
                      />
                      <Legend />
                      
                      {selectedMetrics.map((metricName) => {
                        // Verificando se existem valores de referência
                        const hasReferenceValues = chartData.some(
                          item => 
                            (item[`${metricName}_min`] !== undefined && 
                            item[`${metricName}_min`] !== null) || 
                            (item[`${metricName}_max`] !== undefined && 
                            item[`${metricName}_max`] !== null)
                        );
                        
                        // Encontrando valores mínimos e máximos de referência (pegando o primeiro que encontrar)
                        let refMin: number | undefined = undefined;
                        let refMax: number | undefined = undefined;
                        
                        if (hasReferenceValues) {
                          const itemWithRef = chartData.find(
                            item => 
                              (item[`${metricName}_min`] !== undefined && item[`${metricName}_min`] !== null) || 
                              (item[`${metricName}_max`] !== undefined && item[`${metricName}_max`] !== null)
                          );
                          
                          if (itemWithRef) {
                            const minVal = itemWithRef[`${metricName}_min`];
                            const maxVal = itemWithRef[`${metricName}_max`];
                            
                            if (minVal !== undefined && minVal !== null) {
                              refMin = Number(minVal);
                            }
                            
                            if (maxVal !== undefined && maxVal !== null) {
                              refMax = Number(maxVal);
                            }
                          }
                        }

                        return (
                          <React.Fragment key={metricName}>
                            <Line
                              type="monotone"
                              dataKey={metricName}
                              stroke={metricColors[metricName]}
                              strokeWidth={2}
                              dot={{ 
                                r: 6, 
                                stroke: metricColors[metricName],
                                fill: "white",
                                strokeWidth: 2
                              }}
                              activeDot={{ r: 8, stroke: metricColors[metricName], strokeWidth: 2 }}
                            />
                            
                            {refMin !== undefined && refMin !== null && (
                              <ReferenceLine 
                                y={refMin} 
                                stroke={metricColors[metricName]} 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.6}
                                label={{ 
                                  value: `Min: ${refMin}`, 
                                  position: 'insideBottomLeft',
                                  fill: metricColors[metricName],
                                  fontSize: 12
                                }} 
                              />
                            )}
                            
                            {refMax !== undefined && refMax !== null && (
                              <ReferenceLine 
                                y={refMax} 
                                stroke={metricColors[metricName]} 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.6}
                                label={{ 
                                  value: `Max: ${refMax}`, 
                                  position: 'insideTopLeft',
                                  fill: metricColors[metricName],
                                  fontSize: 12
                                }} 
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legenda e informações */}
          {selectedMetrics.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Informações sobre as métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedMetrics.map((metricName) => {
                    // Buscando informações do primeiro item com esta métrica
                    const metricInfo = availableMetrics[metricName]?.[0];
                    
                    return (
                      <div 
                        key={metricName} 
                        className="p-4 rounded-lg border border-gray-100 shadow-sm"
                        style={{ borderLeftColor: metricColors[metricName], borderLeftWidth: '4px' }}
                      >
                        <div className="font-medium mb-2" style={{ color: metricColors[metricName] }}>
                          {metricName}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {metricInfo?.category && (
                            <div>Categoria: <span className="font-medium">{metricInfo.category}</span></div>
                          )}
                          {metricInfo?.unit && (
                            <div>Unidade: <span className="font-medium">{metricInfo.unit}</span></div>
                          )}
                          {(metricInfo?.referenceMin !== undefined || metricInfo?.referenceMax !== undefined) && (
                            <div>
                              Referência: <span className="font-medium">
                                {metricInfo.referenceMin !== undefined ? metricInfo.referenceMin : '-'} 
                                {' a '} 
                                {metricInfo.referenceMax !== undefined ? metricInfo.referenceMax : '-'}
                                {metricInfo.unit ? ` ${metricInfo.unit}` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}