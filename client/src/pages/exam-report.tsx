import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Exam, ExamResult } from "@shared/schema";
import { getExamDetails, getExamInsights, deleteExam } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Image,
  Share2,
  Download,
  Printer,
  Calendar,
  Building,
  UserRound,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  Minus,
  Info,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  ChevronRight,
  Heart,
  Activity,
  Apple,
  Dumbbell,
  Moon,
  User,
  Microscope,
  FileText as FileMedical,
  Clipboard,
  LineChart,
  Clock,
  Trash2
} from "lucide-react";

// Função para mostrar ícone de variação baseado no valor
function getChangeIconForMetric(change: string | null): JSX.Element {
  if (!change) return <Minus className="h-3 w-3" />;
  
  if (change.startsWith('+')) {
    return <ArrowUp className="h-3 w-3" />;
  } else if (change.startsWith('-')) {
    return <ArrowDown className="h-3 w-3" />;
  } else {
    return <Minus className="h-3 w-3" />;
  }
}
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type HealthInsights = {
  recommendations: string[];
  specialists: string[];
  lifestyle: {
    diet: string;
    exercise: string;
    sleep: string;
    stress_management?: string;
  };
  riskFactors: string[];
  contextualAnalysis: string;
  healthParameters?: {
    healthScore: number;
    criticalAreas: string[];
    stableAreas: string[];
    improvementTrends: string[];
    worseningTrends: string[];
  };
  evidenceBasedAssessment?: {
    clinicalGuidelines: string[];
    studyReferences: string[];
    confidenceLevel: string;
  };
};

