import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Droplets, Zap, BarChart3 } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

export default function HealthTrendsNew() {
  const { data: healthMetrics = [], isLoading } = useQuery({
    queryKey: ["/api/health-metrics"],
  });

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
            </div>
          </main>
        </div>
      </>
    );
  }

  // Contar métricas por categoria
  const hemogramaCount = healthMetrics.filter(m => 
    ['hemoglobina', 'hematócrito', 'eritrócitos', 'leucócitos', 'plaquetas'].some(h => 
      m.name.toLowerCase().includes(h)
    )
  ).length;

  const glicemiaCount = healthMetrics.filter(m => 
    ['glicose', 'glicemia'].some(g => 
      m.name.toLowerCase().includes(g)
    )
  ).length;

  const lipidicoCount = healthMetrics.filter(m => 
    ['colesterol', 'hdl', 'ldl', 'triglicerid'].some(l => 
      m.name.toLowerCase().includes(l)
    )
  ).length;

  // Agrupar por data para mostrar pontos de dados
  const dataPoints = new Map();
  healthMetrics.forEach(metric => {
    const date = new Date(metric.date).toLocaleDateString('pt-BR');
    if (!dataPoints.has(date)) {
      dataPoints.set(date, []);
    }
    dataPoints.get(date).push(metric);
  });

  const sortedDates = Array.from(dataPoints.keys()).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'));
    const dateB = new Date(b.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

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
                  <div className="text-2xl font-bold">{hemogramaCount}</div>
                  <p className="text-xs text-muted-foreground">métricas registradas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Glicemia</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{glicemiaCount}</div>
                  <p className="text-xs text-muted-foreground">métricas registradas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Perfil Lipídico</CardTitle>
                  <Heart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lipidicoCount}</div>
                  <p className="text-xs text-muted-foreground">métricas registradas</p>
                </CardContent>
              </Card>
            </div>

            {/* Dados por data */}
            {sortedDates.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Histórico Temporal
                </h2>
                <div className="grid gap-4">
                  {sortedDates.map(date => {
                    const metrics = dataPoints.get(date);
                    return (
                      <Card key={date}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {date}
                          </CardTitle>
                          <CardDescription>
                            {metrics.length} métricas registradas
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {metrics.map(metric => (
                              <div key={metric.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="font-medium text-sm text-gray-900">
                                  {metric.name}
                                </div>
                                <div className="text-lg font-bold text-[#1E3A5F]">
                                  {metric.value} {metric.unit}
                                </div>
                                <div className={`text-xs ${
                                  metric.status === 'normal' ? 'text-green-600' :
                                  metric.status === 'alto' ? 'text-red-600' :
                                  metric.status === 'baixo' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {metric.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
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

            {/* Estatísticas */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total de métricas</p>
                    <p className="text-2xl font-bold text-[#1E3A5F]">{healthMetrics.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Hemograma</p>
                    <p className="text-2xl font-bold text-red-600">{hemogramaCount}</p>
                  </div>
                  <div>
                    <p className="font-medium">Glicemia</p>
                    <p className="text-2xl font-bold text-yellow-600">{glicemiaCount}</p>
                  </div>
                  <div>
                    <p className="font-medium">Perfil Lipídico</p>
                    <p className="text-2xl font-bold text-blue-600">{lipidicoCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão para gráficos avançados */}
            <Card className="mt-6">
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Visualização em Gráfico
                </h3>
                <p className="text-gray-600 mb-4">
                  Para visualizar gráficos detalhados com evolução temporal, acesse:
                </p>
                <Button 
                  asChild
                  className="bg-[#48C9B0] hover:bg-[#1E3A5F] text-white"
                >
                  <a href="/exam-timeline">Ver Gráficos de Timeline</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}