import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Exam } from "@shared/schema";
import { FileText, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Exames Recentes</h2>
        <Link href="/history">
          <a className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            Ver todos
          </a>
        </Link>
      </div>
      
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exame</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <tr key={index}>
                  <td className="py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-md mr-3" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : recentExams?.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  Nenhum exame encontrado. Faça upload do seu primeiro exame.
                </td>
              </tr>
            ) : (
              recentExams?.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 rounded-md bg-gray-100 mr-3">
                        {getFileIcon(exam.fileType)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{exam.name}</span>
                    </div>
                  </td>
                  <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(exam.uploadDate.toString())}
                  </td>
                  <td className="py-4 whitespace-nowrap">
                    <Badge variant={exam.status === 'analyzed' ? 'success' : 'default'}>
                      {exam.status === 'analyzed' ? 'Analisado' : 'Pendente'}
                    </Badge>
                  </td>
                  <td className="py-4 whitespace-nowrap text-right text-sm">
                    {exam.status === 'analyzed' ? (
                      <Link href={`/report/${exam.id}`}>
                        <a className="text-primary-600 hover:text-primary-900 font-medium">
                          Ver análise
                        </a>
                      </Link>
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
    </div>
  );
}
