import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Droplets, Zap } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

interface HealthMetric {
  id: number;
  name: string;
  value: string;
  unit: string;
  status: string;
  date: string;
}

export default function HealthTrendsNew() {
  const { data: healthMetrics = [], isLoading } = useQuery<HealthMetric[]>({
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tendências de Saúde
              </h1>
              <p className="text-lg text-gray-600">
                Carregando...
              </p>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Categorizar métricas
  const hemogramaMetrics = healthMetrics.filter(m => 
    ['hemoglobina', 'hematócrito', 'eritrócitos', 'leucócitos', 'plaquetas'].some(h => 
      m.name.toLowerCase().includes(h)
    )
  );

  const glicemiaMetrics = healthMetrics.filter(m => 
    ['glicose', 'glicemia'].some(g => 
      m.name.toLowerCase().includes(g)
    )
  );

  const lipidicoMetrics = healthMetrics.filter(m => 
    ['colesterol', 'hdl', 'ldl', 'triglicerid'].some(l => 
      m.name.toLowerCase().includes(l)
    )
  );

  // Agrupar por data
  const dataByDate = new Map<string, HealthMetric[]>();
  healthMetrics.forEach(metric => {
    const date = new Date(metric.date).toLocaleDateString('pt-BR');
    if (!dataByDate.has(date)) {
      dataByDate.set(date, []);
    }
    dataByDate.get(date)!.push(metric);
  });

  const sortedDates = Array.from(dataByDate.keys()).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <>
      <Sidebar />
      <MobileHeader />
      <div className="lg:pl-64">
        <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                Tendências de Saúde
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Acompanhe a evolução das suas principais métricas organizadas por categoria
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
                  <div className="text-2xl font-bold">{hemogramaMetrics.length}</div>
                  <p className="text-xs text-muted-foreground">métricas registradas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Glicemia</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{glicemiaMetrics.length}</div>
                  <p className="text-xs text-muted-foreground">métricas registradas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Perfil Lipídico</CardTitle>
                  <Heart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lipidicoMetrics.length}</div>
                  <p className="text-xs text-muted-foreground">métricas registradas</p>
                </CardContent>
              </Card>
            </div>

            {/* Histórico por data */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Histórico Temporal
              </h2>
              
              {sortedDates.length > 0 ? (
                <div className="space-y-4">
                  {sortedDates.map(date => {
                    const metrics = dataByDate.get(date)!;
                    return (
                      <Card key={date}>
                        <CardHeader>
                          <CardTitle className="text-lg">{date}</CardTitle>
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
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <p className="text-gray-500">
                      Nenhuma métrica encontrada
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Estatísticas */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total</p>
                    <p className="text-2xl font-bold text-[#1E3A5F]">{healthMetrics.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Hemograma</p>
                    <p className="text-2xl font-bold text-red-600">{hemogramaMetrics.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Glicemia</p>
                    <p className="text-2xl font-bold text-yellow-600">{glicemiaMetrics.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Lipídico</p>
                    <p className="text-2xl font-bold text-blue-600">{lipidicoMetrics.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}