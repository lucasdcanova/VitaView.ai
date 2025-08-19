import React, { useState, memo, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import HealthScore from "@/components/health-score";
import HealthMetrics from "@/components/health-metrics";
import RecentExams from "@/components/recent-exams";
import HealthRecommendations from "@/components/health-recommendations";
import { Exam, HealthMetric, Profile } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  FileUp, 
  ArrowUpRight, 
  Clock, 
  Clipboard, 
  CalendarDays, 
  LineChart as LineChartIcon,
  Bell,
  FileText, 
  Heart, 
  Wallet, 
  TrendingUp,
  CircleUser,
  BarChart,
  FileBarChart,
  FileText as FileMedical,
  Microscope,
  AlertCircle,
  Check,
  Calendar,
  User,
  Image
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

// Memoized components for better performance
const MemoizedHealthScore = memo(HealthScore);
const MemoizedHealthMetrics = memo(HealthMetrics);
const MemoizedRecentExams = memo(RecentExams);
const MemoizedHealthRecommendations = memo(HealthRecommendations);

export default function Dashboard() {
  const [activeMetricsTab, setActiveMetricsTab] = useState("all");

  const { data: exams, isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/exams", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch exams");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });
  
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics/latest"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/health-metrics/latest", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch health metrics");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });
  
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/profiles", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch profiles");
        return res.json();
      } catch (error) {
        return [];
      }
    },
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
  
  // Memoized chart data processing
  const chartData = useMemo(() => {
    console.log('🔍 Processing metrics data:', metrics);
    if (!metrics || metrics.length === 0) {
      console.log('⚠️ No metrics data to process');
      return [];
    }
    
    // If we have metrics, let's create a simplified version that just shows general health score
    // Group metrics by month and calculate a simple health score
    const dataByMonth: Record<string, any> = {};
    
    metrics.forEach(metric => {
      console.log('📊 Processing metric:', metric.name, '=', metric.value, 'status:', metric.status);
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
        // Default to normal if status is unclear
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
    
    console.log('📈 Data by month:', dataByMonth);
    
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
    
    console.log('📈 Final chart data result:', finalResult);
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
  
  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }, []);
  
  const formatRelativeDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  }, []);
  
  const getFileIcon = useCallback((fileType: string, iconSize: number = 16) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="text-blue-600" size={iconSize} />;
      case 'jpeg':
      case 'png':
        return <Image className="text-teal-600" size={iconSize} />;
      default:
        return <FileText className="text-gray-600" size={iconSize} />;
    }
  }, []);
  
  const getExamTypeColor = useCallback((fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'jpeg':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'png':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
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
      switch(metric.status?.toLowerCase()) {
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
  
  // Memoized helper function to get metric by various name variations
  const getMetricByName = useCallback((names: string[]) => {
    for (const name of names) {
      const metric = processedMetrics[name.toLowerCase()];
      if (metric) return metric;
    }
    return null;
  }, [processedMetrics]);
  
  // Memoized derived state calculations
  const derivedState = useMemo(() => {
    const isNewUser = !metrics || metrics.length === 0 || !exams || exams.length === 0;
    const isWelcomeVisible = isNewUser && (!isLoadingMetrics && !isLoadingExams);
    
    return {
      isNewUser,
      isWelcomeVisible
    };
  }, [metrics, exams, isLoadingMetrics, isLoadingExams]);

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      
      <div className="flex flex-1 relative">
        <Sidebar />
        
        <main className="flex-1 bg-gray-50">
          <div className="p-4 md:p-6">
            {/* Welcome section for new users */}
            {derivedState.isWelcomeVisible && (
              <Card className="mb-8 border-t-4 border-t-primary">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Bem-vindo ao seu Assistente de Saúde</h2>
                      <p className="text-gray-600 mb-4">
                        Comece a usar seu assistente de análise bioquímica para obter insights detalhados sobre sua saúde através de seus exames.
                      </p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 bg-primary/10 p-1 rounded-full">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Análise Avançada de Exames</h4>
                            <p className="text-sm text-gray-500">Faça upload de seus exames médicos para obter insights profundos.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 bg-primary/10 p-1 rounded-full">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Diagnósticos e Recomendações</h4>
                            <p className="text-sm text-gray-500">Receba análises detalhadas e recomendações baseadas em seus resultados.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 bg-primary/10 p-1 rounded-full">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Acompanhamento da Saúde</h4>
                            <p className="text-sm text-gray-500">Visualize tendências e monitore sua saúde ao longo do tempo.</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Link href="/upload-exams">
                          <Button size="lg" className="mr-3">Enviar meu primeiro exame</Button>
                        </Link>
                        <Link href="/profile">
                          <Button variant="outline" size="lg">Completar perfil</Button>
                        </Link>
                      </div>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <div className="relative w-64 h-64">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="p-6 bg-white rounded-full shadow-lg">
                            <Activity className="h-20 w-20 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <header className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Acompanhe seus indicadores de saúde e últimas análises</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/upload-exams">
                    <Button className="gap-2">
                      <FileUp className="h-4 w-4" />
                      Enviar Novo Exame
                    </Button>
                  </Link>
                </div>
              </div>
            </header>
            
            {/* Health Score & Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Health Score Card */}
              <Card className="md:col-span-1 relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Heart className="mr-2 h-5 w-5 text-primary" />
                    Índice de Saúde
                  </CardTitle>
                  <CardDescription>Baseado nos seus últimos exames</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMetrics ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <Skeleton className="h-32 w-32 rounded-full mb-4" />
                      <Skeleton className="h-5 w-32 mb-2" />
                    </div>
                  ) : metrics && metrics.length > 0 && healthStats.averageScore !== null ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 rounded-full flex items-center justify-center border-8 border-gray-100">
                          <div 
                            className={`w-24 h-24 rounded-full flex items-center justify-center ${
                              healthStats.averageScore >= 80 ? 'bg-green-50 text-green-700' : 
                              healthStats.averageScore >= 60 ? 'bg-yellow-50 text-yellow-700' : 
                              'bg-red-50 text-red-700'
                            }`}
                          >
                            <span className="text-4xl font-bold">{healthStats.averageScore}</span>
                          </div>
                        </div>
                        {healthStats.trend && (
                          <div className={`absolute -top-1 -right-1 rounded-full p-1.5 ${
                            healthStats.trend === 'improving' ? 'bg-green-100 text-green-700' :
                            healthStats.trend === 'declining' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {healthStats.trend === 'improving' ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : healthStats.trend === 'declining' ? (
                              <TrendingUp className="h-5 w-5 transform rotate-180" />
                            ) : (
                              <Activity className="h-5 w-5" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-center mb-3">
                        <p className="font-medium text-gray-800">
                          {healthStats.averageScore >= 80 ? 'Excelente' : 
                           healthStats.averageScore >= 70 ? 'Muito Bom' :
                           healthStats.averageScore >= 60 ? 'Bom' :
                           healthStats.averageScore >= 50 ? 'Regular' : 'Requer Atenção'}
                        </p>
                        {healthStats.trend && (
                          <p className="text-sm text-gray-500">
                            {healthStats.trend === 'improving' ? 'Em melhora' : 
                             healthStats.trend === 'declining' ? 'Em declínio' : 'Estável'}
                          </p>
                        )}
                      </div>
                      
                      <div className="w-full bg-gray-100 h-1 mb-4 rounded-full">
                        <div className={`h-1 rounded-full ${
                          healthStats.averageScore >= 80 ? 'bg-green-500' : 
                          healthStats.averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${healthStats.averageScore}%` }}></div>
                      </div>
                      
                      <div className="grid grid-cols-3 w-full text-center text-xs gap-1">
                        <div className="bg-red-50 text-red-800 p-1 rounded-l-md">0-50</div>
                        <div className="bg-yellow-50 text-yellow-800 p-1">51-79</div>
                        <div className="bg-green-50 text-green-800 p-1 rounded-r-md">80-100</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-1">Sem dados suficientes</p>
                      <p className="text-xs text-gray-400 mb-3">Faça upload de exames para visualizar seu índice de saúde</p>
                      <Link href="/upload-exams">
                        <Button size="sm" variant="outline" className="flex items-center gap-1 text-xs">
                          <FileUp className="h-3 w-3" />
                          Enviar Exame
                        </Button>
                      </Link>
                      <Link href="/upload-exams">
                        <Button variant="outline" size="sm">Enviar primeiro exame</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Health Metrics Charts */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-primary" />
                      Tendências de Saúde
                    </CardTitle>
                    <Tabs value={activeMetricsTab} onValueChange={setActiveMetricsTab} className="w-auto">
                      <TabsList className="h-8">
                        <TabsTrigger value="all" className="text-xs h-7 px-2">Índice Geral</TabsTrigger>
                        <TabsTrigger value="cholesterol" className="text-xs h-7 px-2">Colesterol</TabsTrigger>
                        <TabsTrigger value="glucose" className="text-xs h-7 px-2">Glicemia</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <CardDescription>Evolução histórica dos seus indicadores</CardDescription>
                </CardHeader>
                <CardContent className="h-[220px]">
                  {isLoadingMetrics ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full rounded-md" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeMetricsTab === 'all' ? (
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            axisLine={false}
                            tickLine={false}
                            tickCount={5}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value}`, 'Índice de Saúde']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="healthScore" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            activeDot={{ r: 6 }} 
                            dot={{ r: 4, fill: '#3b82f6' }}
                          />
                        </LineChart>
                      ) : activeMetricsTab === 'cholesterol' ? (
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            domain={[0, 300]} 
                            axisLine={false}
                            tickLine={false}
                            tickCount={5}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} mg/dL`, 'Colesterol']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cholesterol" 
                            stroke="#f59e0b" 
                            strokeWidth={2} 
                            activeDot={{ r: 6 }} 
                            dot={{ r: 4, fill: '#f59e0b' }}
                          />
                        </LineChart>
                      ) : (
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            domain={[0, 200]} 
                            axisLine={false}
                            tickLine={false}
                            tickCount={5}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} mg/dL`, 'Glicemia']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="glucose" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            activeDot={{ r: 6 }} 
                            dot={{ r: 4, fill: '#10b981' }}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                      <LineChartIcon className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-1">Sem dados históricos suficientes</p>
                      <p className="text-xs text-gray-400">Envie mais exames para visualizar tendências</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Exams and Health Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <FileMedical className="mr-2 h-5 w-5 text-primary" />
                        Exames Recentes
                      </CardTitle>
                      <Link href="/history">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                          Ver todos
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                    <CardDescription>Seus últimos exames analisados</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {isLoadingExams ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-start p-3 rounded-lg border border-gray-100">
                            <Skeleton className="h-10 w-10 rounded-md mr-4" />
                            <div className="flex-1">
                              <Skeleton className="h-5 w-40 mb-2" />
                              <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentExams.length > 0 ? (
                      <div className="space-y-3">
                        {recentExams.map(exam => (
                          <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start flex-1 mb-3 sm:mb-0">
                              <div className={`p-2 rounded-md mr-3 ${getExamTypeColor(exam.fileType)}`}>
                                {getFileIcon(exam.fileType, 20)}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">{exam.name}</h4>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                  <div className="flex items-center text-gray-500">
                                    <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {exam.examDate ? formatDate(exam.examDate) : formatDate(exam.uploadDate.toString())}
                                  </div>
                                  
                                  {exam.requestingPhysician && (
                                    <div className="flex items-center text-gray-500">
                                      <User className="h-3.5 w-3.5 mr-1 opacity-70" />
                                      {exam.requestingPhysician}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center text-gray-500">
                                    <Microscope className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {exam.laboratoryName || "Lab não informado"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
                                <Activity className="w-3 h-3 mr-1" /> Analisado
                              </Badge>
                              <div className="flex gap-2">
                                <Link href={`/diagnosis/${exam.id}`}>
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                    <FileBarChart className="h-3.5 w-3.5" />
                                    Diagnóstico
                                  </Button>
                                </Link>
                                <Link href={`/report/${exam.id}`}>
                                  <Button size="sm" className="h-7 text-xs gap-1">
                                    <Activity className="h-3.5 w-3.5" />
                                    Detalhes
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <FileMedical className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum exame encontrado</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          Você ainda não tem exames analisados. Faça upload do seu primeiro exame para receber análises detalhadas.
                        </p>
                        <Link href="/upload-exams">
                          <Button className="gap-1">
                            <FileUp className="h-4 w-4" />
                            Enviar Exame
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Recommendations Card */}
                {metrics && metrics.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Clipboard className="mr-2 h-5 w-5 text-primary" />
                        Recomendações Personalizadas
                      </CardTitle>
                      <CardDescription>Baseadas nos seus resultados recentes</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start p-3 rounded-lg border border-blue-100 bg-blue-50/30">
                          <div className="p-2 bg-blue-100 rounded-md text-blue-700 mr-3">
                            <Activity className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Acompanhamento de Colesterol</h4>
                            <p className="text-gray-600 text-sm">Considere consultar um cardiologista para avaliar seus níveis de colesterol. Recomendamos uma dieta rica em fibras e baixa em gorduras saturadas.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start p-3 rounded-lg border border-amber-100 bg-amber-50/30">
                          <div className="p-2 bg-amber-100 rounded-md text-amber-700 mr-3">
                            <FileBarChart className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Monitoramento de Glicemia</h4>
                            <p className="text-gray-600 text-sm">Seus níveis de glicose estão ligeiramente elevados. Recomendamos reduzir o consumo de açúcares simples e aumentar a atividade física regular.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start p-3 rounded-lg border border-emerald-100 bg-emerald-50/30">
                          <div className="p-2 bg-emerald-100 rounded-md text-emerald-700 mr-3">
                            <Heart className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Saúde Preventiva</h4>
                            <p className="text-gray-600 text-sm">Mantenha o acompanhamento trimestral de seus exames para monitorar a eficácia das mudanças no estilo de vida e ajustar conforme necessário.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <Link href="/upload-exams">
                          <Button variant="outline" size="sm">Enviar novo exame para mais recomendações</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="lg:col-span-1">
                {/* Health Metrics Overview */}
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart className="mr-2 h-5 w-5 text-primary" />
                      Métricas de Saúde
                    </CardTitle>
                    <CardDescription>Visão geral dos seus indicadores</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
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
                        {console.log('📊 Processed metrics for display:', processedMetrics)}
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
                          
                          // Get max value for progress bar - use the actual max from reference range
                          const getMaxValueFromRange = (referenceRange: { min: string, ref: string, max: string, hasRange?: boolean }) => {
                            const maxStr = referenceRange.max;
                            if (maxStr === 'máx') return 100; // fallback
                            
                            // Extract numeric value from max string
                            const numericMatch = maxStr.match(/(\d+(?:\.\d+)?)/);
                            if (numericMatch) {
                              return parseFloat(numericMatch[1]);
                            }
                            return 100; // fallback
                          };
                          
                          // Get personalized reference ranges based on age and gender
                          const getPersonalizedReferenceRange = (name: string, age?: number, gender?: string) => {
                            const n = name.toLowerCase();
                            const isMale = gender?.toLowerCase() === 'masculino' || gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'm';
                            const isFemale = gender?.toLowerCase() === 'feminino' || gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'f';
                            
                            // Return format: { min: string, refMin: string, refMax: string, max: string, hasRange: boolean }
                            
                            // Colesterol e lipídios (mesmos para ambos os gêneros)
                            if (n.includes('colesterol total') || (n.includes('colesterol') && !n.includes('hdl') && !n.includes('ldl'))) {
                              return { min: '0', ref: '<200', max: '240', hasRange: false };
                            }
                            
                            // HDL - varia por gênero
                            if (n.includes('hdl')) {
                              if (isMale) {
                                return { min: '0', ref: '≥40', max: '100', hasRange: false };
                              } else if (isFemale) {
                                return { min: '0', ref: '≥50', max: '100', hasRange: false };
                              } else {
                                return { min: '0', ref: '≥40', max: '100', hasRange: false };
                              }
                            }
                            
                            if (n.includes('ldl')) {
                              return { min: '0', ref: '<100', max: '160', hasRange: false };
                            }
                            if (n.includes('triglicerídeos') || n.includes('triglicerideos')) {
                              return { min: '0', ref: '<150', max: '200', hasRange: false };
                            }
                            
                            // Glicemia (mesma para ambos)
                            if (n.includes('glicose') || n.includes('glicemia')) {
                              return { min: '0', ref: '≤99', max: '140', hasRange: false };
                            }
                            if (n.includes('hemoglobina glicada') || n.includes('hba1c')) {
                              return { min: '0', ref: '<5.7%', max: '10%', hasRange: false };
                            }
                            
                            // Vitamina D (varia por idade)
                            if (n.includes('vitamina d') || n.includes('25-hidroxivitamina d')) {
                              if (age && age >= 65) {
                                return { min: '0', ref: '40', max: '100', hasRange: true }; // Idosos precisam de mais
                              } else {
                                return { min: '0', ref: '30', max: '100', hasRange: true };
                              }
                            }
                            if (n.includes('vitamina b12')) {
                              return { min: '0', ref: '200', max: '900', hasRange: true };
                            }
                            
                            // Hormônios da tireoide (varia com idade)
                            if (n.includes('tsh')) {
                              if (age && age >= 65) {
                                return { min: '0', ref: '0.4', max: '6.0', hasRange: true }; // Idosos toleram TSH mais alto
                              } else {
                                return { min: '0', ref: '0.4', max: '4.0', hasRange: true };
                              }
                            }
                            if (n.includes('t4 livre') || n.includes('t4l')) {
                              return { min: '0', ref: '0.8', max: '1.8', hasRange: true };
                            }
                            if (n.includes('t4 total') || (n.includes('t4') && !n.includes('livre') && !n.includes('t4l'))) {
                              return { min: '0', ref: '4.5', max: '12.0', hasRange: true }; // μg/dL
                            }
                            if (n.includes('t3 livre') || n.includes('t3l')) {
                              return { min: '0', ref: '2.3', max: '4.2', hasRange: true }; // pg/mL
                            }
                            if (n.includes('t3 total') || (n.includes('t3') && !n.includes('livre') && !n.includes('t3l'))) {
                              return { min: '0', ref: '80', max: '200', hasRange: true }; // ng/dL
                            }
                            
                            // Creatinina (varia por gênero e idade)
                            if (n.includes('creatinina')) {
                              if (isMale) {
                                return { min: '0', ref: '≤1.3', max: '2.0', hasRange: false };
                              } else if (isFemale) {
                                return { min: '0', ref: '≤1.1', max: '2.0', hasRange: false };
                              } else {
                                return { min: '0', ref: '≤1.2', max: '2.0', hasRange: false };
                              }
                            }
                            if (n.includes('ureia') || n.includes('uréia')) {
                              return { min: '0', ref: '15', max: '45', hasRange: true };
                            }
                            
                            // Função hepática
                            if (n.includes('alt') || n.includes('tgp')) {
                              return { min: '0', ref: '≤40', max: '60', hasRange: false };
                            }
                            if (n.includes('ast') || n.includes('tgo')) {
                              return { min: '0', ref: '≤40', max: '60', hasRange: false };
                            }
                            
                            // Hemoglobina (varia por gênero)
                            if (n.includes('hemoglobina') && !n.includes('glicada')) {
                              if (isMale) {
                                return { min: '0', ref: '14', max: '18', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '12', max: '16', hasRange: true };
                              } else {
                                return { min: '0', ref: '12', max: '16', hasRange: true };
                              }
                            }
                            if (n.includes('hematócrito') || n.includes('hematocrito')) {
                              if (isMale) {
                                return { min: '0', ref: '41', max: '53', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '36', max: '46', hasRange: true };
                              } else {
                                return { min: '0', ref: '36', max: '48', hasRange: true };
                              }
                            }
                            if (n.includes('leucócitos') || n.includes('leucocitos')) {
                              return { min: '0', ref: '4k', max: '11k', hasRange: true };
                            }
                            if (n.includes('plaquetas')) {
                              return { min: '0', ref: '150k', max: '450k', hasRange: true };
                            }
                            if (n.includes('eritrócitos') || n.includes('eritrocitos') || n.includes('hemácias') || n.includes('hemacias')) {
                              if (isMale) {
                                return { min: '0', ref: '4.5', max: '5.9', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '4.1', max: '5.1', hasRange: true };
                              } else {
                                return { min: '0', ref: '4.1', max: '5.5', hasRange: true };
                              }
                            }
                            
                            // Ferro e ferritina (varia por gênero)
                            if (n.includes('ferro')) {
                              if (isMale) {
                                return { min: '0', ref: '65', max: '175', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '50', max: '170', hasRange: true };
                              } else {
                                return { min: '0', ref: '60', max: '170', hasRange: true };
                              }
                            }
                            if (n.includes('ferritina')) {
                              if (isMale) {
                                return { min: '0', ref: '20', max: '300', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '10', max: '150', hasRange: true };
                              } else {
                                return { min: '0', ref: '15', max: '200', hasRange: true };
                              }
                            }
                            if (n.includes('cálcio') || n.includes('calcio')) {
                              return { min: '0', ref: '8.5', max: '10.5', hasRange: true };
                            }
                            
                            // Proteínas e inflamação
                            if (n.includes('proteína c reativa') || n.includes('pcr')) {
                              return { min: '0', ref: '<3.0', max: '15', hasRange: false };
                            }
                            if (n.includes('albumina')) {
                              return { min: '0', ref: '3.5', max: '5.0', hasRange: true };
                            }
                            
                            // Ácido úrico (varia por gênero)
                            if (n.includes('ácido úrico') || n.includes('acido urico')) {
                              if (isMale) {
                                return { min: '0', ref: '3.5', max: '7.2', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '2.6', max: '6.0', hasRange: true };
                              } else {
                                return { min: '0', ref: '3.5', max: '7.0', hasRange: true };
                              }
                            }
                            
                            // Hormônios sexuais (varia por gênero)
                            // Testosterona - diferentes tipos têm valores diferentes
                            if (n.includes('testosterona livre')) {
                              return { min: '0', ref: '8.7', max: '25.1', hasRange: true }; // pg/mL
                            }
                            if (n.includes('testosterona total') || (n.includes('testosterona') && !n.includes('livre'))) {
                              return { min: '0', ref: '300', max: '1000', hasRange: true }; // ng/dL
                            }
                            
                            // Estradiol - diferentes tipos
                            if (n.includes('estradiol livre')) {
                              if (isFemale) {
                                return { min: '0', ref: '0.5', max: '5', hasRange: true }; // pg/mL
                              } else {
                                return { min: '0', ref: '0.3', max: '1.5', hasRange: true }; // pg/mL
                              }
                            }
                            if (n.includes('estradiol total') || (n.includes('estradiol') && !n.includes('livre'))) {
                              if (isFemale) {
                                return { min: '0', ref: '30', max: '400', hasRange: true }; // pg/mL
                              } else {
                                return { min: '0', ref: '10', max: '50', hasRange: true }; // pg/mL
                              }
                            }
                            
                            // FSH e LH - variam por gênero e ciclo menstrual
                            if (n.includes('fsh')) {
                              if (isFemale) {
                                return { min: '0', ref: '3.5', max: '12.5', hasRange: true }; // mUI/mL (fase folicular)
                              } else {
                                return { min: '0', ref: '1.5', max: '12.4', hasRange: true }; // mUI/mL
                              }
                            }
                            if (n.includes('lh')) {
                              if (isFemale) {
                                return { min: '0', ref: '2.4', max: '12.6', hasRange: true }; // mUI/mL (fase folicular)
                              } else {
                                return { min: '0', ref: '1.7', max: '8.6', hasRange: true }; // mUI/mL
                              }
                            }
                            
                            if (n.includes('progesterona')) {
                              return { min: '0', ref: '0.2', max: '25', hasRange: true };
                            }
                            
                            // Outros exames comuns - diferentes tipos
                            if (n.includes('insulina em jejum') || n.includes('insulina basal')) {
                              return { min: '0', ref: '2', max: '25', hasRange: true }; // μU/mL
                            }
                            if (n.includes('insulina pós-prandial') || n.includes('insulina 2h')) {
                              return { min: '0', ref: '30', max: '150', hasRange: true }; // μU/mL
                            }
                            if (n.includes('insulina') && !n.includes('jejum') && !n.includes('basal') && !n.includes('pós') && !n.includes('2h')) {
                              return { min: '0', ref: '2', max: '25', hasRange: true };
                            }
                            
                            // Cortisol - diferentes horários
                            if (n.includes('cortisol manhã') || n.includes('cortisol matinal') || n.includes('cortisol 8h')) {
                              return { min: '0', ref: '6', max: '23', hasRange: true }; // μg/dL
                            }
                            if (n.includes('cortisol noturno') || n.includes('cortisol 23h')) {
                              return { min: '0', ref: '≤7.5', max: '15', hasRange: false }; // μg/dL
                            }
                            if (n.includes('cortisol livre urinário')) {
                              return { min: '0', ref: '10', max: '50', hasRange: true }; // μg/24h
                            }
                            if (n.includes('cortisol') && !n.includes('manhã') && !n.includes('matinal') && !n.includes('noturno') && !n.includes('livre') && !n.includes('8h') && !n.includes('23h')) {
                              return { min: '0', ref: '6', max: '23', hasRange: true };
                            }
                            
                            if (n.includes('prolactina')) {
                              if (isMale) {
                                return { min: '0', ref: '4', max: '15', hasRange: true };
                              } else if (isFemale) {
                                return { min: '0', ref: '4', max: '23', hasRange: true };
                              } else {
                                return { min: '0', ref: '4', max: '20', hasRange: true };
                              }
                            }
                            
                            // Enzimas cardíacas - diferentes tipos
                            if (n.includes('troponina i')) {
                              return { min: '0', ref: '≤0.04', max: '0.1', hasRange: false }; // ng/mL
                            }
                            if (n.includes('troponina t')) {
                              return { min: '0', ref: '≤0.01', max: '0.1', hasRange: false }; // ng/mL
                            }
                            if (n.includes('ck total') || (n.includes('ck') && !n.includes('mb') && !n.includes('-'))) {
                              if (isMale) {
                                return { min: '0', ref: '38', max: '174', hasRange: true }; // U/L
                              } else {
                                return { min: '0', ref: '26', max: '140', hasRange: true }; // U/L
                              }
                            }
                            if (n.includes('ck-nac') || n.includes('ck nac')) {
                              return { min: '0', ref: '10', max: '190', hasRange: true }; // U/L
                            }
                            if (n.includes('ldh')) {
                              return { min: '0', ref: '125', max: '220', hasRange: true }; // U/L
                            }
                            
                            // Vitaminas adicionais - diferentes formas
                            if (n.includes('vitamina c')) {
                              return { min: '0', ref: '0.4', max: '2.0', hasRange: true };
                            }
                            if (n.includes('vitamina e')) {
                              return { min: '0', ref: '5', max: '20', hasRange: true };
                            }
                            if (n.includes('vitamina a')) {
                              return { min: '0', ref: '30', max: '65', hasRange: true };
                            }
                            
                            // Vitamina B - diferentes tipos
                            if (n.includes('vitamina b1') || n.includes('tiamina')) {
                              return { min: '0', ref: '70', max: '180', hasRange: true }; // nmol/L
                            }
                            if (n.includes('vitamina b6') || n.includes('piridoxina')) {
                              return { min: '0', ref: '20', max: '125', hasRange: true }; // nmol/L
                            }
                            if (n.includes('vitamina b9') || n.includes('ácido fólico') || n.includes('folato')) {
                              return { min: '0', ref: '7', max: '46', hasRange: true }; // nmol/L
                            }
                            
                            // Vitamina K - diferentes formas
                            if (n.includes('vitamina k1') || n.includes('filoquinona')) {
                              return { min: '0', ref: '0.15', max: '1.55', hasRange: true }; // ng/mL
                            }
                            if (n.includes('vitamina k2') || n.includes('menaquinona')) {
                              return { min: '0', ref: '0.1', max: '1.2', hasRange: true }; // ng/mL
                            }
                            
                            // Minerais adicionais
                            if (n.includes('magnésio') || n.includes('magnesio')) {
                              return { min: '0', ref: '1.7', max: '2.2', hasRange: true };
                            }
                            if (n.includes('potássio') || n.includes('potassio')) {
                              return { min: '0', ref: '3.5', max: '5.0', hasRange: true };
                            }
                            if (n.includes('sódio') || n.includes('sodio')) {
                              return { min: '0', ref: '136', max: '145', hasRange: true };
                            }
                            if (n.includes('zinco')) {
                              return { min: '0', ref: '70', max: '120', hasRange: true };
                            }
                            
                            // Proteínas e enzimas adicionais - diferentes tipos
                            if (n.includes('proteínas totais') || n.includes('proteinas totais')) {
                              return { min: '0', ref: '6.0', max: '8.3', hasRange: true };
                            }
                            if (n.includes('globulina alfa-1') || n.includes('alfa-1-globulina')) {
                              return { min: '0', ref: '0.1', max: '0.3', hasRange: true }; // g/dL
                            }
                            if (n.includes('globulina alfa-2') || n.includes('alfa-2-globulina')) {
                              return { min: '0', ref: '0.6', max: '1.0', hasRange: true }; // g/dL
                            }
                            if (n.includes('globulina beta') || n.includes('beta-globulina')) {
                              return { min: '0', ref: '0.7', max: '1.1', hasRange: true }; // g/dL
                            }
                            if (n.includes('globulina gama') || n.includes('gama-globulina') || n.includes('globulina gamma') || n.includes('gamma-globulina')) {
                              return { min: '0', ref: '0.7', max: '1.6', hasRange: true }; // g/dL
                            }
                            if (n.includes('globulina') && !n.includes('alfa') && !n.includes('beta') && !n.includes('gama') && !n.includes('gamma')) {
                              return { min: '0', ref: '2.3', max: '3.5', hasRange: true };
                            }
                            
                            // Bilirrubina - diferentes frações
                            if (n.includes('bilirrubina direta') || n.includes('bilirrubina conjugada')) {
                              return { min: '0', ref: '≤0.3', max: '0.8', hasRange: false }; // mg/dL
                            }
                            if (n.includes('bilirrubina indireta') || n.includes('bilirrubina não conjugada')) {
                              return { min: '0', ref: '≤0.8', max: '1.5', hasRange: false }; // mg/dL
                            }
                            if (n.includes('bilirrubina total')) {
                              return { min: '0', ref: '≤1.2', max: '2.0', hasRange: false };
                            }
                            
                            // Fosfatases - diferentes tipos
                            if (n.includes('fosfatase alcalina óssea')) {
                              return { min: '0', ref: '20', max: '50', hasRange: true }; // U/L
                            }
                            if (n.includes('fosfatase alcalina hepática')) {
                              return { min: '0', ref: '35', max: '104', hasRange: true }; // U/L
                            }
                            if (n.includes('fosfatase alcalina') && !n.includes('óssea') && !n.includes('hepática')) {
                              return { min: '0', ref: '44', max: '147', hasRange: true };
                            }
                            if (n.includes('fosfatase ácida')) {
                              return { min: '0', ref: '0', max: '3.5', hasRange: true }; // U/L
                            }
                            
                            // Lipídios adicionais - diferentes tipos
                            if (n.includes('lipoproteína(a)') || n.includes('lp(a)')) {
                              return { min: '0', ref: '≤30', max: '50', hasRange: false }; // mg/dL
                            }
                            if (n.includes('apolipoproteína a1') || n.includes('apo a1')) {
                              if (isMale) {
                                return { min: '0', ref: '120', max: '180', hasRange: true }; // mg/dL
                              } else {
                                return { min: '0', ref: '140', max: '200', hasRange: true }; // mg/dL
                              }
                            }
                            if (n.includes('apolipoproteína b') || n.includes('apo b')) {
                              return { min: '0', ref: '≤100', max: '140', hasRange: false }; // mg/dL
                            }
                            if (n.includes('colesterol não-hdl') || n.includes('colesterol nao-hdl')) {
                              return { min: '0', ref: '≤130', max: '190', hasRange: false }; // mg/dL
                            }
                            
                            // Imunoglobulinas - diferentes tipos
                            if (n.includes('imunoglobulina g') || n.includes('igg')) {
                              return { min: '0', ref: '700', max: '1600', hasRange: true }; // mg/dL
                            }
                            if (n.includes('imunoglobulina a') || n.includes('iga')) {
                              return { min: '0', ref: '70', max: '400', hasRange: true }; // mg/dL
                            }
                            if (n.includes('imunoglobulina m') || n.includes('igm')) {
                              return { min: '0', ref: '40', max: '230', hasRange: true }; // mg/dL
                            }
                            if (n.includes('imunoglobulina e') || n.includes('ige')) {
                              return { min: '0', ref: '≤100', max: '400', hasRange: false }; // UI/mL
                            }
                            
                            // Marcadores cardíacos
                            if (n.includes('troponina')) {
                              return { min: '0', ref: '≤0.04', max: '0.1', hasRange: false };
                            }
                            if (n.includes('ck-mb') || n.includes('ckmb')) {
                              return { min: '0', ref: '≤25', max: '50', hasRange: false };
                            }
                            
                            // Marcadores tumorais - diferentes tipos
                            if (n.includes('psa livre')) {
                              return { min: '0', ref: '≥0.15', max: '1', hasRange: false }; // relação PSA livre/total
                            }
                            if (n.includes('psa total') || (n.includes('psa') && !n.includes('livre'))) {
                              if (age && age >= 50) {
                                return { min: '0', ref: '≤4.0', max: '10', hasRange: false };
                              } else {
                                return { min: '0', ref: '≤2.5', max: '10', hasRange: false };
                              }
                            }
                            if (n.includes('cea')) {
                              return { min: '0', ref: '≤5.0', max: '15', hasRange: false };
                            }
                            if (n.includes('ca 19-9')) {
                              return { min: '0', ref: '≤37', max: '100', hasRange: false }; // U/mL
                            }
                            if (n.includes('ca 125')) {
                              return { min: '0', ref: '≤35', max: '100', hasRange: false }; // U/mL
                            }
                            if (n.includes('ca 15-3')) {
                              return { min: '0', ref: '≤31.3', max: '100', hasRange: false }; // U/mL
                            }
                            if (n.includes('alfa-fetoproteína') || n.includes('afp')) {
                              return { min: '0', ref: '≤10', max: '20', hasRange: false }; // ng/mL
                            }
                            if (n.includes('beta-hcg') || n.includes('hcg')) {
                              if (isFemale) {
                                return { min: '0', ref: '≤5', max: '25', hasRange: false }; // mUI/mL (não grávida)
                              } else {
                                return { min: '0', ref: '≤2', max: '5', hasRange: false }; // mUI/mL
                              }
                            }
                            
                            // Coagulação
                            if (n.includes('tempo de protrombina') || n.includes('tp') || n.includes('inr')) {
                              return { min: '0', ref: '0.8', max: '1.2', hasRange: true };
                            }
                            if (n.includes('ttpa') || n.includes('ptt')) {
                              return { min: '0', ref: '25', max: '35', hasRange: true };
                            }
                            
                            // Sedimentação
                            if (n.includes('vhs') || n.includes('velocidade de hemossedimentação')) {
                              if (isMale) {
                                return { min: '0', ref: '≤15', max: '30', hasRange: false };
                              } else if (isFemale) {
                                return { min: '0', ref: '≤20', max: '35', hasRange: false };
                              } else {
                                return { min: '0', ref: '≤20', max: '35', hasRange: false };
                              }
                            }
                            
                            // Default mais específico baseado no nome da métrica
                            const cleanName = n.replace(/[^a-záêçõ\s]/g, '').trim();
                            if (cleanName.length > 0) {
                              return { min: '0', ref: 'ref', max: 'máx', hasRange: false };
                            }
                            
                            return { min: '0', ref: 'normal', max: 'máx', hasRange: false };
                          };
                          
                          // Get user profile info for personalized references
                          const activeProfile = profiles?.find(p => p.isDefault) || profiles?.[0];
                          const userAge = activeProfile?.birthDate ? 
                            new Date().getFullYear() - new Date(activeProfile.birthDate).getFullYear() : undefined;
                          const userGender = activeProfile?.gender;
                          
                          const referenceRange = getPersonalizedReferenceRange(metric.name, userAge, userGender);
                          
                          // Calculate progress bar position to match visual layout
                          const calculateProgressPercentage = (value: number, referenceRange: any) => {
                            const minVal = parseFloat(referenceRange.min) || 0;
                            const maxVal = parseFloat(referenceRange.max) || 100;
                            const refVal = parseFloat(referenceRange.ref) || 50;
                            
                            if (referenceRange.hasRange) {
                              // For range-based values: min=0%, ref=50%, max=100%
                              if (value <= refVal) {
                                // Value is between min and ref: scale to 0-50%
                                const percentage = ((value - minVal) / (refVal - minVal)) * 50;
                                return Math.min(50, Math.max(0, percentage));
                              } else {
                                // Value is between ref and max: scale to 50-100%
                                const percentage = 50 + ((value - refVal) / (maxVal - refVal)) * 50;
                                return Math.min(100, Math.max(50, percentage));
                              }
                            } else {
                              // For limit-based values: reference point at 50%
                              const percentage = (value / refVal) * 50;
                              return Math.min(100, Math.max(0, percentage));
                            }
                          };
                          
                          const progressPercentage = calculateProgressPercentage(value, referenceRange);
                          
                          return (
                            <div key={metric.id} className={`mb-4 ${index === 3 ? '' : 'mb-4'}`}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{metric.name}</span>
                                <span className={`text-xs font-medium ${getStatusColor(healthStatus)}`}>
                                  {metric.value} {metric.unit || ''}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${getStatusBgColor(healthStatus)}`} 
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{referenceRange.min}</span>
                                {referenceRange.hasRange ? (
                                  <>
                                    <span className="font-medium text-gray-700">{referenceRange.ref}</span>
                                    <span className="font-medium text-gray-700">{referenceRange.max}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-gray-700">{referenceRange.ref}</span>
                                    <span>{referenceRange.max}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="mt-6 text-center">
                          {(() => {
                            console.log('🔍 DEBUG Relatório:', {
                              recentMetrics: healthStats.recentMetrics,
                              recentMetricsLength: healthStats.recentMetrics?.length,
                              firstMetricExamId: healthStats.recentMetrics?.[0]?.examId,
                              latestExams: recentExams,
                              latestExamsLength: recentExams?.length,
                              firstExamId: recentExams?.[0]?.id
                            });
                            
                            if (healthStats.recentMetrics && healthStats.recentMetrics.length > 0 && healthStats.recentMetrics[0].examId) {
                              const examId = healthStats.recentMetrics[0].examId;
                              console.log(`📊 Usando examId da métrica: ${examId}`);
                              return (
                                <Link href={`/report/${examId}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Activity className="h-4 w-4" />
                                    Ver relatório completo
                                  </Button>
                                </Link>
                              );
                            } else if (recentExams && recentExams.length > 0) {
                              const examId = recentExams[0].id;
                              console.log(`📋 Usando examId do exame: ${examId}`);
                              return (
                                <Link href={`/report/${examId}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Activity className="h-4 w-4" />
                                    Ver relatório completo
                                  </Button>
                                </Link>
                              );
                            } else {
                              console.log('❌ Nenhum dado disponível para relatório');
                              return (
                                <Button variant="outline" size="sm" className="gap-1" disabled>
                                  <Activity className="h-4 w-4" />
                                  Ver relatório completo
                                </Button>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-gray-700 font-medium mb-1">Sem métricas disponíveis</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Envie exames para visualizar seus indicadores de saúde
                        </p>
                        <Link href="/upload-exams">
                          <Button variant="outline" size="sm">Enviar Exame</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Quick Actions Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Bell className="mr-2 h-5 w-5 text-primary" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Link href="/upload">
                        <Button className="w-full flex flex-col h-auto py-3 text-xs gap-1 justify-center items-center" variant="outline">
                          <FileUp className="h-5 w-5 mb-1" />
                          Enviar Exame
                        </Button>
                      </Link>
                      <Link href="/history">
                        <Button className="w-full flex flex-col h-auto py-3 text-xs gap-1 justify-center items-center" variant="outline">
                          <Clipboard className="h-5 w-5 mb-1" />
                          Histórico
                        </Button>
                      </Link>
                      <Link href="/report/latest">
                        <Button className="w-full flex flex-col h-auto py-3 text-xs gap-1 justify-center items-center" variant="outline">
                          <BarChart className="h-5 w-5 mb-1" />
                          Últimos Resultados
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button className="w-full flex flex-col h-auto py-3 text-xs gap-1 justify-center items-center" variant="outline">
                          <CircleUser className="h-5 w-5 mb-1" />
                          Perfil
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Lembre-se: Atualize regularmente seus exames para manter análises mais precisas.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
