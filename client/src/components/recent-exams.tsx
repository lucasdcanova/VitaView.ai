import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Exam } from "@shared/schema";
import { FileText, Image, AlertCircle, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyComponent, useLazyLoading } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useProfiles } from "@/hooks/use-profiles";

export default function RecentExams() {
  const { ref, isInView } = useLazyLoading(0.1, '100px');
  const { activeProfile } = useProfiles();
  
  const { data: apiExams, isLoading: apiLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams", activeProfile?.id],
    queryFn: async () => {
      try {
        const queryParam = activeProfile ? `?profileId=${activeProfile.id}` : "";
        const res = await fetch(`/api/exams${queryParam}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch exams");
        return res.json();
      } catch (error) {
        // Error fetching exams from API
        return [];
      }
    },
    enabled: isInView && !!activeProfile, // Only fetch when component is in view and patient selected
  });
  
  // Use React state instead of direct localStorage access for SSR compatibility
  const [localExams, setLocalExams] = useState<Exam[]>([]);
  const isLoading = apiLoading;
  
  // Combine API and localStorage exams
  useEffect(() => {
    try {
      const savedExamsString = localStorage.getItem('savedExams');
      if (savedExamsString) {
        const savedExams = JSON.parse(savedExamsString);
        if (Array.isArray(savedExams) && activeProfile) {
          setLocalExams(savedExams.filter((exam: Exam) => exam.profileId === activeProfile.id));
        } else {
          setLocalExams([]);
        }
      }
    } catch (error) {
      // Error reading from localStorage
    }
  }, [activeProfile]);
  
  // Combine both sources of exams
  const allExams = useMemo(() => {
    const apiExamsArray = apiExams || [];
    return [...apiExamsArray, ...localExams];
  }, [apiExams, localExams]);
  
  // Sort exams by upload date and limit to the most recent ones
  const recentExams = useMemo(() => 
    allExams
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5), 
    [allExams]
  );
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="text-primary-500" size={20} />;
      case 'jpeg':
      case 'png':
        return <Image className="text-primary-500" size={20} />;
      default:
        return <FileText className="text-primary-500" size={20} />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!activeProfile) {
    return (
      <div ref={ref} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Exames recentes</h2>
        <p className="text-sm text-gray-500">Selecione um paciente para visualizar o histórico de exames analisados.</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Exames Recentes</h2>
          <p className="text-sm text-gray-500 mt-1">Visualize seus exames analisados pela IA</p>
        </div>
        <Link href="/history">
          <Button variant="outline" className="flex items-center gap-1 text-primary-600 border-primary-200 hover:border-primary-300 hover:bg-primary-50 font-medium px-4">
            Ver todos
            <ArrowUpRight size={16} />
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-3 animate-pulse">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-md mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : recentExams?.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center bg-gray-50">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4 shadow-inner">
            <AlertCircle className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum exame encontrado</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Faça upload do seu primeiro exame médico para começar a receber análises detalhadas e recomendações personalizadas.
          </p>
          <Link href="/upload">
            <Button className="bg-primary-600 hover:bg-primary-700 shadow-sm font-medium px-6 py-5 h-auto flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Fazer upload de exame
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentExams?.map((exam, index) => (
            <LazyComponent
              key={exam.id}
              fallback={
                <div className="border border-gray-100 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              }
              threshold={0.1}
              rootMargin="50px"
            >
              <div 
                className={cn(
                  "border rounded-xl p-4 transition-all transform hover:-translate-y-1 hover:shadow-md duration-300",
                  exam.status === 'analyzed' 
                    ? "border-green-200 bg-green-50/70 hover:bg-green-50" 
                    : "border-amber-200 bg-amber-50/70 hover:bg-amber-50"
                )}
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2.5 rounded-lg flex items-center justify-center w-12 h-12 shadow-sm",
                    exam.status === 'analyzed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {getFileIcon(exam.fileType)}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium text-gray-800">{exam.name}</h3>
                      <Badge 
                        className={cn(
                          "ml-2 text-xs px-2",
                          exam.status === 'analyzed' 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        )}
                        variant="outline"
                      >
                        {exam.status === 'analyzed' ? 'Analisado' : 'Em processamento'}
                      </Badge>
                    </div>
                    <div className="flex text-xs text-gray-500 mt-0.5 items-center">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(exam.uploadDate.toString())}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {exam.laboratoryName}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {exam.status === 'analyzed' ? (
                    <Link href={`/report/${exam.id}`}>
                      <Button 
                        size="sm" 
                        className="bg-primary-600 hover:bg-primary-700 shadow-sm font-medium px-3 flex items-center gap-1"
                      >
                        Ver análise
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled
                      className="text-amber-600 border-amber-200 bg-amber-50 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Analisando...
                    </Button>
                  )}
                </div>
              </div>
              </div>
            </LazyComponent>
          ))}
          
          <div className="flex justify-center pt-4 mt-2">
            <Link href="/history">
              <Button variant="outline" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 border-primary-100 hover:border-primary-200 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Explorar histórico completo
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
