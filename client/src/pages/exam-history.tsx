import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Exam } from "@shared/schema";
import { 
  FileText, 
  Image, 
  Search, 
  ChevronLeft, 
  ChevronRight 
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

export default function ExamHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
        .filter(exam => 
          (fileTypeFilter === "all" || exam.fileType === fileTypeFilter) &&
          (searchTerm === "" || exam.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
          if (sortBy === "newest") {
            return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
          } else if (sortBy === "oldest") {
            return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          } else if (sortBy === "a-z") {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        })
    : [];
  
  // Pagination
  const totalPages = Math.ceil((filteredAndSortedExams?.length || 0) / itemsPerPage);
  const paginatedExams = filteredAndSortedExams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const getFileIcon = (fileType: string) => {
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      
      <div className="flex flex-1 relative">
        <Sidebar />
        
        <main className="flex-1">
          <div className="p-4 md:p-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Histórico de Exames</h1>
              <p className="text-gray-600">Visualize e gerencie todos os seus exames analisados</p>
            </header>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Buscar exame..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                    </div>
                    <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                      <SelectTrigger className="w-[180px]">
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
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Ordenar por:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Mais recentes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mais recentes</SelectItem>
                        <SelectItem value="oldest">Mais antigos</SelectItem>
                        <SelectItem value="a-z">A-Z</SelectItem>
                        <SelectItem value="z-a">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exame
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      [...Array(5)].map((_, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Skeleton className="h-8 w-8 rounded-md mr-3" />
                              <div>
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-20 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : paginatedExams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          {searchTerm || fileTypeFilter !== "all" 
                            ? "Nenhum exame encontrado com os filtros aplicados" 
                            : "Nenhum exame encontrado. Faça upload do seu primeiro exame."}
                        </td>
                      </tr>
                    ) : (
                      paginatedExams.map((exam, index) => (
                        <tr key={exam.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 rounded-md bg-gray-100 mr-3">
                                {getFileIcon(exam.fileType)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                                <div className="text-xs text-gray-500">{exam.laboratoryName || "Lab. Central"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(exam.uploadDate.toString())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 uppercase">{exam.fileType}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={exam.status === 'analyzed' ? 'default' : 'outline'} className={exam.status === 'analyzed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                              {exam.status === 'analyzed' ? 'Analisado' : 'Pendente'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {exam.status === 'analyzed' ? (
                              <div className="space-x-3">
                                <Link href={`/report/${exam.id}`}>
                                  <a className="text-primary-600 hover:text-primary-900 font-medium">
                                    Visualizar
                                  </a>
                                </Link>
                                <button className="text-gray-500 hover:text-gray-700">
                                  Baixar
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400">Analisando...</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedExams.length)}</span> de <span className="font-medium">{filteredAndSortedExams.length}</span> resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${currentPage === i + 1 
                              ? 'bg-primary-50 text-primary-600 border-primary-500' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        
                        <Button
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Próximo</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
