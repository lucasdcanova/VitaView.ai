import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import HealthScore from "@/components/health-score";
import HealthMetrics from "@/components/health-metrics";
import RecentExams from "@/components/recent-exams";
import HealthRecommendations from "@/components/health-recommendations";
import { Exam, HealthMetric } from "@shared/schema";
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
        console.error("Error fetching exams from API:", error);
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
        console.error("Error fetching health metrics from API:", error);
        return [];
      }
    },
  });
  
  // Function to process exam data for recency
  const getRecentExams = (examList: Exam[] = [], count: number = 3) => {
    if (!examList || examList.length === 0) return [];
    
    return [...examList]
      .filter(exam => exam.status === 'analyzed')
      .sort((a, b) => {
        const dateA = a.examDate ? new Date(a.examDate) : new Date(a.uploadDate);
        const dateB = b.examDate ? new Date(b.examDate) : new Date(b.uploadDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, count);
  };
  
  // Process the last 6 months of metrics data for charts
  const processChartData = (metricList: HealthMetric[] = []) => {
    if (!metricList || metricList.length === 0) return [];
    
    // Group by date (month) and calculate averages
    const dataByMonth: Record<string, any> = {};
    
    metricList.forEach(metric => {
      const date = new Date(metric.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = {
          month: new Date(date.getFullYear(), date.getMonth(), 1),
          healthScore: 0,
          cholesterol: 0,
          bloodPressure: 0,
          glucose: 0,
          count: 0
        };
      }
      
      dataByMonth[monthKey].healthScore += metric.healthScore || 0;
      dataByMonth[monthKey].cholesterol += metric.cholesterol || 0;
      dataByMonth[monthKey].bloodPressure += metric.bloodPressureSystolic ? 
        metric.bloodPressureSystolic / metric.bloodPressureDiastolic : 0;
      dataByMonth[monthKey].glucose += metric.glucose || 0;
      dataByMonth[monthKey].count += 1;
    });
    
    // Calculate averages and format for chart
    return Object.values(dataByMonth)
      .map(item => ({
        month: new Date(item.month).toLocaleDateString('pt-BR', { month: 'short' }),
        healthScore: Math.round(item.healthScore / item.count),
        cholesterol: Math.round(item.cholesterol / item.count),
        bloodPressure: parseFloat((item.bloodPressure / item.count).toFixed(1)),
        glucose: Math.round(item.glucose / item.count)
      }))
      .sort((a, b) => {
        const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
  };
  
  const getHealthMetricStatus = (value: number, metricType: string): 'normal' | 'warning' | 'alert' => {
    if (!value) return 'normal';
    
    switch (metricType) {
      case 'cholesterol':
        if (value <= 200) return 'normal';
        if (value <= 240) return 'warning';
        return 'alert';
      
      case 'glucose':
        if (value <= 99) return 'normal';
        if (value <= 125) return 'warning';
        return 'alert';
      
      case 'bloodPressure':
        if (value <= 120) return 'normal';
        if (value <= 140) return 'warning';
        return 'alert';
      
      default:
        return 'normal';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };
  
  const getFileIcon = (fileType: string, iconSize: number = 16) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="text-blue-600" size={iconSize} />;
      case 'jpeg':
      case 'png':
        return <Image className="text-teal-600" size={iconSize} />;
      default:
        return <FileText className="text-gray-600" size={iconSize} />;
    }
  };
  
  const getExamTypeColor = (fileType: string) => {
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
  };
  
  // Calculate health stats
  const calcHealthStats = () => {
    if (!metrics || metrics.length === 0) {
      return { averageScore: 0, trend: 'stable', recentMetrics: [] };
    }
    
    // Sort by date, most recent first
    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Calculate average from most recent metrics
    const recentMetrics = sortedMetrics.slice(0, 3);
    const averageScore = Math.round(
      recentMetrics.reduce((sum, metric) => sum + (metric.healthScore || 0), 0) / recentMetrics.length
    );
    
    // Determine trend (if we have enough data)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (sortedMetrics.length >= 2) {
      const latestAvg = sortedMetrics.slice(0, 2).reduce((sum, m) => sum + (m.healthScore || 0), 0) / 2;
      const previousAvg = sortedMetrics.slice(2, 4).reduce((sum, m) => sum + (m.healthScore || 0), 0) / 2;
      
      if (latestAvg > previousAvg + 3) trend = 'improving';
      else if (latestAvg < previousAvg - 3) trend = 'declining';
    }
    
    return { averageScore, trend, recentMetrics };
  };
  
  const { averageScore, trend, recentMetrics } = calcHealthStats();
  const latestExams = getRecentExams(exams, 3);
  const chartData = processChartData(metrics);
  
  // Health stats for metrics display
  const healthStats = {
    labels: ["Colesterol", "Glicemia", "Pressão Arterial", "Hormônios Tireoidianos"],
    abnormalCount: 2
  };
  
  // Determine if we're in a good state to show welcome based on data status
  const isNewUser = !metrics || metrics.length === 0 || !exams || exams.length === 0;
  const isWelcomeVisible = isNewUser && (!isLoadingMetrics && !isLoadingExams);

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      
      <div className="flex flex-1 relative">
        <Sidebar />
        
        <main className="flex-1 bg-gray-50">
          <div className="p-4 md:p-6">
            {/* Welcome section for new users */}
            {isWelcomeVisible && (
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
                  ) : metrics && metrics.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 rounded-full flex items-center justify-center border-8 border-gray-100">
                          <div 
                            className={`w-24 h-24 rounded-full flex items-center justify-center ${
                              averageScore >= 80 ? 'bg-green-50 text-green-700' : 
                              averageScore >= 60 ? 'bg-yellow-50 text-yellow-700' : 
                              'bg-red-50 text-red-700'
                            }`}
                          >
                            <span className="text-4xl font-bold">{averageScore}</span>
                          </div>
                        </div>
                        <div className={`absolute -top-1 -right-1 rounded-full p-1.5 ${
                          trend === 'improving' ? 'bg-green-100 text-green-700' :
                          trend === 'declining' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {trend === 'improving' ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : trend === 'declining' ? (
                            <TrendingUp className="h-5 w-5 transform rotate-180" />
                          ) : (
                            <Activity className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <p className="font-medium text-gray-800">
                          {averageScore >= 80 ? 'Excelente' : 
                           averageScore >= 70 ? 'Muito Bom' :
                           averageScore >= 60 ? 'Bom' :
                           averageScore >= 50 ? 'Regular' : 'Requer Atenção'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {trend === 'improving' ? 'Em melhora' : 
                           trend === 'declining' ? 'Em declínio' : 'Estável'}
                        </p>
                      </div>
                      
                      <div className="w-full bg-gray-100 h-1 mb-4 rounded-full">
                        <div className={`h-1 rounded-full ${
                          averageScore >= 80 ? 'bg-green-500' : 
                          averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${averageScore}%` }}></div>
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
                      <p className="text-gray-500 mb-4">Sem dados de saúde disponíveis</p>
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
                    ) : latestExams.length > 0 ? (
                      <div className="space-y-3">
                        {latestExams.map(exam => (
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
                    ) : recentMetrics && recentMetrics.length > 0 ? (
                      <div>
                        {/* Colesterol */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Colesterol</span>
                            <span className={`text-xs font-medium ${
                              getHealthMetricStatus(recentMetrics[0]?.cholesterol || 0, 'cholesterol') === 'normal' 
                                ? 'text-green-600' 
                                : getHealthMetricStatus(recentMetrics[0]?.cholesterol || 0, 'cholesterol') === 'warning'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}>
                              {recentMetrics[0]?.cholesterol || '-'} mg/dL
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                getHealthMetricStatus(recentMetrics[0]?.cholesterol || 0, 'cholesterol') === 'normal' 
                                  ? 'bg-green-500' 
                                  : getHealthMetricStatus(recentMetrics[0]?.cholesterol || 0, 'cholesterol') === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`} 
                              style={{ 
                                width: `${Math.min(100, ((recentMetrics[0]?.cholesterol || 0) / 300) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0</span>
                            <span>150</span>
                            <span>300+</span>
                          </div>
                        </div>
                        
                        {/* Glicemia */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Glicemia</span>
                            <span className={`text-xs font-medium ${
                              getHealthMetricStatus(recentMetrics[0]?.glucose || 0, 'glucose') === 'normal' 
                                ? 'text-green-600' 
                                : getHealthMetricStatus(recentMetrics[0]?.glucose || 0, 'glucose') === 'warning'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}>
                              {recentMetrics[0]?.glucose || '-'} mg/dL
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                getHealthMetricStatus(recentMetrics[0]?.glucose || 0, 'glucose') === 'normal' 
                                  ? 'bg-green-500' 
                                  : getHealthMetricStatus(recentMetrics[0]?.glucose || 0, 'glucose') === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`} 
                              style={{ 
                                width: `${Math.min(100, ((recentMetrics[0]?.glucose || 0) / 200) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0</span>
                            <span>100</span>
                            <span>200+</span>
                          </div>
                        </div>
                        
                        {/* Pressão Arterial */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Pressão Arterial</span>
                            <span className={`text-xs font-medium ${
                              getHealthMetricStatus(recentMetrics[0]?.bloodPressureSystolic || 0, 'bloodPressure') === 'normal' 
                                ? 'text-green-600' 
                                : getHealthMetricStatus(recentMetrics[0]?.bloodPressureSystolic || 0, 'bloodPressure') === 'warning'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}>
                              {recentMetrics[0]?.bloodPressureSystolic || '-'}/{recentMetrics[0]?.bloodPressureDiastolic || '-'} mmHg
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                getHealthMetricStatus(recentMetrics[0]?.bloodPressureSystolic || 0, 'bloodPressure') === 'normal' 
                                  ? 'bg-green-500' 
                                  : getHealthMetricStatus(recentMetrics[0]?.bloodPressureSystolic || 0, 'bloodPressure') === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`} 
                              style={{ 
                                width: `${Math.min(100, ((recentMetrics[0]?.bloodPressureSystolic || 0) / 180) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0</span>
                            <span>120</span>
                            <span>180+</span>
                          </div>
                        </div>
                        
                        {/* TSH (Tireoide) */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">TSH (Tireoide)</span>
                            <span className="text-xs font-medium text-green-600">
                              {recentMetrics[0]?.tsh || '-'} μIU/mL
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full bg-green-500" 
                              style={{ 
                                width: `${Math.min(100, ((recentMetrics[0]?.tsh || 0) / 10) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0</span>
                            <span>5</span>
                            <span>10+</span>
                          </div>
                        </div>
                        
                        <div className="mt-6 text-center">
                          <Link href="/report/latest">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Activity className="h-4 w-4" />
                              Ver relatório completo
                            </Button>
                          </Link>
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
                      <Link href="/upload-exams">
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
