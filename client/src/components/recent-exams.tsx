import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Exam } from "@shared/schema";
import { FileText, Image, AlertCircle, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RecentExams() {
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });
  
  // Sort exams by upload date and limit to the most recent ones
  const recentExams = exams?.sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  ).slice(0, 5);
  
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Exames Recentes</h2>
          <p className="text-sm text-gray-500 mt-1">Visualize seus exames analisados pela IA</p>
        </div>
        <Link href="/history">
          <Button variant="outline" className="flex items-center gap-1 text-primary-600 border-primary-200 hover:border-primary-300 hover:bg-primary-50">
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
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-primary-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">Nenhum exame encontrado</h3>
          <p className="text-sm text-gray-500 mb-4">Faça upload do seu primeiro exame para começar a análise.</p>
          <Link href="/upload">
            <Button className="bg-primary-600 hover:bg-primary-700">
              Fazer upload de exame
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentExams?.map((exam) => (
            <div 
              key={exam.id} 
              className={cn(
                "border rounded-lg p-4 transition-all",
                exam.status === 'analyzed' 
                  ? "border-green-100 bg-green-50 hover:bg-green-100" 
                  : "border-amber-100 bg-amber-50 hover:bg-amber-100"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-md flex items-center justify-center w-10 h-10",
                    exam.status === 'analyzed' ? "bg-green-100" : "bg-amber-100"
                  )}>
                    {getFileIcon(exam.fileType)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-800">{exam.name}</h3>
                      <Badge 
                        className="ml-2"
                        variant={exam.status === 'analyzed' ? 'default' : 'outline'}
                      >
                        {exam.status === 'analyzed' ? 'Analisado' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="flex text-xs text-gray-500 space-x-3 mt-1">
                      <span>Data: {formatDate(exam.uploadDate.toString())}</span>
                      <span>•</span>
                      <span>Laboratório: {exam.laboratoryName}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {exam.status === 'analyzed' ? (
                    <Link href={`/report/${exam.id}`}>
                      <Button 
                        size="sm" 
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        Ver análise
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled
                      className="text-amber-600"
                    >
                      Analisando...
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center pt-2">
            <Link href="/history">
              <Button variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                Ver histórico completo
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
