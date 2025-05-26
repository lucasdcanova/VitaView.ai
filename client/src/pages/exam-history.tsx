import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Exam } from "@shared/schema";
import { 
  FileText, 
  Image, 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  Clock,
  Tag,
  ArrowUpDown,
  User,
  Microscope,
  BarChart4,
  ListFilter,
  FileBarChart,
  ChevronDown,
  AlertCircle,
  MoreVertical,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteExam } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExamHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"grid" | "list" | "timeline">("grid");
  const [viewMode, setViewMode] = useState<"chronological" | "category">("chronological");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    fileType: "all",
    dateRange: "all",
    status: "all",
    sortBy: "examDate"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const itemsPerPage = activeView === "grid" ? 8 : 10;
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation para excluir um exame
  const deleteMutation = useMutation({
    mutationFn: async (examId: number) => {
      return await deleteExam(examId);
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas aos exames e métricas de saúde
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/chronological"] });
      
      toast({
        title: "Exame excluído",
        description: "O exame foi removido com sucesso.",
        variant: "default",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir exame",
        description: error.message || "Não foi possível excluir o exame. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para abrir diálogo de exclusão
  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDelete = () => {
    if (examToDelete) {
      deleteMutation.mutate(examToDelete.id);
    }
  };
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions, searchTerm, activeView]);

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });
  
  // Helper function to get date value (defined once here)
  const getExamDate = (exam: Exam) => {
    return exam.examDate ? new Date(exam.examDate) : new Date(exam.uploadDate);
  };

  // Função para extrair a categoria do nome do exame
  const getCategoryFromName = (name: string): string => {
    name = name.toLowerCase();
    if (name.includes('hemograma') || name.includes('sanguíneo') || name.includes('sangue')) 
      return 'Sangue';
    if (name.includes('glicemia') || name.includes('diabetes') || name.includes('glicose')) 
      return 'Glicemia';
    if (name.includes('colesterol') || name.includes('triglicerídeos') || name.includes('lipídico')) 
      return 'Perfil Lipídico';
    if (name.includes('tireoide') || name.includes('tsh') || name.includes('t4') || name.includes('t3')) 
      return 'Tireoide';
    if (name.includes('vitamina') || name.includes('mineral') || name.includes('ferro')) 
      return 'Vitaminas e Minerais';
    if (name.includes('urina') || name.includes('renal') || name.includes('uréia') || name.includes('creatinina')) 
      return 'Renal';
    if (name.includes('fígado') || name.includes('hepático') || name.includes('tgo') || name.includes('tgp')) 
      return 'Hepático';
    if (name.includes('cardíaco') || name.includes('coração') || name.includes('troponina')) 
      return 'Cardíaco';
    
    // Tente extrair a categoria do nome do arquivo
    if (name.includes('hemoglobin')) return 'Sangue';
    if (name.includes('glic')) return 'Glicemia';
    if (name.includes('colest')) return 'Perfil Lipídico';
    if (name.includes('renal')) return 'Renal';
    if (name.includes('hepat')) return 'Hepático';
    if (name.includes('cardi')) return 'Cardíaco';
    
    return 'Outros';
  };

  // Apply filters and sorting
  const filteredAndSortedExams = exams
    ? exams
        .filter(exam => {
          // Type filter
          if (filterOptions.fileType !== "all" && exam.fileType !== filterOptions.fileType) {
            return false;
          }
          
          // Status filter
          if (filterOptions.status !== "all" && exam.status !== filterOptions.status) {
            return false;
          }
          
          // Date range filter
          if (filterOptions.dateRange !== "all") {
            const examDate = getExamDate(exam);
            const now = new Date();
            
            switch (filterOptions.dateRange) {
              case "last7days":
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                if (examDate < sevenDaysAgo) return false;
                break;
                
              case "last30days":
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                if (examDate < thirtyDaysAgo) return false;
                break;
                
              case "last3months":
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(now.getMonth() - 3);
                if (examDate < threeMonthsAgo) return false;
                break;
            }
          }
          
          // Text search
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              exam.name.toLowerCase().includes(searchLower) ||
              (exam.laboratoryName && exam.laboratoryName.toLowerCase().includes(searchLower)) ||
              (exam.requestingPhysician && exam.requestingPhysician?.toLowerCase().includes(searchLower))
            );
          }
          
          return true;
        })
        .sort((a, b) => {
          // Helper function to get time value for sorting
          const getDateValue = (exam: Exam) => {
            return getExamDate(exam).getTime();
          };
          
          switch (filterOptions.sortBy) {
            case "examDate":
              return getDateValue(b) - getDateValue(a); // Newest first
            case "examDateAsc":
              return getDateValue(a) - getDateValue(b); // Oldest first
            case "name":
              return a.name.localeCompare(b.name); // A-Z
            case "nameDesc":
              return b.name.localeCompare(a.name); // Z-A
            default:
              return getDateValue(b) - getDateValue(a);
          }
        })
    : [];
  
  // Agrupar exames por categoria
  const groupedExams = useMemo(() => {
    // Agrupar exames por categoria
    const categories: Record<string, Exam[]> = {};
    
    filteredAndSortedExams.forEach(exam => {
      const category = getCategoryFromName(exam.name);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(exam);
    });
    
    return { 
      categories, 
      chronological: filteredAndSortedExams,
      categoryList: Object.keys(categories).sort() 
    };
  }, [filteredAndSortedExams]);
  
  // Filtrar exames por categoria ativa se necessário
  const examsToDisplay = useMemo(() => {
    if (viewMode === 'category' && activeCategory !== 'all') {
      return filteredAndSortedExams.filter(exam => 
        getCategoryFromName(exam.name) === activeCategory
      );
    }
    return filteredAndSortedExams;
  }, [filteredAndSortedExams, viewMode, activeCategory]);
  
  // Pagination
  const totalPages = Math.ceil((examsToDisplay?.length || 0) / itemsPerPage);
  const paginatedExams = examsToDisplay.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
            <Activity className="w-3 h-3 mr-1" /> Analisado
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Processando
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
    }
  };

  // Exam card component for grid view
  const ExamCard = ({ exam }: { exam: Exam }) => (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${getExamTypeColor(exam.fileType)}`}>
              {getFileIcon(exam.fileType, 18)}
            </div>
            <div>
              <CardTitle className="text-base font-medium line-clamp-1">{exam.name}</CardTitle>
              <CardDescription className="text-xs">{exam.laboratoryName || "Laboratório não informado"}</CardDescription>
            </div>
          </div>
          <div className="flex items-start gap-2">
            {getStatusBadge(exam.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {exam.status === 'analyzed' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/diagnosis/${exam.id}`} className="cursor-pointer">
                        <FileBarChart className="mr-2 h-4 w-4" />
                        Ver diagnóstico
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/report/${exam.id}`} className="cursor-pointer">
                        <Activity className="mr-2 h-4 w-4" />
                        Ver análise detalhada
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => handleDeleteClick(exam)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir exame
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200">
            <div className="flex items-center text-gray-700">
              <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              <span>Data do Exame:</span>
            </div>
            <span className="font-medium">
              {exam.examDate ? formatDate(exam.examDate) : (
                <span className="text-gray-400 text-xs">Não informada</span>
              )}
            </span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200">
            <div className="flex items-center text-gray-700">
              <User className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              <span>Médico Solicitante:</span>
            </div>
            <span className="font-medium">
              {exam.requestingPhysician || (
                <span className="text-gray-400 text-xs">Não informado</span>
              )}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-gray-700">
              <Microscope className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              <span>Tipo de Arquivo:</span>
            </div>
            <Badge variant="outline" className={cn("capitalize", getExamTypeColor(exam.fileType))}>
              {exam.fileType}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 flex justify-between items-center border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Enviado {formatRelativeDate(exam.uploadDate.toString())}
        </div>
        <div className="space-x-2">
          {exam.status === 'analyzed' ? (
            <div className="inline-flex gap-2">
              <Link href={`/diagnosis/${exam.id}`}>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <FileBarChart className="mr-1 h-3.5 w-3.5" />
                  Diagnóstico
                </Button>
              </Link>
              <Link href={`/report/${exam.id}`}>
                <Button size="sm" className="h-8 px-3 text-xs">
                  <Activity className="mr-1 h-3.5 w-3.5" />
                  Detalhes
                </Button>
              </Link>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs" disabled>
              <Clock className="mr-1 h-3.5 w-3.5" />
              Processando...
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      
      <div className="flex flex-1 relative">
        <Sidebar />
        
        <main className="flex-1 bg-gray-50">
          <div className="p-4 md:p-6">
            <header className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Histórico de Exames</h1>
                  <p className="text-gray-600 mt-1">Visualize, analise e gerencie seus exames médicos</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link href="/upload-exams">
                    <Button>Enviar Novo Exame</Button>
                  </Link>
                </div>
              </div>
            </header>
            
            <div className="mb-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-wrap gap-4 justify-between">
                    {/* Search Field */}
                    <div className="w-full md:w-auto flex-grow md:flex-grow-0 md:min-w-[320px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          type="text" 
                          placeholder="Buscar por nome, laboratório ou médico..." 
                          className="pl-10 bg-white"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Visualization mode toggle */}
                    <div className="flex gap-3 ml-auto items-center">
                      <div className="flex rounded-md overflow-hidden border border-gray-200" style={{ height: "40px" }}>
                        <button 
                          style={{
                            backgroundColor: viewMode === "chronological" ? "#48C9B0" : "white",
                            color: "#374151",
                            border: "none",
                            height: "40px",
                            padding: "0 16px",
                            width: "120px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            setViewMode("chronological");
                            setActiveCategory("all");
                          }}
                        >
                          <Calendar className="h-[18px] w-[18px] mr-2" />
                          Cronológico
                        </button>
                        <button 
                          style={{
                            backgroundColor: viewMode === "category" ? "#48C9B0" : "white",
                            color: "#374151",
                            border: "none",
                            height: "40px",
                            padding: "0 16px",
                            width: "120px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          onClick={() => setViewMode("category")}
                        >
                          <Tag className="h-[18px] w-[18px] mr-2" />
                          Categorias
                        </button>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            style={{
                              backgroundColor: "white",
                              color: "#374151",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              height: "40px",
                              padding: "0 16px",
                              width: "120px",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            <Filter className="h-[18px] w-[18px] mr-1" />
                            Filtros
                            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[240px]">
                          <DropdownMenuLabel>Filtrar Exames</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <div className="p-2">
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Tipo de Arquivo</label>
                            <Select 
                              value={filterOptions.fileType} 
                              onValueChange={(value) => setFilterOptions({...filterOptions, fileType: value})}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Todos os tipos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="jpeg">JPEG</SelectItem>
                                <SelectItem value="png">PNG</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="p-2">
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Período</label>
                            <Select 
                              value={filterOptions.dateRange} 
                              onValueChange={(value) => setFilterOptions({...filterOptions, dateRange: value})}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Todos os períodos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos os períodos</SelectItem>
                                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                                <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                                <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="p-2">
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
                            <Select 
                              value={filterOptions.status} 
                              onValueChange={(value) => setFilterOptions({...filterOptions, status: value})}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Todos os status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="analyzed">Analisados</SelectItem>
                                <SelectItem value="processing">Processando</SelectItem>
                                <SelectItem value="pending">Pendentes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="p-2">
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Ordenar por</label>
                            <Select 
                              value={filterOptions.sortBy} 
                              onValueChange={(value) => setFilterOptions({...filterOptions, sortBy: value})}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Data (mais recente)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="examDate">Data (mais recente)</SelectItem>
                                <SelectItem value="examDateAsc">Data (mais antiga)</SelectItem>
                                <SelectItem value="name">Nome (A-Z)</SelectItem>
                                <SelectItem value="nameDesc">Nome (Z-A)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <div className="flex border rounded-md overflow-hidden" style={{ height: "40px" }}>
                        <button
                          style={{
                            backgroundColor: activeView === "grid" ? "#f1f5f9" : "white",
                            color: "#374151",
                            border: "none",
                            height: "40px",
                            width: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          onClick={() => setActiveView("grid")}
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
                            <path d="M3.5 2C2.67157 2 2 2.67157 2 3.5V7.5C2 8.32843 2.67157 9 3.5 9H7.5C8.32843 9 9 8.32843 9 7.5V3.5C9 2.67157 8.32843 2 7.5 2H3.5ZM3.5 3H7.5C7.77614 3 8 3.22386 8 3.5V7.5C8 7.77614 7.77614 8 7.5 8H3.5C3.22386 8 3 7.77614 3 7.5V3.5C3 3.22386 3.22386 3 3.5 3ZM3.5 10C2.67157 10 2 10.6716 2 11.5V12.5C2 13.3284 2.67157 14 3.5 14H7.5C8.32843 14 9 13.3284 9 12.5V11.5C9 10.6716 8.32843 10 7.5 10H3.5ZM3.5 11H7.5C7.77614 11 8 11.2239 8 11.5V12.5C8 12.7761 7.77614 13 7.5 13H3.5C3.22386 13 3 12.7761 3 12.5V11.5C3 11.2239 3.22386 11 3.5 11ZM10.5 2C9.67157 2 9 2.67157 9 3.5V4.5C9 5.32843 9.67157 6 10.5 6H11.5C12.3284 6 13 5.32843 13 4.5V3.5C13 2.67157 12.3284 2 11.5 2H10.5ZM10.5 3H11.5C11.7761 3 12 3.22386 12 3.5V4.5C12 4.77614 11.7761 5 11.5 5H10.5C10.2239 5 10 4.77614 10 4.5V3.5C10 3.22386 10.2239 3 10.5 3ZM10.5 10C9.67157 10 9 10.6716 9 11.5V12.5C9 13.3284 9.67157 14 10.5 14H11.5C12.3284 14 13 13.3284 13 12.5V11.5C13 10.6716 12.3284 10 11.5 10H10.5ZM10.5 11H11.5C11.7761 11 12 11.2239 12 11.5V12.5C12 12.7761 11.7761 13 11.5 13H10.5C10.2239 13 10 12.7761 10 12.5V11.5C10 11.2239 10.2239 11 10.5 11ZM9 7.5C9 6.67157 9.67157 6 10.5 6H11.5C12.3284 6 13 6.67157 13 7.5V8.5C13 9.32843 12.3284 10 11.5 10H10.5C9.67157 10 9 9.32843 9 8.5V7.5ZM10.5 7H11.5C11.7761 7 12 7.22386 12 7.5V8.5C12 8.77614 11.7761 9 11.5 9H10.5C10.2239 9 10 8.77614 10 8.5V7.5C10 7.22386 10.2239 7 10.5 7Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                        </button>
                        <button
                          style={{
                            backgroundColor: activeView === "list" ? "#f1f5f9" : "white",
                            color: "#374151",
                            border: "none",
                            height: "40px",
                            width: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          onClick={() => setActiveView("list")}
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
                            <path d="M2 3C2 2.44772 2.44772 2 3 2H12C12.5523 2 13 2.44772 13 3C13 3.55228 12.5523 4 12 4H3C2.44772 4 2 3.55228 2 3ZM2 7.5C2 6.94772 2.44772 6.5 3 6.5H12C12.5523 6.5 13 6.94772 13 7.5C13 8.05228 12.5523 8.5 12 8.5H3C2.44772 8.5 2 8.05228 2 7.5ZM2 12C2 11.4477 2.44772 11 3 11H12C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13H3C2.44772 13 2 12.5523 2 12Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                        </button>
                        <button
                          style={{
                            backgroundColor: activeView === "timeline" ? "#f1f5f9" : "white",
                            color: "#374151",
                            border: "none",
                            height: "40px",
                            width: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          onClick={() => setActiveView("timeline")}
                          title="Visualização em Linha do Tempo"
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
                            <path d="M7.5 0C7.77614 0 8 0.223858 8 0.5V2.5C8 2.77614 7.77614 3 7.5 3C7.22386 3 7 2.77614 7 2.5V0.5C7 0.223858 7.22386 0 7.5 0ZM2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5ZM7.5 3C5.01472 3 3 5.01472 3 7.5C3 9.98528 5.01472 12 7.5 12C9.98528 12 12 9.98528 12 7.5C12 5.01472 9.98528 3 7.5 3ZM7.5 5C7.77614 5 8 5.22386 8 5.5V7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5V5.5C7 5.22386 7.22386 5 7.5 5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mb-6">
              {isLoading ? (
                // Show loading skeletons
                <div className={activeView === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-4"}>
                  {Array(4).fill(0).map((_, index) => (
                    <Card key={index} className={activeView === "list" ? "overflow-hidden" : "h-full"}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-12 w-12 rounded-md" />
                            <div>
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-3 flex justify-between items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-32" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredAndSortedExams.length === 0 ? (
                // Show empty state
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {exams && exams.length > 0 
                      ? "Nenhum exame encontrado para os filtros selecionados" 
                      : "Nenhum exame encontrado"}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    {exams && exams.length > 0 
                      ? "Tente ajustar os filtros ou a busca para visualizar seus exames."
                      : "Comece enviando seu primeiro exame para análise e obtenha insights valiosos sobre sua saúde."}
                  </p>
                  
                  {exams && exams.length > 0 ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setFilterOptions({
                          fileType: "all",
                          dateRange: "all",
                          status: "all",
                          sortBy: "examDate"
                        });
                      }}
                    >
                      Limpar filtros
                    </Button>
                  ) : (
                    <Link href="/upload-exams">
                      <Button>Enviar exame</Button>
                    </Link>
                  )}
                </Card>
              ) : (
                // Show grid or list of exams
                <>
                  {/* Visualização por categoria se o modo categoria estiver ativo */}
                  {viewMode === "category" && (
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <Tag className="h-4 w-4 mr-2 text-primary" />
                        <h2 className="text-lg font-medium text-gray-700">Categorias de Exames</h2>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge 
                          variant={activeCategory === "all" ? "default" : "outline"}
                          className={cn(
                            "px-2.5 py-1 cursor-pointer hover:bg-primary-50",
                            activeCategory === "all" ? "bg-primary hover:bg-primary" : ""
                          )}
                          onClick={() => setActiveCategory("all")}
                        >
                          Todas as Categorias
                        </Badge>
                        
                        {groupedExams.categoryList.map(category => (
                          <Badge 
                            key={category}
                            variant={activeCategory === category ? "default" : "outline"}
                            className={cn(
                              "px-2.5 py-1 cursor-pointer hover:bg-primary-50",
                              activeCategory === category ? "bg-primary hover:bg-primary" : ""
                            )}
                            onClick={() => setActiveCategory(category)}
                          >
                            {category} ({groupedExams.categories[category].length})
                          </Badge>
                        ))}
                      </div>
                      
                      {activeCategory !== "all" && (
                        <div className="mb-4">
                          <h3 className="text-md font-medium text-primary-700 mb-1">
                            Exames na categoria: {activeCategory}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Mostrando {examsToDisplay.length} exame(s) nesta categoria
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeView === "grid" ? (
                    // Grid view
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paginatedExams.map((exam) => (
                        <ExamCard key={exam.id} exam={exam} />
                      ))}
                    </div>
                  ) : activeView === "list" ? (
                    // List view
                    <div className="space-y-3">
                      {paginatedExams.map((exam) => (
                        <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
                          <div className="flex flex-col md:flex-row">
                            <div className={`${getExamTypeColor(exam.fileType)} p-6 flex items-center justify-center md:w-16`}>
                              {getFileIcon(exam.fileType, 24)}
                            </div>
                            <div className="flex-1 p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-2">
                                <div>
                                  <div className="font-medium text-gray-800">{exam.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {exam.laboratoryName || "Laboratório não informado"}
                                    {exam.requestingPhysician ? ` • Dr. ${exam.requestingPhysician}` : ""}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 mt-1">
                                  {getStatusBadge(exam.status)}
                                  <div className="text-xs text-gray-500 ml-3 hidden md:block">
                                    {exam.examDate ? formatDate(exam.examDate) : "Data não informada"}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mt-3">
                                <div className="flex items-center gap-2 text-xs text-gray-500 md:hidden">
                                  <Calendar className="h-3 w-3 opacity-70" />
                                  {exam.examDate ? formatDate(exam.examDate) : "Data não informada"}
                                </div>
                                
                                <div className="text-xs text-gray-500">
                                  Enviado {formatRelativeDate(exam.uploadDate.toString())}
                                </div>
                                
                                <div className="flex gap-2 mt-2 md:mt-0">
                                  {exam.status === 'analyzed' ? (
                                    <>
                                      <Link href={`/diagnosis/${exam.id}`}>
                                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                                          <FileBarChart className="mr-1 h-3.5 w-3.5" />
                                          Diagnóstico
                                        </Button>
                                      </Link>
                                      <Link href={`/report/${exam.id}`}>
                                        <Button size="sm" className="h-8 px-3 text-xs">
                                          <Activity className="mr-1 h-3.5 w-3.5" />
                                          Detalhes
                                        </Button>
                                      </Link>
                                    </>
                                  ) : (
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs" disabled>
                                      <Clock className="mr-1 h-3.5 w-3.5" />
                                      Processando...
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Timeline view
                    <div className="relative px-4 py-6 bg-white rounded-md shadow-sm">
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>
                      
                      {paginatedExams.map((exam, index) => {
                        const examDate = exam.examDate ? new Date(exam.examDate) : new Date(exam.uploadDate);
                        const formattedDate = formatDate(examDate.toString());
                        
                        return (
                          <div key={exam.id} className="relative pl-8 mb-8 last:mb-0">
                            <div className="absolute left-0 w-3 h-3 rounded-full bg-primary border-4 border-white z-10 mt-1.5"></div>
                            
                            <div className="text-sm text-gray-500 mb-1">{formattedDate}</div>
                            
                            <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-md ${getExamTypeColor(exam.fileType)}`}>
                                      {getFileIcon(exam.fileType, 18)}
                                    </div>
                                    <div>
                                      <CardTitle className="text-base font-medium">{exam.name}</CardTitle>
                                      <CardDescription className="text-xs">
                                        {exam.laboratoryName || "Laboratório não informado"}
                                        {exam.requestingPhysician ? ` • Dr. ${exam.requestingPhysician}` : ""}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  {getStatusBadge(exam.status)}
                                </div>
                              </CardHeader>
                              
                              <CardContent className="p-4 pt-2">
                                <div className="mt-2 flex flex-wrap justify-between gap-2">
                                  {exam.status === 'analyzed' ? (
                                    <div className="flex gap-2">
                                      <Link href={`/diagnosis/${exam.id}`}>
                                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                                          <FileBarChart className="mr-1 h-3.5 w-3.5" />
                                          Diagnóstico
                                        </Button>
                                      </Link>
                                      <Link href={`/report/${exam.id}`}>
                                        <Button size="sm" className="h-8 px-3 text-xs">
                                          <Activity className="mr-1 h-3.5 w-3.5" />
                                          Detalhes
                                        </Button>
                                      </Link>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs" disabled>
                                      <Clock className="mr-1 h-3.5 w-3.5" />
                                      Processando...
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8"
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir exame</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {examToDelete ? `"${examToDelete.name}"` : "este exame"}? Esta ação não pode ser desfeita e todos os dados associados, incluindo métricas de saúde, serão permanentemente removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
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
    </div>
  );
}
