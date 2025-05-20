import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileType, Zap, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface QuickSummaryProps {
  onComplete?: (result: any) => void;
}

export default function QuickSummary({ onComplete }: QuickSummaryProps) {
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Quick summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async (data: { fileContent: string, fileType: string }) => {
      console.log(`Enviando requisição para geração rápida de resumo`);
      
      const response = await fetch("/api/exams/quick-summary", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na resposta da API: ${response.status}`, errorText);
        throw new Error(errorText || response.statusText);
      }
      
      const resultData = await response.json();
      console.log("Recebido resultado da geração rápida:", resultData ? "dados recebidos" : "null");
      return resultData;
    },
    onSuccess: (data) => {
      setSummaryResult(data);
      setUploadStep('complete');
      
      toast({
        title: "Resumo gerado",
        description: "O resumo do seu documento foi gerado com sucesso!",
      });
      
      if (onComplete) {
        onComplete(data);
      }
    },
    onError: (error: Error) => {
      setUploadStep('error');
      toast({
        title: "Erro na geração do resumo",
        description: error.message || "Ocorreu um erro ao gerar o resumo do documento.",
        variant: "destructive",
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Iniciar upload
    setUploadStep('uploading');
    setUploadProgress(0);
    
    // Simular progresso de upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // Após o "upload" estar completo, preparar dados para análise
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadStep('processing');
      
      const file = acceptedFiles[0];
      
      // Determinar tipo de arquivo
      const fileType = file.type.includes('pdf') 
        ? 'pdf' 
        : file.type.includes('jpeg') || file.type.includes('jpg')
          ? 'jpeg'
          : 'png';
      
      console.log(`Iniciando geração rápida para arquivo ${file.name} (${fileType})`);
      
      // Ler o arquivo como base64
      const reader = new FileReader();
      reader.onload = (e) => {
        // Extrair apenas a parte base64 (sem o prefixo data:...)
        const base64Content = e.target?.result 
          ? String(e.target.result).split(',')[1]
          : '';
          
        // Verificar se o usuário está autenticado
        if (!user || !user.id) {
          console.error("Usuário não autenticado ao tentar analisar arquivo");
          toast({
            title: "Erro de autenticação",
            description: "Por favor, faça login novamente para continuar.",
            variant: "destructive"
          });
          setUploadStep('error');
          return;
        }
        
        // Enviar para processamento rápido
        generateSummaryMutation.mutate({
          fileContent: base64Content,
          fileType
        });
      };
      
      reader.onerror = () => {
        console.error("Erro ao ler arquivo");
        toast({
          title: "Erro na leitura",
          description: "Ocorreu um erro ao ler o arquivo selecionado.",
          variant: "destructive"
        });
        setUploadStep('error');
      };
      
      reader.readAsDataURL(file);
    }, 1500);
  }, [user, toast, generateSummaryMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploadStep !== 'idle'
  });

  const resetForm = () => {
    setUploadStep('idle');
    setUploadProgress(0);
    setSummaryResult(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {uploadStep !== 'complete' ? (
        <div
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${
            isDragActive ? 'bg-primary-50' : uploadStep === 'idle' ? 'bg-gray-50' : ''
          }`}
          {...(uploadStep === 'idle' ? getRootProps() : {})}
        >
          {uploadStep === 'idle' && (
            <div>
              <Zap className="mx-auto h-12 w-12 text-amber-500 mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                Gerador de Resumo Rápido
              </h3>
              <p className="text-sm text-gray-500 mb-4">Arraste um documento médico para gerar um resumo instantâneo</p>
              <button
                type="button"
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition"
              >
                Selecionar arquivo
              </button>
              <input {...getInputProps()} />
            </div>
          )}
          
          {uploadStep === 'uploading' && (
            <div className="space-y-4">
              <FileType className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="text-lg font-medium text-gray-700">Preparando arquivo...</h3>
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="text-sm text-gray-500">{uploadProgress}% concluído</p>
            </div>
          )}
          
          {uploadStep === 'processing' && (
            <div className="space-y-4">
              <Zap className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="text-lg font-medium text-gray-700">Gerando resumo rápido</h3>
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-sm text-gray-500">Processando seu documento para extrair as informações importantes</p>
            </div>
          )}
          
          {uploadStep === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-lg font-medium text-gray-700">Erro ao processar documento</h3>
              <p className="text-sm text-gray-500">Não foi possível gerar o resumo. Por favor, tente novamente.</p>
              <Button onClick={resetForm} variant="outline">Tentar novamente</Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resumo do Documento</CardTitle>
                <CardDescription>
                  {summaryResult?.laboratoryName} - {summaryResult?.examDate}
                </CardDescription>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 bg-slate-50">
              <h4 className="font-medium mb-2">Resumo</h4>
              <p className="text-sm text-gray-700">{summaryResult?.summary}</p>
            </div>
            
            {summaryResult?.healthMetrics && summaryResult.healthMetrics.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Métricas de Saúde</h4>
                <ScrollArea className="h-40 rounded-md border">
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2">Exame</th>
                          <th className="pb-2">Resultado</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryResult.healthMetrics.map((metric: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 last:border-0">
                            <td className="py-2">{metric.name}</td>
                            <td className="py-2">
                              {metric.value} {metric.unit}
                            </td>
                            <td className="py-2">
                              <Badge 
                                variant={
                                  metric.status === 'normal' ? 'outline' :
                                  metric.status === 'alto' || metric.status === 'baixo' ? 'secondary' : 'destructive'
                                }
                              >
                                {metric.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {summaryResult?.recommendations && summaryResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recomendações</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {Array.isArray(summaryResult.recommendations) ? (
                    summaryResult.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))
                  ) : (
                    <li>{summaryResult.recommendations}</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm}>
              Novo Resumo
            </Button>
            <Button variant="default" className="bg-amber-500 hover:bg-amber-600" onClick={() => window.print()}>
              Imprimir Resumo
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}