import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Exam, HealthMetric } from "@shared/schema";
import { Link, useRoute, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import {
  AlertCircle,
  Filter,
  Search,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientHeader from "@/components/patient-header";

export default function ExamResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [localExams, setLocalExams] = useState<Exam[]>([]);
  const [localHealthMetrics, setLocalHealthMetrics] = useState<HealthMetric[]>([]);
  const [, setLocation] = useLocation();
  const { activeProfile, isLoading: isLoadingProfiles } = useProfiles();

  // Mutação para excluir todas as métricas de saúde
  const clearMetricsMutation = useMutation({
    mutationFn: async () => {
      if (!user || !user.id || !activeProfile) {
        throw new Error("Usuário não autenticado");
      }
      return await fetch(`/api/health-metrics/user/${user.id}?profileId=${activeProfile.id}`, {
        method: "DELETE",
        credentials: "include"
      }).then(res => {
        if (!res.ok) throw new Error("Falha ao excluir métricas");
        return res.json();
      });
    },
    onSuccess: (data) => {
      // Invalidar a consulta de métricas de saúde
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });

      toast({
        title: "Métricas excluídas",
        description: `${data.count} métricas de saúde foram removidas com sucesso.`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir métricas de saúde",
        variant: "destructive",
      });
    }
  });

  // Verificar se estamos na rota individual
  const [match] = useRoute("/results/:id");

  // Se estamos na rota individual, redirecionar para o componente específico
  useEffect(() => {
    if (match) {
      // Não fazemos nada aqui, a rota já está configurada em App.tsx para mostrar 
      // o componente ExamResultSingle quando estamos em /results/:id
    }
  }, [match]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch exams from API
  const { data: apiExams, isLoading: apiLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams", activeProfile?.id],
    queryFn: async () => {
      try {
        const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
        const res = await fetch(`/api/exams${queryParam}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch exams");
        return res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!activeProfile,
  });

  // Fetch health metrics from API
  const { data: apiHealthMetrics, isLoading: metricsLoading } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics", activeProfile?.id],
    queryFn: async () => {
      try {
        const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
        const res = await fetch(`/api/health-metrics${queryParam}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch health metrics");
        return res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!activeProfile,
  });

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
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="container mx-auto max-w-7xl">
              <PatientHeader
                title="Resultados clínicos"
                description="Selecione um paciente para revisar relatórios e métricas consolidadas."
                patient={activeProfile}
              />
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-600">
                <h2 className="text-lg font-semibold text-gray-800">Nenhum paciente selecionado</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Utilize o seletor acima para criar ou escolher um paciente.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load exams from localStorage
      const savedExamsString = localStorage.getItem('savedExams');
      if (savedExamsString) {
        const savedExams = JSON.parse(savedExamsString);
        setLocalExams(
          Array.isArray(savedExams) && activeProfile
            ? savedExams.filter((exam: Exam) => exam.profileId === activeProfile.id)
            : []
        );
      }

      // Load health metrics from localStorage
      const metricsString = localStorage.getItem('healthMetrics');
      if (metricsString) {
        const metrics = JSON.parse(metricsString);
        setLocalHealthMetrics(
          Array.isArray(metrics) && activeProfile
            ? metrics.filter((metric: HealthMetric) => metric.profileId === activeProfile.id)
            : []
        );
      }
    } catch (error) {
      // Error reading from localStorage
    }
  }, [activeProfile]);

  // Combine data from API and localStorage
  const allExams = useMemo(() => {
    const apiExamsArray = apiExams || [];
    return [...apiExamsArray, ...localExams];
  }, [apiExams, localExams]);

  const allHealthMetrics = useMemo(() => {
    const apiMetricsArray = apiHealthMetrics || [];
    return [...apiMetricsArray, ...localHealthMetrics];
  }, [apiHealthMetrics, localHealthMetrics]);

  // Get unique exam types
  const examTypes = useMemo(() => {
    const types = new Set<string>();

    // Add types from health metrics
    allHealthMetrics.forEach(metric => {
      types.add(metric.name);
    });

    return ["all", ...Array.from(types)].sort();
  }, [allHealthMetrics]);

  // Apply filters to health metrics
  const filteredMetrics = useMemo(() => {
    let filtered = [...allHealthMetrics];

    // Apply exam type filter
    if (selectedExamType !== "all") {
      filtered = filtered.filter(metric =>
        metric.name.toLowerCase() === selectedExamType.toLowerCase()
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(metric =>
        metric.name.toLowerCase().includes(searchLower) ||
        (metric.status && metric.status.toLowerCase().includes(searchLower)) ||
        metric.value.toString().includes(searchLower) ||
        (metric.unit && metric.unit.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [allHealthMetrics, selectedExamType, searchTerm]);

  // Group metrics by name
  const groupedMetrics = useMemo(() => {
    const groups = new Map<string, HealthMetric[]>();

    filteredMetrics.forEach(metric => {
      const existing = groups.get(metric.name) || [];
      groups.set(metric.name, [...existing, metric]);
    });

    // Sort each group by date (using date field or creation date)
    groups.forEach((metrics, name) => {
      metrics.sort((a, b) => {
        // Use date field or fallback to current date
        const dateA = a.date ? new Date(a.date).getTime() : Date.now();
        const dateB = b.date ? new Date(b.date).getTime() : Date.now();
        return dateB - dateA;
      });
    });

    return groups;
  }, [filteredMetrics]);

  const isLoading = apiLoading || metricsLoading;

  // Helper function to map status to colors
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';

    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'alto':
      case 'high':
      case 'elevado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'baixo':
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atenção':
      case 'attention':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get trend icon and color
  const getTrendData = (change: string | null | undefined) => {
    if (!change) return { icon: null, color: "" };

    const num = parseFloat(change);
    if (isNaN(num)) return { icon: null, color: "" };

    if (num > 0) {
      return {
        icon: <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z" /></svg>,
        color: "text-red-500"
      };
    } else if (num < 0) {
      return {
        icon: <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z" /></svg>,
        color: "text-green-500"
      };
    } else {
      return {
        icon: <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>,
        color: "text-gray-500"
      };
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto">
          <div className="container px-4 py-6 mx-auto max-w-7xl">
            <PatientHeader
              title="Resultados clínicos"
              description={`Visualize e filtre todos os resultados gerados para ${activeProfile.name}.`}
              patient={activeProfile}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div className="flex gap-3">
                <Link href="/upload">
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    Novo exame
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter size={18} />
                  Filtros
                </CardTitle>
                <CardDescription>
                  Refine os resultados por tipo de exame ou pesquise por termos específicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-1/3">
                    <label className="text-sm font-medium mb-1 block text-gray-700">
                      Tipo de Exame
                    </label>
                    <Select
                      value={selectedExamType}
                      onValueChange={(value) => setSelectedExamType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de exame" />
                      </SelectTrigger>
                      <SelectContent>
                        {examTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === "all" ? "Todos os Exames" : type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <label className="text-sm font-medium mb-1 block text-gray-700">
                      Pesquisar
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        type="search"
                        placeholder="Pesquisar por nome, status ou valor..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerta quando existem métricas sem exames */}
            {allHealthMetrics.length > 0 && (allExams.length === 0) && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Dados desconectados detectados</h3>
                    <p className="text-sm text-yellow-600 mt-1 mb-3">
                      Existem {allHealthMetrics.length} métricas de saúde em seu perfil, mas nenhum exame encontrado.
                      Isso pode acontecer quando exames foram excluídos mas as métricas permaneceram no sistema.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Limpar todas as métricas
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Excluir todas as métricas de saúde</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja excluir todas as {allHealthMetrics.length} métricas de saúde do seu perfil?
                            Esta ação não pode ser desfeita.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-start flex gap-3 mt-2">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={clearMetricsMutation.isPending}
                            onClick={() => clearMetricsMutation.mutate()}
                          >
                            {clearMetricsMutation.isPending ? "Excluindo..." : "Sim, excluir todas as métricas"}
                          </Button>
                          <Button type="button" variant="secondary" className="mt-0">
                            Cancelar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            )}

            {/* View Tabs */}
            <Tabs defaultValue="grid" className="mb-6" onValueChange={(value) => setViewMode(value as "list" | "grid")}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="grid">Grade</TabsTrigger>
                  <TabsTrigger value="list">Lista</TabsTrigger>
                </TabsList>
                <div className="text-sm text-gray-500">
                  {filteredMetrics.length} resultado(s) encontrado(s)
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader>
                        <Skeleton className="h-5 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-1/3" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMetrics.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Não foi possível encontrar resultados com os filtros selecionados. Tente modificar seus filtros ou fazer upload de novos exames.
                  </p>
                  <Link href="/upload">
                    <Button className="bg-primary-600 hover:bg-primary-700 mr-3">
                      Fazer upload de exame
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <TabsContent value="grid" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(groupedMetrics.entries()).map(([name, metrics]) => (
                        <Card key={name} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-xl">{name}</CardTitle>
                            <CardDescription>
                              {metrics.length} resultado(s) • Último: {new Date(metrics[0]?.date || Date.now()).toLocaleDateString('pt-BR')}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center mb-3">
                              <div className="text-3xl font-bold">
                                {metrics[0]?.value}{' '}
                                <span className="text-sm font-normal text-gray-500">{metrics[0]?.unit}</span>
                              </div>
                              <Badge className={cn("text-xs", getStatusColor(metrics[0]?.status))}>
                                {metrics[0]?.status}
                              </Badge>
                            </div>

                            {/* Reference Ruler */}
                            {metrics[0]?.referenceMin && metrics[0]?.referenceMax && (
                              <div className="mb-4">
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-medium">
                                  <span>{metrics[0].referenceMin}</span>
                                  <span>Referência</span>
                                  <span>{metrics[0].referenceMax}</span>
                                </div>
                                <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                  {/* Calculation for ruler */}
                                  {(() => {
                                    const min = parseFloat(metrics[0].referenceMin?.replace(',', '.') || '0');
                                    const max = parseFloat(metrics[0].referenceMax?.replace(',', '.') || '100');
                                    const val = parseFloat(metrics[0].value?.replace(',', '.'));

                                    if (isNaN(min) || isNaN(max) || isNaN(val)) return null;

                                    // Determine display range (add padding)
                                    const range = max - min;
                                    const padding = range > 0 ? range * 0.5 : max * 0.2;
                                    const displayMin = min - padding;
                                    const displayMax = max + padding;
                                    const displayRange = displayMax - displayMin;

                                    if (displayRange <= 0) return null;

                                    // Calculate positions in percentage
                                    let valPercent = ((val - displayMin) / displayRange) * 100;
                                    valPercent = Math.max(0, Math.min(100, valPercent));

                                    const refStart = Math.max(0, ((min - displayMin) / displayRange) * 100);
                                    const refWidth = Math.min(100 - refStart, ((max - min) / displayRange) * 100);

                                    return (
                                      <>
                                        {/* Reference Range (Green Zone) */}
                                        <div
                                          className="absolute top-0 bottom-0 bg-green-100 border-x border-green-200"
                                          style={{ left: `${refStart}%`, width: `${refWidth}%` }}
                                        />

                                        {/* Value Marker */}
                                        <div
                                          className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-sm border-2 border-white z-10",
                                            metrics[0].status === 'normal' ? "bg-green-500" :
                                              (metrics[0].status?.toLowerCase().includes('alto') || metrics[0].status?.toLowerCase().includes('high')) ? "bg-red-500" :
                                                (metrics[0].status?.toLowerCase().includes('baixo') || metrics[0].status?.toLowerCase().includes('low')) ? "bg-blue-500" : "bg-amber-500"
                                          )}
                                          style={{ left: `calc(${valPercent}% - 6px)` }}
                                          title={`Valor: ${metrics[0].value}`}
                                        />
                                      </>
                                    );
                                  })()}
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                  <span className="opacity-0">{metrics[0].referenceMin}</span>
                                  <span className="text-center w-full">
                                    {metrics[0].value} {metrics[0].unit}
                                  </span>
                                  <span className="opacity-0">{metrics[0].referenceMax}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center text-sm">
                              <span className={cn("flex items-center gap-1", getTrendData(metrics[0]?.change).color)}>
                                {getTrendData(metrics[0]?.change).icon}
                                {metrics[0]?.change}
                              </span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-gray-500">
                                {metrics.length > 1
                                  ? `Histórico de ${metrics.length} medições`
                                  : "Primeira medição"}
                              </span>
                            </div>
                          </CardContent>
                          {metrics.length > 1 && (
                            <CardFooter className="pt-0 px-6 pb-4">
                              <div className="w-full h-10 flex items-end space-x-1">
                                {metrics.slice(0, 7).map((metric, i) => {
                                  // Scale based on min/max in this set
                                  const values = metrics.map(m => parseFloat(m.value));
                                  const min = Math.min(...values);
                                  const max = Math.max(...values);
                                  const range = max - min;

                                  // Calculate height percentage (30% to 100%)
                                  const valueNum = parseFloat(metric.value);
                                  let heightPercent = 30; // default min height

                                  if (range > 0) {
                                    heightPercent = 30 + ((valueNum - min) / range) * 70;
                                  }

                                  return (
                                    <div
                                      key={i}
                                      className={cn(
                                        "w-full rounded-t",
                                        !metric.status ? "bg-gray-200" :
                                          metric.status === "normal" ? "bg-green-200" :
                                            (metric.status && metric.status.toLowerCase().includes("alt")) ||
                                              (metric.status && metric.status.toLowerCase().includes("high")) ? "bg-red-200" :
                                              (metric.status && metric.status.toLowerCase().includes("baix")) ||
                                                (metric.status && metric.status.toLowerCase().includes("low")) ? "bg-blue-200" :
                                                "bg-amber-200"
                                      )}
                                      style={{ height: `${heightPercent}%` }}
                                      title={`${metric.value} ${metric.unit || ''} - ${new Date(metric.date || Date.now()).toLocaleDateString()}`}
                                    />
                                  );
                                })}
                              </div>
                            </CardFooter>
                          )}
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="list" className="mt-0">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 py-3 px-4 text-sm font-medium text-gray-500">
                        <div className="col-span-4">Nome do exame</div>
                        <div className="col-span-2 text-center">Valor</div>
                        <div className="col-span-2 text-center">Unidade</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-center">Variação</div>
                      </div>

                      {Array.from(groupedMetrics.entries()).flatMap(([name, metrics]) =>
                        metrics.map((metric, index) => (
                          <div
                            key={`${name}-${index}`}
                            className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 items-center hover:bg-gray-50"
                          >
                            <div className="col-span-4 font-medium text-gray-800">
                              {metric.name}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-primary-50 text-primary-700 py-0.5 px-1.5 rounded-full">
                                  Recente
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 text-center">{metric.value}</div>
                            <div className="col-span-2 text-center text-gray-500">{metric.unit || ''}</div>
                            <div className="col-span-2 text-center">
                              <Badge className={cn("px-2 py-0.5", getStatusColor(metric.status || ''))}>
                                {metric.status || 'N/A'}
                              </Badge>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className={cn("flex items-center justify-center gap-1", getTrendData(metric.change).color)}>
                                {getTrendData(metric.change).icon}
                                {metric.change}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
