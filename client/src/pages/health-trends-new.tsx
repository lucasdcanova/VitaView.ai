import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, BarChart3, Heart, Droplets, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

export default function HealthTrendsNew() {
  const { data: healthMetrics = [], isLoading } = useQuery({
    queryKey: ["/api/health-metrics"],
  });

  // Preparar dados por categoria
  const categoryData = useMemo(() => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return { hemograma: [], glicemia: [], lipidico: [] };
    }

    // Definir métricas por categoria
    const hemogramaMetrics = ['hemoglobina', 'hematócrito', 'eritrócitos', 'leucócitos', 'plaquetas'];
    const glicemiaMetrics = ['glicose', 'glicemia'];
    const lipidicoMetrics = ['colesterol total', 'hdl', 'ldl', 'triglicerídeos'];

    // Agrupar por data e categoria
    const dataByDate = new Map();
    
    healthMetrics.forEach(metric => {
      const metricName = metric.name.toLowerCase();
      const date = new Date(metric.date).toLocaleDateString('pt-BR');
      const value = parseFloat(metric.value);
      
      if (isNaN(value)) return;
      
      if (!dataByDate.has(date)) {
        dataByDate.set(date, {
          date,
          timestamp: new Date(metric.date).getTime()
        });
      }
      
      const dataPoint = dataByDate.get(date);
      
      if (hemogramaMetrics.some(h => metricName.includes(h))) {
        dataPoint[metricName] = value;
        dataPoint[`${metricName}_unit`] = metric.unit;
        dataPoint[`${metricName}_status`] = metric.status;
      }
      
      if (glicemiaMetrics.some(g => metricName.includes(g))) {
        dataPoint.glicose = value;
        dataPoint.glicose_unit = metric.unit;
        dataPoint.glicose_status = metric.status;
      }
      
      if (lipidicoMetrics.some(l => metricName.includes(l))) {
        dataPoint[metricName] = value;
        dataPoint[`${metricName}_unit`] = metric.unit;
        dataPoint[`${metricName}_status`] = metric.status;
      }
    });

    const sortedData = Array.from(dataByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      hemograma: sortedData.filter(d => hemogramaMetrics.some(m => d[m] !== undefined)),
      glicemia: sortedData.filter(d => d.glicose !== undefined),
      lipidico: sortedData.filter(d => lipidicoMetrics.some(m => d[m] !== undefined))
    };
  }, [healthMetrics]);

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <MobileHeader />
        <div className="flex flex-col min-h-screen lg:pl-64">
          <main className="flex-1 p-4 lg:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tendências de Saúde
                </h1>
                <p className="text-lg text-gray-600">
                  Carregando suas métricas de saúde...
                </p>
              </div>
              <div className="grid gap-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

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
                Acompanhe a evolução das suas principais métricas de saúde organizadas por categoria
              </p>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hemograma</CardTitle>
                  <Droplets className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categoryData.hemograma.length}</div>
                  <p className="text-xs text-muted-foreground">exames registrados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Glicemia</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categoryData.glicemia.length}</div>
                  <p className="text-xs text-muted-foreground">exames registrados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Perfil Lipídico</CardTitle>
                  <Heart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categoryData.lipidico.length}</div>
                  <p className="text-xs text-muted-foreground">exames registrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Hemograma */}
            {categoryData.hemograma.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Droplets className="h-5 w-5 mr-2 text-red-600" />
                    Hemograma - Evolução Temporal
                  </CardTitle>
                  <CardDescription>
                    Acompanhe a evolução dos componentes sanguíneos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={categoryData.hemograma}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="hemoglobina" stroke="#dc2626" name="Hemoglobina" />
                        <Line type="monotone" dataKey="hematócrito" stroke="#7c2d12" name="Hematócrito" />
                        <Line type="monotone" dataKey="leucócitos" stroke="#059669" name="Leucócitos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico Glicemia */}
            {categoryData.glicemia.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                    Glicemia - Controle Glicêmico
                  </CardTitle>
                  <CardDescription>
                    Monitore seus níveis de glicose ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={categoryData.glicemia}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="glicose" stroke="#eab308" name="Glicose" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico Perfil Lipídico */}
            {categoryData.lipidico.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-blue-600" />
                    Perfil Lipídico - Saúde Cardiovascular
                  </CardTitle>
                  <CardDescription>
                    Acompanhe seus níveis de colesterol e triglicerídeos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={categoryData.lipidico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="colesterol total" stroke="#2563eb" name="Colesterol Total" />
                        <Line type="monotone" dataKey="hdl" stroke="#16a34a" name="HDL" />
                        <Line type="monotone" dataKey="ldl" stroke="#dc2626" name="LDL" />
                        <Line type="monotone" dataKey="triglicerídeos" stroke="#9333ea" name="Triglicerídeos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagem quando não há dados */}
            {categoryData.hemograma.length === 0 && categoryData.glicemia.length === 0 && categoryData.lipidico.length === 0 && (
              <Card>
                <CardContent className="text-center py-16">
                  <BarChart3 className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum dado encontrado
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Faça o upload dos seus exames para visualizar a evolução das métricas de saúde
                  </p>
                  <Button 
                    asChild
                    className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white"
                  >
                    <a href="/upload-exams">Enviar Primeiro Exame</a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Debug info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total de métricas</p>
                    <p className="text-2xl font-bold text-[#1E3A5F]">{healthMetrics.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Hemograma</p>
                    <p className="text-2xl font-bold text-red-600">{categoryData.hemograma.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Glicemia</p>
                    <p className="text-2xl font-bold text-yellow-600">{categoryData.glicemia.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Perfil Lipídico</p>
                    <p className="text-2xl font-bold text-blue-600">{categoryData.lipidico.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}