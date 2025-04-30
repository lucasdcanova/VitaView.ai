import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  FileBarChart,
  ChevronDown,
  AlertCircle
} from "lucide-react";
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

export default function ExamHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    fileType: "all",
    dateRange: "all",
    status: "all",
    sortBy: "examDate"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = activeView === "grid" ? 8 : 10;
  
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
              (exam.requestingPhysician && exam.requestingPhysician.toLowerCase().includes(searchLower))
            );
          }
          
          return true;
        })
        .sort((a, b) => {
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
  
  // Pagination
  const totalPages = Math.ceil((filteredAndSortedExams?.length || 0) / itemsPerPage);
  const paginatedExams = filteredAndSortedExams.slice(
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
  
  const getExamDate = (exam: Exam) => {
    return exam.examDate ? new Date(exam.examDate) : new Date(exam.uploadDate);
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
          {getStatusBadge(exam.status)}
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
                    
                    {/* Filters and View toggle */}
                    <div className="flex gap-3 ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-1">
                            <Filter className="h-4 w-4 mr-1" />
                            Filtros
                            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                          </Button>
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
                                <SelectItem value="pending">Pendentes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <DropdownMenuSeparator />
                          
                          <div className="p-2">
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Ordenar por</label>
                            <Select 
                              value={filterOptions.sortBy} 
                              onValueChange={(value) => setFilterOptions({...filterOptions, sortBy: value})}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Data do exame (recente)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="examDate">Data do exame (recente)</SelectItem>
                                <SelectItem value="examDateAsc">Data do exame (antigo)</SelectItem>
                                <SelectItem value="name">Nome (A-Z)</SelectItem>
                                <SelectItem value="nameDesc">Nome (Z-A)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <DropdownMenuSeparator />
                          
                          <div className="p-2 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs mr-2"
                              onClick={() => {
                                setFilterOptions({
                                  fileType: "all",
                                  dateRange: "all",
                                  status: "all",
                                  sortBy: "examDate"
                                });
                              }}
                            >
                              Limpar Filtros
                            </Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* View toggle */}
                      <div className="flex border rounded-md overflow-hidden">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant={activeView === "grid" ? "default" : "ghost"} 
                                size="icon" 
                                className="h-9 w-9 rounded-none border-0"
                                onClick={() => setActiveView("grid")}
                              >
                                <div className="grid grid-cols-2 gap-0.5">
                                  <div className="w-1.5 h-1.5 bg-current opacity-70 rounded-sm"></div>
                                  <div className="w-1.5 h-1.5 bg-current opacity-70 rounded-sm"></div>
                                  <div className="w-1.5 h-1.5 bg-current opacity-70 rounded-sm"></div>
                                  <div className="w-1.5 h-1.5 bg-current opacity-70 rounded-sm"></div>
                                </div>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualização em Grade</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant={activeView === "list" ? "default" : "ghost"} 
                                size="icon" 
                                className="h-9 w-9 rounded-none border-0"
                                onClick={() => setActiveView("list")}
                              >
                                <div className="flex flex-col gap-0.5 items-center justify-center">
                                  <div className="w-3.5 h-0.5 bg-current opacity-70 rounded-full"></div>
                                  <div className="w-3.5 h-0.5 bg-current opacity-70 rounded-full"></div>
                                  <div className="w-3.5 h-0.5 bg-current opacity-70 rounded-full"></div>
                                </div>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualização em Lista</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Applied filters indicators */}
            {(filterOptions.fileType !== "all" || 
              filterOptions.dateRange !== "all" || 
              filterOptions.status !== "all" || 
              searchTerm) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-1">
                    <Search className="w-3 h-3 mr-1" />
                    Busca: {searchTerm}
                    <button className="ml-1 hover:text-blue-900" onClick={() => setSearchTerm("")}>×</button>
                  </Badge>
                )}
                
                {filterOptions.fileType !== "all" && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-2 py-1">
                    <Tag className="w-3 h-3 mr-1" />
                    Tipo: {filterOptions.fileType.toUpperCase()}
                    <button 
                      className="ml-1 hover:text-purple-900" 
                      onClick={() => setFilterOptions({...filterOptions, fileType: "all"})}
                    >×</button>
                  </Badge>
                )}
                
                {filterOptions.dateRange !== "all" && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Período: {
                      filterOptions.dateRange === "last7days" ? "Últimos 7 dias" :
                      filterOptions.dateRange === "last30days" ? "Últimos 30 dias" :
                      "Últimos 3 meses"
                    }
                    <button 
                      className="ml-1 hover:text-emerald-900" 
                      onClick={() => setFilterOptions({...filterOptions, dateRange: "all"})}
                    >×</button>
                  </Badge>
                )}
                
                {filterOptions.status !== "all" && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-2 py-1">
                    <Activity className="w-3 h-3 mr-1" />
                    Status: {
                      filterOptions.status === "analyzed" ? "Analisados" : "Pendentes"
                    }
                    <button 
                      className="ml-1 hover:text-amber-900" 
                      onClick={() => setFilterOptions({...filterOptions, status: "all"})}
                    >×</button>
                  </Badge>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs p-0 px-2 ml-1 hover:bg-gray-100"
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
                  Limpar todos os filtros
                </Button>
              </div>
            )}
            
            {/* Content area */}
            {isLoading ? (
              activeView === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, idx) => (
                    <Card key={idx} className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-md" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-3 flex justify-between items-center border-t border-gray-100">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase">
                          <th className="px-4 py-3 text-left">Exame</th>
                          <th className="px-4 py-3 text-left">Data do Exame</th>
                          <th className="px-4 py-3 text-left">Médico Solicitante</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(5)].map((_, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <Skeleton className="h-8 w-8 rounded-md mr-3" />
                                <div>
                                  <Skeleton className="h-4 w-32 mb-1" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="px-4 py-3">
                              <Skeleton className="h-4 w-28" />
                            </td>
                            <td className="px-4 py-3">
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Skeleton className="h-8 w-24 ml-auto" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )
            ) : filteredAndSortedExams.length === 0 ? (
              <Card className="py-10">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum exame encontrado</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {searchTerm || filterOptions.fileType !== "all" || filterOptions.dateRange !== "all" || filterOptions.status !== "all"
                      ? "Não encontramos nenhum exame com os filtros selecionados. Tente ajustar os critérios de busca."
                      : "Você ainda não tem nenhum exame cadastrado. Comece enviando seu primeiro exame para análise."}
                  </p>
                  {(searchTerm || filterOptions.fileType !== "all" || filterOptions.dateRange !== "all" || filterOptions.status !== "all") ? (
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
                      Limpar Filtros
                    </Button>
                  ) : (
                    <Link href="/upload-exams">
                      <Button>Enviar Exame</Button>
                    </Link>
                  )}
                </div>
              </Card>
            ) : (
              <>
                {/* Grid view */}
                {activeView === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedExams.map(exam => (
                      <ExamCard key={exam.id} exam={exam} />
                    ))}
                  </div>
                ) : (
                  /* List view */
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase">
                            <th className="px-4 py-3 text-left">Exame</th>
                            <th className="px-4 py-3 text-left">Data do Exame</th>
                            <th className="px-4 py-3 text-left">Médico Solicitante</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedExams.map((exam, idx) => (
                            <tr key={exam.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-md mr-3 ${getExamTypeColor(exam.fileType)}`}>
                                    {getFileIcon(exam.fileType)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                                    <div className="text-xs text-gray-500">{exam.laboratoryName || "Lab. não informado"}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {exam.examDate ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">{formatDate(exam.examDate)}</span>
                                    <span className="text-xs text-gray-500">{formatRelativeDate(exam.examDate)}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">Não informada</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {exam.requestingPhysician || (
                                  <span className="text-gray-400 text-xs">Não informado</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {getStatusBadge(exam.status)}
                              </td>
                              <td className="px-4 py-3 text-right">
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedExams.length)}</span> de <span className="font-medium">{filteredAndSortedExams.length}</span> exames
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={`h-8 w-8 p-0 ${
                            currentPage === page ? 'text-white' : 'text-gray-600'
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        </main>
      </div>
    </div>
  );
}