export default function ExamReport() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [match, params] = useRoute<{ id: string }>("/report/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const examId = match && params ? parseInt(params.id) : 0;
  
  // Verificar se existe um parâmetro 'tab' na URL para definir a aba ativa inicialmente
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['summary', 'detailed', 'recommendations', 'evidence'].includes(tabParam)) {
        return tabParam;
      }
    }
    return "summary"; // Tab padrão se não houver parâmetro válido
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  const { data, isLoading } = useQuery<{ exam: Exam, result: ExamResult }>({
    queryKey: [`/api/exams/${examId}`],
    queryFn: () => getExamDetails(examId),
    enabled: !!examId,
  });
  
  const { data: insights, isLoading: isLoadingInsights } = useQuery<HealthInsights>({
    queryKey: [`/api/exams/${examId}/insights`],
    queryFn: () => getExamInsights(examId),
    enabled: !!examId && !!data?.result,
  });
  
  // Mutação para excluir o exame
  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(examId),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas aos exames e métricas de saúde
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/chronological"] });
      
      toast({
        title: "Exame excluído com sucesso",
        description: "O exame e todos os dados associados foram removidos.",
        variant: "default",
      });
      
      // Redirecionando para a página de resultados
      setLocation("/results");
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir exame",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o exame.",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Format relative date
  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };
  
  // Get icon for a given lifestyle category
  const getLifestyleIcon = (category: string) => {
    switch (category) {
      case 'diet':
        return <Apple className="h-5 w-5 text-emerald-600" />;
      case 'exercise':
        return <Dumbbell className="h-5 w-5 text-blue-600" />;
      case 'sleep':
        return <Moon className="h-5 w-5 text-indigo-600" />;
      case 'stress_management':
        return <Heart className="h-5 w-5 text-rose-600" />;
      default:
        return <Activity className="h-5 w-5 text-primary-600" />;
    }
  };
  
  // Get background color for lifestyle card
  const getLifestyleCardStyle = (category: string) => {
    switch (category) {
      case 'diet':
        return 'bg-emerald-50 border-emerald-200';
      case 'exercise':
        return 'bg-blue-50 border-blue-200';
      case 'sleep':
        return 'bg-indigo-50 border-indigo-200';
      case 'stress_management':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Get color for confidence level
  const getConfidenceLevelColor = (level?: string) => {
    switch (level) {
      case 'alto':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'médio':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'baixo':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  // Filtrar recomendações para garantir conformidade com diretrizes do Ministério da Saúde
  const filterRecommendations = (recommendations: string[]) => {
    const prohibitedTerms = [
      'vitamina', 'suplemento', 'zinco', 'magnésio', 'ferro', 'cálcio', 'ômega',
      'b12', 'vitamin', 'supplement', 'prescri', 'dosagem', 'mg', 'ui'
    ];
    
    return recommendations.filter(rec => {
      const lowerRec = rec.toLowerCase();
      return !prohibitedTerms.some(term => lowerRec.includes(term));
    }).map(rec => {
      // Se ainda houver recomendações problemáticas, substituir por orientação padrão
      if (rec.toLowerCase().includes('acompanhamento') && !rec.includes('Ministério da Saúde')) {
        return 'Consulte um médico para orientações específicas sobre os resultados';
      }
      return rec;
    });
  };

  // Filtrar texto de lifestyle para remover nutrientes específicos
  const filterLifestyleText = (text: string) => {
    const prohibitedTerms = [
      'vitamina', 'suplemento', 'zinco', 'magnésio', 'ferro', 'cálcio', 'ômega',
      'b12', 'vitamin', 'supplement', 'prescri', 'dosagem', 'mg', 'ui'
    ];
    
    let filteredText = text;
    prohibitedTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      if (regex.test(filteredText)) {
        // Se contém termo proibido, usar texto padrão do Ministério da Saúde
        if (text.toLowerCase().includes('alimentação') || text.toLowerCase().includes('diet')) {
          filteredText = 'Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde';
        } else if (text.toLowerCase().includes('exercí') || text.toLowerCase().includes('atividade')) {
          filteredText = 'Pratique atividade física regular conforme orientações do Ministério da Saúde (150 min/semana)';
        } else {
          filteredText = 'Consulte um médico para orientações específicas';
        }
      }
    });
    
    return filteredText;
  };
  
  const getFileIcon = (fileType?: string, iconSize: number = 16) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="text-gray-500" size={16} />;
      case 'jpeg':
      case 'png':
        return <Image className="text-gray-500" size={16} />;
      default:
        return <FileText className="text-gray-500" size={16} />;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return "Data indisponível";
    }
    return parsedDate.toLocaleDateString('pt-BR');
  };
  
  // Função simplificada para obter o status da métrica para a UI, independente da função implementada
  const getMetricStatusForUI = (status?: string, value?: string, referenceMin?: string | null, referenceMax?: string | null) => {
    // Valores padrão
    let position = '50%';
    let indicatorClass = 'bg-green-500';
    
    // Se tem valores de referência, calcula posição com base neles
    if (referenceMin && referenceMax) {
      const min = parseFloat(referenceMin);
      const max = parseFloat(referenceMax);
      const val = value ? parseFloat(value) : 0;
      
      if (!isNaN(min) && !isNaN(max) && !isNaN(val)) {
        // Normalização para visualização
        const range = max - min;
        const padding = range * 0.2; // 20% de margem visual
        const visualMin = min - padding;
        const visualMax = max + padding;
        const visualRange = visualMax - visualMin;
        
        // Porcentagem entre 10 e 90% para melhor visibilidade
        let percentage = ((val - visualMin) / visualRange) * 100;
        percentage = Math.max(10, Math.min(90, percentage));
        
        position = `${percentage}%`;
        
        // Cores baseadas na relação com os valores de referência
        if (val > max) {
          indicatorClass = 'bg-red-500';
        } else if (val < min) {
          indicatorClass = 'bg-blue-500';
        } else if (val >= max * 0.9) {
          indicatorClass = 'bg-amber-500';
        } else {
          indicatorClass = 'bg-green-500';
        }
      }
    } else {
      // Sem referências, usa apenas o status
      switch (status) {
        case 'alto':
        case 'high':
          position = '80%';
          indicatorClass = 'bg-red-500';
          break;
        case 'atenção':
          position = '65%';
          indicatorClass = 'bg-amber-500';
          break;
        case 'baixo':
        case 'low':
          position = '20%';
          indicatorClass = 'bg-blue-500';
          break;
        default:
          position = '50%';
          indicatorClass = 'bg-green-500';
      }
    }
    
    // Adicionamos propriedades adicionais para compatibilidade com o código existente
    return {
      position,
      indicatorClass,
      color: indicatorClass,
      width: '40%',
      showRange: !!referenceMin && !!referenceMax,
      referenceMin: referenceMin ? parseFloat(referenceMin) : null,
      referenceMax: referenceMax ? parseFloat(referenceMax) : null,
      value: value ? parseFloat(value) : 0,
      severity: 'normal'
    };
  };
  
  const getChangeIcon = (change?: string) => {
    if (!change) return <Minus className="h-3 w-3 text-gray-600" />;
    
    if (change.startsWith('-')) {
      return <ArrowDown className="h-3 w-3 text-green-600" />;
    } else if (change.startsWith('+')) {
      return <ArrowUp className="h-3 w-3 text-red-600" />;
    }
    return <Minus className="h-3 w-3 text-gray-600" />;
  };
  
  // Extract sample health metrics from the exam result
  const healthMetrics = data?.result?.healthMetrics as any[] || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.
              Todos os dados associados ao exame, incluindo resultados e métricas de saúde, serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      <div className="flex flex-1 relative">
        <Sidebar className="hidden md:flex" />
        
        <main className="flex-1">
          {/* Cabeçalho */}
          <div className="border-b bg-white shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/exam-history">
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                    {isLoading ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      <>
                        {data?.exam?.name || "Resultado do Exame"}
                        {data?.exam?.status === "analyzed" && (
                          <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-100 border border-green-200">
                            Analisado
                          </Badge>
                        )}
                      </>
                    )}
                  </h1>
                  {!isLoading && data?.exam && (
                    <div className="flex items-center text-sm text-gray-500 space-x-3">
                      <span>Enviado {formatRelativeDate(data.exam?.uploadDate?.toString())}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        {getFileIcon(data.exam?.fileType)}{' '}
                        <span className="ml-1">{data.exam?.fileType?.toUpperCase()}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex"
                  onClick={async () => {
                    if (!data) return;
                    
                    try {
                      const response = await fetch(`/api/export-exam-report/${examId}`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `relatorio-exame-${data.exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } else {
                        alert('Erro ao gerar o PDF do relatório');
                      }
                    } catch (error) {
                      console.error('Erro ao baixar PDF:', error);
                      alert('Erro ao gerar o PDF do relatório');
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Relatório de Exame - ${data?.exam.name}`,
                        text: data?.result?.summary,
                        url: window.location.href
                      }).catch(() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copiado para a área de transferência!');
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copiado para a área de transferência!');
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-y-2 border-t border-gray-100 bg-gray-50">
              {!isLoading && data?.exam && (
                <>
                  <div className="flex items-center text-sm text-gray-600 mr-6">
                    <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                    <span className="font-medium">
                      {formatDate(data.exam.examDate || data.exam.uploadDate?.toString())}
                    </span>
                  </div>
                  
                  {data.exam.laboratoryName && (
                    <div className="flex items-center text-sm text-gray-600 mr-6">
                      <Building className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="font-medium">{data.exam.laboratoryName}</span>
                    </div>
                  )}
                  
                  {data.exam.requestingPhysician && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserRound className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="font-medium">Dr. {data.exam.requestingPhysician}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Report Details */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                {isLoading ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <Skeleton className="h-7 w-64 mb-2" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Skeleton className="h-10 w-full mb-6" />
                      <Skeleton className="h-32 w-full mb-4" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">{data?.exam.name}</h2>
                      <p className="text-gray-500">
                        {data?.result?.analysisDate
                          ? `Analisado em ${formatDate(data.result.analysisDate.toString())}`
                          : data?.exam?.uploadDate
                            ? `Enviado em ${formatDate(data.exam.uploadDate.toString())}`
                            : "Data de análise indisponível"}
                      </p>
                    </div>
                    
                    <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                      <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent pb-px mb-6">
                        <TabsTrigger 
                          value="summary"
                          className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent"
                        >
                          Resumo
                        </TabsTrigger>
                        <TabsTrigger 
                          value="detailed"
                          className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent ml-8"
                        >
                          Análise Detalhada
                        </TabsTrigger>
                        <TabsTrigger 
                          value="recommendations"
                          className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent ml-8"
                        >
                          Recomendações
                        </TabsTrigger>
                        <TabsTrigger 
                          value="evidence"
                          className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent ml-8"
                        >
                          Evidências Científicas
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Summary Tab */}
                      <TabsContent value="summary" className="mt-6">
                        <p className="text-gray-600 mb-4">
                          {data?.result?.summary}
                        </p>
                        
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg mb-4">
                          <div className="flex">
                            <CheckCircle2 className="text-green-600 mr-3 flex-shrink-0" size={20} />
                            <div>
                              <h4 className="font-medium text-green-800">Resultado geral positivo</h4>
                              <p className="text-sm text-green-700 mt-1">Seus resultados estão majoritariamente dentro dos intervalos de referência, indicando boa saúde geral.</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                          <div className="flex">
                            <CheckCircle2 className="text-yellow-600 mr-3 flex-shrink-0" size={20} />
                            <div>
                              <h4 className="font-medium text-yellow-800">Pontos de atenção</h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                {healthMetrics.find(m => m.status === 'atenção' || m.status === 'baixo' || m.status === 'alto')
                                  ? `${healthMetrics.find(m => m.status === 'atenção' || m.status === 'baixo')?.name || 'Alguns parâmetros'} em nível de atenção.`
                                  : 'Alguns parâmetros merecem atenção e acompanhamento.'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-medium text-lg text-gray-800 mt-6 mb-3">Principais parâmetros</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {healthMetrics.slice(0, 4).map((metric, index) => (
                            <div key={index} className={`p-4 rounded-lg ${
                              metric.status === 'alto' || metric.status === 'high' ? 'bg-red-50 border border-red-100' :
                              metric.status === 'baixo' || metric.status === 'low' ? 'bg-blue-50 border border-blue-100' :
                              metric.status === 'atenção' ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'
                            }`}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                  {metric.name.charAt(0).toUpperCase() + metric.name.slice(1)}
                                  {metric.status !== 'normal' && (
                                    <Badge variant="outline" className={`ml-2 ${
                                      metric.status === 'alto' || metric.status === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                      metric.status === 'baixo' || metric.status === 'low' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                      'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}>
                                      {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                                    </Badge>
                                  )}
                                </span>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-700 font-medium">{metric.value} {metric.unit}</span>
                                  {metric.change && (
                                    <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full ${
                                      metric.change.startsWith('+') ? 'bg-red-50 text-red-700' : 
                                      metric.change.startsWith('-') ? 'bg-green-50 text-green-700' : 
                                      'bg-gray-50 text-gray-700'
                                    }`}>
                                      {metric.change}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1 relative">
                                {/* Área de referência "normal" */}
                                {(metric.referenceMin && metric.referenceMax) ? (
                                  <div className="absolute h-full bg-green-100 rounded-full opacity-60"
                                    style={{ 
                                      left: '30%', 
                                      width: '40%'
                                    }}>
                                  </div>
                                ) : (
                                  <div className="absolute h-full bg-gray-300 rounded-full opacity-40"
                                    style={{ 
                                      left: '25%', 
                                      width: '50%'
                                    }}>
                                  </div>
                                )}
                                
                                {/* Marcadores de limite para valores de referência */}
                                {(metric.referenceMin && metric.referenceMax) && (
                                  <>
                                    <div className="absolute h-full w-0.5 bg-green-700 opacity-50" 
                                      style={{ left: '30%' }} 
                                      title={`Valor mínimo de referência: ${metric.referenceMin}`}>
                                    </div>
                                    <div className="absolute h-full w-0.5 bg-green-700 opacity-50" 
                                      style={{ left: '70%' }}
                                      title={`Valor máximo de referência: ${metric.referenceMax}`}>
                                    </div>
                                  </>
                                )}
                                
                                {/* Indicador de valor com posição calculada pelos valores reais */}
                                {(() => {
                                  const status = getMetricStatusForUI(
                                    metric.status, 
                                    metric.value, 
                                    metric.referenceMin, 
                                    metric.referenceMax
                                  );
                                  
                                  return (
                                    <div 
                                      className={`w-3 h-3 rounded-full absolute top-1/2 transform -translate-y-1/2 shadow-md ${status.indicatorClass}`}
                                      style={{ 
                                        left: status.position,
                                        marginLeft: '-4px',
                                        transition: 'left 0.3s ease-in-out'
                                      }}
                                      title={`Valor: ${metric.value} ${metric.unit}`}>
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <div className="flex items-center">
                                  <span>
                                    Ref: {metric.referenceMin || '?'}-{metric.referenceMax || '?'} {metric.unit}
                                  </span>
                                  
                                  {metric.change && (
                                    <span className={`ml-2 px-1.5 rounded-md flex items-center ${
                                      metric.change.startsWith('+') ? 'text-red-700' : 
                                      metric.change.startsWith('-') ? 'text-green-700' : 
                                      'text-gray-700'
                                    }`}>
                                      {getChangeIcon(metric.change)}
                                      <span className="ml-0.5">{metric.change}</span>
                                    </span>
                                  )}
                                </div>
                                
                                {metric.clinical_significance && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-primary-600 cursor-help flex items-center">
                                          <Info className="h-3 w-3 mr-1" />
                                          <span className="text-xs">Significado clínico</span>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs p-3">
                                        <p>{metric.clinical_significance}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      {/* Detailed Analysis Tab */}
                      <TabsContent value="detailed">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parâmetro</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referência</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Significado Clínico</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {healthMetrics.map((metric, index) => (
                                <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {metric.name.charAt(0).toUpperCase() + metric.name.slice(1)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="font-medium">{metric.value}</span> {metric.unit}
                                    {metric.change && (
                                      <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full inline-flex items-center ${
                                        metric.change.startsWith('+') ? 'bg-red-50 text-red-700' : 
                                        metric.change.startsWith('-') ? 'bg-green-50 text-green-700' : 
                                        'bg-gray-50 text-gray-700'
                                      }`}>
                                        {getChangeIcon(metric.change)}
                                        <span className="ml-0.5">{metric.change}</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {metric.referenceMin && metric.referenceMax ? 
                                      <span className="bg-green-50 px-2 py-0.5 rounded text-green-700">
                                        {metric.referenceMin}-{metric.referenceMax} {metric.unit}
                                      </span> : 
                                      (metric.name === 'hemoglobina' && '12.0-16.0 g/dL') ||
                                      (metric.name === 'glicemia' && '70-99 mg/dL') ||
                                      (metric.name === 'colesterol' && '150-199 mg/dL') ||
                                      (metric.name === 'vitamina_d' && '30-100 ng/mL') ||
                                      'Não disponível'
                                    }
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Badge variant={
                                      metric.status === 'normal' ? 'default' :
                                      metric.status === 'atenção' ? 'outline' :
                                      metric.status === 'baixo' || metric.status === 'low' ? 'secondary' : 'destructive'
                                    } className={
                                      metric.status === 'normal' ? 'bg-green-100 text-green-800 border-green-200' :
                                      metric.status === 'atenção' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                      metric.status === 'baixo' || metric.status === 'low' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                                    }>
                                      {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                    {metric.clinical_significance ? (
                                      <div className="truncate">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <p className="cursor-help truncate">
                                                {metric.clinical_significance}
                                              </p>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-md p-3">
                                              <p>{metric.clinical_significance}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    ) : 'Sem informações adicionais'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="font-medium text-lg text-gray-800 mb-3">Interpretação detalhada</h3>
                          <div className="space-y-3">
                            <p className="text-gray-600">
                              {data?.result?.detailedAnalysis}
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {/* Recommendations Tab */}
                      <TabsContent value="recommendations">
                        <div className="mb-6">
                          <h3 className="font-medium text-lg text-gray-800 mb-3">Orientações de saúde</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            ⚠️ Seguimos rigorosamente as diretrizes do Ministério da Saúde. Todas as orientações são gerais e não substituem consulta médica.
                          </p>
                          
                          <div className="space-y-4">
                            {isLoadingInsights ? (
                              [...Array(3)].map((_, i) => (
                                <div key={i} className="bg-primary-50 p-4 rounded-lg">
                                  <div className="flex">
                                    <Skeleton className="h-6 w-6 mr-4" />
                                    <div className="w-full">
                                      <Skeleton className="h-5 w-48 mb-2" />
                                      <Skeleton className="h-4 w-full" />
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              filterRecommendations(insights?.recommendations || []).map((recommendation, index) => (
                                <div key={index} className="bg-primary-50 p-4 rounded-lg">
                                  <div className="flex">
                                    <div className="flex-shrink-0">
                                      {index === 0 && <UserRound className="text-primary-600" size={20} />}
                                      {index === 1 && <Apple className="text-emerald-600" size={20} />}
                                      {index === 2 && <Dumbbell className="text-blue-600" size={20} />}
                                      {index > 2 && <CheckCircle2 className="text-primary-600" size={20} />}
                                    </div>
                                    <div className="ml-4">
                                      <h4 className="text-base font-medium text-gray-900">
                                        {index === 0 && 'Orientação médica'}
                                        {index === 1 && 'Alimentação saudável'}
                                        {index === 2 && 'Atividade física'}
                                        {index === 3 && 'Cuidados gerais'}
                                        {index > 3 && `Orientação ${index + 1}`}
                                      </h4>
                                      <p className="mt-1 text-sm text-gray-600">{recommendation}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-lg text-gray-800 mb-3">Especialistas sugeridos</h3>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <ul className="space-y-2">
                              {isLoadingInsights ? (
                                [...Array(3)].map((_, i) => (
                                  <li key={i} className="flex items-start">
                                    <Skeleton className="h-5 w-5 mt-0.5 mr-2" />
                                    <div className="w-full">
                                      <Skeleton className="h-5 w-40 mb-1" />
                                      <Skeleton className="h-4 w-full" />
                                    </div>
                                  </li>
                                ))
                              ) : (
                                insights?.specialists.map((specialist, index) => (
                                  <li key={index} className="flex items-start">
                                    <CheckCircle2 className="text-primary-600 mt-0.5 mr-2 flex-shrink-0" size={18} />
                                    <div>
                                      <h4 className="font-medium text-gray-800">{specialist}</h4>
                                    </div>
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                          
                          {insights?.lifestyle && (
                            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Recomendações de estilo de vida</h4>
                              <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start">
                                  <span className="font-medium mr-2">Alimentação:</span>
                                  <span>{filterLifestyleText(insights.lifestyle.diet)}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium mr-2">Exercícios:</span>
                                  <span>{filterLifestyleText(insights.lifestyle.exercise)}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium mr-2">Sono:</span>
                                  <span>{filterLifestyleText(insights.lifestyle.sleep)}</span>
                                </li>
                                {insights.lifestyle.stress_management && (
                                  <li className="flex items-start">
                                    <span className="font-medium mr-2">Gerenciamento de estresse:</span>
                                    <span>{filterLifestyleText(insights.lifestyle.stress_management)}</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      {/* Evidências Científicas Tab */}
                      <TabsContent value="evidence">
                        <div className="mb-6">
                          <h3 className="font-medium text-lg text-gray-800 mb-4">Parâmetros de Saúde Baseados em Evidências</h3>
                          
                          {insights?.healthParameters ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              {/* Health Score */}
                              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Pontuação Global de Saúde</h4>
                                <div className="flex justify-center items-center mb-3">
                                  <div className="relative w-36 h-36 flex items-center justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                      <circle 
                                        cx="18" cy="18" r="16" 
                                        fill="none" 
                                        stroke="#e5e7eb" 
                                        strokeWidth="3" 
                                      />
                                      <circle 
                                        cx="18" cy="18" r="16" 
                                        fill="none" 
                                        stroke={
                                          insights.healthParameters.healthScore >= 80 ? "#22c55e" : 
                                          insights.healthParameters.healthScore >= 60 ? "#f59e0b" : 
                                          "#ef4444"
                                        } 
                                        strokeWidth="3" 
                                        strokeDasharray="100" 
                                        strokeDashoffset={100 - insights.healthParameters.healthScore}
                                        strokeLinecap="round"
                                        transform="rotate(-90, 18, 18)"
                                      />
                                    </svg>
                                    <div className="absolute text-2xl font-bold">{insights.healthParameters.healthScore}</div>
                                  </div>
                                </div>
                                <p className="text-center text-sm text-gray-600">Pontuação baseada na análise de todos os parâmetros disponíveis</p>
                              </div>
                              
                              {/* Parameters Areas */}
                              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Áreas de Saúde</h4>
                                
                                {insights.healthParameters.criticalAreas.length > 0 && (
                                  <div className="mb-4">
                                    <h5 className="text-sm font-medium text-red-600 mb-1">Áreas críticas</h5>
                                    <ul className="space-y-1">
                                      {insights.healthParameters.criticalAreas.map((area, idx) => (
                                        <li key={idx} className="text-sm flex text-gray-700">
                                          <span className="mr-2">•</span>
                                          <span>{area}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {insights.healthParameters.stableAreas.length > 0 && (
                                  <div className="mb-4">
                                    <h5 className="text-sm font-medium text-green-600 mb-1">Áreas estáveis</h5>
                                    <ul className="space-y-1">
                                      {insights.healthParameters.stableAreas.map((area, idx) => (
                                        <li key={idx} className="text-sm flex text-gray-700">
                                          <span className="mr-2">•</span>
                                          <span>{area}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {insights.healthParameters.improvementTrends.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium text-blue-600 mb-1">Tendências de melhoria</h5>
                                    <ul className="space-y-1">
                                      {insights.healthParameters.improvementTrends.map((trend, idx) => (
                                        <li key={idx} className="text-sm flex text-gray-700">
                                          <span className="mr-2">•</span>
                                          <span>{trend}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-6 rounded-lg mb-8">
                              <p className="text-center text-gray-500">Parâmetros de saúde não disponíveis para este exame</p>
                            </div>
                          )}
                          
                          {insights?.evidenceBasedAssessment ? (
                            <div className="space-y-6">
                              <div>
                                <h3 className="font-medium text-lg text-gray-800 mb-3">Diretrizes Clínicas Relevantes</h3>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                  <ul className="space-y-2">
                                    {insights.evidenceBasedAssessment.clinicalGuidelines.map((guideline, idx) => (
                                      <li key={idx} className="text-sm flex items-start">
                                        <span className="text-blue-600 font-medium mr-2">›</span>
                                        <span className="text-gray-700">{guideline}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-medium text-lg text-gray-800 mb-3">Referências Científicas</h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <ul className="space-y-2">
                                    {insights.evidenceBasedAssessment.studyReferences.map((reference, idx) => (
                                      <li key={idx} className="text-sm flex items-start">
                                        <span className="text-gray-800 font-medium mr-2">[{idx + 1}]</span>
                                        <span className="text-gray-700">{reference}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-800 mb-2">Nível de confiança na avaliação</h4>
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-4">
                                    <div className={`h-2.5 rounded-full ${
                                      insights.evidenceBasedAssessment.confidenceLevel === 'alto' ? 'w-full bg-green-600' :
                                      insights.evidenceBasedAssessment.confidenceLevel === 'médio' ? 'w-2/3 bg-yellow-500' :
                                      'w-1/3 bg-red-500'
                                    }`}></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 w-16">{
                                    insights.evidenceBasedAssessment.confidenceLevel.charAt(0).toUpperCase() + 
                                    insights.evidenceBasedAssessment.confidenceLevel.slice(1)
                                  }</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-6 rounded-lg">
                              <p className="text-center text-gray-500">Evidências científicas não disponíveis para este exame</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
              
              {/* Additional Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-1">
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-48 mb-4" />
                    
                    <div className="space-y-4 mb-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center">
                          <Skeleton className="h-5 w-5 mr-3" />
                          <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Skeleton className="h-px w-full my-4" />
                    
                    <Skeleton className="h-6 w-36 mb-4" />
                    
                    <div className="space-y-4 mb-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center">
                          <Skeleton className="h-5 w-5 mr-3" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Skeleton className="h-px w-full my-4" />
                    
                    <Skeleton className="h-6 w-24 mb-4" />
                    
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Informações do Exame</h2>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center">
                        <Calendar className="text-primary-500 mr-3" size={18} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Data do exame</h3>
                          <p className="text-sm text-gray-600">
                            {data?.exam.examDate ? formatDate(data?.exam.examDate) : formatDate(data?.exam.uploadDate.toString())}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Building className="text-primary-500 mr-3" size={18} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Laboratório</h3>
                          <p className="text-sm text-gray-600">{data?.exam.laboratoryName || "Laboratório Central"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <UserRound className="text-primary-500 mr-3" size={18} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Médico Solicitante</h3>
                          <p className="text-sm text-gray-600">{data?.exam.requestingPhysician || "Não informado"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="mr-3 text-primary-500">
                          {getFileIcon(data?.exam.fileType)}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Tipo de arquivo</h3>
                          <p className="text-sm text-gray-600">{data?.exam.fileType.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <hr className="my-4 border-gray-200" />
                    
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Análise por IA</h2>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center">
                        <img src="https://img.icons8.com/color/48/000000/openai-logo.png" alt="OpenAI" className="w-6 h-6 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Extração do documento</h3>
                          <p className="text-sm text-gray-600">OpenAI GPT-5 Vision</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <img src="https://img.icons8.com/color/48/000000/openai-logo.png" alt="OpenAI" className="w-6 h-6 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Recomendações</h3>
                          <p className="text-sm text-gray-600">OpenAI GPT-4o</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="text-primary-500 mr-3" size={18} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Tempo de análise</h3>
                          <p className="text-sm text-gray-600">~2 minutos</p>
                        </div>
                      </div>
                    </div>
                    
                    <hr className="my-4 border-gray-200" />
                    
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Informações</h2>
                    
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Data do exame:</strong> {data?.exam.examDate || 'Não informado'}</p>
                      <p><strong>Laboratório:</strong> {data?.exam.laboratoryName || 'Não informado'}</p>
                      <p><strong>Médico solicitante:</strong> {data?.exam.requestingPhysician || 'Não informado'}</p>
                      <p><strong>Tipo de arquivo:</strong> {data?.exam.fileType?.toUpperCase() || 'Não informado'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
